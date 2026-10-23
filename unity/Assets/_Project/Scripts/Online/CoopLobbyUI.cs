using System.Collections.Generic;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Co-op expedition lobby built on the project's uGUI stack.
    ///
    /// Hosting and joining are separate actions. The host receives a
    /// server-generated six-character code; the join field only accepts that
    /// alphabet. Solo play never opens a network connection.
    /// </summary>
    [DisallowMultipleComponent]
    public class CoopLobbyUI : MonoBehaviour
    {
        private const string PlayerNameKey = "ww.coop.playerName";
        private const string CodePattern = "^[A-HJ-NP-Z2-9]{6}$";

        private static readonly Color PanelColor = new Color(0.055f, 0.09f, 0.08f, 0.97f);
        private static readonly Color FieldColor = new Color(0.10f, 0.16f, 0.14f, 1f);
        private static readonly Color Gold = new Color(0.95f, 0.76f, 0.32f, 1f);
        private static readonly Color TextColor = new Color(0.93f, 0.92f, 0.86f, 1f);
        private static readonly Color Muted = new Color(0.68f, 0.72f, 0.68f, 1f);

        private static CoopLobbyUI instance;

        [SerializeField] private bool startVisible;

        private GameObject panel;
        private InputField nameField;
        private InputField codeField;
        private Text titleLabel;
        private Text statusLabel;
        private Text nameLabel;
        private Text codeLabel;
        private Text roomLabel;
        private Text roleLabel;
        private Text playersLabel;
        private Text rosterLabel;
        private Button hostButton;
        private Button joinButton;
        private Button soloButton;
        private Button leaveButton;
        private Button copyButton;
        private Button closeButton;
        private Text hostButtonLabel;
        private Text joinButtonLabel;
        private Text soloButtonLabel;
        private Text leaveButtonLabel;
        private Text copyButtonLabel;
        private Text closeButtonLabel;
        private GameObject offlineGroup;
        private GameObject roomGroup;
        private string playerName = "Explorer";
        private string statusOverride;
        private bool visible;

        public static bool IsOpen => instance != null && instance.visible;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            EnsureInstance();
        }

        public static void Show()
        {
            EnsureInstance().SetVisible(true);
        }

        public static void Hide()
        {
            if (instance != null) instance.SetVisible(false);
        }

        private static CoopLobbyUI EnsureInstance()
        {
            if (instance != null) return instance;
            var go = new GameObject("CoopLobbyUI");
            DontDestroyOnLoad(go);
            instance = go.AddComponent<CoopLobbyUI>();
            return instance;
        }

        private void Awake()
        {
            if (instance != null && instance != this)
            {
                Destroy(gameObject);
                return;
            }

            instance = this;
            DontDestroyOnLoad(gameObject);
            playerName = PlayerPrefs.GetString(PlayerNameKey, "Explorer");
            if (string.IsNullOrWhiteSpace(playerName)) playerName = "Explorer";
            BuildUI();
            SetVisible(startVisible);
        }

        private void Start()
        {
            RealtimeManager manager = RealtimeManager.Instance;
            if (manager != null)
            {
                manager.OnRoomJoined += HandleRoomJoined;
                manager.OnJoinFailed += HandleJoinFailed;
                manager.OnLeftRoom += HandleLeftRoom;
                manager.OnRosterChanged += HandleRosterChanged;
                manager.OnNetworkRoleChanged += HandleRoleChanged;
            }

            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += HandleLanguageChanged;
            }

            Refresh();
        }

        private void OnDestroy()
        {
            RealtimeManager manager = RealtimeManager.Instance;
            if (manager != null)
            {
                manager.OnRoomJoined -= HandleRoomJoined;
                manager.OnJoinFailed -= HandleJoinFailed;
                manager.OnLeftRoom -= HandleLeftRoom;
                manager.OnRosterChanged -= HandleRosterChanged;
                manager.OnNetworkRoleChanged -= HandleRoleChanged;
            }

            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= HandleLanguageChanged;
            }

            if (instance == this) instance = null;
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.F8))
            {
                SetVisible(!visible);
                return;
            }

            if (visible && Input.GetKeyDown(KeyCode.Escape))
            {
                SetVisible(false);
            }
        }

        private void SetVisible(bool value)
        {
            visible = value;
            if (panel != null) panel.SetActive(value);
            if (value)
            {
                Refresh();
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
                if (nameField != null && string.IsNullOrEmpty(nameField.text)) nameField.text = playerName;
            }
        }

        private void HandleRoomJoined(string roomCode, bool isHost)
        {
            statusOverride = null;
            SetVisible(true);
            Refresh();
        }

        private void HandleJoinFailed(string reason)
        {
            statusOverride = string.IsNullOrEmpty(reason)
                ? Localize("coop.join_failed", "Could not join the expedition.")
                : reason;
            SetVisible(true);
            Refresh();
        }

        private void HandleLeftRoom()
        {
            statusOverride = null;
            Refresh();
        }

        private void HandleRosterChanged()
        {
            if (visible) Refresh();
        }

        private void HandleRoleChanged(NetworkRole role)
        {
            if (role == NetworkRole.OfflineSinglePlayer && visible) Refresh();
        }

        private void HandleLanguageChanged(Language language)
        {
            ApplyStaticLabels();
            Refresh();
        }

        private void OnHostClicked()
        {
            RealtimeManager manager = RealtimeManager.Instance;
            if (manager == null) return;
            RememberName();
            statusOverride = Localize("coop.connecting", "Connecting...");
            manager.CreateRoom(playerName);
            Refresh();
        }

        private void OnJoinClicked()
        {
            RealtimeManager manager = RealtimeManager.Instance;
            if (manager == null) return;

            string code = (codeField != null ? codeField.text : string.Empty).Trim().ToUpperInvariant();
            if (!Regex.IsMatch(code, CodePattern))
            {
                statusOverride = Localize("coop.invalid_code", "Enter a valid six-character code.");
                Refresh();
                return;
            }

            RememberName();
            statusOverride = Localize("coop.connecting", "Connecting...");
            manager.JoinRoom(code, playerName);
            Refresh();
        }

        private void OnSoloClicked()
        {
            RememberName();
            RealtimeManager.Instance?.EnterSoloMode();
            statusOverride = null;
            SetVisible(false);
        }

        private void OnLeaveClicked()
        {
            RealtimeManager.Instance?.LeaveRoom();
            statusOverride = null;
            Refresh();
        }

        private void OnCopyClicked()
        {
            RealtimeManager manager = RealtimeManager.Instance;
            if (manager == null || string.IsNullOrEmpty(manager.CurrentRoom)) return;
            GUIUtility.systemCopyBuffer = manager.CurrentRoom;
            statusOverride = Localize("coop.copied", "Invite code copied.");
            Refresh();
        }

        private void OnCloseClicked()
        {
            SetVisible(false);
        }

        private void RememberName()
        {
            if (nameField != null) playerName = nameField.text;
            if (string.IsNullOrWhiteSpace(playerName)) playerName = "Explorer";
            playerName = playerName.Trim();
            if (playerName.Length > 24) playerName = playerName.Substring(0, 24);
            if (nameField != null) nameField.text = playerName;
            PlayerPrefs.SetString(PlayerNameKey, playerName);
            PlayerPrefs.Save();
        }

        private void Refresh()
        {
            if (panel == null) return;

            RealtimeManager manager = RealtimeManager.Instance;
            bool inRoom = manager != null && !string.IsNullOrEmpty(manager.CurrentRoom);

            if (offlineGroup != null) offlineGroup.SetActive(!inRoom);
            if (roomGroup != null) roomGroup.SetActive(inRoom);

            if (hostButton != null)
            {
                hostButton.interactable = !inRoom;
            }

            if (joinButton != null)
            {
                string code = codeField != null ? (codeField.text ?? string.Empty).Trim().ToUpperInvariant() : string.Empty;
                joinButton.interactable = !inRoom && Regex.IsMatch(code, CodePattern);
            }

            if (inRoom)
            {
                roomLabel.text = manager.CurrentRoom;
                roleLabel.text = manager.IsHost
                    ? Localize("coop.role.host", "Host")
                    : Localize("coop.role.explorer", "Explorer");

                List<string> roster = manager.GetRosterNames();
                rosterLabel.text = string.Join("\n", roster);
                playersLabel.text = $"{Localize("coop.players", "Explorers")}  {manager.PlayerCount}/{Mathf.Max(1, manager.MaxPlayers)}";

                if (string.IsNullOrEmpty(statusOverride))
                {
                    statusOverride = manager.IsHost
                        ? Localize("coop.host_hint", "Share this code with your party.")
                        : Localize("coop.joined_hint", "You joined the expedition.");
                }
                statusLabel.text = statusOverride;
            }
            else
            {
                statusLabel.text = string.IsNullOrEmpty(statusOverride)
                    ? Localize("coop.offline", "Offline single-player")
                    : statusOverride;
            }

            ApplyStaticLabels();
        }

        private void ApplyStaticLabels()
        {
            if (titleLabel != null) titleLabel.text = Localize("coop.title", "Co-op Expedition");
            if (nameLabel != null) nameLabel.text = Localize("coop.name", "Explorer name");
            if (codeLabel != null) codeLabel.text = Localize("coop.code", "Six-character invite code");
            if (hostButtonLabel != null) hostButtonLabel.text = Localize("coop.host", "Host Expedition");
            if (joinButtonLabel != null) joinButtonLabel.text = Localize("coop.join", "Join Expedition");
            if (soloButtonLabel != null) soloButtonLabel.text = Localize("coop.solo", "Play Offline (Solo)");
            if (leaveButtonLabel != null) leaveButtonLabel.text = Localize("coop.leave", "Leave Room");
            if (copyButtonLabel != null) copyButtonLabel.text = Localize("coop.copy", "Copy Code");
            if (closeButtonLabel != null) closeButtonLabel.text = Localize("coop.close", "Close");
            if (playersLabel != null && RealtimeManager.Instance != null && !string.IsNullOrEmpty(RealtimeManager.Instance.CurrentRoom))
            {
                playersLabel.text = $"{Localize("coop.players", "Explorers")}  {RealtimeManager.Instance.PlayerCount}/{Mathf.Max(1, RealtimeManager.Instance.MaxPlayers)}";
            }
        }

        private static string Localize(string key, string fallback)
        {
            LocalizationManager manager = LocalizationManager.Instance;
            if (manager == null) return fallback;
            string value = manager.GetForDisplay(key, fallback);
            return string.IsNullOrEmpty(value) ? fallback : value;
        }

        private void BuildUI()
        {
            EnsureEventSystem();

            var canvasObject = new GameObject("CoopCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            Canvas canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 400;
            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.matchWidthOrHeight = 0.5f;

            panel = new GameObject("CoopPanel", typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(canvasObject.transform, false);
            RectTransform panelRect = panel.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(1f, 0.5f);
            panelRect.anchorMax = new Vector2(1f, 0.5f);
            panelRect.pivot = new Vector2(1f, 0.5f);
            panelRect.anchoredPosition = new Vector2(-28f, 0f);
            panelRect.sizeDelta = new Vector2(440f, 600f);
            panel.GetComponent<Image>().color = PanelColor;

            var accent = NewImage("Accent", panelRect, Gold);
            Place(accent.rectTransform, 0f, 0f, 440f, 3f);

            titleLabel = NewText("Title", panelRect, "Co-op Expedition", 24, FontStyle.Bold, TextColor, TextAnchor.MiddleLeft);
            Place(titleLabel.rectTransform, 20f, 18f, 340f, 32f);

            closeButton = NewButton("Close", panelRect, new Color(0.34f, 0.20f, 0.18f), out closeButtonLabel);
            Place(closeButton.GetComponent<RectTransform>(), 382f, 16f, 38f, 30f);
            closeButtonLabel.fontSize = 13;
            closeButton.onClick.AddListener(OnCloseClicked);

            statusLabel = NewText("Status", panelRect, string.Empty, 14, FontStyle.Normal, Muted, TextAnchor.UpperLeft);
            Place(statusLabel.rectTransform, 20f, 58f, 400f, 44f);

            offlineGroup = new GameObject("OfflineGroup", typeof(RectTransform));
            offlineGroup.transform.SetParent(panelRect, false);
            RectTransform offlineRect = offlineGroup.GetComponent<RectTransform>();
            Stretch(offlineRect);

            nameLabel = NewText("NameLabel", offlineRect, "Explorer name", 14, FontStyle.Bold, TextColor, TextAnchor.MiddleLeft);
            Place(nameLabel.rectTransform, 20f, 108f, 400f, 24f);

            nameField = NewInput("NameField", offlineRect, "Explorer", 24);
            Place(nameField.GetComponent<RectTransform>(), 20f, 134f, 400f, 40f);

            hostButton = NewButton("HostButton", offlineRect, new Color(0.15f, 0.45f, 0.35f), out hostButtonLabel);
            Place(hostButton.GetComponent<RectTransform>(), 20f, 188f, 400f, 46f);
            hostButton.onClick.AddListener(OnHostClicked);

            codeLabel = NewText("CodeLabel", offlineRect, "Six-character invite code", 14, FontStyle.Bold, TextColor, TextAnchor.MiddleLeft);
            Place(codeLabel.rectTransform, 20f, 250f, 400f, 24f);

            codeField = NewInput("CodeField", offlineRect, "ABC234", 6);
            codeField.characterLimit = 6;
            codeField.onValueChanged.AddListener(_ => Refresh());
            Place(codeField.GetComponent<RectTransform>(), 20f, 276f, 400f, 44f);

            joinButton = NewButton("JoinButton", offlineRect, new Color(0.20f, 0.35f, 0.50f), out joinButtonLabel);
            Place(joinButton.GetComponent<RectTransform>(), 20f, 334f, 400f, 46f);
            joinButton.onClick.AddListener(OnJoinClicked);

            soloButton = NewButton("SoloButton", offlineRect, new Color(0.18f, 0.30f, 0.28f), out soloButtonLabel);
            Place(soloButton.GetComponent<RectTransform>(), 20f, 398f, 400f, 44f);
            soloButton.onClick.AddListener(OnSoloClicked);

            roomGroup = new GameObject("RoomGroup", typeof(RectTransform));
            roomGroup.transform.SetParent(panelRect, false);
            Stretch(roomGroup.GetComponent<RectTransform>());

            Text roomCaption = NewText("RoomCaption", roomGroup.GetComponent<RectTransform>(), "ROOM", 12, FontStyle.Bold, Muted, TextAnchor.UpperLeft);
            Place(roomCaption.rectTransform, 20f, 108f, 120f, 20f);

            roomLabel = NewText("RoomCode", roomGroup.GetComponent<RectTransform>(), "------", 40, FontStyle.Bold, Gold, TextAnchor.UpperLeft);
            Place(roomLabel.rectTransform, 20f, 128f, 400f, 56f);

            roleLabel = NewText("Role", roomGroup.GetComponent<RectTransform>(), "Explorer", 16, FontStyle.Normal, TextColor, TextAnchor.UpperLeft);
            Place(roleLabel.rectTransform, 20f, 190f, 400f, 24f);

            copyButton = NewButton("CopyButton", roomGroup.GetComponent<RectTransform>(), new Color(0.20f, 0.38f, 0.42f), out copyButtonLabel);
            Place(copyButton.GetComponent<RectTransform>(), 20f, 224f, 190f, 40f);
            copyButton.onClick.AddListener(OnCopyClicked);

            leaveButton = NewButton("LeaveButton", roomGroup.GetComponent<RectTransform>(), new Color(0.46f, 0.20f, 0.18f), out leaveButtonLabel);
            Place(leaveButton.GetComponent<RectTransform>(), 230f, 224f, 190f, 40f);
            leaveButton.onClick.AddListener(OnLeaveClicked);

            playersLabel = NewText("Players", roomGroup.GetComponent<RectTransform>(), "Explorers  1/5", 15, FontStyle.Bold, TextColor, TextAnchor.UpperLeft);
            Place(playersLabel.rectTransform, 20f, 284f, 400f, 24f);

            rosterLabel = NewText("Roster", roomGroup.GetComponent<RectTransform>(), "Explorer", 15, FontStyle.Normal, Muted, TextAnchor.UpperLeft);
            Place(rosterLabel.rectTransform, 20f, 312f, 400f, 170f);

            ApplyStaticLabels();
            panel.SetActive(false);
        }

        private static void EnsureEventSystem()
        {
            if (EventSystem.current != null) return;
            var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            DontDestroyOnLoad(eventSystem);
        }

        private static Image NewImage(string name, RectTransform parent, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            var image = go.GetComponent<Image>();
            image.color = color;
            return image;
        }

        private static Text NewText(string name, RectTransform parent, string content, int size, FontStyle style, Color color, TextAnchor anchor)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            Text text = go.GetComponent<Text>();
            text.text = content;
            text.font = LocalizedFontProvider.Font;
            text.fontSize = size;
            text.fontStyle = style;
            text.color = color;
            text.alignment = anchor;
            text.supportRichText = false;
            text.raycastTarget = false;
            return text;
        }

        private static Button NewButton(string name, RectTransform parent, Color color, out Text label)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            Image image = go.GetComponent<Image>();
            image.color = color;

            Button button = go.GetComponent<Button>();
            button.targetGraphic = image;
            ColorBlock colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(1.08f, 1.08f, 1.08f, 1f);
            colors.pressedColor = new Color(0.82f, 0.82f, 0.82f, 1f);
            colors.disabledColor = new Color(0.55f, 0.55f, 0.55f, 0.6f);
            button.colors = colors;

            label = NewText("Label", go.GetComponent<RectTransform>(), name, 16, FontStyle.Bold, TextColor, TextAnchor.MiddleCenter);
            Stretch(label.rectTransform, 8f);
            return button;
        }

        private static InputField NewInput(string name, RectTransform parent, string placeholder, int limit)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(InputField));
            go.transform.SetParent(parent, false);
            Image image = go.GetComponent<Image>();
            image.color = FieldColor;

            Text text = NewText("Text", go.GetComponent<RectTransform>(), string.Empty, 18, FontStyle.Normal, TextColor, TextAnchor.MiddleLeft);
            Stretch(text.rectTransform, 10f);
            text.raycastTarget = true;

            Text hint = NewText("Placeholder", go.GetComponent<RectTransform>(), placeholder, 16, FontStyle.Italic, new Color(0.62f, 0.66f, 0.62f, 0.8f), TextAnchor.MiddleLeft);
            Stretch(hint.rectTransform, 10f);

            InputField field = go.GetComponent<InputField>();
            field.targetGraphic = image;
            field.textComponent = text;
            field.placeholder = hint;
            field.lineType = InputField.LineType.SingleLine;
            field.characterLimit = limit;
            field.contentType = InputField.ContentType.Alphanumeric;
            return field;
        }

        private static void Place(RectTransform rect, float x, float y, float width, float height)
        {
            rect.anchorMin = new Vector2(0f, 1f);
            rect.anchorMax = new Vector2(0f, 1f);
            rect.pivot = new Vector2(0f, 1f);
            rect.anchoredPosition = new Vector2(x, -y);
            rect.sizeDelta = new Vector2(width, height);
        }

        private static void Stretch(RectTransform rect, float padding = 0f)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(padding, padding);
            rect.offsetMax = new Vector2(-padding, -padding);
        }
    }
}
