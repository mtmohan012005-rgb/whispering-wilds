using System;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;

namespace WhisperingWilds.Quality
{
    /// <summary>
    /// Single authoritative governor for all graphics, hardware auto-detection,
    /// quality preset application, and real dynamic resolution adaptation.
    /// Eliminates fragmented conflicting quality mutations across subsystems.
    /// </summary>
    [DisallowMultipleComponent]
    public class GraphicsPerformanceManager : MonoBehaviour
    {
        public static GraphicsPerformanceManager Instance { get; private set; }

        [Header("Active Profile")]
        [SerializeField] private QualityTier currentTier = QualityTier.High;
        [SerializeField] private bool autoDetectOnBoot = true;
        [SerializeField] private bool dynamicAdaptationEnabled = true;

        [Header("Target Framerate & Pacing")]
        [SerializeField] private float targetFPS = 60f;
        [SerializeField] private float dropFPSRatio = 0.85f;    // Trigger scale down if FPS < 85% of target for > 3s
        [SerializeField] private float recoverFPSRatio = 0.96f; // Trigger scale up if FPS > 96% of target for > 8s

        [Header("Dynamic Resolution Bounds")]
        [Range(0.5f, 1.0f)] [SerializeField] private float minRenderScale = 0.65f;
        [Range(0.5f, 1.2f)] [SerializeField] private float maxRenderScale = 1.0f;
        [SerializeField] private float scaleStep = 0.05f;

        [Header("Hysteresis & Anti-Oscillation")]
        [SerializeField] private float dropDurationThreshold = 3.0f;
        [SerializeField] private float recoverDurationThreshold = 8.0f;
        [SerializeField] private float adaptationCooldownSeconds = 4.0f;

        // Runtime Metrics
        public QualityTier CurrentTier => currentTier;
        public float CurrentFPS { get; private set; }
        public float CurrentFrameTimeMS { get; private set; }
        public float CurrentRenderScale { get; private set; } = 1.0f;
        public int DynamicStepOffset { get; private set; } = 0;

        public event Action<QualityTier, QualityPresetSettings> OnQualityProfileChanged;
        public event Action<float> OnDynamicResolutionChanged;

        private float underperformingTimer = 0f;
        private float stableTimer = 0f;
        private float cooldownTimer = 0f;
        private float[] fpsBuffer = new float[60];
        private int bufferIndex = 0;
        private Camera trackedCamera;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnEnable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
        {
            // Re-acquire the main camera on every scene load.
            // Camera.main returns null after scene unload, so we must refresh.
            trackedCamera = null;
            InitCamera();
            // Reapply the current render scale to the new camera
            ApplyEngineRenderResolution(CurrentRenderScale);
        }

        private void Start()
        {
            InitCamera();

            if (autoDetectOnBoot && !PlayerPrefs.HasKey("WW_QualityTier"))
            {
                QualityTier detected = AutoDetectHardware();
                ApplyProfile(detected);
            }
            else
            {
                int savedTier = PlayerPrefs.GetInt("WW_QualityTier", (int)QualityTier.High);
                ApplyProfile((QualityTier)savedTier);
            }
        }

        /// <summary>Force rebind to the current scene's main camera. Call after spawning a new camera.</summary>
        public void ForceRebindCamera()
        {
            trackedCamera = null;
            InitCamera();
        }

        private void InitCamera()
        {
            if (trackedCamera == null)
            {
                trackedCamera = Camera.main;
            }

            if (trackedCamera != null)
            {
                trackedCamera.allowDynamicResolution = true;
            }
        }

        private void Update()
        {
            UpdateFramerateMetrics();

            if (!dynamicAdaptationEnabled) return;

            if (cooldownTimer > 0f)
            {
                cooldownTimer -= Time.unscaledDeltaTime;
                return;
            }

            EvaluateDynamicPerformance();
        }

