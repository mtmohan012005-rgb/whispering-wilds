using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.World;

namespace WhisperingWilds.Campaign
{
    /// <summary>
    /// Determines which story ending the player earns based on their campaign performance.
    /// 
    /// Four endings are evaluated in priority order:
    /// - ENDING_D (Secret True Ending): All 7 regional clues, all 5 central NPCs trusted, 
    ///   all 4 exploration milestones, Living Sanctuary verdict.
    /// - ENDING_A (The Living Heritage): Heritage Council affinity ≥ 60%, avg NPC trust ≥ 50%,
    ///   ≥ 5 clues, Living Sanctuary verdict.
    /// - ENDING_B (The Recorded Chronicle): Archaeological Society affinity ≥ 55%,
    ///   State Biosphere Reserve verdict.
    /// - ENDING_C (The Shadowed Sanctuary): Fallback for low trust or sealed vault.
    /// 
    /// The ending is evaluated once when the final Nilgiris quest completes and is cached
    /// so it cannot change mid-ending sequence.
    /// </summary>
    public class EndingController : MonoBehaviour
    {
        public static EndingController Instance { get; private set; }

        /// <summary>The four possible endings, ordered by evaluation priority (highest first).</summary>
        public enum EndingType
        {
            None,
            EndingC_ShadowedSanctuary,
            EndingB_RecordedChronicle,
            EndingA_LivingHeritage,
            EndingD_SongOfAncestralSoil
        }

        // Events
        public event Action<EndingType> OnEndingDetermined;

        // State
        private EndingType cachedEnding = EndingType.None;
        private bool endingEvaluated = false;

        // Affinity tracking
        private int heritageCouncilAffinity = 0;
        private int archaeologicalSocietyAffinity = 0;
        private int agrarianGuildAffinity = 0;

        // NPC trust scores (keyed by NPC id)
        private readonly Dictionary<string, int> npcTrustScores = new Dictionary<string, int>();

        // Verdict tracking
        private string sanctuaryVerdict = ""; // "LivingSanctuary", "StateBiosphere", "SealedVault"

        // Exploration milestones
        private readonly HashSet<string> explorationMilestones = new HashSet<string>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        // ------------------------------------------------------------------
        // Affinity management
        // ------------------------------------------------------------------

        /// <summary>
        /// Adjusts faction affinity. Called by quest decisions and NPC interactions.
        /// </summary>
        public void AdjustAffinity(string factionId, int delta)
        {
            switch (factionId.ToLowerInvariant())
            {
                case "heritage":
                    heritageCouncilAffinity = Mathf.Clamp(heritageCouncilAffinity + delta, -100, 100);
                    break;
                case "archaeological":
                    archaeologicalSocietyAffinity = Mathf.Clamp(archaeologicalSocietyAffinity + delta, -100, 100);
                    break;
                case "agrarian":
                    agrarianGuildAffinity = Mathf.Clamp(agrarianGuildAffinity + delta, -100, 100);
                    break;
            }
        }

        public int GetAffinity(string factionId)
        {
            switch (factionId.ToLowerInvariant())
            {
                case "heritage": return heritageCouncilAffinity;
                case "archaeological": return archaeologicalSocietyAffinity;
                case "agrarian": return agrarianGuildAffinity;
                default: return 0;
            }
        }

        // ------------------------------------------------------------------
        // NPC trust management
        // ------------------------------------------------------------------

        /// <summary>
        /// Adjusts trust with a specific NPC. Called by dialogue choices and quest decisions.
        /// </summary>
        public void AdjustTrust(string npcId, int delta)
        {
            if (string.IsNullOrEmpty(npcId)) return;

            if (!npcTrustScores.ContainsKey(npcId))
                npcTrustScores[npcId] = 0;

            npcTrustScores[npcId] = Mathf.Clamp(npcTrustScores[npcId] + delta, 0, 100);
        }

        public int GetTrust(string npcId)
        {
            if (string.IsNullOrEmpty(npcId) || !npcTrustScores.ContainsKey(npcId))
                return 0;
            return npcTrustScores[npcId];
        }

        /// <summary>
        /// Returns the average trust across all tracked NPCs.
        /// </summary>
        public float GetAverageTrust()
        {
            if (npcTrustScores.Count == 0) return 0f;
            int total = 0;
            foreach (var kvp in npcTrustScores)
                total += kvp.Value;
            return (float)total / npcTrustScores.Count;
        }

        /// <summary>
        /// Returns the number of NPCs with trust ≥ threshold.
        /// </summary>
        public int CountNPCsWithTrust(int threshold)
        {
            int count = 0;
            foreach (var kvp in npcTrustScores)
                if (kvp.Value >= threshold) count++;
            return count;
        }

        // ------------------------------------------------------------------
        // Verdict tracking
        // ------------------------------------------------------------------

        /// <summary>
        /// Records the player's Sanctuary Destiny verdict (final chapter decision).
        /// </summary>
        public void SetSanctuaryVerdict(string verdict)
        {
            this.sanctuaryVerdict = verdict ?? "";
        }

        public string GetSanctuaryVerdict() => sanctuaryVerdict;

