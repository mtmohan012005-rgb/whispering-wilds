using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Loops;
using WhisperingWilds.Traversal;

namespace WhisperingWilds.Campaign
{
    [System.Serializable]
    public struct ExpansionHubData
    {
        public string hubId;
        public string englishName;
        public string tamilName;
        public string sceneName;
        public string specialtyResource;
        public bool isUnlocked;
    }

    /// <summary>
    /// Expansion Pack Architecture: "Sangam Horizons (சங்கத் தடம்)".
    /// Expands the playable journey into southern Tamil Nadu:
    /// - Madurai (Meenakshi temple corridors, night jasmine floriculture & Vaigai archaeological digs)
    /// - Kanyakumari (Confluence of three oceans & coastal lighthouse navigation)
    /// - Agasthyamalai (Nocturnal Western Ghats biodiversity & indigenous botanical codex)
    /// Seamlessly links with RegionalTravelManager and AgricultureSystem.
    /// </summary>
    public class SangamHorizonsExpansion : MonoBehaviour
    {
        public static SangamHorizonsExpansion Instance { get; private set; }

        [Header("Expansion Hub Registry")]
        public List<ExpansionHubData> expansionHubs = new List<ExpansionHubData>();

        [Header("Sangam Archaeological Relics")]
        public int relicsDiscovered = 0;
        public const int TotalRelics = 3;

        public event Action<string> OnExpansionHubUnlocked;
        public event Action<string, int> OnSangamArtifactDiscovered;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            InitializeExpansionHubs();
            WhisperingWilds.Gameplay.SangamHorizonsContent.EnsureInitialized();
        }

        public void InitializeExpansionHubs()
        {
            expansionHubs.Clear();

            expansionHubs.Add(new ExpansionHubData
            {
                hubId = "madurai",
                englishName = "Madurai",
                tamilName = "மதுரை",
                sceneName = "09_Madurai_Meenakshi",
                specialtyResource = "Madurai Jasmine (மல்லிகை)",
                isUnlocked = false
            });

            expansionHubs.Add(new ExpansionHubData
            {
                hubId = "kanyakumari",
                englishName = "Kanyakumari",
                tamilName = "கன்னியாகுமரி",
                sceneName = "10_Kanyakumari_Cape",
                specialtyResource = "Palmyra Palm Sap (பனம்பால்)",
                isUnlocked = false
            });

            expansionHubs.Add(new ExpansionHubData
            {
                hubId = "agasthyamalai",
                englishName = "Agasthyamalai",
                tamilName = "அகஸ்தியர்மலை",
                sceneName = "11_Agasthyamalai_Wilds",
                specialtyResource = "Medicinal Flora (மூலிகை)",
                isUnlocked = false
            });
        }

        /// <summary>
        /// Unlocks an expansion hub and registers its routes into the travel manager.
        /// </summary>
        public bool UnlockExpansionHub(string hubId, RegionalTravelManager travelManager = null)
        {
            for (int i = 0; i < expansionHubs.Count; i++)
            {
                if (expansionHubs[i].hubId.Equals(hubId, StringComparison.OrdinalIgnoreCase))
                {
                    if (expansionHubs[i].isUnlocked) return false;

                    var updated = expansionHubs[i];
                    updated.isUnlocked = true;
                    expansionHubs[i] = updated;

                    // If travel manager is provided, integrate new travel node
                    if (travelManager != null)
                    {
                        travelManager.travelNodes.Add(new TravelNode
                        {
                            nodeId = updated.hubId,
                            regionName = updated.englishName,
                            connectedNodeIds = new List<string> { "chettinad", "thanjavur" },
                            travelStaminaCost = 30f,
                            travelTimeHours = 3.5f,
                            hasDirectTransitRoute = true
                        });
                    }

                    OnExpansionHubUnlocked?.Invoke(updated.hubId);
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// Registers the discovery of a Sangam archaeological artifact.
        /// </summary>
        public void DiscoverRelic(string relicId)
        {
            relicsDiscovered = Mathf.Min(TotalRelics, relicsDiscovered + 1);
            OnSangamArtifactDiscovered?.Invoke(relicId, relicsDiscovered);
        }
    }
}
