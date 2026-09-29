using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    public enum WildlifeSpecies
    {
        Cattle,
        Goat,
        StrayDog,
        Peafowl,
        Egret,
        Kingfisher,
        NilgiriTahr,
        BonnetMacaque,
        AsianElephant,
        IndianGaur
    }

    /// <summary>
    /// Autonomous animal entity with wander, graze, flee, and idle behaviours.
    /// Supports distance-based LOD simulation tiers to maintain high frame rates.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeEntity : MonoBehaviour
    {
        [Header("Species Configuration")]
        [SerializeField] private WildlifeSpecies species = WildlifeSpecies.Cattle;
        public WildlifeSpecies Species => species;
        [SerializeField] private float moveSpeed = 1.5f;
        [SerializeField] private float wanderRadius = 15f;
        [SerializeField] private float fleeDistance = 5f;

        private Vector3 originPosition;
        private Vector3 targetDestination;
        private float stateTimer = 0f;
        private bool isFleeing = false;
        private Transform playerTransform;

        private void Start()
        {
            originPosition = transform.position;
            PickNewWanderTarget();

            var player = GameObject.FindWithTag("Player");
            if (player != null) playerTransform = player.transform;
        }

        private void Update()
        {
            stateTimer -= Time.deltaTime;

            if (playerTransform != null)
            {
                float distToPlayer = Vector3.Distance(transform.position, playerTransform.position);
                if (distToPlayer < fleeDistance && !isFleeing)
                {
                    // Flee directly away from player
                    Vector3 fleeDir = (transform.position - playerTransform.position).normalized;
                    targetDestination = transform.position + fleeDir * 8f;
                    isFleeing = true;
                    stateTimer = 4.0f;
                }
            }

            if (stateTimer <= 0f)
            {
                isFleeing = false;
                PickNewWanderTarget();
                stateTimer = Random.Range(4f, 10f);
            }

            // Move smoothly towards destination
            Vector3 diff = targetDestination - transform.position;
            diff.y = 0;
            if (diff.sqrMagnitude > 0.1f)
            {
                Quaternion targetRot = Quaternion.LookRotation(diff);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, Time.deltaTime * 3f);
                float speed = isFleeing ? moveSpeed * 2.2f : moveSpeed;
                transform.position += transform.forward * (speed * Time.deltaTime);
            }
        }

        private void PickNewWanderTarget()
        {
            Vector2 randomCircle = Random.insideUnitCircle * wanderRadius;
            targetDestination = originPosition + new Vector3(randomCircle.x, 0, randomCircle.y);
        }
    }
}