        // ------------------------------------------------------------------
        // Exploration milestones
        // ------------------------------------------------------------------

        /// <summary>
        /// Records an exploration milestone completion.
        /// Milestones: "Epigraphist", "LostHerbarium", "VoiceOfTheForest", "BanyanHeart"
        /// </summary>
        public void RecordMilestone(string milestoneId)
        {
            if (!string.IsNullOrEmpty(milestoneId))
                explorationMilestones.Add(milestoneId);
        }

        public int MilestoneCount => explorationMilestones.Count;

        /// <summary>Public accessor for heritage council affinity (used by tests).</summary>
        public int HeritageCouncilAffinity => heritageCouncilAffinity;

        /// <summary>Public accessor for whether ending has been evaluated (used by tests).</summary>
        public bool EndingEvaluated => endingEvaluated;

        /// <summary>Public accessor for exploration milestones (used by tests).</summary>
        public HashSet<string> ExplorationMilestones => explorationMilestones;

        // ------------------------------------------------------------------
        // Ending evaluation
        // ------------------------------------------------------------------

        /// <summary>
        /// Evaluates and caches the ending based on current campaign state.
        /// Returns the determined ending type.
        /// </summary>
        public EndingType EvaluateEnding()
        {
            if (endingEvaluated)
                return cachedEnding;

            endingEvaluated = true;

            // Gather current state
            int clueCount = InvestigationRuntimeState.SnapshotDiscovered().Count;
            float avgTrust = GetAverageTrust();
            int npcsTalkedTo = NPCInteractionLog.Count;
            bool hasLivingSanctuary = string.Equals(sanctuaryVerdict, "LivingSanctuary", StringComparison.OrdinalIgnoreCase);
            bool hasStateBiosphere = string.Equals(sanctuaryVerdict, "StateBiosphere", StringComparison.OrdinalIgnoreCase);
            bool hasSealedVault = string.Equals(sanctuaryVerdict, "SealedVault", StringComparison.OrdinalIgnoreCase);
            int milestones = explorationMilestones.Count;

            // Central NPC IDs from the story design
            string[] centralNpcs = { "murugan", "velu", "selvam", "sundaram", "mani" };
            int maxTrustCentralNpcs = 0;
            foreach (var npc in centralNpcs)
            {
                if (GetTrust(npc) >= 70) maxTrustCentralNpcs++;
            }

            // Evaluate in priority order (highest first)

            // ENDING_D — Secret True Ending
            if (clueCount >= 7 && milestones >= 4 && maxTrustCentralNpcs >= 5 && hasLivingSanctuary)
            {
                cachedEnding = EndingType.EndingD_SongOfAncestralSoil;
                Debug.Log($"<color=#FFD700><b>[Ending]</b></color> SECRET TRUE ENDING earned: Song of the Ancestral Soil");
                OnEndingDetermined?.Invoke(cachedEnding);
                return cachedEnding;
            }

            // ENDING_A — The Living Heritage
            if (heritageCouncilAffinity >= 60 && avgTrust >= 50 && clueCount >= 5 && hasLivingSanctuary)
            {
                cachedEnding = EndingType.EndingA_LivingHeritage;
                Debug.Log($"<color=#00FF99><b>[Ending]</b></color> ENDING A earned: The Living Heritage");
                OnEndingDetermined?.Invoke(cachedEnding);
                return cachedEnding;
            }

            // ENDING_B — The Recorded Chronicle
            if (archaeologicalSocietyAffinity >= 55 && hasStateBiosphere)
            {
                cachedEnding = EndingType.EndingB_RecordedChronicle;
                Debug.Log($"<color=#4488FF><b>[Ending]</b></color> ENDING B earned: The Recorded Chronicle");
                OnEndingDetermined?.Invoke(cachedEnding);
                return cachedEnding;
            }

            // ENDING_C — The Shadowed Sanctuary (fallback)
            cachedEnding = EndingType.EndingC_ShadowedSanctuary;
            Debug.Log($"<color=#888888><b>[Ending]</b></color> ENDING C: The Shadowed Sanctuary (fallback)");
            OnEndingDetermined?.Invoke(cachedEnding);
            return cachedEnding;
        }

        /// <summary>
        /// Returns the cached ending if already evaluated, otherwise None.
        /// </summary>
        public EndingType GetCurrentEnding() => cachedEnding;

        /// <summary>Checks whether an ending has been evaluated yet.</summary>
        public bool HasEndingBeenEvaluated() => endingEvaluated;

        // ------------------------------------------------------------------
        // Localization helpers
        // ------------------------------------------------------------------

        /// <summary>Returns the localized title for an ending.</summary>
        public string GetEndingTitle(EndingType ending, bool tamil)
        {
            switch (ending)
            {
                case EndingType.EndingA_LivingHeritage:
                    return tamil ? "தூய பசுமைத் தடம்" : "The Living Heritage";
                case EndingType.EndingB_RecordedChronicle:
                    return tamil ? "வரலாற்றின் பதிவேடு" : "The Recorded Chronicle";
                case EndingType.EndingC_ShadowedSanctuary:
                    return tamil ? "மறைந்த வனம்" : "The Shadowed Sanctuary";
                case EndingType.EndingD_SongOfAncestralSoil:
                    return tamil ? "காலத்தின் பாடல்" : "Song of the Ancestral Soil";
                default:
                    return tamil ? "இறுதி" : "Ending";
            }
        }

