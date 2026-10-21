using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Interactive bilingual HUD for the Tamil Nadu State Map (01_StateMap_TamilNadu).
    /// Provides region selection, details view, travel buttons, camera controls guide,
    /// and clean transitions back to the main menu (00_Boot).
    /// </summary>
    public class StateMapHUDController : MonoBehaviour
    {
        public static StateMapHUDController Instance { get; private set; }

        [Header("State")]
        [SerializeField] private StateMapRegionMarker selectedMarker;
        [SerializeField] private string hoveredRegionName = "";

        private StateMapCameraController _cameraController;

        // Visual styles
        private GUIStyle _headerStyle;
        private GUIStyle _subHeaderStyle;
        private GUIStyle _cardTitleStyle;
        private GUIStyle _cardSubStyle;
        private GUIStyle _bodyStyle;
        private GUIStyle _buttonStyle;
        private GUIStyle _lockedButtonStyle;
        private GUIStyle _panelStyle;
        private GUIStyle _legendStyle;
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
            _cameraController = FindAnyObjectByType<StateMapCameraController>();

            // Ensure cursor is free for map navigation
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            // Default selection to Chennai if available
            var markers = FindObjectsByType<StateMapRegionMarker>(FindObjectsSortMode.None);
            foreach (var m in markers)
            {
                if (m.regionId == "chennai")
                {
                    selectedMarker = m;
                    break;
                }
            }
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                ReturnToBootMenu();
            }
        }

        public void SelectRegion(StateMapRegionMarker marker)
        {
            selectedMarker = marker;
            if (marker != null && _cameraController != null)
            {
                _cameraController.FocusOnPosition(marker.transform.position, 600f);
            }
        }

        public void OnMarkerHoverEnter(StateMapRegionMarker marker)
        {
            if (marker != null)
            {
                hoveredRegionName = $"{marker.englishName} ({marker.tamilName})";
            }
        }

        private bool _showCreditsModal = false;

        public void OnMarkerHoverExit(StateMapRegionMarker marker)
        {
            if (hoveredRegionName.StartsWith(marker.englishName))
            {
                hoveredRegionName = "";
            }
        }

        public void TravelToSelectedRegion()
        {
            if (selectedMarker == null)
            {
                Debug.LogWarning("[StateMapHUD] Cannot travel: no region selected.");
                return;
            }

            string regionId = selectedMarker.regionId;
            if (string.IsNullOrEmpty(regionId))
            {
                Debug.LogWarning("[StateMapHUD] Cannot travel: selected marker has null or empty regionId.");
                return;
            }

            if (!TamilNaduGeography.TryGetRegion(regionId, out RegionGeoLocation geo))
            {
                Debug.LogWarning($"[StateMapHUD] Cannot travel: unknown region '{regionId}'.");
                return;
            }

            if (!selectedMarker.isUnlocked || !RegionUnlocks.IsUnlocked(regionId))
            {
                Debug.LogWarning($"[StateMapHUD] Travel rejected: region '{regionId}' is locked.");
                return;
            }

            string sceneName = string.IsNullOrEmpty(selectedMarker.sceneName) ? geo.sceneName : selectedMarker.sceneName;
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogWarning($"[StateMapHUD] Cannot travel: no scene assigned for region '{regionId}'.");
                return;
            }

            Debug.Log($"[StateMapHUD] Initiating travel to region '{regionId}' (Scene: {sceneName})");

            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.TravelToRegion(regionId);
            }
            else
            {
                if (Application.isPlaying)
                {
                    SceneManager.LoadScene(sceneName);
                }
            }
        }

        public void ReturnToBootMenu()
        {
            Debug.Log("[StateMapHUD] Returning to Main Menu (00_Boot)...");
            if (Application.isPlaying)
            {
                SceneManager.LoadScene("00_Boot");
            }
        }

        private void InitStyles()
        {
            if (_stylesInitialized) return;

            var bgTex = new Texture2D(1, 1);
            bgTex.SetPixel(0, 0, new Color(0.08f, 0.10f, 0.14f, 0.90f));
            bgTex.Apply();

            _panelStyle = new GUIStyle(GUI.skin.box);
            _panelStyle.normal.background = bgTex;
            _panelStyle.normal.textColor = Color.white;
            _panelStyle.padding = new RectOffset(16, 16, 14, 14);

            _headerStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 20,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft
            };
            _headerStyle.normal.textColor = new Color(0.96f, 0.88f, 0.70f);

            _subHeaderStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                fontStyle = FontStyle.Italic,
                alignment = TextAnchor.MiddleLeft
            };
            _subHeaderStyle.normal.textColor = new Color(0.78f, 0.82f, 0.86f);

            _cardTitleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                fontStyle = FontStyle.Bold
            };
            _cardTitleStyle.normal.textColor = new Color(1f, 0.92f, 0.65f);

            _cardSubStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 13,
                fontStyle = FontStyle.Bold
            };
            _cardSubStyle.normal.textColor = new Color(0.55f, 0.85f, 0.95f);

            _bodyStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 12,
                wordWrap = true
            };
            _bodyStyle.normal.textColor = new Color(0.90f, 0.92f, 0.94f);

            _buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold
            };
            _buttonStyle.normal.textColor = Color.white;

            _lockedButtonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 13,
                fontStyle = FontStyle.Normal
            };
            _lockedButtonStyle.normal.textColor = new Color(0.6f, 0.6f, 0.6f);

            _legendStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 11,
                wordWrap = false
            };
            _legendStyle.normal.textColor = new Color(0.85f, 0.88f, 0.90f);

            _stylesInitialized = true;
        }

        private void OnGUI()
        {
            InitStyles();

            float screenW = Screen.width;
            float screenH = Screen.height;

            // 1. Top Header Bar
            GUILayout.BeginArea(new Rect(16, 12, screenW - 32, 60), _panelStyle);
            GUILayout.BeginHorizontal();
            GUILayout.BeginVertical();
            GUILayout.Label("The Whispering Wilds (காட்டு வழி) — Tamil Nadu State Map", _headerStyle);
            GUILayout.Label("Select a cultural region to view historical significance and travel to the 3D world.", _subHeaderStyle);
            GUILayout.EndVertical();

            GUILayout.FlexibleSpace();

            if (GUILayout.Button("Map Data & Credits / வரைபடம்", _buttonStyle, GUILayout.Width(220), GUILayout.Height(36)))
            {
                _showCreditsModal = !_showCreditsModal;
            }

            if (GUILayout.Button("Main Menu / முதன்மை மெனு [Esc]", _buttonStyle, GUILayout.Width(220), GUILayout.Height(36)))
            {
                ReturnToBootMenu();
            }
            GUILayout.EndHorizontal();
            GUILayout.EndArea();

            // 2. Controls & Legend (Top Right)
            float legendW = 310;
            float legendH = 185;
            GUILayout.BeginArea(new Rect(screenW - legendW - 16, 80, legendW, legendH), _panelStyle);
            GUILayout.Label("<b>CONTROLS & LEGEND</b>", _cardSubStyle);
            GUILayout.Label("• <b>Pan:</b> WASD, Arrows, Right-Drag, or Left-Drag", _legendStyle);
            GUILayout.Label("• <b>Zoom:</b> Scroll Wheel or Q / E (150–2800 units)", _legendStyle);
            GUILayout.Label("• <b>Reset View:</b> [R] key", _legendStyle);
            GUILayout.Space(6);
            GUILayout.Label("<color=#70A0D0>━</color> Coastline & Rivers (Cauvery/Palar)", _legendStyle);
            GUILayout.Label("<color=#E0C060>━</color> National Highways (NH16/32/83)", _legendStyle);
            GUILayout.Label("<color=#507040>◼</color> Western Ghats & Nilgiri Biosphere", _legendStyle);
            GUILayout.Label("<color=#FFF0A0>●</color> Cultural Region Centers", _legendStyle);
            GUILayout.EndArea();

            // 3. Hover Tooltip
            if (!string.IsNullOrEmpty(hoveredRegionName))
            {
                Vector3 mouse = Input.mousePosition;
                GUI.Box(new Rect(mouse.x + 15, screenH - mouse.y - 25, 240, 28), hoveredRegionName, _panelStyle);
            }

            // 4. Selected Region Card (Bottom Left)
            float cardW = 440;
            float cardH = 220;
            GUILayout.BeginArea(new Rect(16, screenH - cardH - 16, cardW, cardH), _panelStyle);

            if (selectedMarker != null)
            {
                GUILayout.Label($"{selectedMarker.englishName}", _cardTitleStyle);
                GUILayout.Label($"{selectedMarker.tamilName}", _cardSubStyle);

                bool unlocked = selectedMarker.isUnlocked;
                string statusText = unlocked ? "<color=#00FF99>● UNLOCKED (திறக்கப்பட்டது)</color>" : "<color=#FFAA00>🔒 LOCKED (திறக்கப்படவில்லை)</color>";
                GUILayout.Label($"Status: {statusText}  |  Coord: {selectedMarker.latitude:F4}°N, {selectedMarker.longitude:F4}°E", _legendStyle);

                string biomeInfo = GetRegionBiomeDesc(selectedMarker.regionId);
                GUILayout.Label(biomeInfo, _bodyStyle);

                GUILayout.FlexibleSpace();
                GUILayout.BeginHorizontal();

                GUI.enabled = unlocked;
                string travelBtnText = unlocked ? "TRAVEL TO REGION (பயணம் செய்) ►" : "LOCKED (முன்னேற்றம் தேவை)";
                if (GUILayout.Button(travelBtnText, unlocked ? _buttonStyle : _lockedButtonStyle, GUILayout.Height(36)))
                {
                    TravelToSelectedRegion();
                }
                GUI.enabled = true;

                if (_cameraController != null && GUILayout.Button("Focus (கவனம்)", GUILayout.Width(110), GUILayout.Height(36)))
                {
                    _cameraController.FocusOnPosition(selectedMarker.transform.position);
                }

                GUILayout.EndHorizontal();
            }
            else
            {
                GUILayout.Label("Tamil Nadu Cultural Overview", _cardTitleStyle);
                GUILayout.Label("Click on any region pin on the map to inspect historical details and fast-travel.", _bodyStyle);
            }

            GUILayout.EndArea();

            // 5. Region Quick Select Ribbon (Bottom Center / Right)
            float ribbonX = cardW + 32;
            float ribbonW = screenW - ribbonX - 16;
            GUILayout.BeginArea(new Rect(ribbonX, screenH - 60, ribbonW, 44), _panelStyle);
            GUILayout.BeginHorizontal();
            GUILayout.Label("<b>Jump:</b>", _legendStyle, GUILayout.Width(45));

            var regions = new[] {
                ("chennai", "Chennai"),
                ("mamallapuram", "Mamallapuram"),
                ("pichavaram", "Pichavaram"),
                ("thanjavur", "Thanjavur"),
                ("chettinad", "Chettinad"),
                ("nilgiris", "Nilgiris")
            };

            var markers = FindObjectsByType<StateMapRegionMarker>(FindObjectsSortMode.None);
            foreach (var r in regions)
            {
                if (GUILayout.Button(r.Item2, GUILayout.Height(26)))
                {
                    foreach (var m in markers)
                    {
                        if (m.regionId == r.Item1)
                        {
                            SelectRegion(m);
                            break;
                        }
                    }
                }
            }

            GUILayout.EndHorizontal();
            GUILayout.EndArea();

            // 6. Map Data & Credits Modal
            if (_showCreditsModal)
            {
                float modalW = Mathf.Min(680, screenW - 64);
                float modalH = Mathf.Min(480, screenH - 64);
                float modalX = (screenW - modalW) / 2f;
                float modalY = (screenH - modalH) / 2f;

                GUI.depth = -100;
                GUILayout.BeginArea(new Rect(modalX, modalY, modalW, modalH), _panelStyle);
                GUILayout.Label("<b>Map Data & Credits (வரைபட தரவு மற்றும் உரிமங்கள்)</b>", _cardTitleStyle);
                GUILayout.Space(8);

                GUILayout.Label("<b>Natural Earth (Public Domain):</b>", _legendStyle);
                GUILayout.Label("State outline, coastline, rivers, highways/roads, physical geography regions, and populated places derived from Natural Earth 10m public domain datasets (naturalearthdata.com).", _bodyStyle);
                GUILayout.Space(6);

                GUILayout.Label("<b>Project Curated Campaign Hubs:</b>", _legendStyle);
                GUILayout.Label("Primary exploration regions (Chennai, Mamallapuram, Pichavaram, Thanjavur, Chettinad, Nilgiris) with bilingual Tamil/English titles and progression unlock gating authored for The Whispering Wilds.", _bodyStyle);
                GUILayout.Space(6);

                GUILayout.Label("<b>Geographic Coordinate System & Canonical Projection:</b>", _legendStyle);
                GUILayout.Label("• Canonical Origin: 10.79° N, 78.37° E (Tiruchirappalli center)\n• Scale: 1 scene unit = 1 kilometre (0.001 units/metre)\n• Orientation: +X = East, +Z = North, +Y = Elevation\n• Projection: Equirectangular with cosine latitude correction", _bodyStyle);
                GUILayout.Space(10);

                GUILayout.FlexibleSpace();
                if (GUILayout.Button("Close / மூடு [X]", _buttonStyle, GUILayout.Height(36)))
                {
                    _showCreditsModal = false;
                }
                GUILayout.EndArea();
            }
        }

        private string GetRegionBiomeDesc(string regionId)
        {
            switch (regionId?.ToLowerInvariant())
            {
                case "chennai":
                    return "Urban Coastal & Spice Mercantile Core. Indo-Saracenic High Court plaza, historic harbor corridors, and tea stalls.";
                case "mamallapuram":
                    return "Granite Coastal Heritage. 7th-century Pallava shore monoliths, Arjuna's Penance rock relief, and active sculptors.";
                case "pichavaram":
                    return "Estuarine Mangrove Wetlands. Labyrinthian tidal channels, mangrove roots, and coastal fishing catamarans.";
                case "thanjavur":
                case "delta":
                    return "Cauvery Delta Agri-Basin & Chola Citadel. 11th-century Brihadeeswara granite vimana, canal bund roads, and bronzes.";
                case "chettinad":
                    return "Semi-Arid Heritage Plains. Palatial Nattukottai merchant mansions, Athangudi handmade tiles, and rainwater courtyards.";
                case "nilgiris":
                    return "Montane Shola-Tea Biosphere (2,240m elevation). Tea garden slopes, indigenous Toda settlements, and misty peaks.";
                default:
                    return "Historical cultural zone of Tamil Nadu.";
            }
        }
    }
}
