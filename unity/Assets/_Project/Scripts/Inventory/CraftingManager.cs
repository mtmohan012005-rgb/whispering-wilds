using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.Inventory
{
    /// <summary>
    /// Regional exploration crafting manager.
    /// Supports crafting bamboo torches, palm-leaf umbrellas, herbal poultices, and filter coffee.
    ///
    /// Every successful craft is recorded in <see cref="CraftingHistory"/> and reported on the
    /// gameplay event bus before the result item is granted, so a CraftItem quest objective is
    /// satisfied exactly once per craft even though the result item is itself a normal collection.
    /// </summary>
    public class CraftingManager : MonoBehaviour
    {
        public static CraftingManager Instance { get; private set; }

        [Header("Available Recipes")]
        [SerializeField] private List<RecipeData> knownRecipes = new List<RecipeData>();

        public IReadOnlyList<RecipeData> KnownRecipes => knownRecipes;

        public event Action<RecipeData> OnItemCrafted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            EnsureOpeningRecipesKnown();
        }

        /// <summary>
        /// Seeds the recipe list from the catalogue. The serialized list was always empty because
        /// no RecipeData assets existed, which made every craft impossible at runtime.
        /// </summary>
        private void EnsureOpeningRecipesKnown()
        {
            ChennaiOpeningContent.EnsureInitialized();
            foreach (var recipe in GameDataCatalog.AllRecipes)
            {
                LearnRecipe(recipe);
            }
        }

        public bool CanCraft(RecipeData recipe)
        {
            if (recipe == null || InventoryManager.Instance == null) return false;
            if (recipe.ingredients == null) return false;

            // IngredientRequirement is a struct, so a malformed entry (no item, or a
            // non-positive count) cannot be skipped silently: treating it as satisfied would let a
            // broken recipe craft for free. A malformed recipe is simply not craftable.
            foreach (var req in recipe.ingredients)
            {
                if (req.item == null || req.count <= 0) return false;
                if (!InventoryManager.Instance.HasItem(req.item, req.count))
                {
                    return false;
                }
            }
            return true;
        }

        public bool CraftItem(RecipeData recipe)
        {
            if (!CanCraft(recipe)) return false;

            // Remove required ingredients
            if (recipe.ingredients != null)
            {
                // CanCraft already rejected malformed requirements, so every entry here is safe to charge.
                foreach (var req in recipe.ingredients)
                {
                    InventoryManager.Instance.RemoveItem(req.item, req.count);
                }
            }

            // Record and report the craft first, so quest progression cannot be lost even if the
            // result grant is refused by capacity or weight.
            CraftingHistory.Record(recipe.recipeId);
            GameplayEventBus.ReportCraftCompleted(recipe.recipeId);

            // Grant result item. Marked as Crafted so a crafted result cannot satisfy a CollectItem
            // objective the player was meant to fill by finding the item in the world.
            if (InventoryManager.Instance != null && recipe.resultItem != null && recipe.resultCount > 0)
            {
                InventoryManager.Instance.AddItem(recipe.resultItem, recipe.resultCount, InventoryManager.ItemGrantSource.Crafted);
            }

            Debug.Log($"<color=#00FF88><b>[Crafting]</b></color> Successfully crafted: {recipe.titleEn} (x{recipe.resultCount})");
            OnItemCrafted?.Invoke(recipe);
            return true;
        }

        /// <summary>Crafts by stable recipe identifier. Used by scripted beats and tests.</summary>
        public bool CraftById(string recipeId)
        {
            var recipe = GameDataCatalog.GetRecipe(recipeId);
            if (recipe == null)
            {
                Debug.LogWarning($"[Crafting] Unknown recipe '{recipeId}'.");
                return false;
            }
            return CraftItem(recipe);
        }

        public void LearnRecipe(RecipeData recipe)
        {
            if (recipe != null && !knownRecipes.Contains(recipe))
            {
                knownRecipes.Add(recipe);
                Debug.Log($"<color=#00D2FF><b>[Crafting]</b></color> Discovered new regional recipe: {recipe.titleEn}");
            }
        }
    }
}