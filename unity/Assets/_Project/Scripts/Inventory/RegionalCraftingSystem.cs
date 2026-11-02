using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;

namespace WhisperingWilds.Crafting
{
    [System.Serializable]
    public struct CraftingMaterial
    {
        public string itemId;
        public int requiredQuantity;
    }

    [System.Serializable]
    public class RegionalRecipe
    {
        public string recipeId;
        public string recipeName;
        public string targetRegion; // e.g., "Chettinad", "Thanjavur", "Nilgiris"
        public List<CraftingMaterial> ingredients = new List<CraftingMaterial>();
        public string resultingItemId;
        public bool isUnlocked;
    }

    /// <summary>
    /// Regional Loops: Regional crafting expansion.
    /// Handles regional blueprint unlocks, specialized materials (Chettinad brassware, Thanjavur art supplies),
    /// and craft events.
    /// </summary>
    public class RegionalCraftingSystem : MonoBehaviour
    {
        [Header("Recipe Database")]
        public List<RegionalRecipe> availableRecipes = new List<RegionalRecipe>();

        public event Action<string> OnItemCrafted;

        public bool CanCraft(string recipeId)
        {
            if (string.IsNullOrEmpty(recipeId)) return false;
            RegionalRecipe recipe = availableRecipes.Find(r => string.Equals(r.recipeId, recipeId, StringComparison.OrdinalIgnoreCase));
            if (recipe == null || !recipe.isUnlocked) return false;

            // In full game, checks player inventory items
            var inv = Inventory.InventoryManager.Instance;
            if (inv != null && recipe.ingredients != null)
            {
                foreach (var mat in recipe.ingredients)
                {
                    if (inv.GetItemCountById(mat.itemId) < mat.requiredQuantity)
                        return false;
                }
            }

            return true; 
        }

        public bool CraftItem(string recipeId)
        {
            if (!CanCraft(recipeId))
            {
                Debug.LogWarning($"[Crafting] Cannot craft recipe {recipeId}. Requirements unmet or locked.");
                return false;
            }

            RegionalRecipe recipe = availableRecipes.Find(r => string.Equals(r.recipeId, recipeId, StringComparison.OrdinalIgnoreCase));
            
            // Deduct ingredients if inventory is present
            var inv = Inventory.InventoryManager.Instance;
            if (inv != null && recipe.ingredients != null)
            {
                foreach (var mat in recipe.ingredients)
                {
                    var data = GameDataCatalog.GetItem(mat.itemId);
                    if (data != null)
                    {
                        inv.RemoveItem(data, mat.requiredQuantity);
                    }
                }

                var resultData = GameDataCatalog.GetItem(recipe.resultingItemId);
                if (resultData != null)
                {
                    inv.AddItem(resultData, 1);
                }
            }

            Debug.Log($"[Crafting] Successfully crafted {recipe.recipeName}!");
            OnItemCrafted?.Invoke(recipe.resultingItemId);
            return true;
        }

        public void UnlockRecipe(string recipeId)
        {
            var recipe = availableRecipes.Find(r => string.Equals(r.recipeId, recipeId, StringComparison.OrdinalIgnoreCase));
            if (recipe != null)
            {
                recipe.isUnlocked = true;
            }
        }
    }
}
