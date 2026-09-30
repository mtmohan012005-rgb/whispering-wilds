using System;
using UnityEngine;
using UnityEngine.Rendering;

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
        /// Actually invokes the low-level engine dynamic resolution scaling APIs
        /// rather than merely modifying an unapplied variable.
        /// </summary>
        public void ApplyEngineRenderResolution(float scale)
        {
            InitCamera();
            CurrentRenderScale = Mathf.Clamp(scale, minRenderScale, maxRenderScale);

            // 1. Native engine buffer scaling for dynamic resolution
            ScalableBufferManager.ResizeBuffers(CurrentRenderScale, CurrentRenderScale);

            // 2. Adjust LOD bias proportionally to relieve vertex and draw-call pressure
            QualityPresetSettings currentSettings = GetPresetSettings(currentTier);
            QualitySettings.lodBias = currentSettings.renderScale * CurrentRenderScale;

            OnDynamicResolutionChanged?.Invoke(CurrentRenderScale);
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

        public QualityPresetSettings GetPresetSettings(QualityTier tier)
        {
            switch (tier)
            {
                case QualityTier.VeryLow:
                    return new QualityPresetSettings
                    {
                        name = "Very Low (குறைந்தபட்சம்)",
                        renderScale = 0.70f,
                        shadowDistance = 20f,
                        shadowCascades = 1,
                        vegetationDensity = 0.30f,
                        npcDensityFactor = 0.40f,
                        wildlifeDensityFactor = 0.30f,
                        viewDistance = 120f,
                        textureStreamingBudgetMB = 256,
                        targetFrameRate = 30,
                        vSyncCount = 0,
                        antiAliasing = 0,
                        anisotropicFiltering = false,
                        softShadows = false,
                        volumetricEffects = false,
                        postProcessingEnabled = false
                    };
                case QualityTier.Low:
                    return new QualityPresetSettings
                    {
                        name = "Low (குறைவு)",
                        renderScale = 0.80f,
                        shadowDistance = 40f,
                        shadowCascades = 2,
                        vegetationDensity = 0.50f,
                        npcDensityFactor = 0.60f,
                        wildlifeDensityFactor = 0.50f,
                        viewDistance = 250f,
                        textureStreamingBudgetMB = 512,
                        targetFrameRate = 30,
                        vSyncCount = 0,
                        antiAliasing = 0,
                        anisotropicFiltering = true,
                        softShadows = false,
                        volumetricEffects = false,
                        postProcessingEnabled = true
                    };
                case QualityTier.Medium:
                    return new QualityPresetSettings
                    {
                        name = "Medium (நடுத்தரம்)",
                        renderScale = 0.90f,
                        shadowDistance = 75f,
                        shadowCascades = 2,
                        vegetationDensity = 0.75f,
                        npcDensityFactor = 0.80f,
                        wildlifeDensityFactor = 0.75f,
                        viewDistance = 500f,
                        textureStreamingBudgetMB = 1024,
                        targetFrameRate = 60,
                        vSyncCount = 1,
                        antiAliasing = 2,
                        anisotropicFiltering = true,
                        softShadows = true,
                        volumetricEffects = false,
                        postProcessingEnabled = true
                    };
                case QualityTier.High:
                    return new QualityPresetSettings
                    {
                        name = "High (உயர்ந்தது)",
                        renderScale = 1.0f,
                        shadowDistance = 150f,
                        shadowCascades = 4,
                        vegetationDensity = 1.0f,
                        npcDensityFactor = 1.0f,
                        wildlifeDensityFactor = 1.0f,
                        viewDistance = 1000f,
                        textureStreamingBudgetMB = 2048,
                        targetFrameRate = 60,
                        vSyncCount = 1,
                        antiAliasing = 4,
                        anisotropicFiltering = true,
                        softShadows = true,
                        volumetricEffects = true,
                        postProcessingEnabled = true
                    };
                case QualityTier.Ultra:
                    return new QualityPresetSettings
                    {
                        name = "Ultra (அதிநவீனம்)",
                        renderScale = 1.0f,
                        shadowDistance = 250f,
                        shadowCascades = 4,
                        vegetationDensity = 1.25f,
                        npcDensityFactor = 1.20f,
                        wildlifeDensityFactor = 1.20f,
                        viewDistance = 1800f,
                        textureStreamingBudgetMB = 4096,
                        targetFrameRate = 120,
                        vSyncCount = 1,
                        antiAliasing = 8,
                        anisotropicFiltering = true,
                        softShadows = true,
                        volumetricEffects = true,
                        postProcessingEnabled = true
                    };
                default:
                    return GetPresetSettings(QualityTier.High);
            }
        }
    }
}
