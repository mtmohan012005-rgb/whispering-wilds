using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Inventory;

namespace WhisperingWilds.Quests
{
    [Serializable]
    public class ActiveQuestProgress
    {
        public QuestData quest;
        public int currentStageIndex = 0;
        [NonSerialized] public Dictionary<string, int> objectiveCounts = new Dictionary<string, int>();

        public ActiveQuestProgress(QuestData quest)
        {
            this.quest = quest;
            this.currentStageIndex = 0;
            this.objectiveCounts = new Dictionary<string, int>();
        }
    }

    /// <summary>
    /// Narrative campaign quest manager supporting multi-stage objectives and rewards.
    /// </summary>
    public class QuestManager : MonoBehaviour
    {
        public static QuestManager Instance { get; private set; }

        [Header("Quest Lists")]
        [SerializeField] private List<ActiveQuestProgress> activeQuests = new List<ActiveQuestProgress>();
        [SerializeField] private List<string> completedQuestIds = new List<string>();

        public IReadOnlyList<ActiveQuestProgress> ActiveQuests => activeQuests;
        public IReadOnlyList<string> CompletedQuestIds => completedQuestIds;

        public event Action<QuestData> OnQuestAccepted;
        public event Action<QuestData, string, int> OnObjectiveAdvanced;
        public event Action<QuestData> OnQuestCompleted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public bool AcceptQuest(QuestData quest)
        {
            if (quest == null || IsQuestActive(quest.questId) || IsQuestCompleted(quest.questId))
            {
                return false;
            }

            var progress = new ActiveQuestProgress(quest);
            activeQuests.Add(progress);

            Debug.Log($"<color=#00D2FF><b>[Quest]</b></color> Accepted quest: {quest.titleEn} ({quest.titleTa})");
            OnQuestAccepted?.Invoke(quest);
            return true;
        }

        public bool AdvanceObjective(string questId, string objectiveId, int amount = 1)
        {
            var active = activeQuests.Find(q => q.quest.questId == questId);
            if (active == null) return false;

            if (!active.objectiveCounts.ContainsKey(objectiveId))
            {
                active.objectiveCounts[objectiveId] = 0;
            }

            active.objectiveCounts[objectiveId] += amount;
            int currentCount = active.objectiveCounts[objectiveId];

            Debug.Log($"<color=#00FF88><b>[Quest]</b></color> Progress on {questId} - {objectiveId}: {currentCount}");
            OnObjectiveAdvanced?.Invoke(active.quest, objectiveId, currentCount);

            // Check if current stage is fully satisfied
            CheckStageProgression(active);
            return true;
        }

        private void CheckStageProgression(ActiveQuestProgress active)
        {
            if (active.quest.stages == null || active.currentStageIndex >= active.quest.stages.Count) return;

            var currentStage = active.quest.stages[active.currentStageIndex];
            bool allComplete = true;

            foreach (var obj in currentStage.objectives)
            {
                int count = active.objectiveCounts.ContainsKey(obj.objectiveId) ? active.objectiveCounts[obj.objectiveId] : 0;
                if (count < obj.requiredCount)
                {
                    allComplete = false;
                    break;
                }
            }

            if (allComplete)
            {
                active.currentStageIndex++;

                if (active.currentStageIndex >= active.quest.stages.Count)
                {
                    CompleteQuest(active);
                }
                else
                {
                    Debug.Log($"<color=#00D2FF><b>[Quest]</b></color> Advanced to stage {active.currentStageIndex + 1} for quest: {active.quest.titleEn}");
                }
            }
        }

        private void CompleteQuest(ActiveQuestProgress active)
        {
            activeQuests.Remove(active);
            if (!completedQuestIds.Contains(active.quest.questId))
            {
                completedQuestIds.Add(active.quest.questId);
            }

            // Distribute rewards
            if (active.quest.rewardCoins > 0 && InventoryManager.Instance != null)
            {
                InventoryManager.Instance.AddCurrency(active.quest.rewardCoins);
            }

            if (active.quest.rewardItem != null && InventoryManager.Instance != null)
            {
                InventoryManager.Instance.AddItem(active.quest.rewardItem, 1);
            }

            Debug.Log($"<color=#00FF88><b>[Quest]</b></color> COMPLETED QUEST: {active.quest.titleEn}! Awarded {active.quest.rewardCoins} coins.");
            OnQuestCompleted?.Invoke(active.quest);
        }

        public bool IsQuestActive(string questId) => activeQuests.Exists(q => q.quest.questId == questId);
        public bool IsQuestCompleted(string questId) => completedQuestIds.Contains(questId);
    }
}
