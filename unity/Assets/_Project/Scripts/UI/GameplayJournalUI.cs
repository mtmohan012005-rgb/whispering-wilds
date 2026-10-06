using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;
using WhisperingWilds.Investigation;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;
using WhisperingWilds.Photography;
using WhisperingWilds.Player;
using WhisperingWilds.Quests;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Field journal and crafting bench, built at runtime so it needs no authored prefab.
    ///
    /// The journal lists active quests, recorded clues, unlocked deductions, captured photographs,
    /// and who the player has met. The bench lists catalogue recipes and crafts through
    /// <see cref="CraftingManager"/>, which is what records the craft and advances a CraftItem
    /// objective. Both panels are gated on the GameManager state, so opening the journal pauses the
    /// world and releases the cursor without touching Time.timeScale directly.
    /// </summary>
    [DisallowMultipleComponent]
    public class GameplayJournalUI : MonoBehaviour
    {
        private enum PanelMode
        {
            Closed,
            Journal,
            Crafting
        }

        private const int MaxListedRows = 14;

        private PanelMode mode = PanelMode.Closed;
        private GameState stateBeforePanel = GameState.Gameplay;

        private RectTransform panelRoot;
        private RectTransform listRoot;
        private Text titleText;
        private Text subtitleText;
        private Font font;

        private PlayerInputHandler input;

        private void Awake()
        {
            font = LocalizedFontProvider.Font;
            BuildPanel();
        }

        private void Start()
        {
            GameplayContentRegistry.EnsureAllInitialized();
            input = FindObjectOfType<PlayerInputHandler>();
        }

        private void Update()
        {
            if (input == null) return;

            // The journal and bench are gameplay tools, so they are unavailable outside gameplay.
            bool gameplayActive = GameManager.Instance != null
                                  && GameManager.Instance.CurrentState == GameState.Gameplay;

            if (input.JournalTriggered && gameplayActive)
            {
                input.ConsumeJournal();
                Toggle(PanelMode.Journal);
            }
            else if (input.CraftingTriggered && gameplayActive)
            {
                input.ConsumeCrafting();
                Toggle(PanelMode.Crafting);
            }
            else if (input.CancelTriggered && mode != PanelMode.Closed)
            {
                input.ConsumeCancel();
                Toggle(PanelMode.Closed);
            }

            // Quick save and quick load work whether or not a panel is open.
            if (input.QuickSaveTriggered && GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Gameplay)
            {
                input.ConsumeQuickSave();
                GameManager.Instance.QuickSave();
            }

            if (input.QuickLoadTriggered && GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Gameplay)
            {
                input.ConsumeQuickLoad();
                GameManager.Instance.QuickLoad();
            }

            if (mode != PanelMode.Closed) Refresh();
        }

        private void Toggle(PanelMode requested)
        {
            SetMode(requested == mode ? PanelMode.Closed : requested);
        }

        private void SetMode(PanelMode next)
        {
            if (next == mode)
            {
                ApplyPanelVisibility();
                return;
            }

            if (next == PanelMode.Closed)
            {
                mode = PanelMode.Closed;
                if (GameManager.Instance != null) GameManager.Instance.SetGameState(stateBeforePanel);
                ApplyPanelVisibility();
                return;
            }

            stateBeforePanel = GameManager.Instance != null ? GameManager.Instance.CurrentState : GameState.Gameplay;
            mode = next;

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(next == PanelMode.Journal
                    ? GameState.InvestigationBoard
                    : GameState.Paused);
            }

            ApplyPanelVisibility();
            Refresh();
        }

        private void ApplyPanelVisibility()
        {
            bool open = mode != PanelMode.Closed;
            if (panelRoot != null) panelRoot.gameObject.SetActive(open);

            if (open)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Gameplay)
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        private void Refresh()
        {
            ClearRows();

            if (titleText != null)
            {
                titleText.text = Localized(mode == PanelMode.Crafting ? "crafting.title" : "journal.title",
                    mode == PanelMode.Crafting ? "Crafting" : "Field Journal");
            }

            if (mode == PanelMode.Crafting) BuildCraftingRows();
            else BuildJournalRows();
        }

        // ---- Journal ---------------------------------------------------------

        private void BuildJournalRows()
        {
            var quests = QuestManager.Instance;
            if (quests == null)
            {
                AddRow(Localized("journal.no_quests", "No active quests."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            AddHeading(Localized("journal.quests", "Quests"));

            var active = quests.ActiveQuests;
            if (active == null || active.Count == 0)
            {
                AddRow(Localized("journal.no_quests", "No active quests."), new Color(0.8f, 0.8f, 0.8f));
            }
            else
            {
                for (int i = 0; i < active.Count; i++)
                {
                    var progress = active[i];
                    if (progress == null || progress.quest == null) continue;

                    bool tamil = IsTamil();
                    string questTitle = tamil && !string.IsNullOrEmpty(progress.quest.titleTa)
                        ? progress.quest.titleTa
                        : progress.quest.titleEn;

                    AddRow($"• {questTitle}", new Color(1f, 0.92f, 0.7f));
                    AddObjectiveRows(progress);
                }
            }

            AddHeading(Localized("journal.clues", "Recorded Clues"));
            AddEvidenceRows();

            AddHeading(Localized("journal.deductions", "Deductions"));
            AddDeductionRows();

            AddHeading(Localized("journal.discoveries", "Important Discoveries"));
            AddDiscoveryRows();

            AddHeading(Localized("journal.contacts", "People Met"));
            AddContactRows();
        }

        private void AddObjectiveRows(ActiveQuestProgress progress)
        {
            var stage = progress.CurrentStage;
            if (stage == null || stage.objectives == null) return;

            for (int i = 0; i < stage.objectives.Count && i < MaxListedRows; i++)
            {
                var objective = stage.objectives[i];
                if (objective == null) continue;

                int count = progress.GetCount(objective.objectiveId);
                string description = IsTamil() && !string.IsNullOrEmpty(objective.descriptionTa)
                    ? objective.descriptionTa
                    : objective.descriptionEn;

                // QuestObjective.isCompleted reflects the template's own counter, not the live save,
                // so completion is derived from the runtime count here.
                bool complete = count >= objective.requiredCount;
                string prefix = complete ? "[x]" : $"[{count}/{objective.requiredCount}]";
                Color tint = complete ? new Color(0.55f, 0.9f, 0.6f) : new Color(0.85f, 0.88f, 0.92f);
                AddRow($"   {prefix} {description}", tint);
            }
        }

        private void AddEvidenceRows()
        {
            var investigation = InvestigationManager.Instance;
            if (investigation == null)
            {
                AddRow(Localized("journal.no_clues", "Nothing recorded yet."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            var clues = investigation.DiscoveredClues;
            if (clues == null || clues.Count == 0)
            {
                AddRow(Localized("journal.no_clues", "Nothing recorded yet."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            for (int i = 0; i < clues.Count && i < MaxListedRows; i++)
            {
                var clue = clues[i];
                if (clue == null) continue;
                AddRow($"• {Resolve(clue.titleEn, clue.titleTa)}", new Color(0.85f, 0.9f, 1f));
            }
        }

        private void AddDeductionRows()
        {
            var investigation = InvestigationManager.Instance;
            var keys = investigation != null ? investigation.LinkedDeductions : null;

            if (keys == null || keys.Count == 0)
            {
                AddRow(Localized("journal.no_deductions", "Link two records to form a deduction."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            for (int i = 0; i < keys.Count && i < MaxListedRows; i++)
            {
                string key = keys[i];
                if (string.IsNullOrEmpty(key)) continue;

                // The deduction key is built from the two clue ids it links, so the note can be
                // resolved from either side of the pair.
                string note = ResolveDeductionNote(key);
                AddRow(string.IsNullOrEmpty(note) ? $"• {key}" : $"• {note}", new Color(1f, 0.85f, 0.5f));
            }
        }

        private string ResolveDeductionNote(string deductionKey)
        {
            // BuildDeductionKey joins the two clue ids with a separator; recover both halves.
            var ids = deductionKey.Split(ResearchSplitChars);
            for (int i = 0; i < ids.Length; i++)
            {
                var clue = GameDataCatalog.GetClue(ids[i]);
                if (clue == null || string.IsNullOrEmpty(clue.deductionNote)) continue;
                return Resolve(clue.deductionNote, clue.deductionNoteTa);
            }
            return string.Empty;
        }

        private static readonly char[] ResearchSplitChars = { '|', '+', ':' };

        /// <summary>
        /// Lists resolved discoveries from the discovery log. This is a separate record from recorded
        /// clues: a clue is raw evidence the quest matches objectives against, while a discovery is
        /// something the player has actually pieced together, such as the room behind the wall.
        /// </summary>
        private void AddDiscoveryRows()
        {
            var recorded = DiscoveryLog.SnapshotRecordedIds();
            if (recorded == null || recorded.Count == 0)
            {
                AddRow(Localized("journal.no_discoveries", "Nothing resolved yet."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            for (int i = 0; i < recorded.Count && i < MaxListedRows; i++)
            {
                string id = recorded[i];
                if (string.IsNullOrEmpty(id)) continue;
                if (!DiscoveryLog.TryGet(id, out var definition) || definition == null) continue;

                AddRow($"• {DiscoveryLog.ResolveTitle(definition)}", new Color(1f, 0.88f, 0.6f));
                AddRow($"   {DiscoveryLog.ResolveBody(definition)}", new Color(0.78f, 0.8f, 0.84f));
            }
        }

        private void AddContactRows()
        {
            var talked = NPCInteractionLog.All;
            if (talked == null || talked.Count == 0)
            {
                AddRow(Localized("journal.no_contacts", "You have not spoken to anyone yet."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            var names = new List<string>(talked);
            names.Sort(System.StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < names.Count && i < MaxListedRows; i++)
            {
                AddRow($"• {names[i]}", new Color(0.9f, 0.9f, 0.75f));
            }
        }

        // ---- Crafting --------------------------------------------------------

        private void BuildCraftingRows()
        {
            var crafting = CraftingManager.Instance;
            var inventory = InventoryManager.Instance;

            if (crafting == null)
            {
                AddRow(Localized("crafting.unavailable", "Crafting is unavailable in this region."), new Color(0.8f, 0.6f, 0.6f));
                return;
            }

            var recipes = crafting.KnownRecipes;
            if (recipes == null || recipes.Count == 0)
            {
                AddRow(Localized("crafting.no_recipes", "No recipes known."), new Color(0.8f, 0.8f, 0.8f));
                return;
            }

            var sorted = new List<RecipeData>(recipes);
            sorted.Sort((a, b) => string.CompareOrdinal(
                IsTamil() ? (b?.titleTa ?? string.Empty) : (b?.titleEn ?? string.Empty),
                IsTamil() ? (a?.titleTa ?? string.Empty) : (a?.titleEn ?? string.Empty)));

            int shown = 0;
            for (int i = 0; i < sorted.Count && shown < MaxListedRows; i++)
            {
                var recipe = sorted[i];
                if (recipe == null) continue;
                shown++;

                bool canCraft = crafting.CanCraft(recipe);
                AddRow($"{(canCraft ? "[ ]" : "[x]")} {Resolve(recipe.titleEn, recipe.titleTa)} - {Resolve(recipe.descriptionEn, recipe.descriptionTa)}",
                    canCraft ? new Color(0.7f, 1f, 0.75f) : new Color(0.75f, 0.75f, 0.75f));

                if (inventory != null)
                {
                    AddRow(DescribeIngredients(recipe, inventory), new Color(0.7f, 0.75f, 0.85f));
                }

                int crafted = CraftingHistory.GetCraftCount(recipe.recipeId);
                if (crafted > 0)
                {
                    AddRow($"   crafted x{crafted}", new Color(0.65f, 0.8f, 0.9f));
                }

                if (canCraft)
                {
                    var captured = recipe;
                    AddButton(Localized("crafting.craft", "Craft"), () => crafting.CraftItem(captured));
                }
            }
        }

        private static string DescribeIngredients(RecipeData recipe, InventoryManager inventory)
        {
            if (recipe.ingredients == null || recipe.ingredients.Count == 0) return "   (no ingredients)";

            // IngredientRequirement is a struct; a malformed entry still has to be shown so the player can
            // see why the recipe is listed but not craftable.
            var parts = new List<string>(recipe.ingredients.Count);
            for (int i = 0; i < recipe.ingredients.Count; i++)
            {
                var requirement = recipe.ingredients[i];
                if (requirement.item == null)
                {
                    parts.Add("<unknown>");
                    continue;
                }

                int held = inventory.GetItemCount(requirement.item);
                parts.Add($"{requirement.item.itemId} {held}/{requirement.count}");
            }
            return "   " + string.Join(", ", parts);
        }

        // ---- Row helpers -----------------------------------------------------

        private void ClearRows()
        {
            if (listRoot == null) return;

            for (int i = listRoot.childCount - 1; i >= 0; i--)
            {
                var child = listRoot.GetChild(i);
                if (child == null) continue;
                Destroy(child.gameObject);
            }
        }

        private void AddHeading(string text)
        {
            AddRow(text.ToUpperInvariant(), new Color(0.55f, 0.85f, 0.95f), 22);
        }

        private void AddRow(string text, Color color, int size = 18)
        {
            if (listRoot == null || string.IsNullOrEmpty(text)) return;

            var label = NewText(text, size, color);
            var rect = label.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0f, 1f);
            rect.anchorMax = new Vector2(1f, 1f);
            rect.pivot = new Vector2(0.5f, 1f);
            rect.offsetMin = new Vector2(18f, 0f);
            rect.offsetMax = new Vector2(-18f, 0f);
            rect.anchoredPosition = new Vector2(0f, -8f);
            rect.sizeDelta = new Vector2(0f, size + 10f);
        }

        private void AddButton(string text, UnityEngine.Events.UnityAction onClick)
        {
            if (listRoot == null || onClick == null) return;

            var buttonObj = new GameObject("RowButton", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            buttonObj.transform.SetParent(listRoot, false);

            var rect = buttonObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(1f, 1f);
            rect.anchorMax = new Vector2(1f, 1f);
            rect.pivot = new Vector2(1f, 1f);
            rect.sizeDelta = new Vector2(160f, 34f);
            rect.anchoredPosition = new Vector2(-24f, -8f);

            var image = buttonObj.GetComponent<Image>();
            image.color = new Color(0.16f, 0.42f, 0.34f);

            var labelObj = new GameObject("Label", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            labelObj.transform.SetParent(buttonObj.transform, false);
            var label = labelObj.GetComponent<Text>();
            label.font = font;
            label.fontSize = 16;
            label.alignment = TextAnchor.MiddleCenter;
            label.color = Color.white;
            label.text = text;
            label.horizontalOverflow = HorizontalWrapMode.Overflow;

            var labelRect = labelObj.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = Vector2.zero;
            labelRect.offsetMax = Vector2.zero;

            buttonObj.GetComponent<Button>().onClick.AddListener(onClick);
        }

        private Text NewText(string text, int size, Color color)
        {
            var textObj = new GameObject("Row", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            textObj.transform.SetParent(listRoot, false);

            var label = textObj.GetComponent<Text>();
            label.font = font;
            label.fontSize = size;
            label.alignment = TextAnchor.MiddleLeft;
            label.color = color;
            label.text = text;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            label.verticalOverflow = VerticalWrapMode.Overflow;
            return label;
        }

        // ---- Helpers ---------------------------------------------------------

        private static bool IsTamil()
        {
            return LocalizationManager.Instance != null
                   && LocalizationManager.Instance.CurrentLanguage == Language.Tamil;
        }

        private static string Resolve(string english, string tamil)
        {
            return IsTamil() && !string.IsNullOrEmpty(tamil) ? tamil : english;
        }

        private static string Localized(string key, string fallback)
        {
            var mgr = LocalizationManager.Instance;
            if (mgr == null) return fallback;

            string value = mgr.Get(key);
            return string.IsNullOrEmpty(value) ? fallback : value;
        }

        private void BuildPanel()
        {
            var canvas = GetComponent<Canvas>();
            if (canvas == null) canvas = gameObject.AddComponent<Canvas>();

            var panelObj = new GameObject("GameplayJournalPanel", typeof(RectTransform), typeof(Image));
            panelObj.transform.SetParent(transform, false);

            var rect = panelObj.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(1100f, 760f);

            panelObj.GetComponent<Image>().color = new Color(0.04f, 0.06f, 0.08f, 0.94f);
            panelRoot = rect;

            var titleObj = new GameObject("Title", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            titleObj.transform.SetParent(panelRoot, false);
            titleText = ConfigureText(titleObj, 28, new Color(1f, 0.9f, 0.7f), TextAnchor.MiddleLeft);
            var titleRect = titleObj.GetComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0f, 1f);
            titleRect.anchorMax = new Vector2(1f, 1f);
            titleRect.pivot = new Vector2(0.5f, 1f);
            titleRect.offsetMin = new Vector2(28f, 0f);
            titleRect.offsetMax = new Vector2(-28f, 0f);
            titleRect.anchoredPosition = new Vector2(0f, -24f);
            titleRect.sizeDelta = new Vector2(0f, 40f);

            var subtitleObj = new GameObject("Hint", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            subtitleObj.transform.SetParent(panelRoot, false);
            subtitleText = ConfigureText(subtitleObj, 15, new Color(0.7f, 0.75f, 0.8f), TextAnchor.MiddleRight);
            var subtitleRect = subtitleObj.GetComponent<RectTransform>();
            subtitleRect.anchorMin = new Vector2(0f, 1f);
            subtitleRect.anchorMax = new Vector2(1f, 1f);
            subtitleRect.pivot = new Vector2(0.5f, 1f);
            subtitleRect.offsetMin = new Vector2(28f, 0f);
            subtitleRect.offsetMax = new Vector2(-28f, 0f);
            subtitleRect.anchoredPosition = new Vector2(0f, -62f);
            subtitleRect.sizeDelta = new Vector2(0f, 26f);

            var listObj = new GameObject("List", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
            listObj.transform.SetParent(panelRoot, false);

            listRoot = listObj.GetComponent<RectTransform>();
            listRoot.anchorMin = new Vector2(0f, 0f);
            listRoot.anchorMax = new Vector2(1f, 1f);
            listRoot.offsetMin = new Vector2(0f, 20f);
            listRoot.offsetMax = new Vector2(0f, -96f);

            var layout = listObj.GetComponent<VerticalLayoutGroup>();
            layout.childControlHeight = false;
            layout.childControlWidth = true;
            layout.childForceExpandHeight = false;
            layout.childForceExpandWidth = true;
            layout.spacing = 2f;

            var fitter = listObj.GetComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            panelRoot.gameObject.SetActive(false);
        }

        private Text ConfigureText(GameObject textObj, int size, Color color, TextAnchor alignment)
        {
            var label = textObj.GetComponent<Text>();
            label.font = font;
            label.fontSize = size;
            label.alignment = alignment;
            label.color = color;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            return label;
        }
    }
}