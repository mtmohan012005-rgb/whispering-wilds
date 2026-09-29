using UnityEngine;

namespace WhisperingWilds.Quality
{
    /// <summary>
    /// Evaluates system CPU, GPU, VRAM, and RAM to determine optimal default graphics profile.
    /// Executes on initial boot and can be re-run on demand from the settings menu.
    /// </summary>
    [DisallowMultipleComponent]
    public class AutoQualityDetector : MonoBehaviour
    {
        public static AutoQualityDetector Instance { get; private set; }

        [System.Serializable]
        public struct SystemSpecs
        {
            public string gpuName;
            public int vramMB;
            public int cpuCores;
            public int systemRamMB;
            public string graphicsAPI;
            public int screenWidth;
            public int screenHeight;
            public int refreshRate;
            public QualityTier recommendedTier;
        }

        [SerializeField] private SystemSpecs detectedSpecs;
        public SystemSpecs DetectedSpecs => detectedSpecs;

        private const string PrefKeyAutoDetected = "WW_HardwareAutoDetected";

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
            bool hasAutoDetected = PlayerPrefs.GetInt(PrefKeyAutoDetected, 0) == 1;
            if (!hasAutoDetected)
            {
                DetectAndApply();
            }
            else
            {
                GatherSpecs();
            }
        }

        public QualityTier DetectAndApply()
        {
            GatherSpecs();
            QualityTier recommended = EvaluateTier(detectedSpecs);
            detectedSpecs.recommendedTier = recommended;

            if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.ApplyPreset(recommended);
            }

            PlayerPrefs.SetInt(PrefKeyAutoDetected, 1);
            PlayerPrefs.Save();

            Debug.Log($"<color=#FFD700><b>[AutoQualityDetector]</b></color> Hardware Analyzed:\n" +
                      $"GPU: {detectedSpecs.gpuName} ({detectedSpecs.vramMB} MB VRAM)\n" +
                      $"CPU: {detectedSpecs.cpuCores} threads, System RAM: {detectedSpecs.systemRamMB} MB\n" +
                      $"API: {detectedSpecs.graphicsAPI} @ {detectedSpecs.screenWidth}x{detectedSpecs.screenHeight}\n" +
                      $"<b>Recommended Preset: {recommended}</b>");

            return recommended;
        }

        private void GatherSpecs()
        {
            detectedSpecs.gpuName = SystemInfo.graphicsDeviceName;
            detectedSpecs.vramMB = SystemInfo.graphicsMemorySize;
            detectedSpecs.cpuCores = SystemInfo.processorCount;
            detectedSpecs.systemRamMB = SystemInfo.systemMemorySize;
            detectedSpecs.graphicsAPI = SystemInfo.graphicsDeviceType.ToString();
            detectedSpecs.screenWidth = Screen.currentResolution.width;
            detectedSpecs.screenHeight = Screen.currentResolution.height;
            detectedSpecs.refreshRate = (int)Screen.currentResolution.refreshRateRatio.value;
        }

        public static QualityTier EvaluateTier(SystemSpecs specs)
        {
            // Tier calculation based on VRAM, system RAM, and CPU threads
            // Ultra: >= 8GB VRAM, >= 16GB RAM, >= 8 CPU cores
            // High: >= 6GB VRAM, >= 12GB RAM, >= 6 CPU cores
            // Medium: >= 4GB VRAM, >= 8GB RAM, >= 4 CPU cores
            // Low: >= 2GB VRAM, >= 6GB RAM, >= 2 CPU cores
            // VeryLow: Below 2GB VRAM or integrated GPU

            string gpuLower = specs.gpuName.ToLowerInvariant();
            bool isIntegrated = gpuLower.Contains("intel") || gpuLower.Contains("uhd") || 
                               gpuLower.Contains("iris") || gpuLower.Contains("radeon graphics") ||
                               gpuLower.Contains("vega 3") || gpuLower.Contains("vega 6") ||
                               specs.vramMB < 2048;

            if (isIntegrated || specs.vramMB < 2000 || specs.systemRamMB < 6000)
            {
                return QualityTier.VeryLow;
            }

            if (specs.vramMB >= 8000 && specs.systemRamMB >= 15000 && specs.cpuCores >= 8)
            {
                return QualityTier.Ultra;
            }

            if (specs.vramMB >= 5500 && specs.systemRamMB >= 11000 && specs.cpuCores >= 6)
            {
                return QualityTier.High;
            }

            if (specs.vramMB >= 3500 && specs.systemRamMB >= 7500 && specs.cpuCores >= 4)
            {
                return QualityTier.Medium;
            }

            return QualityTier.Low;
        }
    }
}
