using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Data
{
    public enum QuestState
    {
        Locked,
        Available,
        Active,
        Completed,
        Failed
    }

    [Serializable]
    public class QuestObjective
    {
        public string objectiveId;
        public string descriptionEn;
        public string descriptionTa;
        public int requiredCount = 1;
        public int currentCount = 0;
        public bool isCompleted => currentCount >= requiredCount;
    }

    [Serializable]
    public class QuestStage
    {
        public int stageIndex;
        public string titleEn;
        public string titleTa;
        public List<QuestObjective> objectives = new List<QuestObjective>();
    }

    [CreateAssetMenu(fileName = "NewQuest", menuName = "Whispering Wilds/Data/Quest")]
    public class QuestData : ScriptableObject
    {
        [Header("Quest Identity")]
        public string questId;
        public string titleEn;
        public string titleTa;
        [TextArea(2, 4)] public string summaryEn;
        [TextArea(2, 4)] public string summaryTa;
        public string regionId;

        [Header("Progression")]
        public QuestState defaultState = QuestState.Available;
        public List<QuestStage> stages = new List<QuestStage>();

        [Header("Rewards")]
        public int rewardCoins = 50;
        public ItemData rewardItem;
        public string unlockedCodexEntry;
    }
}
