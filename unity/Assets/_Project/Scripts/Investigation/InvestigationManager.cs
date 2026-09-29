using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;

namespace WhisperingWilds.Investigation
{
    /// <summary>
    /// Detective investigation system. Manages clue discovery,
    /// evidence linking on the Investigation Board, and photography records.
    /// </summary>
    public class InvestigationManager : MonoBehaviour
    {
        public static InvestigationManager Instance { get; private set; }

        [Header("Discovered Evidence")]
        [SerializeField] private List<ClueData> discoveredClues = new List<ClueData>();
        [SerializeField] private List<string> linkedDeductions = new List<string>();

        public IReadOnlyList<ClueData> DiscoveredClues => discoveredClues;

        public event Action<ClueData> OnClueDiscovered;
        public event Action<string> OnDeductionMade;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public bool DiscoverClue(ClueData clue)
        {
            if (clue == null || discoveredClues.Contains(clue)) return false;

            discoveredClues.Add(clue);
            Debug.Log($"<color=#FFD700><b>[Investigation]</b></color> DISCOVERED CLUE: {clue.titleEn} ({clue.type})");
            OnClueDiscovered?.Invoke(clue);

            // Check if this clue links with an already discovered clue
            if (!string.IsNullOrEmpty(clue.relatedClueId))
            {
                var related = discoveredClues.Find(c => c.clueId == clue.relatedClueId);
                if (related != null)
                {
                    string deductionKey = $"{clue.clueId}_{related.clueId}";
                    if (!linkedDeductions.Contains(deductionKey))
                    {
                        linkedDeductions.Add(deductionKey);
                        Debug.Log($"<color=#00FF88><b>[Investigation]</b></color> DEDUCTION UNLOCKED between '{clue.titleEn}' and '{related.titleEn}'!");
                        OnDeductionMade?.Invoke(clue.deductionNote);
                    }
                }
            }

            return true;
        }

        public bool HasClue(string clueId)
        {
            return discoveredClues.Exists(c => c.clueId == clueId);
        }
    }
}