        /// <summary>Returns the localized epilogue text for an ending.</summary>
        public string GetEndingEpilogue(EndingType ending, bool tamil)
        {
            switch (ending)
            {
                case EndingType.EndingA_LivingHeritage:
                    return tamil
                        ? "புனித தாவரங்கள் மற்றும் பழமையான கையெழுத்துப் பிரதிகள் சமூகக் கவனிப்பிற்குத் திரும்பப்பட்டுள்ளன. காடு வாழ்கிறது, மரபு தொடர்கிறது."
                        : "The sacred flora and ancient folios have been returned to community stewardship. The forest lives, the heritage continues.";
                case EndingType.EndingB_RecordedChronicle:
                    return tamil
                        ? "வரைபடங்கள் மற்றும் பொருட்கள் மதராஸ் உயர் நீதிமன்றம் மற்றும் எக்மோர் அருங்காட்சியக சேகரிப்புகளில் சேர்க்கப்பட்டுள்ளன. வரலாறு பதிவு செய்யப்பட்டுள்ளது."
                        : "The blueprints and artifacts have been accessioned into the Madras High Court and Egmore Museum collections. History is recorded.";
                case EndingType.EndingC_ShadowedSanctuary:
                    return tamil
                        ? "மலைப் பாதைகள் சரிந்துள்ளன. பழமையான தாவரவியல் ரகசியங்கள் மௌனம் மற்றும் புராணங்களில் மறைகின்றன."
                        : "The mountain passes have collapsed. Ancient botanical secrets slip into silence and myth.";
                case EndingType.EndingD_SongOfAncestralSoil:
                    return tamil
                        ? "முழு கலாச்சார-சூழலியல் இசைவு. அனைத்து சான்றுகளும் இணைக்கப்பட்டுள்ளன, அனைத்து நட்சத்திரங்களும் ஒளிர்கின்றன. மண்ணின் பாடல் என்றென்றும் ஒலிக்கிறது."
                        : "Complete cultural-ecological harmony. All evidence connected, all stars aligned. The song of the ancestral soil echoes forever.";
                default:
                    return tamil ? "கதை இன்னும் தொடர்கிறது..." : "The story continues...";
            }
        }

        // ------------------------------------------------------------------
        // Save/Load
        // ------------------------------------------------------------------

        /// <summary>Serializes ending state for save.</summary>
        public EndingSaveData Snapshot()
        {
            return new EndingSaveData
            {
                heritageCouncilAffinity = heritageCouncilAffinity,
                archaeologicalSocietyAffinity = archaeologicalSocietyAffinity,
                agrarianGuildAffinity = agrarianGuildAffinity,
                npcTrustScores = new Dictionary<string, int>(npcTrustScores),
                sanctuaryVerdict = sanctuaryVerdict,
                explorationMilestones = new HashSet<string>(explorationMilestones),
                endingEvaluated = endingEvaluated,
                cachedEnding = cachedEnding
            };
        }

        /// <summary>Restores ending state from save.</summary>
        public void Restore(EndingSaveData data)
        {
            if (data == null) return;

            heritageCouncilAffinity = data.heritageCouncilAffinity;
            archaeologicalSocietyAffinity = data.archaeologicalSocietyAffinity;
            agrarianGuildAffinity = data.agrarianGuildAffinity;

            npcTrustScores.Clear();
            if (data.npcTrustScores != null)
            {
                foreach (var kvp in data.npcTrustScores)
                    npcTrustScores[kvp.Key] = kvp.Value;
            }

            sanctuaryVerdict = data.sanctuaryVerdict ?? "";

            explorationMilestones.Clear();
            if (data.explorationMilestones != null)
            {
                foreach (var m in data.explorationMilestones)
                    explorationMilestones.Add(m);
            }

            endingEvaluated = data.endingEvaluated;
            cachedEnding = data.cachedEnding;
        }

        /// <summary>Clears all ending state for a new game.</summary>
        public void ResetForNewGame()
        {
            heritageCouncilAffinity = 0;
            archaeologicalSocietyAffinity = 0;
            agrarianGuildAffinity = 0;
            npcTrustScores.Clear();
            sanctuaryVerdict = "";
            explorationMilestones.Clear();
            endingEvaluated = false;
            cachedEnding = EndingType.None;
        }
    }

    /// <summary>Serializable snapshot of ending state for save/load.</summary>
    [Serializable]
    public class EndingSaveData
    {
        public int heritageCouncilAffinity;
        public int archaeologicalSocietyAffinity;
        public int agrarianGuildAffinity;
        public Dictionary<string, int> npcTrustScores = new Dictionary<string, int>();
        public string sanctuaryVerdict;
        public HashSet<string> explorationMilestones = new HashSet<string>();
        public bool endingEvaluated;
        public EndingController.EndingType cachedEnding;
    }
}
