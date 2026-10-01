using UnityEngine;

namespace WhisperingWilds.Data
{
    public enum ClueType
    {
        Document,
        PhysicalEvidence,
        Photograph,
        WitnessTestimony,
        ArchaeologicalInscription
    }

    [CreateAssetMenu(fileName = "NewClue", menuName = "Whispering Wilds/Data/Clue")]
    public class ClueData : ScriptableObject
    {
        [Header("Identity")]
        public string clueId;
        public string titleEn;
        public string titleTa;
        [TextArea(3, 5)] public string descriptionEn;
        [TextArea(3, 5)] public string descriptionTa;

        [Header("Classification")]
        public ClueType type;
        public string regionId;
        public Sprite evidenceSprite;
        public bool isKeyLead;

        [Header("Investigation Links")]
        public string relatedClueId;

        /// <summary>Player-facing conclusion unlocked by holding this clue and its link.</summary>
        public string deductionNote;

        /// <summary>Tamil rendering of <see cref="deductionNote"/>. Falls back to English when empty.</summary>
        [TextArea(2, 3)] public string deductionNoteTa;
    }
}
