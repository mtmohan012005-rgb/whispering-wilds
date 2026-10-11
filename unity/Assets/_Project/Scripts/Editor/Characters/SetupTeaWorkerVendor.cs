using UnityEditor;
using UnityEngine;
using WhisperingWilds.Characters;
using WhisperingWilds.Economy;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Editor.Characters
{
    /// <summary>
    /// Editor utility that attaches VendorInteraction to the TeaWorker NPC prefab.
    /// 
    /// The TeaWorker at the Chennai tea stall becomes the first reachable vendor,
    /// allowing the player to buy and sell items through normal gameplay interaction.
    /// 
    /// Run via: Tools/Whispering Wilds/Characters/Setup TeaWorker Vendor
    /// </summary>
    public static class SetupTeaWorkerVendor
    {
        [MenuItem("Whispering Wilds/Characters/Setup TeaWorker Vendor")]
        public static void SetupVendor()
        {
            string prefabPath = CharacterPrefabCatalog.TeaWorkerPrefabPath;
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);

            if (prefab == null)
            {
                Debug.LogError($"[SetupTeaWorkerVendor] Cannot find prefab at '{prefabPath}'. " +
                    "Run 'Whispering Wilds/Characters/Build All Characters' first.");
                return;
            }

            // Import the prefab for editing
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            if (instance == null)
            {
                Debug.LogError("[SetupTeaWorkerVendor] Failed to instantiate prefab for editing.");
                return;
            }

            try
            {
                // Find or add VendorInteraction
                VendorInteraction vendor = instance.GetComponent<VendorInteraction>();
                if (vendor == null)
                {
                    vendor = instance.AddComponent<VendorInteraction>();
                    Debug.Log("[SetupTeaWorkerVendor] Added VendorInteraction component.");
                }

                // Configure vendor using reflection since fields are serialized private
                SerializedObject so = new SerializedObject(vendor);
                
                SerializedProperty startingCoins = so.FindProperty("startingCoins");
                startingCoins.intValue = 500;

                SerializedProperty maxCoins = so.FindProperty("maxCoins");
                maxCoins.intValue = 4000;

                // Configure sell stock (items the vendor sells to the player)
                SerializedProperty sellStock = so.FindProperty("sellStock");
                sellStock.ClearArray();

                // Item 1: Tea
                int idx = sellStock.arraySize;
                sellStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, sellStock.GetArrayElementAtIndex(idx), "tea", 10, 50, 15);

                // Item 2: Biscuit
                idx = sellStock.arraySize;
                sellStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, sellStock.GetArrayElementAtIndex(idx), "biscuit", 20, 100, 5);

                // Item 3: Water
                idx = sellStock.arraySize;
                sellStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, sellStock.GetArrayElementAtIndex(idx), "water", 15, 80, 10);

                // Item 4: First Aid Kit
                idx = sellStock.arraySize;
                sellStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, sellStock.GetArrayElementAtIndex(idx), "first_aid_kit", 5, 30, 50);

                // Configure buy stock (items the vendor buys from the player)
                SerializedProperty buyStock = so.FindProperty("buyStock");
                buyStock.ClearArray();

                // Item 1: Herbal Remedy (vendor buys from player)
                idx = buyStock.arraySize;
                buyStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, buyStock.GetArrayElementAtIndex(idx), "herbal_remedy", 999, 20, 25);

                // Item 2: Spice Blend (vendor buys from player)
                idx = buyStock.arraySize;
                buyStock.InsertArrayElementAtIndex(idx);
                SetStockItem(so, buyStock.GetArrayElementAtIndex(idx), "spice_blend", 999, 15, 30);

                so.ApplyModifiedPropertiesWithoutUndo();

                // Save the prefab
                PrefabUtility.SaveAsPrefabAsset(instance, prefabPath);
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();

                Debug.Log("<color=#00FF88><b>[SetupTeaWorkerVendor]</b></color> TeaWorker vendor configured and saved!");
                Debug.Log("  Sell stock: tea (10@15), biscuit (20@50), water (15@80), first_aid_kit (5@30)");
                Debug.Log("  Buy stock: herbal_remedy (25), spice_blend (30)");
                Debug.Log("  Starting coins: 500, Max coins: 4000");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(instance);
            }
        }

        private static void SetStockItem(SerializedObject so, SerializedProperty element, string itemId, int quantity, int maxQuantity, int unitPrice)
        {
            element.FindPropertyRelative("itemId").stringValue = itemId;
            element.FindPropertyRelative("quantity").intValue = quantity;
            element.FindPropertyRelative("maxQuantity").intValue = maxQuantity;
            element.FindPropertyRelative("unitPrice").intValue = unitPrice;
        }
    }
}
