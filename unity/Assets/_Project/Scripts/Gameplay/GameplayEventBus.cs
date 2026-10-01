using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Global, scene-agnostic event bus for gameplay actions that can advance quest objectives.
    ///
    /// Only verifiable, player-driven actions are reported: talk, discover clue, collect item,
    /// craft item, photograph target, reach location, or investigate object. Callers must pass
    /// the stable identifier associated with that action (npc id, clue id, item id, recipe id,
    /// photo target id, location id, or object id). Reporting never creates or mutates content;
    /// it simply broadcasts that the condition occurred at least once.
    ///
    /// The bus is thread-safe by Unity convention (events fire from the main thread, and
    /// subscribers attach/detach during play). Listeners must not throw or they will be logged
    /// and skipped.
    /// </summary>
    public static class GameplayEventBus
    {
        public delegate void GameplayEventHandler(QuestObjectiveType type, string targetId);

        /// <summary>Fired whenever a gameplay action that may satisfy a quest objective is reported.</summary>
        public static event GameplayEventHandler OnEventReported;

        /// <summary>Reports a gameplay event. Returns true if at least one listener was notified.</summary>
        public static bool Report(QuestObjectiveType type, string targetId)
        {
            if (string.IsNullOrEmpty(targetId))
            {
                Debug.LogWarning($"[GameplayEventBus] Ignoring event of type {type} with empty targetId.");
                return false;
            }

            if (OnEventReported == null) return false;

            try
            {
                OnEventReported.Invoke(type, targetId);
                return true;
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[GameplayEventBus] Event listener threw while handling {type}:{targetId}: {ex}");
                return false;
            }
        }

        /// <summary>Reports a clue discovery by id.</summary>
        public static bool ReportClueDiscovered(string clueId) => Report(QuestObjectiveType.DiscoverClue, clueId);

        /// <summary>Reports a collected item by id.</summary>
        public static bool ReportItemCollected(string itemId) => Report(QuestObjectiveType.CollectItem, itemId);

        /// <summary>Reports a completed craft by recipe id.</summary>
        public static bool ReportCraftCompleted(string recipeId) => Report(QuestObjectiveType.CraftItem, recipeId);

        /// <summary>Reports a photograph captured by target id.</summary>
        public static bool ReportPhotoCaptured(string targetId) => Report(QuestObjectiveType.PhotographTarget, targetId);

        /// <summary>Reports a conversation with an NPC by npc id.</summary>
        public static bool ReportTalkedToNpc(string npcId) => Report(QuestObjectiveType.TalkToNPC, npcId);

        /// <summary>Reports reaching a location by location id.</summary>
        public static bool ReportReachedLocation(string locationId) => Report(QuestObjectiveType.ReachLocation, locationId);

        /// <summary>Reports investigating an object by object id.</summary>
        public static bool ReportInvestigatedObject(string objectId) => Report(QuestObjectiveType.InvestigateObject, objectId);
    }
}