using System;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    public enum AnchorActivityType
    {
        HomeResting,
        MarketStall,
        TemplePrayer,
        TeaPlucking,
        PaddyFarming,
        ArtisanWork,
        SocialBench,
        PatrolLookout
    }

    /// <summary>
    /// Physical location anchor where NPCs dock to perform specific daily schedule tasks
    /// (e.g. running a flower stall, resting on a thinnai verandah, harvesting crops).
    /// </summary>
    [DisallowMultipleComponent]
    [SelectionBase]
    public class NPCActivityAnchor : MonoBehaviour
    {
        [Header("Anchor Identity")]
        [SerializeField] private string anchorId = "anchor_01";
        [SerializeField] private AnchorActivityType activityType = AnchorActivityType.MarketStall;
        [SerializeField] private string locationName = "Market Stall";
        [SerializeField] private string activityPromptTa = "வணிகம் செய்தல்";

        [Header("Docking & Alignment")]
        [SerializeField] private Transform dockPoint;
        [SerializeField] private bool lockRotation = true;

        [Header("Occupancy")]
        [SerializeField] private NPCCharacter currentOccupant;

        public string AnchorId => anchorId;
        public AnchorActivityType ActivityType => activityType;
        public string LocationName => locationName;
        public bool IsOccupied => currentOccupant != null;
        public NPCCharacter CurrentOccupant => currentOccupant;
        public Vector3 DockPosition => dockPoint != null ? dockPoint.position : transform.position;
        public Quaternion DockRotation => dockPoint != null ? dockPoint.rotation : transform.rotation;

        public bool Occupy(NPCCharacter npc)
        {
            if (currentOccupant != null && currentOccupant != npc)
            {
                return false;
            }

            currentOccupant = npc;
            return true;
        }

        public void Release(NPCCharacter npc)
        {
            if (currentOccupant == npc)
            {
                currentOccupant = null;
            }
        }

        private void OnDrawGizmos()
        {
            Gizmos.color = IsOccupied ? Color.red : Color.cyan;
            Vector3 pos = DockPosition;
            Gizmos.DrawWireSphere(pos, 0.4f);
            Gizmos.DrawRay(pos, (dockPoint != null ? dockPoint.forward : transform.forward) * 0.8f);
        }
    }
}
