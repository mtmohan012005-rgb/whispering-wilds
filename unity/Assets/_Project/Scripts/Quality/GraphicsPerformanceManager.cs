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

        /// <summary>
        /// When set, a fixed user-chosen render scale (e.g. the stored WW_RenderScale setting) is
        /// enforced exactly and the adaptive loop is suspended. Null restores tier-governed
        /// adaptive tuning. This is the ONLY sanctioned manual override of the HDRP scaler.
        /// </summary>
        public float? UserRenderScaleOverride { get; private set; }

        public event Action<QualityTier, QualityPresetSettings> OnQualityProfileChanged;
        public event Action<float> OnDynamicResolutionChanged;

        private float underperformingTimer = 0f;
        private float stableTimer = 0f;
        private float cooldownTimer = 0f;
        private float[] fpsBuffer = new float[60];
        private int samplesCollected = 0;
        private int bufferIndex = 0;
        private Camera trackedCamera;

        private Volume ssrVolume;
        private VolumeProfile ssrProfile;
        private ScreenSpaceReflection ssrComponent;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
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

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }

            if (ssrVolume != null)
            {
                Destroy(ssrVolume.gameObject);
            }

            if (ssrProfile != null)
            {
                Destroy(ssrProfile);
            }
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

        /// <summary>
        /// Enforces a fixed user-chosen render scale (0.5-1.0) through the real HDRP dynamic
        /// resolution pipeline, suspending adaptive tuning until cleared. Pass null to clear the
        /// override and resume tier-governed adaptation from the current preset baseline.
        /// </summary>
        public void SetUserRenderScale(float? scale)
        {
            UserRenderScaleOverride = scale;
            if (!scale.HasValue)
            {
                QualityPresetSettings settings = GetPresetSettings(currentTier);
                CurrentRenderScale = settings.renderScale;
                DynamicStepOffset = 0;
                ApplyEngineRenderResolution(CurrentRenderScale);
                Debug.Log($"<color=#00D2FF><b>[GraphicsPerformanceManager]</b></color> User render-scale override cleared; adaptive tuning resumed at tier band base {CurrentRenderScale:F2}.");
                return;
            }

            // User band is 50-100%. Widening the asset percentages is required so the
            // scaler lerp below 60/65/75% is not clamped away (see ApplyEngineRenderResolution).
            minRenderScale = 0.5f;
            maxRenderScale = 1.0f;
            CurrentRenderScale = Mathf.Clamp(scale.Value, 0.5f, 1.0f);
            ApplyEngineRenderResolution(CurrentRenderScale);
            Debug.Log($"<color=#00D2FF><b>[GraphicsPerformanceManager]</b></color> User render-scale override applied: {CurrentRenderScale:F2} via HDRP dynamic resolution.");
        }

        /// <summary>
        /// Force rebind to the current scene's main camera. Call after spawning a new camera.</summary>
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

            if (trackedCamera == null) return;

            trackedCamera.allowDynamicResolution = true;

            // HDRP does NOT read Camera.allowDynamicResolution. HDRenderPipeline gates every
            // per-camera dynamic-resolution update on HDAdditionalCameraData.allowDynamicResolution
            // (HDRenderPipeline.RenderFrame, `hdCam.allowDynamicResolution`), so setting only the
            // built-in Camera flag leaves HDRP skipping the camera entirely and every render-scale
            // change below becomes a silent no-op. Both flags are required.
            HDAdditionalCameraData hdCamera = trackedCamera.GetComponent<HDAdditionalCameraData>();
            if (hdCamera == null)
            {
                hdCamera = trackedCamera.gameObject.AddComponent<HDAdditionalCameraData>();
            }
            hdCamera.allowDynamicResolution = true;
        }

        private void Update()
        {
            UpdateFramerateMetrics();

            // STEP 26 §2: SINGLE PERFORMANCE AUTHORITY — this manager owns the decision loop.
            if (!dynamicAdaptationEnabled) return;

            // A manual user override suspends adaptation: the fixed scale is enforced verbatim.
            if (UserRenderScaleOverride.HasValue) return;

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

                // STEP 26 §3: never average over unwritten zero-valued buffer entries.
                // Averaging the full length during the first second reported a near-zero
                // startup FPS and could falsely trigger a quality scale-down on boot.
                samplesCollected = Mathf.Min(samplesCollected + 1, fpsBuffer.Length);
                float sum = 0f;
                for (int i = 0; i < samplesCollected; i++) sum += fpsBuffer[i];
                CurrentFPS = sum / samplesCollected;
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
        /// Runtime-only copy of the active HDRP asset. Dynamic resolution range has to be mutated in
        /// lockstep with the tier's min/max render scale, and doing that on the project's HDRP asset
        /// dirties the committed <c>.asset</c> file inside the Editor. Mutating an instantiated clone
        /// keeps the on-disk asset untouched while HDRP still reads live values from it.
        /// </summary>
        private static HDRenderPipelineAsset s_runtimeHdrAsset;
        private static HDRenderPipelineAsset s_runtimeHdrAssetSource;

        /// <summary>
        /// Wires this manager into the HDRP dynamic resolution pipeline and pushes
        /// <see cref="CurrentRenderScale"/> to it. Safe on non-HDRP pipelines: it falls back to
        /// <c>ScalableBufferManager</c> so the built-in render pipeline keeps working.
        /// </summary>
        /// <remarks>
        /// The handler stores a <c>PerformDynamicRes</c> delegate returning a lerp factor between
        /// the asset's min and max screen percentages, so the delegate is registered exactly once
        /// and simply reads <see cref="CurrentRenderScale"/> thereafter. Because the handler lerps
        /// between the asset's min/max percentages, those percentages must equal this tier's
        /// min/max render scale (times 100) or the rendered scale silently clamps.
        /// </remarks>
        private void ApplyHdrpDynamicResolution()
        {
            HDRenderPipelineAsset hdrAsset = GetRuntimeHdrpAsset();
            if (hdrAsset == null)
            {
                // Built-in render pipeline (or SRP not yet assigned): use the software scaler.
                ScalableBufferManager.ResizeBuffers(CurrentRenderScale, CurrentRenderScale);
                return;
            }

            RenderPipelineSettings settings = hdrAsset.currentPlatformRenderPipelineSettings;
            GlobalDynamicResolutionSettings drSettings = settings.dynamicResolutionSettings;
            if (!drSettings.enabled)
            {
                drSettings.enabled = true;
            }
            // Mip bias keeps the upscaled frame from shimmering when the adaptive loop steps
            // below native resolution.
            drSettings.useMipBias = true;
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
        /// Returns the HDRP asset that should be mutated: an instantiated clone of whichever HDRP
        /// asset is active, re-instantiated if the quality tier swapped assets underneath us.
        /// The clone is pushed back into every quality level so a tier change cannot swap the
        /// un-mutable original back in and silently disable the tuned range.
        /// </summary>
        private static HDRenderPipelineAsset GetRuntimeHdrpAsset()
        {
            HDRenderPipelineAsset source = QualitySettings.renderPipeline as HDRenderPipelineAsset
                                          ?? GraphicsSettings.currentRenderPipeline as HDRenderPipelineAsset;
            if (source == null) return null;

            // An asset that is already our clone must not be cloned again.
            if (ReferenceEquals(source, s_runtimeHdrAsset)) return s_runtimeHdrAsset;

            if (s_runtimeHdrAsset == null || !ReferenceEquals(source, s_runtimeHdrAssetSource))
            {
                s_runtimeHdrAssetSource = source;
                s_runtimeHdrAsset = Instantiate(source);
                s_runtimeHdrAsset.name = source.name + " (Runtime Tuned)";

                // QualitySettings.renderPipeline is a per-quality-level property with no public
                // setter-by-index, so every level is visited once and the clone is installed on each.
                GraphicsSettings.defaultRenderPipeline = s_runtimeHdrAsset;
                int activeLevel = QualitySettings.GetQualityLevel();
                for (int level = 0; level < QualitySettings.names.Length; level++)
                {
                    QualitySettings.SetQualityLevel(level, false);
                    QualitySettings.renderPipeline = s_runtimeHdrAsset;
                }
                QualitySettings.SetQualityLevel(activeLevel, true);
            }

            return s_runtimeHdrAsset;
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
            QualitySettings.streamingMipmapsAddAllCameras = true;
            QualitySettings.streamingMipmapsMaxFileIORequests = tier <= QualityTier.Low ? 256 : 1024;

            // 4. Filtering & Anti-Aliasing
            QualitySettings.anisotropicFiltering = settings.anisotropicFiltering ? AnisotropicFiltering.Enable : AnisotropicFiltering.Disable;
            QualitySettings.antiAliasing = settings.antiAliasing;

            // 5. Dynamic resolution baseline
            minRenderScale = tier == QualityTier.VeryLow ? 0.60f : (tier == QualityTier.Low ? 0.70f : 0.75f);
            maxRenderScale = settings.renderScale;
            CurrentRenderScale = settings.renderScale;
            DynamicStepOffset = 0;
            ApplyEngineRenderResolution(CurrentRenderScale);

            // 6. HDRP feature scalability (SSR runs on High/Ultra only)
            ApplyHdrpFeatureScalability(tier);

            // Persist setting
            PlayerPrefs.SetInt("WW_QualityTier", (int)tier);
            PlayerPrefs.Save();

            Debug.Log($"<color=#00FF99><b>[GraphicsPerformanceManager]</b></color> Authoritative profile applied: {tier} ({settings.name}) - ShadowDist: {settings.shadowDistance}m, Budget: {settings.textureStreamingBudgetMB}MB");
            OnQualityProfileChanged?.Invoke(tier, settings);
        }

        /// <summary>
        /// Enables screen-space reflections on High/Ultra and forces them off on lower tiers.
        /// The project's HDRP assets advertise SSR support; this volume is the runtime switch
        /// that makes the scalability preset actually honour it instead of running SSR always-on.
        /// </summary>
        private void ApplyHdrpFeatureScalability(QualityTier tier)
        {
            ApplyCameraFrameSettings(tier);

            EnsureSsrVolume();
            if (ssrComponent == null) return;

            ssrComponent.enabled.Override(true);
            ssrComponent.enabled.value = tier >= QualityTier.High;
        }

        /// <summary>
        /// Applies the tier's HDRP camera frame settings. The HDRP asset only advertises which
        /// features are *supported*; the camera frame settings decide what actually runs. Without
        /// this, SSR/SSS stay at their authored default regardless of tier, so the volume switch
        /// above and the material diffusion profiles never reached the render graph.
        /// </summary>
        private void ApplyCameraFrameSettings(QualityTier tier)
        {
            Camera cam = trackedCamera != null ? trackedCamera : Camera.main;
            if (cam == null) return;

            if (!cam.TryGetComponent(out HDAdditionalCameraData hdCamera))
            {
                hdCamera = cam.gameObject.AddComponent<HDAdditionalCameraData>();
            }

            QualityPresetSettings settings = GetPresetSettings(tier);
            bool highEnd = tier >= QualityTier.High;
            bool balanced = tier >= QualityTier.Medium;

            hdCamera.customRenderingSettings = true;

            ref FrameSettings frameSettings = ref hdCamera.renderingPathCustomFrameSettings;
            frameSettings.SetEnabled(FrameSettingsField.SSR, highEnd);
            frameSettings.SetEnabled(FrameSettingsField.TransparentSSR, highEnd);
            frameSettings.SetEnabled(FrameSettingsField.SubsurfaceScattering, balanced);
            frameSettings.SetEnabled(FrameSettingsField.Volumetrics, settings.volumetricEffects);
            frameSettings.SetEnabled(FrameSettingsField.ScreenSpaceShadows, balanced);

            // Skin needs the densest SSS sample budget the asset exposes (20/40/80 here).
            frameSettings.sssQualityMode = SssQualityMode.OverrideQualitySettings;
            frameSettings.sssQualityLevel = tier >= QualityTier.Ultra ? 2 : (highEnd ? 1 : 0);

            FrameSettingsOverrideMask mask = hdCamera.renderingPathCustomFrameSettingsOverrideMask;
            mask.mask[(uint)FrameSettingsField.SSR] = true;
            mask.mask[(uint)FrameSettingsField.TransparentSSR] = true;
            mask.mask[(uint)FrameSettingsField.SubsurfaceScattering] = true;
            mask.mask[(uint)FrameSettingsField.Volumetrics] = true;
            mask.mask[(uint)FrameSettingsField.ScreenSpaceShadows] = true;
            hdCamera.renderingPathCustomFrameSettingsOverrideMask = mask;
        }

        private void EnsureSsrVolume()
        {
            if (ssrVolume != null) return;

            ssrProfile = ScriptableObject.CreateInstance<VolumeProfile>();
            ssrProfile.name = "WW HDRP Scalability Profile";
            ssrComponent = ssrProfile.Add<ScreenSpaceReflection>();
            ssrComponent.enabled.Override(true);
            ssrComponent.enabled.value = false;

            var volumeObject = new GameObject("WW HDRP Scalability Volume")
            {
                hideFlags = HideFlags.HideAndDontSave
            };
            ssrVolume = volumeObject.AddComponent<Volume>();
            ssrVolume.isGlobal = true;
            ssrVolume.priority = 1000f;
            ssrVolume.profile = ssrProfile;
            DontDestroyOnLoad(volumeObject);
        }

        /// <summary>
        /// Tier lookup delegated to <see cref="QualityPresetManager"/>, the single owner of the
        /// preset table. This manager must not keep a second copy, or the two drift apart and
        /// the settings menu stops reflecting what the adaptive loop actually applied.
        /// </summary>
        public QualityPresetSettings GetPresetSettings(QualityTier tier) => QualityPresetManager.GetPreset(tier);
    }
}
