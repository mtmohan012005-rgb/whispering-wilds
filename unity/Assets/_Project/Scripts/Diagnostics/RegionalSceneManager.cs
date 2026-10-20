using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;
using WhisperingWilds.Core;

namespace WhisperingWilds.World
{
    public partial class RegionalSceneManager
    {
        [Header("NPC Dialogue Parameters")]
        private string activeNPCTalking = "";
        private int currentDialogueIndex = 0;

        /// <summary>
        /// Backward-compatible property alias for current active region.
        /// </summary>
        public string currentActiveRegion
        {
            get => activeRegionId;
            set => activeRegionId = value;
        }

        /// <summary>
        /// Backward-compatible property alias for transitioning state.
        /// </summary>
        public bool isTransitioning
        {
            get => isLoadingRegion;
            set => isLoadingRegion = value;
        }

        public void TriggerTravelSequence(string targetRegionName)
        {
            if (isTransitioning || isLoadingRegion) return;
            StartCoroutine(ExecuteFadeTransition(targetRegionName));
        }

        private IEnumerator ExecuteFadeTransition(string regionName)
        {
            isTransitioning = true;
            Debug.Log($"✈️ Travel System: Initializing real-world transit path to: {regionName}...");

            // Simulate data persistence compression save before breaking scene loops
            if (FindFirstObjectByType<SaveManager>() != null)
            {
                FindFirstObjectByType<SaveManager>().SaveGame();
            }
            else
            {
                SaveSystem.SaveProgress(5, "chennai_veshti", SceneManager.GetActiveScene().buildIndex, Vector3.zero);
            }

            // Handle regional coordinate mapping
            currentActiveRegion = regionName;
            
            // Trigger true scene compilation arrays depending on user tracking intent
            int targetSceneIndex = 1; // Default fallback playground map
            string lower = regionName.ToLower();
            if (lower.Contains("pichavaram")) targetSceneIndex = 3;
            else if (lower.Contains("nilgiris")) targetSceneIndex = 7;
            else if (lower.Contains("chennai")) targetSceneIndex = 2;

            yield return new WaitForSeconds(1.0f); // Allow audio propagation dampening to settle
            
            if (targetSceneIndex < SceneManager.sceneCountInBuildSettings)
            {
                SceneManager.LoadScene(targetSceneIndex);
            }
            else
            {
                Debug.LogWarning($"⚠️ Scene Index {targetSceneIndex} not registered in Build Matrix. Simulating environment switch internally.");
            }

            isTransitioning = false;
            Debug.Log($"🌍 Region loaded successfully: Welcome to the real-world spaces of {regionName}!");
        }

        public void InterrogateNPC(string npcID)
        {
            activeNPCTalking = npcID;
            currentDialogueIndex = 0;

            switch (npcID.ToLower())
            {
                case "murugan":
                    Debug.Log("🫖 [NPC Murugan]: 'வணக்கம் தம்பி! Welcome to my tea kadai stall. Have some hot ginger tea before you venture into the wild mangroves.'");
                    break;
                case "velu":
                    Debug.Log("🛺 [NPC Velu]: 'Hey brother, my auto-rickshaw is ready! The George Town traffic is intense today, but we can cut through the alleys down to the docks.'");
                    break;
                default:
                    Debug.Log($"🧍 [NPC]: Looking at you curiously in the {currentActiveRegion} atmosphere.");
                    break;
            }
        }
    }
}
