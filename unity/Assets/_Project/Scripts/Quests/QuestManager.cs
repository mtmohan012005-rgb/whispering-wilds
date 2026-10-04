using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;

namespace WhisperingWilds.Quests
{
    [Serializable]
    public class ActiveQuestProgress
    {
        public QuestData quest;
        public int currentStageIndex = 0;

        /// <summary>
        /// Progress counters keyed by objective id. Serialized as a plain list of pairs rather
        /// than a Dictionary because Unity's JsonUtility cannot serialize dictionaries, which is
        /// why stage and counter progress used to be lost on every save.
        /// </summary>
        public List<ObjectiveProgressEntry> objectiveCounts = new List<ObjectiveProgressEntry>();

        public ActiveQuestProgress(QuestData quest)
        {
            this.quest = quest;
            this.currentStageIndex = 0;
            this.objectiveCounts = new List<ObjectiveProgressEntry>();
        }

        public int GetCount(string objectiveId)
        {
            if (string.IsNullOrEmpty(objectiveId)) return 0;
            for (int i = 0; i < objectiveCounts.Count; i++)
            {
                if (objectiveCounts[i].objectiveId == objectiveId) return objectiveCounts[i].count;
            }
            return 0;
        }

        public void SetCount(string objectiveId, int count)
        {
            if (string.IsNullOrEmpty(objectiveId)) return;

            for (int i = 0; i < objectiveCounts.Count; i++)
            {
                if (objectiveCounts[i].objectiveId == objectiveId)
                {
                    objectiveCounts[i].count = count;
                    return;
                }
            }
            objectiveCounts.Add(new ObjectiveProgressEntry { objectiveId = objectiveId, count = count });
        }

        /// <summary>The active stage, or null once the quest has run past its final stage.</summary>
        public QuestStage CurrentStage
        {
            get
            {
                if (quest == null || quest.stages == null) return null;
                if (currentStageIndex < 0 || currentStageIndex >= quest.stages.Count) return null;
                return quest.stages[currentStageIndex];
            }
        }
    }

    /// <summary>One serialized objective counter. Plain pair so JsonUtility can round-trip it.</summary>
    [Serializable]
    public class ObjectiveProgressEntry
    {
        public string objectiveId;
        public int count;
    }

    /// <summary>Serialized snapshot of one quest's progress. Identifiers and counts only.</summary>
    [Serializable]
    public class SavedQuestProgress
    {
        public string questId;
        public int currentStageIndex;
        public List<ObjectiveProgressEntry> objectiveCounts = new List<ObjectiveProgressEntry>();
    }

    /// <summary>
    /// Narrative campaign quest manager supporting multi-stage objectives and rewards.
    ///
    /// Progression is event-driven: objectives only advance when
    /// <see cref="GameplayEventBus"/> reports a matching event type and stable target id, so an
    /// unrelated call can no longer complete a quest. Full progress, including the current stage
    /// index and every objective counter, is exposed for persistence and can be restored exactly.
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
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;

            GameplayEventBus.OnEventReported += HandleGameplayEvent;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;

