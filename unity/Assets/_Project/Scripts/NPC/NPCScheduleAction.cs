using System;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// Discrete scheduled activity slot defining where an NPC should be, what logical state they occupy,
    /// and what occupation action they perform at a given time of day.
    /// </summary>
    [Serializable]
    public class NPCScheduleAction
    {
        [Tooltip("Hour of day (0-23) when this activity begins.")]
        [Range(0, 23)]
        public int startHour24 = 6;

        [Tooltip("Duration of this scheduled activity in hours.")]
        [Range(0.5f, 12f)]
        public float durationHours = 2.0f;

        [Tooltip("Primary logical state during this schedule slot.")]
        public NPCState state = NPCState.Working;

        [Tooltip("Human-readable activity summary in English.")]
        public string activityDescriptionEn = "Tending crops";

        [Tooltip("Human-readable activity summary in Tamil.")]
        public string activityDescriptionTa = "பயிர் பராமரித்தல்";

        [Tooltip("Target world destination position.")]
        public Vector3 targetPosition;

        [Tooltip("Optional transform anchor representing destination (overrides targetPosition if set).")]
        public Transform targetAnchor;

        [Tooltip("Location name (e.g., 'Village Temple', 'Paddy Field', 'Home').")]
        public string locationName = "Home";

        [Tooltip("If true, NPC prioritizes this event over dynamic social banter.")]
        public bool isMandatory = false;

        public Vector3 ResolvedPosition => targetAnchor != null ? targetAnchor.position : targetPosition;

        public bool IsActiveAtHour(float currentHour)
        {
            float endHour = startHour24 + durationHours;
            if (endHour <= 24f)
            {
                return currentHour >= startHour24 && currentHour < endHour;
            }
            else
            {
                // Wraps past midnight
                float wrappedEnd = endHour - 24f;
                return currentHour >= startHour24 || currentHour < wrappedEnd;
            }
        }
    }
}
