using UnityEngine;

namespace WhisperingWilds.Data
{
    public enum ItemCategory
    {
        Consumable,
        Tool,
        Material,
        Quest,
        CulturalRelic
    }

    [CreateAssetMenu(fileName = "NewItem", menuName = "Whispering Wilds/Data/Item")]
    public class ItemData : ScriptableObject
    {
        [Header("Identity")]
        public string itemId;
        public string itemNameEn;
        public string itemNameTa; // Tamil script name
        [TextArea(2, 4)] public string descriptionEn;
        [TextArea(2, 4)] public string descriptionTa;
        public Sprite icon;
        public ItemCategory category;

        [Header("Economics & Stack")]
        public int baseValue = 10;
        public int maxStackSize = 20;
        public float weightKg = 0.2f;

        [Header("Usage Properties")]
        public bool isConsumable;
        public float staminaRestore;
        public float hydrationRestore;
        public float coldResistanceDuration;
    }
}
