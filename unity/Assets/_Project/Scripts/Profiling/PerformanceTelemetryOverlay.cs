using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Quality;

namespace WhisperingWilds.Profiling
{
    /// <summary>
    /// Lightweight runtime telemetry overlay drawn with IMGUI.
    /// Toggle with F3. Shows FPS, frametime, 1% lows, render scale,
    /// memory budget, and dynamic adaptation status.
    /// Never allocates on heap per-frame - uses pre-cached strings updated
    /// every 0.25s so it does not perturb the very metrics it displays.
    /// </summary>
    [DisallowMultipleComponent]
    public class PerformanceTelemetryOverlay : MonoBehaviour
    {
        public static PerformanceTelemetryOverlay Instance { get; private set; }

        [Header("Toggle Key")]
        [SerializeField] private KeyCode toggleKey = KeyCode.F3;
        [SerializeField] private bool visibleByDefault = false;

        [Header("Overlay Appearance")]
        [SerializeField] private int fontSize = 14;
        [SerializeField] private float updateIntervalSeconds = 0.25f;
        [SerializeField] private Vector2 overlayOffset = new Vector2(10f, 10f);

        private bool overlayVisible = false;
        private float updateTimer = 0f;

        // Cached display strings (updated every 0.25s to avoid constant GC allocs)
        private string cachedLine1 = "";
        private string cachedLine2 = "";
        private string cachedLine3 = "";
        private string cachedLine4 = "";
        private string cachedLine5 = "";
        private string cachedTier  = "";

        // Rolling frame time window for 1% low computation
        private const int SAMPLE_WINDOW = 180; // ~3 sec @ 60fps
        private float[] frameSamples = new float[SAMPLE_WINDOW];
        private int sampleHead = 0;

        private GUIStyle overlayStyle;
        private GUIStyle shadowStyle;
        private bool stylesInitialised = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            overlayVisible = visibleByDefault;
        }

        private void InitStyles()
        {
            if (stylesInitialised) return;
            stylesInitialised = true;

            overlayStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize  = fontSize,
                fontStyle = FontStyle.Bold,
                normal    = { textColor = Color.white },
                richText  = true
            };

            shadowStyle = new GUIStyle(overlayStyle)
            {
                normal = { textColor = new Color(0f, 0f, 0f, 0.85f) }
            };
        }

        private void Update()
        {
            frameSamples[sampleHead] = Time.unscaledDeltaTime;
            sampleHead = (sampleHead + 1) % SAMPLE_WINDOW;

            if (Input.GetKeyDown(toggleKey))
                overlayVisible = !overlayVisible;

            if (!overlayVisible) return;

            updateTimer -= Time.unscaledDeltaTime;
            if (updateTimer <= 0f)
            {
                updateTimer = updateIntervalSeconds;
                RefreshCachedStrings();
            }
        }

        private void RefreshCachedStrings()
        {
            var gpm = GraphicsPerformanceManager.Instance;

            float avgFPS  = gpm != null ? gpm.CurrentFPS         : EstimateCurrentFPS();
            float frameMS = gpm != null ? gpm.CurrentFrameTimeMS : Time.unscaledDeltaTime * 1000f;
            float scale   = gpm != null ? gpm.CurrentRenderScale : 1.0f;
            int   dynStep = gpm != null ? gpm.DynamicStepOffset  : 0;
            string tier   = gpm != null ? gpm.CurrentTier.ToString() : "?";

            float onePercentLow = ComputeOnePercentLow();

            long allocMB    = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemoryLong() / (1024 * 1024);
            long reservedMB = UnityEngine.Profiling.Profiler.GetTotalReservedMemoryLong()  / (1024 * 1024);

            string scene = SceneManager.GetActiveScene().name;

            string fpsCol   = avgFPS >= 55f ? "#00FF88" : avgFPS >= 30f ? "#FFCC00" : "#FF4444";
            string lowCol   = onePercentLow >= 40f ? "#00FF88" : onePercentLow >= 20f ? "#FFCC00" : "#FF4444";
            string scaleCol = scale >= 0.95f ? "#00FF88" : scale >= 0.75f ? "#FFCC00" : "#FF8800";

            cachedLine1 = $"<color={fpsCol}>{avgFPS:F1} FPS</color>  <color=#AAAAAA>{frameMS:F2} ms/frame</color>";
            cachedLine2 = $"1% Low: <color={lowCol}>{onePercentLow:F1} FPS</color>";
            cachedLine3 = $"RenderScale: <color={scaleCol}>{scale:F2}</color>  DynStep: {dynStep:+0;-#;0}";
            cachedLine4 = $"Alloc: {allocMB} MB  Reserved: {reservedMB} MB";
            cachedLine5 = $"Scene: {scene}";
            cachedTier  = $"Tier: <b>{tier}</b>  [F3 = Hide]";
        }

        private float ComputeOnePercentLow()
        {
            float[] sorted = new float[SAMPLE_WINDOW];
            System.Array.Copy(frameSamples, sorted, SAMPLE_WINDOW);
            System.Array.Sort(sorted);
            // Highest delta-times = worst frames => end of sorted array
            int idx = Mathf.Clamp(Mathf.RoundToInt(SAMPLE_WINDOW * 0.99f), 0, SAMPLE_WINDOW - 1);
            float worstDt = sorted[idx];
            return worstDt > 0f ? 1.0f / worstDt : 0f;
        }

        private float EstimateCurrentFPS()
        {
            float sum = 0f;
            for (int i = 0; i < SAMPLE_WINDOW; i++) sum += frameSamples[i];
            float avg = sum / SAMPLE_WINDOW;
            return avg > 0f ? 1.0f / avg : 0f;
        }

        private void OnGUI()
        {
            if (!overlayVisible) return;
            InitStyles();

            float x     = overlayOffset.x;
            float y     = overlayOffset.y;
            float lineH = fontSize + 4f;
            float panelW = 300f;
            float panelH = lineH * 7 + 8f;

            // Dark translucent background
            GUI.color = new Color(0f, 0f, 0f, 0.65f);
            GUI.DrawTexture(new Rect(x - 6f, y - 4f, panelW, panelH), Texture2D.whiteTexture);
            GUI.color = Color.white;

            DrawShadowedLabel(new Rect(x, y,             panelW, lineH), cachedLine1);
            DrawShadowedLabel(new Rect(x, y + lineH,     panelW, lineH), cachedLine2);
            DrawShadowedLabel(new Rect(x, y + lineH * 2, panelW, lineH), cachedLine3);
            DrawShadowedLabel(new Rect(x, y + lineH * 3, panelW, lineH), cachedLine4);
            DrawShadowedLabel(new Rect(x, y + lineH * 4, panelW, lineH), cachedLine5);
            DrawShadowedLabel(new Rect(x, y + lineH * 5, panelW, lineH), cachedTier);
        }

        private void DrawShadowedLabel(Rect rect, string text)
        {
            GUI.Label(new Rect(rect.x + 1, rect.y + 1, rect.width, rect.height), text, shadowStyle);
            GUI.Label(rect, text, overlayStyle);
        }

        public void SetVisible(bool visible) => overlayVisible = visible;
        public bool IsVisible => overlayVisible;
    }
}