        private void UpdateFramerateMetrics()
        {
            float dt = Time.unscaledDeltaTime;
            if (dt > 0.0001f)
            {
                float instantFPS = 1.0f / dt;
                fpsBuffer[bufferIndex] = instantFPS;
                bufferIndex = (bufferIndex + 1) % fpsBuffer.Length;

                float sum = 0f;
                for (int i = 0; i < fpsBuffer.Length; i++) sum += fpsBuffer[i];
                CurrentFPS = sum / fpsBuffer.Length;
                CurrentFrameTimeMS = dt * 1000f;
            }
        }

        private void EvaluateDynamicPerformance()
        {
            float targetDropFPS = targetFPS * dropFPSRatio;
            float targetRecoverFPS = targetFPS * recoverFPSRatio;

            if (CurrentFPS < targetDropFPS)
            {
                underperformingTimer += Time.unscaledDeltaTime;
                stableTimer = 0f;

                if (underperformingTimer >= dropDurationThreshold)
                {
                    StepDownDynamicQuality();
                    underperformingTimer = 0f;
                    cooldownTimer = adaptationCooldownSeconds;
                }
            }
            else if (CurrentFPS >= targetRecoverFPS)
            {
                stableTimer += Time.unscaledDeltaTime;
                underperformingTimer = 0f;

                if (stableTimer >= recoverDurationThreshold && DynamicStepOffset < 0)
                {
                    StepUpDynamicQuality();
                    stableTimer = 0f;
                    cooldownTimer = adaptationCooldownSeconds;
                }
            }
            else
            {
                underperformingTimer = Mathf.Max(0f, underperformingTimer - Time.unscaledDeltaTime * 0.5f);
                stableTimer = Mathf.Max(0f, stableTimer - Time.unscaledDeltaTime * 0.5f);
            }
        }

        private void StepDownDynamicQuality()
        {
            if (CurrentRenderScale > minRenderScale)
            {
                CurrentRenderScale = Mathf.Max(minRenderScale, CurrentRenderScale - scaleStep);
                DynamicStepOffset--;
                ApplyEngineRenderResolution(CurrentRenderScale);
                Debug.Log($"<color=#FFAA00><b>[GraphicsPerformanceManager]</b></color> Frame drop detected (Avg FPS: {CurrentFPS:F1} < {targetFPS * dropFPSRatio:F1}). Dynamically scaled buffer to: {CurrentRenderScale:F2}");
            }
        }

        private void StepUpDynamicQuality()
        {
            if (CurrentRenderScale < maxRenderScale)
            {
                CurrentRenderScale = Mathf.Min(maxRenderScale, CurrentRenderScale + scaleStep);
                DynamicStepOffset++;
                ApplyEngineRenderResolution(CurrentRenderScale);
                Debug.Log($"<color=#00FFAA><b>[GraphicsPerformanceManager]</b></color> Stable performance maintained (Avg FPS: {CurrentFPS:F1}). Dynamically restored buffer to: {CurrentRenderScale:F2}");
            }
        }

        /// <summary>
        /// Applies a render scale through the HDRP dynamic resolution pipeline.
        /// </summary>
        /// <remarks>
        /// <c>ScalableBufferManager.ResizeBuffers</c> drives the built-in render pipeline's
        /// software scaler. HDRP does not honour it, so on this project the scaler must be
        /// configured through <c>DynamicResolutionHandler</c> instead, otherwise the adaptive
        /// loop silently changes a number that never reaches the GPU.
        /// The HDRP asset's own min/max dynamic-resolution percentages are widened first,
        /// because the asset ships pinned at 100-100, which would clamp any scaler to a no-op.
        /// </remarks>
        public void ApplyEngineRenderResolution(float scale)
        {
            InitCamera();
            CurrentRenderScale = Mathf.Clamp(scale, minRenderScale, maxRenderScale);

            // 1. Widen the HDRP asset's dynamic-resolution range so the scaler below is not
            //    clamped away, then push the requested scale into the handler.
            ApplyHdrpDynamicResolution();

            // 2. Adjust LOD bias proportionally to relieve vertex and draw-call pressure.
            //    renderScale is the tier's native target, so this preserves the ratio the
            //    adaptive loop is stepping away from.
            QualityPresetSettings currentSettings = GetPresetSettings(currentTier);
            QualitySettings.lodBias = currentSettings.renderScale * CurrentRenderScale;

            OnDynamicResolutionChanged?.Invoke(CurrentRenderScale);
        }

