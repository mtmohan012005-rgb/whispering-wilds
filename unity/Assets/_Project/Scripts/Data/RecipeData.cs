using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Data
{
    [Serializable]
    public struct IngredientRequirement
    {
        public ItemData item;
        public int count;
    }

    [CreateAssetMenu(fileName = "NewRecipe", menuName = "Whispering Wilds/Data/Recipe")]
    public class RecipeData : ScriptableObject
    {
        public string recipeId;
        public string titleEn;
        public string titleTa;
        [TextArea(2, 3)] public string descriptionEn;
        [TextArea(2, 3)] public string descriptionTa;

        public ItemData resultItem;
        public int resultCount = 1;
        public float craftingDurationSeconds = 1.5f;

        public List<IngredientRequirement> ingredients = new List<IngredientRequirement>();
    }
}
