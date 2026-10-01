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

    /// <summary>
    /// The gameplay event that can satisfy an objective. An objective only advances when its
    /// own event is actually reported through <c>GameplayEventBus</c>, never because some
    /// unrelated call happened to name the same quest.
    /// </summary>
    public enum QuestObjectiveType
    {
        TalkToNPC = 0,
        DiscoverClue = 1,
        ReachLocation = 2,
        CollectItem = 3,
        InvestigateObject = 4,
        PhotographTarget = 5,
        CraftItem = 6
    }

    [Serializable]
    public class QuestObjective
    {
        public string objectiveId;

        [Tooltip("Which gameplay event satisfies this objective.")]
        public QuestObjectiveType type = QuestObjectiveType.TalkToNPC;

        [Tooltip("Stable identifier the reported event must match: npcId, clueId, locationId, itemId, objectId, photo target id, or recipeId.")]
        public string targetId;

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