        /// <summary>Registered once with the dynamic resolution handler; see <see cref="ApplyHdrpDynamicResolution"/>.</summary>
        private static PerformDynamicRes s_RegisteredScaler;

        /// <summary>
        /// Wires this manager into the HDRP dynamic resolution pipeline and pushes
        /// <see cref="CurrentRenderScale"/> to it. Safe on non-HDRP pipelines: it falls back to
        /// <c>ScalableBufferManager</c> so the built-in render pipeline keeps working.
        /// </summary>
        /// <remarks>
        /// The handler stores a <c>PerformDynamicRes</c> delegate returning a lerp factor between
        /// the asset's min and max screen percentages, so the delegate is registered exactly once
        /// and simply reads <see cref="CurrentRenderScale"/> thereafter.
        /// </remarks>
        private void ApplyHdrpDynamicResolution()
        {
            HDRenderPipelineAsset hdrAsset = GraphicsSettings.currentRenderPipeline as HDRenderPipelineAsset;
            if (hdrAsset == null)
            {
                // Built-in render pipeline (or SRP not yet assigned): use the software scaler.
                ScalableBufferManager.ResizeBuffers(CurrentRenderScale, CurrentRenderScale);
                return;
            }

            // Widen the asset's dynamic-resolution range. The shipped asset pins min/max to 100%,
            // which clamps the handler's lerp to a fixed 100% and makes the whole system a no-op.
            RenderPipelineSettings settings = hdrAsset.currentPlatformRenderPipelineSettings;
            GlobalDynamicResolutionSettings drSettings = settings.dynamicResolutionSettings;
            if (!drSettings.enabled)
            {
                drSettings.enabled = true;
            }
            drSettings.minPercentage = minRenderScale * 100f;
            drSettings.maxPercentage = maxRenderScale * 100f;
            settings.dynamicResolutionSettings = drSettings;
            hdrAsset.currentPlatformRenderPipelineSettings = settings;

            if (s_RegisteredScaler == null)
            {
                s_RegisteredScaler = PerformDynamicResScaler;
                DynamicResolutionHandler.SetDynamicResScaler(
                    s_RegisteredScaler,
                    DynamicResScalePolicyType.ReturnsMinMaxLerpFactor);
            }
        }

        /// <summary>
        /// Converts the current render scale into the lerp factor the dynamic resolution handler
        /// expects: 0 = asset minimum percentage, 1 = asset maximum percentage.
        /// </summary>
        private static float PerformDynamicResScaler()
        {
            GraphicsPerformanceManager mgr = Instance;
            if (mgr == null) return 1f;

            float range = mgr.maxRenderScale - mgr.minRenderScale;
            if (range <= 0.0001f) return 1f;

            float t = (mgr.CurrentRenderScale - mgr.minRenderScale) / range;
            return Mathf.Clamp01(t);
        }

