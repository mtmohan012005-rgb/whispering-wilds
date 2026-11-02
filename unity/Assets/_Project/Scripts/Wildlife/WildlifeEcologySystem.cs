using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Ecology
{
    public enum WildlifeBehavior
    {
        Grazing,
        Migrating,
        Fleeing,
        Alert
    }

    [System.Serializable]
    public struct PhotoSnapshotResult
    {
        public string speciesId;
        public float distance;
        public bool isCenteredInFrame;
        public bool isActionShot;
        public int calculatedResearchScore;
    }

    /// <summary>
    /// Regional Loops: Wildlife ecology & research photography.
    /// Tracks regional animal behaviors, herd movement vectors, stress levels, and non-lethal research photography scoring.
    /// </summary>
    public class WildlifeEcologySystem : MonoBehaviour
    {
        [Header("Ecology Tracking")]
        public string regionId;
        public WildlifeBehavior currentBehavior = WildlifeBehavior.Grazing;
        [Range(0f, 100f)] public float herdStressLevel = 10f;

        public event Action<string, WildlifeBehavior> OnBehaviorShift;

        /// <summary>
        /// Evaluates a non-lethal research photograph taken by the player.
        /// </summary>
        public PhotoSnapshotResult EvaluatePhotograph(string speciesId, float distance, bool centered, bool actionActive)
        {
            int score = 100;

            // Distance penalties/bonuses (too close spooks them, too far loses detail)
            if (distance < 3f) score -= 40; // Too close, risk of scattering herd
            else if (distance > 25f) score -= 50; // Too far
            else score += 50; // Optimal distance

            if (centered) score += 30;
            if (actionActive) score += 50;

            // Increase herd stress if player is too close
            if (distance < 5f)
            {
                AdjustHerdStress(15f);
            }

            return new PhotoSnapshotResult
            {
                speciesId = speciesId,
                distance = distance,
                isCenteredInFrame = centered,
                isActionShot = actionActive,
                calculatedResearchScore = Mathf.Max(10, score)
            };
        }

        public void AdjustHerdStress(float amount)
        {
            herdStressLevel = Mathf.Clamp(herdStressLevel + amount, 0f, 100f);
            if (herdStressLevel > 70f && currentBehavior != WildlifeBehavior.Fleeing)
            {
                SetBehavior(WildlifeBehavior.Fleeing);
            }
            else if (herdStressLevel < 30f && currentBehavior == WildlifeBehavior.Fleeing)
            {
                SetBehavior(WildlifeBehavior.Grazing);
            }
            else if (herdStressLevel >= 40f && herdStressLevel <= 70f && currentBehavior == WildlifeBehavior.Grazing)
            {
                SetBehavior(WildlifeBehavior.Alert);
            }
        }

        public void SetBehavior(WildlifeBehavior newBehavior)
        {
            if (currentBehavior != newBehavior)
            {
                currentBehavior = newBehavior;
                OnBehaviorShift?.Invoke(regionId, currentBehavior);
            }
        }
    }
}
