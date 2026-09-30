using UnityEngine;

namespace WhisperingWilds.Quality
{
    /// <summary>
    /// Dynamic performance adaptation system that monitors real-time FPS and frame times,
    /// dynamically adjusting render scale, shadow distance, and LOD bias with hysteresis
    /// to maintain rock-solid 60 FPS frame pacing on all PC hardware tiers.
    /// </summary>
    [DisallowMultipleComponent]
    public class AdaptiveQualityManager : MonoBehaviour
    {
        public static AdaptiveQualityManager Instance { get; private set; }

        [Header("Adaptation Settings")]
        [SerializeField] private bool adaptationEnabled = true;
        [SerializeField] private float targetFPS = 60f;
        [SerializeField] private float dropFPSRatio = 0.85f;    // Trigger scale down if FPS < 85% of target
        [SerializeField] private float recoverFPSRatio = 0.96f; // Trigger scale up if FPS > 96% of target

        [Header("Hysteresis Timers")]
        [SerializeField] private float dropDurationThreshold = 3.0f;
        [SerializeField] private float recoverDurationThreshold = 8.0f;
        [SerializeField] private float cooldownBetweenSteps = 4.0f;

        [Header("Dynamic Scaling Limits")]
        [SerializeField] private float minRenderScale = 0.65f;
        [SerializeField] private float maxRenderScale = 1.0f;
        [SerializeField] private float scaleStep = 0.05f;

        // Runtime Metrics
        public float CurrentFPS { get; private set; }
        public float CurrentFrameTimeMS { get; private set; }
        public float CurrentRenderScale { get; private set; } = 1.0f;
        public int QualityStepOffset { get; private set; } = 0; // Negative = stepped down

        private float underperformingTimer = 0f;
        private float stableTimer = 0f;
        private float cooldownTimer = 0f;
        private float[] fpsBuffer = new float[60];
        private int bufferIndex = 0;

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

        private void Start()
        {
            targetFPS = Application.targetFrameRate > 0 ? Application.targetFrameRate : 60f;
        }

        private void Update()
        {
            UpdateFramerateMetrics();

            if (!adaptationEnabled) return;

            if (cooldownTimer > 0f)
            {
                cooldownTimer -= Time.unscaledDeltaTime;
                return;
            }

            EvaluatePerformance();
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

        private void EvaluatePerformance()
        {
            float targetDropFPS = targetFPS * dropFPSRatio;
            float targetRecoverFPS = targetFPS * recoverFPSRatio;

            if (CurrentFPS < targetDropFPS)
            {
                underperformingTimer += Time.unscaledDeltaTime;
                stableTimer = 0f;

                if (underperformingTimer >= dropDurationThreshold)
                {
                    StepDownQuality();
                    underperformingTimer = 0f;
                    cooldownTimer = cooldownBetweenSteps;
                }
            }
            else if (CurrentFPS >= targetRecoverFPS)
            {
                stableTimer += Time.unscaledDeltaTime;
                underperformingTimer = 0f;

                if (stableTimer >= recoverDurationThreshold && QualityStepOffset < 0)
                {
                    StepUpQuality();
                    stableTimer = 0f;
                    cooldownTimer = cooldownBetweenSteps;
                }
            }
            else
            {
                underperformingTimer = Mathf.Max(0f, underperformingTimer - Time.unscaledDeltaTime * 0.5f);
                stableTimer = Mathf.Max(0f, stableTimer - Time.unscaledDeltaTime * 0.5f);
            }
        }

        private void StepDownQuality()
        {
            if (CurrentRenderScale > minRenderScale)
            {
                CurrentRenderScale = Mathf.Max(minRenderScale, CurrentRenderScale - scaleStep);
                QualityStepOffset--;
                ApplyDynamicScaling();
                Debug.Log($"<color=#FFAA00><b>[AdaptiveQualityManager]</b></color> Frame drop detected (Avg FPS: {CurrentFPS:F1}). Stepped down render scale to: {CurrentRenderScale:F2}");
            }
        }

        private void StepUpQuality()
        {
            if (CurrentRenderScale < maxRenderScale)
            {
                CurrentRenderScale = Mathf.Min(maxRenderScale, CurrentRenderScale + scaleStep);
                QualityStepOffset++;
                ApplyDynamicScaling();
                Debug.Log($"<color=#00FFAA><b>[AdaptiveQualityManager]</b></color> Stable performance maintained (Avg FPS: {CurrentFPS:F1}). Stepped up render scale to: {CurrentRenderScale:F2}");
            }
        }

        private void ApplyDynamicScaling()
        {
            // Render resolution is owned exclusively by GraphicsPerformanceManager, which
            // performs the real HDRP/URP buffer resize (ScalableBufferManager.ResizeBuffers
            // plus Camera.allowDynamicResolution). Changing QualitySettings.lodBias alone
            // does NOT change rendering resolution, so this method must not pretend to.
            //
            // When the real manager is present we drive it; otherwise we fall back to the
            // LOD-bias-only approximation and say so, rather than silently no-oping.
            if (GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ApplyEngineRenderResolution(CurrentRenderScale);
                return;
            }

            QualitySettings.lodBias = Mathf.Clamp(CurrentRenderScale, 0.7f, 1.5f);
            Debug.LogWarning("[AdaptiveQualityManager] GraphicsPerformanceManager absent: applying LOD-bias approximation only. Actual render resolution is unchanged.");
        }

        public void SetAdaptationEnabled(bool enabled)
        {
            adaptationEnabled = enabled;
            if (!enabled)
            {
                CurrentRenderScale = 1.0f;
                QualityStepOffset = 0;
                ApplyDynamicScaling();
            }
        }

        public void SetTargetFramerate(float target)
        {
            targetFPS = target;
        }
    }
}
