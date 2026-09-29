using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;

namespace WhisperingWilds.Inventory
{
    /// <summary>
    /// Regional exploration crafting manager.
    /// Supports crafting bamboo torches, palm-leaf umbrellas, herbal poultices, and filter coffee.
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
        }

        public bool CanCraft(RecipeData recipe)
        {
            if (recipe == null || InventoryManager.Instance == null) return false;

            foreach (var req in recipe.ingredients)
            {
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
            foreach (var req in recipe.ingredients)
            {
                InventoryManager.Instance.RemoveItem(req.item, req.count);
            }

            // Grant result item
            InventoryManager.Instance.AddItem(recipe.resultItem, recipe.resultCount);

            Debug.Log($"<color=#00FF88><b>[Crafting]</b></color> Successfully crafted: {recipe.titleEn} (x{recipe.resultCount})");
            OnItemCrafted?.Invoke(recipe);
            return true;
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
