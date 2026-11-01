using System;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Localization;
using WhisperingWilds.Quests;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Step 3 Campaign Flow & Objective System:
    /// Responsive on-screen Heads-Up Display for tracking active campaign quests and objectives.
    /// Supports dynamic bilingual updates (English & Tamil), stage progression, and clean
    /// integration with QuestManager and LocalizationManager.
    /// </summary>
    [DisallowMultipleComponent]
    public class ObjectiveTrackerHUD : MonoBehaviour
    {
        public static ObjectiveTrackerHUD Instance { get; private set; }

        [Header("UI Hierarchy")]
        [SerializeField] private GameObject trackerPanel;
        [SerializeField] private Text trackerHeaderLabel;
        [SerializeField] private Text questTitleText;
        [SerializeField] private Text stageTitleText;
        [SerializeField] private Text objectiveDetailsText;
        [SerializeField] private Image accentBar;

        [Header("Settings")]
        [SerializeField] private bool hideDuringMenus = true;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            if (trackerPanel == null)
            {
                BuildDynamicObjectiveHUD();
            }
        }

        private void Start()
        {
            ApplyFonts();
            RefreshDisplay();
        }

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += HandleLanguageChanged;
            }

            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.OnQuestAccepted += HandleQuestAccepted;
                QuestManager.Instance.OnObjectiveAdvanced += HandleObjectiveAdvanced;
                QuestManager.Instance.OnQuestCompleted += HandleQuestCompleted;
            }
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= HandleLanguageChanged;
            }

            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.OnQuestAccepted -= HandleQuestAccepted;
                QuestManager.Instance.OnObjectiveAdvanced -= HandleObjectiveAdvanced;
                QuestManager.Instance.OnQuestCompleted -= HandleQuestCompleted;
            }
        }

        private void Update()
        {
            // Subscribe to QuestManager lazily if it was spawned after this HUD
            if (QuestManager.Instance != null)
            {
                // Re-bind events if needed
            }

            // Gating visibility during pause or non-gameplay states
            if (hideDuringMenus && trackerPanel != null)
            {
                var gm = GameManager.Instance;
                bool shouldShow = gm == null || gm.CurrentState == GameState.Gameplay;
                if (trackerPanel.activeSelf != shouldShow)
                {
                    trackerPanel.SetActive(shouldShow);
                }
            }
        }

        private void HandleLanguageChanged(Language language)
        {
            ApplyFonts();
            RefreshDisplay();
        }

        private void HandleQuestAccepted(QuestData quest)
        {
            RefreshDisplay();
        }

        private void HandleObjectiveAdvanced(QuestData quest, string objectiveId, int count)
        {
            RefreshDisplay();
        }

        private void HandleQuestCompleted(QuestData quest)
        {
            RefreshDisplay();
        }

        /// <summary>
        /// Refreshes the on-screen objective text from the primary active quest.
        /// </summary>
        public void RefreshDisplay()
        {
            if (trackerPanel == null) return;

            var qm = QuestManager.Instance;
            var loc = LocalizationManager.Instance;
            bool isTamil = loc != null && loc.CurrentLanguage == Language.Tamil;

            if (trackerHeaderLabel != null)
            {
                trackerHeaderLabel.text = loc != null
                    ? loc.GetForDisplay("objective.tracker_title")
                    : "ACTIVE OBJECTIVE";
            }

            if (qm == null || qm.ActiveQuests == null || qm.ActiveQuests.Count == 0)
            {
                if (questTitleText != null)
                {
                    questTitleText.text = loc != null
                        ? loc.GetForDisplay("objective.no_active")
                        : "Explore the region";
                }
                if (stageTitleText != null) stageTitleText.text = string.Empty;
                if (objectiveDetailsText != null) objectiveDetailsText.text = string.Empty;
                return;
            }

            var primary = qm.ActiveQuests[0];
            if (primary == null || primary.quest == null) return;

            // Quest Title
            if (questTitleText != null)
            {
                string title = isTamil && !string.IsNullOrEmpty(primary.quest.titleTa)
                    ? primary.quest.titleTa
                    : primary.quest.titleEn;
                questTitleText.text = title;
            }

            // Stage Title
            var stage = primary.CurrentStage;
            if (stage != null && stageTitleText != null)
            {
                string stageTitle = isTamil && !string.IsNullOrEmpty(stage.titleTa)
                    ? stage.titleTa
                    : stage.titleEn;

                string stageFormat = loc != null ? loc.Get("objective.stage_label") : "Stage {0}: {1}";
                if (string.IsNullOrEmpty(stageFormat) || stageFormat.StartsWith("missing.")) stageFormat = "Stage {0}: {1}";
                stageTitleText.text = string.Format(stageFormat, primary.currentStageIndex + 1, stageTitle);
            }
            else if (stageTitleText != null)
            {
                stageTitleText.text = string.Empty;
            }

            // Stage Objectives
            if (objectiveDetailsText != null && stage != null && stage.objectives != null)
            {
                var sb = new StringBuilder();
                for (int i = 0; i < stage.objectives.Count; i++)
                {
                    var obj = stage.objectives[i];
                    if (obj == null) continue;

                    int count = primary.GetCount(obj.objectiveId);
                    bool done = count >= obj.requiredCount;
                    string mark = done ? "<color=#00FF88>[✓]</color>" : "<color=#FFCC00>[•]</color>";

                    string desc = isTamil && !string.IsNullOrEmpty(obj.descriptionTa)
                        ? obj.descriptionTa
                        : obj.descriptionEn;

                    sb.AppendLine($"{mark} {desc} ({count}/{obj.requiredCount})");
                }
                objectiveDetailsText.text = sb.ToString().TrimEnd();
            }
        }

        private void ApplyFonts()
        {
            LocalizedFontProvider.Apply(trackerHeaderLabel);
            LocalizedFontProvider.Apply(questTitleText);
            LocalizedFontProvider.Apply(stageTitleText);
            LocalizedFontProvider.Apply(objectiveDetailsText);
        }

        /// <summary>
        /// Dynamically builds the Objective Tracker HUD panel on the main Canvas.
        /// </summary>
        private void BuildDynamicObjectiveHUD()
        {
            var canvasObj = GameObject.Find("HUD_Canvas");
            Canvas canvas = canvasObj != null ? canvasObj.GetComponent<Canvas>() : FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                var newCanvas = new GameObject("ObjectiveTracker_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                canvas = newCanvas.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 400;
            }

            trackerPanel = new GameObject("ObjectiveTrackerPanel", typeof(RectTransform), typeof(Image));
            trackerPanel.transform.SetParent(canvas.transform, false);

            var rt = trackerPanel.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(1f, 1f);
            rt.anchorMax = new Vector2(1f, 1f);
            rt.pivot = new Vector2(1f, 1f);
            rt.anchoredPosition = new Vector2(-20f, -80f);
            rt.sizeDelta = new Vector2(340f, 120f);

            var bg = trackerPanel.GetComponent<Image>();
            bg.color = new Color(0.06f, 0.08f, 0.12f, 0.88f);

            // Gold accent bar
            var accentObj = new GameObject("AccentBar", typeof(RectTransform), typeof(Image));
            accentObj.transform.SetParent(trackerPanel.transform, false);
            var accentRt = accentObj.GetComponent<RectTransform>();
            accentRt.anchorMin = new Vector2(0f, 1f);
            accentRt.anchorMax = new Vector2(1f, 1f);
            accentRt.pivot = new Vector2(0f, 1f);
            accentRt.anchoredPosition = new Vector2(0f, 0f);
            accentRt.sizeDelta = new Vector2(0f, 3f);
            accentBar = accentObj.GetComponent<Image>();
            accentBar.color = new Color(0.85f, 0.72f, 0.28f, 1f);

            // Header label
            var headerObj = new GameObject("HeaderLabel", typeof(RectTransform), typeof(Text));
            headerObj.transform.SetParent(trackerPanel.transform, false);
            var headerRt = headerObj.GetComponent<RectTransform>();
            headerRt.anchoredPosition = new Vector2(14f, -14f);
            headerRt.sizeDelta = new Vector2(310f, 18f);
            trackerHeaderLabel = headerObj.GetComponent<Text>();
            trackerHeaderLabel.fontSize = 11;
            trackerHeaderLabel.fontStyle = FontStyle.Bold;
            trackerHeaderLabel.color = new Color(0.85f, 0.72f, 0.28f, 1f);

            // Quest Title
            var titleObj = new GameObject("QuestTitle", typeof(RectTransform), typeof(Text));
            titleObj.transform.SetParent(trackerPanel.transform, false);
            var titleRt = titleObj.GetComponent<RectTransform>();
            titleRt.anchoredPosition = new Vector2(14f, -32f);
            titleRt.sizeDelta = new Vector2(310f, 22f);
            questTitleText = titleObj.GetComponent<Text>();
            questTitleText.fontSize = 13;
            questTitleText.fontStyle = FontStyle.Bold;
            questTitleText.color = Color.white;

            // Stage Title
            var stageObj = new GameObject("StageTitle", typeof(RectTransform), typeof(Text));
            stageObj.transform.SetParent(trackerPanel.transform, false);
            var stageRt = stageObj.GetComponent<RectTransform>();
            stageRt.anchoredPosition = new Vector2(14f, -54f);
            stageRt.sizeDelta = new Vector2(310f, 18f);
            stageTitleText = stageObj.GetComponent<Text>();
            stageTitleText.fontSize = 11;
            stageTitleText.color = new Color(0.35f, 0.85f, 1f, 1f);

            // Objective Details
            var objDetails = new GameObject("ObjectiveDetails", typeof(RectTransform), typeof(Text));
            objDetails.transform.SetParent(trackerPanel.transform, false);
            var objRt = objDetails.GetComponent<RectTransform>();
            objRt.anchoredPosition = new Vector2(14f, -74f);
            objRt.sizeDelta = new Vector2(310f, 40f);
            objectiveDetailsText = objDetails.GetComponent<Text>();
            objectiveDetailsText.fontSize = 11;
            objectiveDetailsText.color = new Color(0.9f, 0.9f, 0.9f, 1f);
            objectiveDetailsText.lineSpacing = 1.15f;
        }
    }
}
