using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Data
{
    /// <summary>
    /// Authoritative code-defined catalogue of every save-persisted gameplay entity.
    ///
    /// ItemData, QuestData, ClueData, and RecipeData are ScriptableObjects, but the project
    /// ships no .asset files for them: the scene builders reference them by reference and every
    /// runtime-created instance was a throwaway object. That made it impossible to resolve a
    /// saved <c>itemId</c> back to real content on load.
    ///
    /// This catalogue follows the existing <c>PlantCatalog</c> / <c>WildlifeSpeciesCatalog</c>
    /// pattern already used for plants and wildlife: definitions live in code, are keyed by a
    /// stable identifier, and are resolved through <c>GetItem</c>/<c>GetQuest</c>/etc. Because the
    /// instances are cached for the process lifetime, a save stores only the identifier and a load
    /// always reconstructs the same shared instance. No object reference ever crosses the
    /// save boundary.
    /// </summary>
    public static class GameDataCatalog
    {
        // ---- Items ------------------------------------------------------------

        private static readonly Dictionary<string, ItemData> Items = new Dictionary<string, ItemData>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Builds a runtime <see cref="ItemData"/>. Created once and cached, never persisted.
        /// </summary>
        public static ItemData RegisterItem(string itemId, string nameEn, string nameTa,
            string descEn, string descTa, ItemCategory category,
            int baseValue, int maxStack, float weightKg, bool consumable = false,
            float staminaRestore = 0f, float hydrationRestore = 0f)
        {
            if (string.IsNullOrEmpty(itemId))
            {
                Debug.LogError("[GameDataCatalog] Refusing to register an item with an empty id.");
                return null;
            }

            if (Items.ContainsKey(itemId))
            {
                return Items[itemId];
            }

            var item = ScriptableObject.CreateInstance<ItemData>();
            item.name = itemId;
            item.itemId = itemId;
            item.itemNameEn = nameEn;
            item.itemNameTa = nameTa;
            item.descriptionEn = descEn;
            item.descriptionTa = descTa;
            item.category = category;
            item.baseValue = baseValue;
            item.maxStackSize = Mathf.Max(1, maxStack);
            item.weightKg = Mathf.Max(0.0001f, weightKg);
            item.isConsumable = consumable;
            item.staminaRestore = staminaRestore;
            item.hydrationRestore = hydrationRestore;

            Items[itemId] = item;
            return item;
        }

        /// <summary>
        /// Resolves a saved item identifier to its shared content instance.
        /// Returns null for unknown or blank identifiers so callers can skip them safely
        /// instead of crashing on a save from a different content version.
        /// </summary>
        public static ItemData GetItem(string itemId)
        {
            if (string.IsNullOrEmpty(itemId)) return null;
            return Items.TryGetValue(itemId, out var item) ? item : null;
        }

        public static bool HasItem(string itemId) => !string.IsNullOrEmpty(itemId) && Items.ContainsKey(itemId);

        public static IReadOnlyCollection<ItemData> AllItems => Items.Values;

        // ---- Clues ------------------------------------------------------------

        private static readonly Dictionary<string, ClueData> Clues = new Dictionary<string, ClueData>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Registers a clue. <paramref name="relatedClueId"/> links two clues so that holding both
        /// unlocks a deduction; it is a stable identifier, not an object reference, so the link
        /// survives save and load.
        /// </summary>
        public static ClueData RegisterClue(string clueId, string titleEn, string titleTa,
            string descEn, string descTa, ClueType type, string regionId,
            string relatedClueId = null, string deductionNoteEn = null, string deductionNoteTa = null,
            bool isKeyLead = false)
        {
            if (string.IsNullOrEmpty(clueId))
            {
                Debug.LogError("[GameDataCatalog] Refusing to register a clue with an empty id.");
                return null;
            }

            if (Clues.ContainsKey(clueId))
            {
                return Clues[clueId];
            }

            var clue = ScriptableObject.CreateInstance<ClueData>();
            clue.name = clueId;
            clue.clueId = clueId;
            clue.titleEn = titleEn;
            clue.titleTa = titleTa;
            clue.descriptionEn = descEn;
            clue.descriptionTa = descTa;
            clue.type = type;
            clue.regionId = regionId;
            clue.relatedClueId = relatedClueId;
            clue.deductionNote = deductionNoteEn;
            clue.deductionNoteTa = deductionNoteTa;
            clue.isKeyLead = isKeyLead;

            Clues[clueId] = clue;
            return clue;
        }

        public static ClueData GetClue(string clueId)
        {
            if (string.IsNullOrEmpty(clueId)) return null;
            return Clues.TryGetValue(clueId, out var clue) ? clue : null;
        }

        public static bool HasClue(string clueId) => !string.IsNullOrEmpty(clueId) && Clues.ContainsKey(clueId);

        public static IReadOnlyCollection<ClueData> AllClues => Clues.Values;

        // ---- Quests -----------------------------------------------------------

        private static readonly Dictionary<string, QuestData> Quests = new Dictionary<string, QuestData>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Registers a multi-stage quest. Objectives are declared with an explicit
        /// <see cref="QuestObjectiveType"/> and stable target id so progression can only be
        /// driven by the matching real gameplay event.
        /// </summary>
        public static QuestData RegisterQuest(string questId, string titleEn, string titleTa,
            string summaryEn, string summaryTa, string regionId,
            QuestStage[] stages, int rewardCoins = 0, string rewardItemId = null)
        {
            if (string.IsNullOrEmpty(questId))
            {
                Debug.LogError("[GameDataCatalog] Refusing to register a quest with an empty id.");
                return null;
            }

            if (Quests.ContainsKey(questId))
            {
                return Quests[questId];
            }

            var quest = ScriptableObject.CreateInstance<QuestData>();
            quest.name = questId;
            quest.questId = questId;
            quest.titleEn = titleEn;
            quest.titleTa = titleTa;
            quest.summaryEn = summaryEn;
            quest.summaryTa = summaryTa;
            quest.regionId = regionId;
            quest.defaultState = QuestState.Available;
            quest.stages = new List<QuestStage>();
            if (stages != null)
            {
                foreach (var stage in stages)
                {
                    if (stage != null) quest.stages.Add(stage);
                }
            }
            quest.rewardCoins = rewardCoins;
            quest.rewardItem = string.IsNullOrEmpty(rewardItemId) ? null : GetItem(rewardItemId);

            Quests[questId] = quest;
            return quest;
        }

        public static QuestData GetQuest(string questId)
        {
            if (string.IsNullOrEmpty(questId)) return null;
            return Quests.TryGetValue(questId, out var quest) ? quest : null;
        }

        public static bool HasQuest(string questId) => !string.IsNullOrEmpty(questId) && Quests.ContainsKey(questId);

        public static IReadOnlyCollection<QuestData> AllQuests => Quests.Values;

        // ---- Recipes ----------------------------------------------------------

        private static readonly Dictionary<string, RecipeData> Recipes = new Dictionary<string, RecipeData>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Registers a recipe from stable ingredient identifiers. Ingredients resolve to the
        /// shared item instances so a craft checks the same objects the inventory holds.
        /// </summary>
        public static RecipeData RegisterRecipe(string recipeId, string titleEn, string titleTa,
            string descEn, string descTa, string resultItemId, int resultCount,
            (string itemId, int count)[] ingredients, float durationSeconds = 1.5f)
        {
            if (string.IsNullOrEmpty(recipeId))
            {
                Debug.LogError("[GameDataCatalog] Refusing to register a recipe with an empty id.");
                return null;
            }

            if (Recipes.ContainsKey(recipeId))
            {
                return Recipes[recipeId];
            }

            var recipe = ScriptableObject.CreateInstance<RecipeData>();
            recipe.name = recipeId;
            recipe.recipeId = recipeId;
            recipe.titleEn = titleEn;
            recipe.titleTa = titleTa;
            recipe.descriptionEn = descEn;
            recipe.descriptionTa = descTa;
            recipe.resultItem = GetItem(resultItemId);
            recipe.resultCount = Mathf.Max(1, resultCount);
            recipe.craftingDurationSeconds = durationSeconds;
            recipe.ingredients = new List<IngredientRequirement>();

            if (ingredients != null)
            {
                foreach (var pair in ingredients)
                {
                    var item = GetItem(pair.itemId);
                    if (item == null)
                    {
                        Debug.LogError($"[GameDataCatalog] Recipe '{recipeId}' references unknown ingredient '{pair.itemId}'. Recipe skipped.");
                        continue;
                    }
                    recipe.ingredients.Add(new IngredientRequirement { item = item, count = pair.count });
                }
            }

            if (recipe.resultItem == null)
            {
                Debug.LogError($"[GameDataCatalog] Recipe '{recipeId}' references unknown result item '{resultItemId}'. Recipe skipped.");
                return null;
            }

            Recipes[recipeId] = recipe;
            return recipe;
        }

        public static RecipeData GetRecipe(string recipeId)
        {
            if (string.IsNullOrEmpty(recipeId)) return null;
            return Recipes.TryGetValue(recipeId, out var recipe) ? recipe : null;
        }

        public static bool HasRecipe(string recipeId) => !string.IsNullOrEmpty(recipeId) && Recipes.ContainsKey(recipeId);

        public static IReadOnlyCollection<RecipeData> AllRecipes => Recipes.Values;
    }
}