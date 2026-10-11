using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.Quests;

namespace WhisperingWilds.Campaign
{
    /// <summary>
    /// Bridges QuestManager completion events to EndingController evaluation.
    /// 
    /// When the final Nilgiris quest completes, this bridge evaluates which ending
    /// the player has earned based on their campaign performance.
    /// 
    /// Attach this to a persistent manager GameObject that survives scene loads,
    /// or it will auto-register when both QuestManager and EndingController are available.
    /// </summary>
    public class QuestEndingBridge : MonoBehaviour
    {
        [Header("Final Quest Configuration")]
        [Tooltip("The quest ID that triggers ending evaluation when completed. " +
                 "Set this to the final Nilgiris quest ID, e.g., 'nilgiris_sanctuary_destiny'.")]
        [SerializeField] private string finalQuestId = "nilgiris_sanctuary_destiny";

        [Header("Auto-detection")]
        [Tooltip("If true, the bridge auto-subscribes when QuestManager and EndingController are available.")]
        [SerializeField] private bool autoSubscribe = true;

        private bool isSubscribed = false;

        private void OnEnable()
        {
            if (autoSubscribe)
            {
                TrySubscribe();
            }
        }

        private void OnDisable()
        {
            Unsubscribe();
        }

        /// <summary>
        /// Manually subscribe to quest completion events.
        /// Call this if autoSubscribe is false or if you need explicit control.
        /// </summary>
        public void Subscribe()
        {
            TrySubscribe();
        }

        private void TrySubscribe()
        {
            if (isSubscribed) return;
            if (QuestManager.Instance == null || EndingController.Instance == null) return;

            QuestManager.Instance.OnQuestCompleted += OnQuestCompleted;
            isSubscribed = true;
            Debug.Log($"<color=#00FF99><b>[QuestEndingBridge]</b></color> Subscribed to quest completion. Final quest ID: '{finalQuestId}'");
        }

        private void Unsubscribe()
        {
            if (!isSubscribed) return;
            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.OnQuestCompleted -= OnQuestCompleted;
            }
            isSubscribed = false;
        }

        private void OnQuestCompleted(QuestData quest)
        {
            if (quest == null) return;

            // Ensure EndingController is available
            if (EndingController.Instance == null)
            {
                Debug.LogWarning($"<color=#FFAA00><b>[QuestEndingBridge]</b></color> EndingController not found. Cannot evaluate ending for quest '{quest.questId}'.");
                return;
            }

            // Check if this is the final quest
            if (string.Equals(quest.questId, finalQuestId, System.StringComparison.OrdinalIgnoreCase))
            {
                Debug.Log($"<color=#FFD700><b>[QuestEndingBridge]</b></color> Final quest '{quest.questId}' completed! Evaluating ending...");
                EndingController.EndingType ending = EndingController.Instance.EvaluateEnding();
                Debug.Log($"<color=#FFD700><b>[QuestEndingBridge]</b></color> Ending determined: {ending}");
            }
            else
            {
                // For non-final quests, still adjust affinity based on quest rewards
                // This allows quest decisions to influence the ending even before the final quest
                Debug.Log($"<color=#88FF88><b>[QuestEndingBridge]</b></color> Quest '{quest.questId}' completed. (Not the final quest, ending not yet evaluated.)");
            }
        }

        /// <summary>
        /// Sets the final quest ID that triggers ending evaluation.
        /// </summary>
        public void SetFinalQuestId(string questId)
        {
            finalQuestId = questId ?? "";
            Debug.Log($"<color=#88FF88><b>[QuestEndingBridge]</b></color> Final quest ID set to: '{finalQuestId}'");
        }
    }
}