        public QualityTier AutoDetectHardware()
        {
            string gpuName = SystemInfo.graphicsDeviceName.ToLowerInvariant();
            int vramMB = SystemInfo.graphicsMemorySize;
            int cpuCores = SystemInfo.processorCount;
            int systemRamMB = SystemInfo.systemMemorySize;

            // Distinguish true integrated graphics from modern discrete Intel Arc GPUs
            bool isIntelArc = gpuName.Contains("arc") || gpuName.Contains("a770") || gpuName.Contains("a750") || gpuName.Contains("a580") || gpuName.Contains("b580");
            bool isIntegrated = !isIntelArc && (gpuName.Contains("intel") || gpuName.Contains("uhd") ||
                                                gpuName.Contains("hd graphics") || gpuName.Contains("iris") ||
                                                gpuName.Contains("vega 3") || gpuName.Contains("vega 6") ||
                                                vramMB < 2048);

            QualityTier detected;
            if (isIntegrated || vramMB < 2048 || systemRamMB < 6144)
            {
                detected = QualityTier.VeryLow;
            }
            else if (vramMB >= 8000 && systemRamMB >= 15000 && cpuCores >= 8)
            {
                detected = QualityTier.Ultra;
            }
            else if (vramMB >= 5500 && systemRamMB >= 11000 && cpuCores >= 6)
            {
                detected = QualityTier.High;
            }
            else if (vramMB >= 3500 && systemRamMB >= 7500 && cpuCores >= 4)
            {
                detected = QualityTier.Medium;
            }
            else
            {
                detected = QualityTier.Low;
            }

            Debug.Log($"<color=#00D2FF><b>[GraphicsPerformanceManager]</b></color> Hardware detected: {gpuName} ({vramMB} MB VRAM, {cpuCores} cores, {systemRamMB} MB RAM). Selected Tier: <b>{detected}</b>");
            return detected;
        }

        public void ApplyProfile(QualityTier tier)
        {
            currentTier = tier;
            QualityPresetSettings settings = GetPresetSettings(tier);

            // 1. Frame pacing
            targetFPS = settings.targetFrameRate;
            Application.targetFrameRate = settings.targetFrameRate;
            QualitySettings.vSyncCount = settings.vSyncCount;

            // 2. Shadows
            QualitySettings.shadowDistance = settings.shadowDistance;
            QualitySettings.shadowCascades = settings.shadowCascades;

            // 3. Texture Mipmap Streaming
            QualitySettings.streamingMipmapsActive = true;
            QualitySettings.streamingMipmapsMemoryBudget = settings.textureStreamingBudgetMB;
            QualitySettings.streamingMipmapsRenderersPerFrame = 512;
            QualitySettings.streamingMipmapsMaxLevelReduction = tier <= QualityTier.Low ? 3 : 2;

            // 4. Filtering & Anti-Aliasing
            QualitySettings.anisotropicFiltering = settings.anisotropicFiltering ? AnisotropicFiltering.Enable : AnisotropicFiltering.Disable;
            QualitySettings.antiAliasing = settings.antiAliasing;

            // 5. Dynamic resolution baseline
            minRenderScale = tier == QualityTier.VeryLow ? 0.60f : (tier == QualityTier.Low ? 0.70f : 0.75f);
            maxRenderScale = settings.renderScale;
            CurrentRenderScale = settings.renderScale;
            DynamicStepOffset = 0;
            ApplyEngineRenderResolution(CurrentRenderScale);

            // Persist setting
            PlayerPrefs.SetInt("WW_QualityTier", (int)tier);
            PlayerPrefs.Save();

            Debug.Log($"<color=#00FF99><b>[GraphicsPerformanceManager]</b></color> Authoritative profile applied: {tier} ({settings.name}) - ShadowDist: {settings.shadowDistance}m, Budget: {settings.textureStreamingBudgetMB}MB");
            OnQualityProfileChanged?.Invoke(tier, settings);
        }

        /// <summary>
        /// Tier lookup delegated to <see cref="QualityPresetManager"/>, the single owner of the
        /// preset table. This manager must not keep a second copy, or the two drift apart and
        /// the settings menu stops reflecting what the adaptive loop actually applied.
        /// </summary>
        public QualityPresetSettings GetPresetSettings(QualityTier tier) => QualityPresetManager.GetPreset(tier);
    }
}
