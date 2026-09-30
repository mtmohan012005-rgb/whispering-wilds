using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Lightweight herd / flock coordinator managing collective wildlife movement,
    /// cohesive feeding, and group flee responses without O(N^2) pairwise physics.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeGroup : MonoBehaviour
    {
        [SerializeField] private WildlifeSpecies species = WildlifeSpecies.SpottedDeer;
        [SerializeField] private WildlifeEntity leader;
        [SerializeField] private List<WildlifeEntity> members = new List<WildlifeEntity>();
        [SerializeField] private float cohesionRadius = 12.0f;

        public WildlifeEntity Leader => leader;
        public List<WildlifeEntity> Members => members;

        public void RegisterMember(WildlifeEntity entity)
        {
            if (!members.Contains(entity))
            {
                members.Add(entity);
                if (leader == null) leader = entity;
            }
        }

        public void UnregisterMember(WildlifeEntity entity)
        {
            members.Remove(entity);
            if (leader == entity)
            {
                leader = members.Count > 0 ? members[0] : null;
            }
        }

        public Vector3 GetFlockOffset(WildlifeEntity member, Vector3 leaderDestination)
        {
            int index = members.IndexOf(member);
            if (index <= 0) return leaderDestination;

            // Form dynamic staggered formation behind leader
            float angle = (index * 60f) * Mathf.Deg2Rad;
            float dist = Mathf.Min(cohesionRadius, 2.5f + (index * 1.5f));
            Vector3 offset = new Vector3(Mathf.Cos(angle) * dist, 0f, Mathf.Sin(angle) * dist);
            return leaderDestination + offset;
        }

        public void NotifyGroupFlee(Vector3 dangerSource)
        {
            for (int i = 0; i < members.Count; i++)
            {
                if (members[i] != null)
                {
                    members[i].TriggerFlee(dangerSource);
                }
            }
        }
    }
}
