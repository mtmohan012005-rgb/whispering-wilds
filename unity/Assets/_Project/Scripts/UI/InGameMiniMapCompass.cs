using System;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// In-game navigational HUD for playable 3D regions (Chennai, Pichavaram, Thanjavur, etc.).
    /// Distinct from the state-scale overview map: provides local player bearing, cardinal
    /// compass directions (N, E, S, W), nearby points of interest, objective markers, and
    /// quick hotkey [M] to open/transition to the State Overview Map.
    /// </summary>
    public class InGameMiniMapCompass : MonoBehaviour
    {
        public static InGameMiniMapCompass Instance { get; private set; }

        [Header("Player Tracking")]
        [SerializeField] private Transform playerTransform;
        [SerializeField] private Camera playerCamera;

        [Header("Settings")]
        [SerializeField] private bool showCompass = true;
        [SerializeField] private bool showRegionBanner = true;
        [SerializeField] private bool showObjectiveTracker = true;

        [Header("Current Region Info")]
        [SerializeField] private string regionTitleEnglish = "Chennai George Town";
        [SerializeField] private string regionTitleTamil = "சென்னை ஜார்ஜ் டவுன்";
        [SerializeField] private string activeObjective = "Explore George Town and speak with Tea Vendor Murugan";

        private GUIStyle _compassStyle;
        private GUIStyle _cardinalStyle;
        private GUIStyle _regionStyle;
        private GUIStyle _objectiveStyle;
        private GUIStyle _hintStyle;
        private GUIStyle _bgStyle;
        private bool _stylesInitialized = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            FindPlayerReferences();
            DetectCurrentRegion();
        }

        private void Update()
        {
            if (playerTransform == null || playerCamera == null)
            {
                FindPlayerReferences();
            }

            // [M] key toggles State Map
            if (Input.GetKeyDown(KeyCode.M))
            {
                OpenStateMap();
            }
        }

        private void FindPlayerReferences()
        {
            if (playerCamera == null) playerCamera = Camera.main;

            if (playerTransform == null)
            {
                var playerObj = GameObject.FindWithTag("Player");
                if (playerObj != null)
                {
                    playerTransform = playerObj.transform;
                }
                else if (playerCamera != null)
                {
                    playerTransform = playerCamera.transform;
                }
            }
        }

        private void DetectCurrentRegion()
        {
            string sceneName = SceneManager.GetActiveScene().name;
            string regionId = RegionalSceneManager.ResolveRegionIdFromSceneName(sceneName);

            if (!string.IsNullOrEmpty(regionId) && TamilNaduGeography.TryGetRegion(regionId, out var geo))
            {
                regionTitleEnglish = geo.englishName;
                regionTitleTamil = geo.tamilName;
            }
            else
            {
                regionTitleEnglish = sceneName.Replace("_", " ");
                regionTitleTamil = "";
            }
        }

        public void SetObjective(string objectiveText)
        {
            activeObjective = objectiveText;
        }

        public void OpenStateMap()
        {
            Debug.Log("[InGameMiniMapCompass] Transitioning from 3D region to 01_StateMap_TamilNadu...");
            // Save state before leaving region
            if (WhisperingWilds.Persistence.SaveSystem.Instance != null)
            {
                WhisperingWilds.Persistence.SaveSystem.Instance.SaveToDisk();
            }
            SceneManager.LoadScene("01_StateMap_TamilNadu");
        }

        private void InitStyles()
        {
            if (_stylesInitialized) return;

            var bgTex = new Texture2D(1, 1);
            bgTex.SetPixel(0, 0, new Color(0.06f, 0.08f, 0.12f, 0.82f));
            bgTex.Apply();

            _bgStyle = new GUIStyle(GUI.skin.box);
            _bgStyle.normal.background = bgTex;
            _bgStyle.padding = new RectOffset(8, 8, 4, 4);

            _compassStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter
            };
            _compassStyle.normal.textColor = new Color(0.92f, 0.94f, 0.96f);

            _cardinalStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 15,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter
            };
            _cardinalStyle.normal.textColor = new Color(1.0f, 0.85f, 0.40f);

            _regionStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft
            };
            _regionStyle.normal.textColor = new Color(0.55f, 0.88f, 1.0f);

            _objectiveStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                alignment = TextAnchor.MiddleLeft,
                wordWrap = true
            };
            _objectiveStyle.normal.textColor = new Color(0.95f, 0.95f, 0.90f);

            _hintStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 11,
                alignment = TextAnchor.MiddleRight
            };
            _hintStyle.normal.textColor = new Color(0.70f, 0.75f, 0.80f);

            _stylesInitialized = true;
        }

        private void OnGUI()
        {
            // Do not show in State Map or Boot scenes
            string activeScene = SceneManager.GetActiveScene().name;
            if (activeScene.StartsWith("00_") || activeScene.StartsWith("01_")) return;

            InitStyles();

            float screenW = Screen.width;

            // 1. Top Compass Ribbon (Center Top)
            if (showCompass && playerCamera != null)
            {
                float compassW = 340f;
                float compassH = 34f;
                float compassX = (screenW - compassW) * 0.5f;

                GUI.Box(new Rect(compassX, 10, compassW, compassH), GUIContent.none, _bgStyle);

                float yaw = playerCamera.transform.eulerAngles.y;
                string headingText = GetHeadingString(yaw);
                GUI.Label(new Rect(compassX, 12, compassW, compassH - 4), headingText, _compassStyle);
            }

            // 2. Region & Objective Banner (Top Left)
            if (showRegionBanner)
            {
                float bannerW = 420f;
                float bannerH = string.IsNullOrEmpty(activeObjective) ? 40f : 68f;

                GUI.Box(new Rect(16, 10, bannerW, bannerH), GUIContent.none, _bgStyle);

                string titleDisplay = string.IsNullOrEmpty(regionTitleTamil)
                    ? regionTitleEnglish
                    : $"{regionTitleEnglish} / {regionTitleTamil}";
                GUI.Label(new Rect(24, 14, bannerW - 16, 22), titleDisplay, _regionStyle);

                if (showObjectiveTracker && !string.IsNullOrEmpty(activeObjective))
                {
                    GUI.Label(new Rect(24, 38, bannerW - 16, 32), $"<color=#00FF99>◆ Task:</color> {activeObjective}", _objectiveStyle);
                }
            }

            // 3. Navigation Controls Hint (Top Right)
            float hintW = 280f;
            float hintH = 30f;
            GUI.Box(new Rect(screenW - hintW - 16, 10, hintW, hintH), GUIContent.none, _bgStyle);
            GUI.Label(new Rect(screenW - hintW - 20, 14, hintW, 22), "[M] State Map | [J] Journal | [Esc] Pause", _hintStyle);
        }

        private string GetHeadingString(float yaw)
        {
            yaw = (yaw % 360f + 360f) % 360f;
            string cardinal;
            if (yaw >= 337.5f || yaw < 22.5f) cardinal = "<color=#FFAA00><b>N</b></color>";
            else if (yaw < 67.5f) cardinal = "NE";
            else if (yaw < 112.5f) cardinal = "<color=#FFAA00><b>E</b></color>";
            else if (yaw < 157.5f) cardinal = "SE";
            else if (yaw < 202.5f) cardinal = "<color=#FFAA00><b>S</b></color>";
            else if (yaw < 247.5f) cardinal = "SW";
            else if (yaw < 292.5f) cardinal = "<color=#FFAA00><b>W</b></color>";
            else cardinal = "NW";

            return $"◄  {cardinal}  •  {Mathf.RoundToInt(yaw):D3}°  ►";
        }
    }
}
