using System;
using UnityEngine;
using UnityEngine.AI;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// Production-grade NPC navigation controller implementing strict NavMesh destination validation,
    /// obstacle avoidance, stuck detection and recovery, rate-limited path recalculations,
    /// scene boundary containment, and safe failure when NavMesh is missing without console spam.
    /// Never uses direct transform teleportation for ordinary movement.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCNavigationController : MonoBehaviour
    {
        [Header("Agent Configuration")]
        [SerializeField] private float walkSpeed = 1.6f;
        [SerializeField] private float runSpeed = 3.8f;
        [SerializeField] private float stoppingDistance = 0.8f;
        [SerializeField] private float maxNavMeshSampleDistance = 5.0f;

        [Header("Safety & Boundaries")]
        [SerializeField] private Bounds sceneGameplayBounds = new Bounds(Vector3.zero, new Vector3(300f, 60f, 300f));
        [SerializeField] private bool enforceSceneBounds = true;

        [Header("Stuck Detection & Recovery")]
        [SerializeField] private float stuckCheckInterval = 2.5f;
        [SerializeField] private float minimumMovementThreshold = 0.15f;
        [SerializeField] private int maxStuckAttemptsBeforeRecovery = 2;

        [Header("Path Rate Limiting")]
        [SerializeField] private float pathRecalculationCooldown = 0.5f;

        // Components
        private NavMeshAgent agent;
        private Animator animator;

        // Navigation state
        private Vector3 currentDestination;
        private bool hasActiveDestination = false;
        private float lastPathRequestTime = -99f;
        private float stuckTimer = 0f;
        private Vector3 lastRecordedPosition;
        private int consecutiveStuckCount = 0;
        private bool isRecoveringFromStuck = false;

        // Static warning tracker to prevent console spam across multiple NPCs
        private static bool s_loggedNavMeshMissingWarning = false;

        // Events
        public event Action OnDestinationReached;
        public event Action OnStuckRecovered;
        public event Action<Vector3> OnPathFailed;

        // Public properties
        public bool IsMoving => hasActiveDestination && agent != null && agent.isOnNavMesh && !agent.isStopped && agent.remainingDistance > agent.stoppingDistance;
        public float RemainingDistance => (agent != null && agent.isOnNavMesh) ? agent.remainingDistance : Vector3.Distance(transform.position, currentDestination);
        public Vector3 CurrentDestination => currentDestination;
        public bool HasValidNavMesh => agent != null && agent.isOnNavMesh;
        public int ConsecutiveStuckCount => consecutiveStuckCount;

        private void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            animator = GetComponentInChildren<Animator>();

            lastRecordedPosition = transform.position;
        }

        private void Start()
        {
            // A NavMeshAgent attached to a serialized scene object is constructed during scene
            // activation, BEFORE the scene's NavMeshSceneLink registers the baked NavMeshData
            // (link registration also happens in Awake). Agents created that early fail
            // permanently: "Failed to create agent because there is no valid NavMesh". Region
            // scenes therefore no longer serialize agents at all; the controller creates one
            // here, in Start, which always runs after every Awake has completed, so the baked
            // NavMeshData is already registered by the time the agent is built.
            if (agent == null)
            {
                agent = gameObject.AddComponent<NavMeshAgent>();
            }
            ConfigureAgent();

            ValidateNavMeshStatusOnStart();
        }

        private void ConfigureAgent()
        {
            if (agent == null) return;

            agent.speed = walkSpeed;
            agent.stoppingDistance = stoppingDistance;
            agent.acceleration = 6.0f;
            agent.autoBraking = true;
            agent.obstacleAvoidanceType = ObstacleAvoidanceType.HighQualityObstacleAvoidance;
        }

        private void ValidateNavMeshStatusOnStart()
        {
            if (agent == null) return;

            if (!agent.isOnNavMesh)
            {
                // Attempt to place agent onto nearest NavMesh within reasonable sample radius
                if (NavMesh.SamplePosition(transform.position, out NavMeshHit hit, maxNavMeshSampleDistance, NavMesh.AllAreas))
                {
                    agent.Warp(hit.position);
                }
                else if (!s_loggedNavMeshMissingWarning)
                {
                    s_loggedNavMeshMissingWarning = true;
                    Debug.LogWarning($"<color=#FFAA00><b>[NPCNavigation]</b></color> Scene '{gameObject.scene.name}' does not have a baked NavMesh at {transform.position}. NPCs will operate in safe stationary fallback mode without console spam.");
                }
            }
        }

        /// <summary>
        /// Validates, bounds-checks, and initiates movement toward target destination.
        /// Guaranteed zero transform teleportation.
        /// </summary>
        public bool SetDestination(Vector3 targetPosition, bool isRunning = false)
        {
            // 1. Rate-limit path recalculations
            if (Time.time - lastPathRequestTime < pathRecalculationCooldown && hasActiveDestination)
            {
                if (Vector3.Distance(targetPosition, currentDestination) < 1.0f)
                {
                    return true;
                }
            }
            lastPathRequestTime = Time.time;

            // 2. Enforce gameplay boundaries
            if (enforceSceneBounds)
            {
                targetPosition = ClampToSceneBounds(targetPosition);
            }

            // 3. Check NavMesh availability
            if (agent == null || !agent.isOnNavMesh)
            {
                // Safe failure: Hold position, do not teleport
                hasActiveDestination = false;
                OnPathFailed?.Invoke(targetPosition);
                return false;
            }

            // 4. Validate destination with NavMesh.SamplePosition
            if (!NavMesh.SamplePosition(targetPosition, out NavMeshHit hit, maxNavMeshSampleDistance, NavMesh.AllAreas))
            {
                OnPathFailed?.Invoke(targetPosition);
                return false;
            }

            // 5. Calculate path to ensure reachability (avoid walking through walls or unreachable targets)
            NavMeshPath path = new NavMeshPath();
            if (!agent.CalculatePath(hit.position, path) || path.status == NavMeshPathStatus.PathInvalid)
            {
                OnPathFailed?.Invoke(targetPosition);
                return false;
            }

            // Set destination and configure speed
            currentDestination = hit.position;
            agent.speed = isRunning ? runSpeed : walkSpeed;
            agent.isStopped = false;
            agent.SetPath(path);

            hasActiveDestination = true;
            stuckTimer = 0f;
            lastRecordedPosition = transform.position;

            return true;
        }

        public void StopNavigation()
        {
            hasActiveDestination = false;
            if (agent != null && agent.isOnNavMesh)
            {
                agent.isStopped = true;
                agent.ResetPath();
            }
        }

        /// <summary>
        /// Central update tick called by NPCCharacter / PerformanceTierManager.
        /// </summary>
        public void TickNavigation(float dt)
        {
            if (!hasActiveDestination || agent == null || !agent.isOnNavMesh)
            {
                return;
            }

            // 1. Check destination arrival
            if (!agent.pathPending && agent.remainingDistance <= agent.stoppingDistance)
            {
                hasActiveDestination = false;
                agent.isStopped = true;
                consecutiveStuckCount = 0;
                isRecoveringFromStuck = false;
                OnDestinationReached?.Invoke();
                return;
            }

            // 2. Stuck Detection & Recovery
            stuckTimer += dt;
            if (stuckTimer >= stuckCheckInterval)
            {
                float movedDist = Vector3.Distance(transform.position, lastRecordedPosition);
                if (movedDist < minimumMovementThreshold && agent.remainingDistance > agent.stoppingDistance * 1.5f)
                {
                    HandleStuckState();
                }
                else
                {
                    consecutiveStuckCount = 0;
                    isRecoveringFromStuck = false;
                }

                lastRecordedPosition = transform.position;
                stuckTimer = 0f;
            }
        }

        private void HandleStuckState()
        {
            consecutiveStuckCount++;

            if (consecutiveStuckCount >= maxStuckAttemptsBeforeRecovery)
            {
                // Recovery: Sample a nearby valid NavMesh clearance point away from obstacles
                Vector3 randomOffset = UnityEngine.Random.insideUnitSphere * 3.0f;
                randomOffset.y = 0;
                Vector3 recoveryCandidate = transform.position + randomOffset;

                if (NavMesh.SamplePosition(recoveryCandidate, out NavMeshHit hit, 4.0f, NavMesh.AllAreas))
                {
                    agent.isStopped = false;
                    agent.SetDestination(hit.position);
                    isRecoveringFromStuck = true;
                    consecutiveStuckCount = 0;
                    OnStuckRecovered?.Invoke();
                }
                else
                {
                    // Fallback: stop gracefully at current spot to avoid jitter
                    StopNavigation();
                    OnDestinationReached?.Invoke();
                }
            }
            else
            {
                // Re-sample current destination to kick the pathfinder
                if (NavMesh.SamplePosition(currentDestination, out NavMeshHit hit, maxNavMeshSampleDistance, NavMesh.AllAreas))
                {
                    agent.SetDestination(hit.position);
                }
            }
        }

        private Vector3 ClampToSceneBounds(Vector3 target)
        {
            target.x = Mathf.Clamp(target.x, sceneGameplayBounds.min.x, sceneGameplayBounds.max.x);
            target.y = Mathf.Clamp(target.y, sceneGameplayBounds.min.y, sceneGameplayBounds.max.y);
            target.z = Mathf.Clamp(target.z, sceneGameplayBounds.min.z, sceneGameplayBounds.max.z);
            return target;
        }

        public void SetSceneGameplayBounds(Bounds bounds)
        {
            sceneGameplayBounds = bounds;
            enforceSceneBounds = true;
        }
    }
}