            // Must be removed on destroy or a re-entered scene leaves a dead listener behind that
            // keeps advancing quests against a destroyed manager.
            GameplayEventBus.OnEventReported -= HandleGameplayEvent;
        }

        private void HandleGameplayEvent(QuestObjectiveType type, string targetId)
        {
            // A single reported event may satisfy several objectives across several quests, so
            // sweep the whole active set rather than stopping at the first match.
            for (int i = 0; i < activeQuests.Count; i++)
            {
                AdvanceMatchingObjectives(activeQuests[i], type, targetId);
            }
        }

        private bool AdvanceMatchingObjectives(ActiveQuestProgress active, QuestObjectiveType type, string targetId)
        {
            var stage = active.CurrentStage;
            if (stage == null || stage.objectives == null) return false;

            bool advanced = false;
            for (int i = 0; i < stage.objectives.Count; i++)
            {
                var objective = stage.objectives[i];
                if (objective == null) continue;
                if (objective.type != type) continue;
                if (!string.Equals(objective.targetId, targetId, StringComparison.Ordinal)) continue;
                if (objective.isCompleted) continue;

                if (AdvanceObjective(active.quest.questId, objective.objectiveId, 1))
                {
                    advanced = true;
                }
            }
            return advanced;
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

            // Objectives already satisfied before the quest was accepted (for example clues
            // discovered while it was still inactive) must count, otherwise accepting a quest
            // after the fact would leave it permanently incomplete.
            ReconcileAgainstKnownProgress(progress);

            return true;
        }

        /// <summary>
        /// Re-evaluates an active quest against events that already happened. Only counts that
        /// were actually reached are applied, so this cannot invent progression.
        /// </summary>
        private void ReconcileAgainstKnownProgress(ActiveQuestProgress active)
        {
            var stage = active.CurrentStage;
            if (stage == null || stage.objectives == null) return;

            for (int i = 0; i < stage.objectives.Count; i++)
            {
                var objective = stage.objectives[i];
                if (objective == null || objective.isCompleted) continue;

                if (IsObjectiveAlreadySatisfied(objective))
                {
                    AdvanceObjective(active.quest.questId, objective.objectiveId, 1);
                }
            }
        }

        private static bool IsObjectiveAlreadySatisfied(QuestObjective objective)
        {
            switch (objective.type)
            {
                case QuestObjectiveType.TalkToNPC:
                    return NPC.NPCInteractionLog.HasTalkedTo(objective.targetId);
                case QuestObjectiveType.DiscoverClue:
                    return Investigation.InvestigationManager.HasClueStatic(objective.targetId);
                case QuestObjectiveType.CraftItem:
                    return HasCraftedRecipe(objective.targetId);
                case QuestObjectiveType.PhotographTarget:
                    return HasPhotographedTarget(objective.targetId);
                default:
                    // ReachLocation / CollectItem / InvestigateObject describe a one-time action
                    // the player performs after accepting; there is no pre-existing history to
                    // reconstruct, so they are left at zero.
                    return false;
            }
        }

        public bool AdvanceObjective(string questId, string objectiveId, int amount = 1)
        {
            var active = FindProgress(questId);
            if (active == null) return false;

            if (amount <= 0) return false;
            if (!IsObjectiveInCurrentOrLaterStage(active, objectiveId)) return false;

            int previous = active.GetCount(objectiveId);
            active.SetCount(objectiveId, previous + amount);
            int currentCount = active.GetCount(objectiveId);

            Debug.Log($"<color=#00FF88><b>[Quest]</b></color> Progress on {questId} - {objectiveId}: {currentCount}");
            OnObjectiveAdvanced?.Invoke(active.quest, objectiveId, currentCount);

            CheckStageProgression(active);
            return true;
        }

        /// <summary>
        /// Guards against a caller advancing an objective that does not exist in this quest.
        /// </summary>
        private static bool IsObjectiveInCurrentOrLaterStage(ActiveQuestProgress active, string objectiveId)
        {
            if (string.IsNullOrEmpty(objectiveId)) return false;
            if (active.quest == null || active.quest.stages == null) return false;

            for (int i = 0; i < active.quest.stages.Count; i++)
            {
                var stage = active.quest.stages[i];
                if (stage == null || stage.objectives == null) continue;
                for (int j = 0; j < stage.objectives.Count; j++)
                {
                    if (stage.objectives[j] != null && stage.objectives[j].objectiveId == objectiveId) return true;
                }
            }
            return false;
        }

        private ActiveQuestProgress FindProgress(string questId)
        {
            for (int i = 0; i < activeQuests.Count; i++)
            {
                var q = activeQuests[i];
                if (q != null && q.quest != null && q.quest.questId == questId) return q;
            }
            return null;
        }

        private void CheckStageProgression(ActiveQuestProgress active)
        {
            // Loop rather than advance a single stage: satisfying one stage can immediately
            // satisfy the next when their objectives overlap.
            int guard = 0;
            while (guard++ < 64)
            {
                var currentStage = active.CurrentStage;
                if (currentStage == null || currentStage.objectives == null) return;

                bool allComplete = true;
                for (int i = 0; i < currentStage.objectives.Count; i++)
                {
                    var obj = currentStage.objectives[i];
                    if (obj == null) continue;
                    if (active.GetCount(obj.objectiveId) < obj.requiredCount)
                    {
                        allComplete = false;
                        break;
                    }
                }

                if (!allComplete) return;

                active.currentStageIndex++;

                if (active.quest.stages != null && active.currentStageIndex >= active.quest.stages.Count)
                {
                    CompleteQuest(active);
                    return;
                }

                Debug.Log($"<color=#00D2FF><b>[Quest]</b></color> Advanced to stage {active.currentStageIndex + 1} for quest: {active.quest.titleEn}");
            }

            Debug.LogWarning($"[Quest] Stage progression for quest '{active.quest.questId}' exceeded the safety guard; halting to avoid an infinite loop.");
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
                // Rewarded, not Collected: a quest reward must not satisfy a CollectItem objective.
                InventoryManager.Instance.AddItem(active.quest.rewardItem, 1, InventoryManager.ItemGrantSource.Rewarded);
            }

            Debug.Log($"<color=#00FF88><b>[Quest]</b></color> COMPLETED QUEST: {active.quest.titleEn}! Awarded {active.quest.rewardCoins} coins.");
            OnQuestCompleted?.Invoke(active.quest);
        }

        public bool IsQuestActive(string questId) => FindProgress(questId) != null;
        public bool IsQuestCompleted(string questId) => completedQuestIds.Contains(questId);

        /// <summary>Counter for one objective on one active quest. Used by UI and tests.</summary>
        public int GetObjectiveCount(string questId, string objectiveId)
        {
            var active = FindProgress(questId);
            return active?.GetCount(objectiveId) ?? 0;
        }

        /// <summary>Current stage index for one active quest. Returns -1 when not active.</summary>
        public int GetCurrentStageIndex(string questId)
        {
            var active = FindProgress(questId);
            return active?.currentStageIndex ?? -1;
        }

        // ---- Persistence ----------------------------------------------------

        /// <summary>
        /// Captures every active quest's stage index and objective counters. Only identifiers and
        /// counts are stored; quest definitions are resolved from the catalogue on load, so no
        /// quest content is duplicated into the save file.
        /// </summary>
        public List<SavedQuestProgress> CaptureProgress()
        {
            var snapshot = new List<SavedQuestProgress>();
            for (int i = 0; i < activeQuests.Count; i++)
            {
                var active = activeQuests[i];
                if (active == null || active.quest == null) continue;

                var saved = new SavedQuestProgress
                {
                    questId = active.quest.questId,
                    currentStageIndex = active.currentStageIndex,
                    objectiveCounts = new List<ObjectiveProgressEntry>()
                };

                for (int j = 0; j < active.objectiveCounts.Count; j++)
                {
                    var entry = active.objectiveCounts[j];
                    if (entry == null || string.IsNullOrEmpty(entry.objectiveId)) continue;
                    if (entry.count <= 0) continue;
                    saved.objectiveCounts.Add(new ObjectiveProgressEntry { objectiveId = entry.objectiveId, count = entry.count });
                }

                snapshot.Add(saved);
            }
            return snapshot;
        }

        /// <summary>
        /// Replaces active quest state with a saved snapshot. Unknown quest ids are skipped with a
        /// warning instead of throwing, so a save from a different content version still loads
        /// the campaign the player can play.
        /// </summary>
        public void RestoreProgress(List<SavedQuestProgress> savedProgress, List<string> savedActiveIds, List<string> savedCompletedIds)
        {
            activeQuests.Clear();
            completedQuestIds.Clear();

            if (savedCompletedIds != null)
            {
                for (int i = 0; i < savedCompletedIds.Count; i++)
                {
                    if (!string.IsNullOrEmpty(savedCompletedIds[i]) && !completedQuestIds.Contains(savedCompletedIds[i]))
                    {
                        completedQuestIds.Add(savedCompletedIds[i]);
                    }
                }
            }

            if (savedProgress != null)
            {
                for (int i = 0; i < savedProgress.Count; i++)
                {
                    var saved = savedProgress[i];
                    if (saved == null || string.IsNullOrEmpty(saved.questId)) continue;

                    var quest = GameDataCatalog.GetQuest(saved.questId);
                    if (quest == null)
                    {
                        Debug.LogWarning($"[Quest] Save references unknown quest '{saved.questId}'; skipping it.");
                        continue;
                    }
                    if (completedQuestIds.Contains(saved.questId)) continue;

                    var progress = new ActiveQuestProgress(quest);
                    int stageCount = quest.stages != null ? quest.stages.Count : 0;
                    progress.currentStageIndex = Mathf.Clamp(saved.currentStageIndex, 0, Mathf.Max(0, stageCount));

                    if (saved.objectiveCounts != null)
                    {
                        for (int j = 0; j < saved.objectiveCounts.Count; j++)
                        {
                            var entry = saved.objectiveCounts[j];
                            if (entry == null || string.IsNullOrEmpty(entry.objectiveId)) continue;
                            progress.SetCount(entry.objectiveId, Mathf.Max(0, entry.count));
                        }
                    }

                    activeQuests.Add(progress);
                }
            }
            else if (savedActiveIds != null)
            {
                // v1 saves carried only quest ids with no stage or counter detail. Restore the
                // quests themselves at stage 0 with zeroed counters rather than dropping them.
                for (int i = 0; i < savedActiveIds.Count; i++)
                {
                    var quest = GameDataCatalog.GetQuest(savedActiveIds[i]);
                    if (quest == null)
                    {
                        Debug.LogWarning($"[Quest] Save references unknown active quest '{savedActiveIds[i]}'; skipping it.");
                        continue;
                    }
                    if (completedQuestIds.Contains(quest.questId) || IsQuestActive(quest.questId)) continue;
                    activeQuests.Add(new ActiveQuestProgress(quest));
                }
            }
        }

        /// <summary>Clears all quest state. Used by New Game.</summary>
        public void ResetAllProgress()
        {
            activeQuests.Clear();
            completedQuestIds.Clear();
        }

        /// <summary>Accepts the opening quests. Used by New Game.</summary>
        public void AcceptOpeningQuests()
        {
            ChennaiOpeningContent.EnsureInitialized();

            var first = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            if (first != null) AcceptQuest(first);

            var second = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestTeaLedgerDiscrepancy);
            if (second != null) AcceptQuest(second);
        }

        private static bool HasCraftedRecipe(string recipeId)
        {
            return Inventory.CraftingHistory.HasCrafted(recipeId);
        }

        private static bool HasPhotographedTarget(string targetId)
        {
            return WhisperingWilds.Photography.PhotoJournal.HasCaptured(targetId);
        }
    }
}