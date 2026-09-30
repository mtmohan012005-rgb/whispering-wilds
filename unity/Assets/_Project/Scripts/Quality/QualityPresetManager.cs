using System;
using UnityEngine;

namespace WhisperingWilds.Quality
{
    public enum QualityTier
    {
        VeryLow = 0,
        Low = 1,
        Medium = 2,
        High = 3,
        Ultra = 4,
        Custom = 5
    }

    [System.Serializable]
    public struct QualityPresetSettings
    {
        public string name;
        public float renderScale;
        public float shadowDistance;
        public int shadowCascades;
        public float vegetationDensity;
        public float npcDensityFactor;
        public float wildlifeDensityFactor;
        public float viewDistance;
        public int textureStreamingBudgetMB;
        public int targetFrameRate;
        public int vSyncCount;
        public int antiAliasing;
        public bool anisotropicFiltering;
        public bool softShadows;
        public bool volumetricEffects;
        public bool postProcessingEnabled;
    }

    /// <summary>
    /// Master quality preset system supporting scalable profiles from low-end laptops to ultra rigs.
    /// Provides granular parameters for renderer, streaming, shadows, and entity density.
    /// </summary>
    [DisallowMultipleComponent]
    public class QualityPresetManager : MonoBehaviour
    {
        public static QualityPresetManager Instance { get; private set; }

        [Header("Current Configuration")]
        [SerializeField] private QualityTier currentTier = QualityTier.High;
        public QualityTier CurrentTier => currentTier;
        public QualityTier CurrentPreset => currentTier;

        public event Action<QualityTier, QualityPresetSettings> OnQualityPresetChanged;
        public event Action<QualityTier> OnPresetApplied;

        private static readonly QualityPresetSettings VeryLowPreset = new QualityPresetSettings
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

        private static readonly QualityPresetSettings LowPreset = new QualityPresetSettings
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

        private static readonly QualityPresetSettings MediumPreset = new QualityPresetSettings
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

        private static readonly QualityPresetSettings HighPreset = new QualityPresetSettings
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

        private static readonly QualityPresetSettings UltraPreset = new QualityPresetSettings
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
            int savedTier = PlayerPrefs.GetInt("WW_QualityTier", (int)QualityTier.High);
            ApplyPreset((QualityTier)savedTier);
        }

        public QualityPresetSettings GetPresetSettings(QualityTier tier)
        {
            switch (tier)
            {
                case QualityTier.VeryLow: return VeryLowPreset;
                case QualityTier.Low: return LowPreset;
                case QualityTier.Medium: return MediumPreset;
                case QualityTier.High: return HighPreset;
                case QualityTier.Ultra: return UltraPreset;
                default: return HighPreset;
            }
        }

        public void ApplyPreset(QualityTier tier)
        {
            currentTier = tier;
            QualityPresetSettings settings = GetPresetSettings(tier);

            // Frame pacing
            Application.targetFrameRate = settings.targetFrameRate;
            QualitySettings.vSyncCount = settings.vSyncCount;

            // Shadows
            QualitySettings.shadowDistance = settings.shadowDistance;
            QualitySettings.shadowCascades = settings.shadowCascades;

            // Texture Streaming
            QualitySettings.streamingMipmapsActive = true;
            QualitySettings.streamingMipmapsMemoryBudget = settings.textureStreamingBudgetMB;
            QualitySettings.streamingMipmapsRenderersPerFrame = 512;
            QualitySettings.streamingMipmapsMaxLevelReduction = tier <= QualityTier.Low ? 3 : 2;

            // Aniso & AA
            QualitySettings.anisotropicFiltering = settings.anisotropicFiltering ? AnisotropicFiltering.Enable : AnisotropicFiltering.Disable;
            QualitySettings.antiAliasing = settings.antiAliasing;

            PlayerPrefs.SetInt("WW_QualityTier", (int)tier);
            PlayerPrefs.Save();

            Debug.Log($"<color=#00FF99><b>[QualityPresetManager]</b></color> Applied preset: {tier} ({settings.name}) - ShadowDist: {settings.shadowDistance}m, Budget: {settings.textureStreamingBudgetMB}MB");

            OnQualityPresetChanged?.Invoke(tier, settings);
            OnPresetApplied?.Invoke(tier);
        }
    }
}
