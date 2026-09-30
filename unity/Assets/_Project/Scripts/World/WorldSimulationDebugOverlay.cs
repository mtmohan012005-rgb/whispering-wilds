using System;
using UnityEngine;
using WhisperingWilds.Vegetation;
using WhisperingWilds.Wildlife;
using WhisperingWilds.Online;
using WhisperingWilds.Persistence;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Developer debug overlay and time fast-forward governor (toggled via F4).
    /// Provides live telemetry for world calendar, season, climate, weather,
    /// wildlife populations (visible vs logical), crop growth, and Firebase sync status.
    /// </summary>
    [DisallowMultipleComponent]
    public class WorldSimulationDebugOverlay : MonoBehaviour
    {
        public static WorldSimulationDebugOverlay Instance { get; private set; }

        [Header("Overlay Settings")]
        [SerializeField] private bool showOverlay = false;
        [SerializeField] private KeyCode toggleKey = KeyCode.F4;

        private GUIStyle panelStyle;
        private GUIStyle headerStyle;
        private GUIStyle labelStyle;
        private GUIStyle buttonStyle;
        private bool stylesInitialized = false;

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

        private void Update()
        {
            if (Input.GetKeyDown(toggleKey))
            {
                showOverlay = !showOverlay;
            }
        }

        private void InitializeStyles()
        {
            if (stylesInitialized) return;

            panelStyle = new GUIStyle(GUI.skin.box);
            panelStyle.normal.background = MakeColorTex(2, 2, new Color(0.04f, 0.08f, 0.12f, 0.88f));

            headerStyle = new GUIStyle(GUI.skin.label);
            headerStyle.fontSize = 14;
            headerStyle.fontStyle = FontStyle.Bold;
            headerStyle.normal.textColor = new Color(0.2f, 0.9f, 1.0f);

            labelStyle = new GUIStyle(GUI.skin.label);
            labelStyle.fontSize = 11;
            labelStyle.normal.textColor = Color.white;

            buttonStyle = new GUIStyle(GUI.skin.button);
            buttonStyle.fontSize = 11;
            buttonStyle.fontStyle = FontStyle.Bold;
            buttonStyle.normal.textColor = Color.white;

            stylesInitialized = true;
        }

        private Texture2D MakeColorTex(int width, int height, Color col)
        {
            Color[] pix = new Color[width * height];
            for (int i = 0; i < pix.Length; i++) pix[i] = col;
            Texture2D result = new Texture2D(width, height);
            result.SetPixels(pix);
            result.Apply();
            return result;
        }

        private void OnGUI()
        {
            if (!showOverlay) return;
            InitializeStyles();

            float panelWidth = 380f;
            float panelHeight = 490f;
            Rect panelRect = new Rect(Screen.width - panelWidth - 15f, 15f, panelWidth, panelHeight);

            GUILayout.BeginArea(panelRect, panelStyle);
            GUILayout.Space(8);

            GUILayout.Label("<b>TAMIL NADU ECOSYSTEM SIMULATOR</b> (F4)", headerStyle);
            GUILayout.Space(4);

            // --- Section 1: World Time & Calendar ---
            WorldTimeSystem clock = WorldTimeSystem.Instance;
            if (clock != null)
            {
                GUILayout.Label($"<b>Calendar:</b> {clock.GetFormattedDateString()} | <b>Time:</b> {clock.GetFormattedTimeString()}", labelStyle);
                GUILayout.Label($"<b>Day Phase:</b> {clock.CurrentDayPhase} | <b>Season:</b> {clock.CurrentSeason.GetShortTamilName()} ({clock.CurrentSeason})", labelStyle);
            }

            GUILayout.Space(6);

            // --- Section 2: Regional Climate & Weather ---
            RegionalClimateSystem climate = RegionalClimateSystem.Instance;
            WeatherSystem weather = WeatherSystem.Instance;

            if (climate != null)
            {
                GUILayout.Label($"<b>Region:</b> {climate.ActiveRegionId.ToUpperInvariant()} ({climate.ActiveProfile?.regionName})", labelStyle);
                GUILayout.Label($"<b>Temperature:</b> {climate.CurrentTemperatureCelsius:F1}°C | <b>Humidity:</b> {(climate.CurrentHumidity * 100f):F0}%", labelStyle);
                GUILayout.Label($"<b>Wind:</b> {climate.CurrentWindSpeedKmh:F1} km/h | <b>Rain Prob:</b> {(climate.CurrentRainProbability * 100f):F0}%", labelStyle);
            }

            if (weather != null)
            {
                string transStr = weather.IsTransitioning ? " [Blended]" : "";
                GUILayout.Label($"<b>Atmosphere:</b> {weather.CurrentWeather}{transStr} | <b>Wetness:</b> {(weather.CurrentWetness * 100f):F0}%", labelStyle);
            }

            GUILayout.Space(6);

            // --- Section 3: Wildlife Ecology ---
            WildlifeManager wildlife = WildlifeManager.Instance;
            if (wildlife != null)
            {
                GUILayout.Label($"<b>Wildlife:</b> Visible: {wildlife.VisibleWildlifeCount} | Pooled: {wildlife.PooledWildlifeCount} | Logical: {wildlife.LogicalPopulationTotal}", labelStyle);
            }

            // --- Section 4: Botanical Agriculture ---
            VegetationManager veg = VegetationManager.Instance;
            if (veg != null)
            {
                GUILayout.Label($"<b>Agriculture:</b> Active Plots: {veg.ActivePlotCount} | Crops: {veg.ActiveCropCount} | Fruit Trees: {veg.ActiveTreeCount}", labelStyle);
            }

            // --- Section 5: Persistence & Sync ---
            WorldPersistenceManager pers = WorldPersistenceManager.Instance;
            CloudSaveManager cloud = CloudSaveManager.Instance;
            if (pers != null)
            {
                string syncState = cloud != null && cloud.IsSyncing ? "Syncing..." : "Idle";
                GUILayout.Label($"<b>Persistence:</b> Dirty: {pers.IsDirty} | Cloud Sync: {syncState}", labelStyle);
            }

            GUILayout.Space(8);
            GUILayout.Label("<b>SIMULATION SPEED CONTROLS</b>", headerStyle);

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("1x (Normal)", buttonStyle)) clock?.SetFastForwardMultiplier(1.0f);
            if (GUILayout.Button("10x", buttonStyle)) clock?.SetFastForwardMultiplier(10.0f);
            if (GUILayout.Button("100x", buttonStyle)) clock?.SetFastForwardMultiplier(100.0f);
            if (GUILayout.Button("1000x", buttonStyle)) clock?.SetFastForwardMultiplier(1000.0f);
            GUILayout.EndHorizontal();

            GUILayout.Space(6);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Advance 1 Day", buttonStyle)) clock?.AdvanceWorldSimulation(24.0);
            if (GUILayout.Button("Advance 1 Month", buttonStyle)) clock?.AdvanceWorldSimulation(24.0 * 30.0);
            if (GUILayout.Button("Save World", buttonStyle)) pers?.SaveWorldState();
            GUILayout.EndHorizontal();

            GUILayout.Space(6);
            if (GUILayout.Button("Toggle Rain / Clear", buttonStyle))
            {
                if (weather != null)
                {
                    var target = weather.CurrentWeather == WeatherType.Clear ? WeatherType.HeavyRain : WeatherType.Clear;
                    weather.ChangeWeather(target, 4.0f);
                }
            }

            GUILayout.EndArea();
        }
    }
}
