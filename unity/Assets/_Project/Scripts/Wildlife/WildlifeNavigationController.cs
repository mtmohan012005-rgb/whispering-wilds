using System;
using UnityEngine;
using UnityEngine.AI;

namespace WhisperingWilds.Wildlife
{
    public enum NavigationMode
    {
        GroundNavMesh,
        AvianFlight,
        ClimbingPerch
    }

    /// <summary>
    /// Dual-mode wildlife navigation controller supporting ground NavMesh traversal,
    /// 3D avian flight/glide pathing with altitude clamping, obstacle avoidance,
    /// habitat boundary enforcement, and stuck recovery.
    /// Never teleports entities during ordinary movement.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeNavigationController : MonoBehaviour
    {
        [Header("Mode & Speeds")]
        [SerializeField] private NavigationMode navMode = NavigationMode.GroundNavMesh;
        [SerializeField] private float walkSpeed = 1.6f;
        [SerializeField] private float runSpeed = 4.5f;
        [SerializeField] private float flySpeed = 7.5f;

        [Header("Avian Flight Dynamics")]
        [SerializeField] private float minFlightAltitude = 3.0f;
        [SerializeField] private float maxFlightAltitude = 12.0f;
        [SerializeField] private float flightTurnRate = 3.5f;
        [SerializeField] private float climbDescentRate = 2.5f;

        [Header("Stuck Detection")]
        [SerializeField] private float stuckCheckInterval = 2.5f;
        [SerializeField] private float minimumMovementThreshold = 0.15f;

        // Components
        private NavMeshAgent navAgent;
        private WildlifeHabitatZone habitatZone;

        // Movement state
        private Vector3 currentDestination;
        private bool hasDestination = false;
        private float stuckTimer = 0f;
        private Vector3 lastPosition;
        private int stuckRecoveryAttempts = 0;
        private bool isAirborne = false;

        // Events
        public event Action OnDestinationReached;
        public event Action OnStuckRecovered;

        public NavigationMode Mode => navMode;
        public bool IsMoving => hasDestination && Vector3.Distance(transform.position, currentDestination) > 0.8f;
        public bool IsAirborne => isAirborne;
        public Vector3 CurrentDestination => currentDestination;

        private void Awake()
        {
            navAgent = GetComponent<NavMeshAgent>();
            lastPosition = transform.position;

            if (navAgent != null)
            {
                navAgent.speed = walkSpeed;
                navAgent.stoppingDistance = 0.6f;
                navAgent.acceleration = 6.0f;
                navAgent.obstacleAvoidanceType = ObstacleAvoidanceType.LowQualityObstacleAvoidance;
            }
        }

        public void Initialize(SpeciesProfile profile, WildlifeHabitatZone habitat)
        {
            habitatZone = habitat;
            walkSpeed = profile.baseWalkSpeed;
            runSpeed = profile.baseRunSpeed;
            flySpeed = profile.baseFlySpeed;
            minFlightAltitude = profile.flightAltitudeMin;
            maxFlightAltitude = profile.flightAltitudeMax;

            if (profile.canFly)
            {
                navMode = NavigationMode.AvianFlight;
                if (navAgent != null)
                {
                    // Disable agent when in flight mode to prevent ground locking
                    navAgent.enabled = false;
                }
            }
            else
            {
                navMode = NavigationMode.GroundNavMesh;
                if (navAgent != null)
                {
                    navAgent.enabled = true;
                    navAgent.speed = walkSpeed;
                }
            }
        }

        public bool SetDestination(Vector3 targetPos, bool isRunning = false)
        {
            // Clamp target to habitat zone boundaries
            if (habitatZone != null)
            {
                targetPos = habitatZone.ClampToZone(targetPos);
            }

            currentDestination = targetPos;
            hasDestination = true;
            stuckTimer = 0f;
            lastPosition = transform.position;

            if (navMode == NavigationMode.GroundNavMesh)
            {
                if (navAgent != null && navAgent.isActiveAndEnabled && navAgent.isOnNavMesh)
                {
                    float speed = isRunning ? runSpeed : walkSpeed;
                    navAgent.speed = speed;
                    navAgent.isStopped = false;

                    // Validate destination on NavMesh
                    if (NavMesh.SamplePosition(targetPos, out NavMeshHit hit, 4.0f, NavMesh.AllAreas))
                    {
                        navAgent.SetDestination(hit.position);
                        currentDestination = hit.position;
                        return true;
                    }
                }
                // Fallback: ground movement without NavMesh
                return true;
            }
            else if (navMode == NavigationMode.AvianFlight)
            {
                // Avian flight destination: ensure safe flight altitude above terrain
                float groundY = SampleGroundHeight(targetPos);
                targetPos.y = groundY + UnityEngine.Random.Range(minFlightAltitude, maxFlightAltitude);
                currentDestination = targetPos;
                isAirborne = true;
                return true;
            }

            return false;
        }

        public void TakeOff()
        {
            if (navMode == NavigationMode.AvianFlight)
            {
                isAirborne = true;
                if (navAgent != null && navAgent.enabled)
                {
                    navAgent.enabled = false;
                }
                // Ascend
                currentDestination = transform.position + (Vector3.up * minFlightAltitude) + (transform.forward * 8f);
                hasDestination = true;
            }
        }

        public void LandAt(Vector3 groundTarget)
        {
            if (habitatZone != null)
            {
                groundTarget = habitatZone.ClampToZone(groundTarget);
            }
            float groundY = SampleGroundHeight(groundTarget);
            groundTarget.y = groundY;
            currentDestination = groundTarget;
            hasDestination = true;
        }

        public void Stop()
        {
            hasDestination = false;
            if (navAgent != null && navAgent.isActiveAndEnabled && navAgent.isOnNavMesh)
            {
                navAgent.isStopped = true;
                navAgent.ResetPath();
            }
        }

        public void TickNavigation(float dt)
        {
            if (!hasDestination) return;

            if (navMode == NavigationMode.GroundNavMesh)
            {
                TickGroundMovement(dt);
            }
            else if (navMode == NavigationMode.AvianFlight)
            {
                TickAvianFlight(dt);
            }

            // Boundary containment check
            EnforceHabitatContainment();
        }

        private void TickGroundMovement(float dt)
        {
            float dist = Vector3.Distance(transform.position, currentDestination);

            if (navAgent != null && navAgent.isActiveAndEnabled && navAgent.isOnNavMesh)
            {
                if (!navAgent.pathPending && navAgent.remainingDistance <= navAgent.stoppingDistance)
                {
                    hasDestination = false;
                    navAgent.isStopped = true;
                    stuckRecoveryAttempts = 0;
                    OnDestinationReached?.Invoke();
                    return;
                }
            }
            else
            {
                // Smooth forward progression toward destination adhering to terrain height
                Vector3 toDest = currentDestination - transform.position;
                toDest.y = 0f;

                if (toDest.sqrMagnitude > 0.3f)
                {
                    Quaternion targetRot = Quaternion.LookRotation(toDest.normalized);
                    transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, dt * 4.0f);
                    transform.position += transform.forward * (walkSpeed * dt);

                    // Clamp to ground surface
                    float groundY = SampleGroundHeight(transform.position);
                    transform.position = new Vector3(transform.position.x, groundY, transform.position.z);
                }
                else
                {
                    hasDestination = false;
                    stuckRecoveryAttempts = 0;
                    OnDestinationReached?.Invoke();
                    return;
                }
            }

            // Stuck detection
            stuckTimer += dt;
            if (stuckTimer >= stuckCheckInterval)
            {
                float movedDist = Vector3.Distance(transform.position, lastPosition);
                if (movedDist < minimumMovementThreshold)
                {
                    HandleStuckRecovery();
                }
                else
                {
                    stuckRecoveryAttempts = 0;
                }
                lastPosition = transform.position;
                stuckTimer = 0f;
            }
        }

        private void TickAvianFlight(float dt)
        {
            Vector3 toDest = currentDestination - transform.position;
            float dist = toDest.magnitude;

            if (dist <= 1.2f)
            {
                hasDestination = false;
                // If landed near ground, switch out of airborne
                float groundY = SampleGroundHeight(transform.position);
                if (transform.position.y - groundY < 0.8f)
                {
                    isAirborne = false;
                }
                OnDestinationReached?.Invoke();
                return;
            }

            // Steer toward 3D destination
            Quaternion targetRot = Quaternion.LookRotation(toDest.normalized);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, dt * flightTurnRate);

            // Forward flight speed
            transform.position += transform.forward * (flySpeed * dt);

            // Ground clearance safeguard: ensure bird never clips below terrain
            float terrainY = SampleGroundHeight(transform.position);
            if (isAirborne && transform.position.y < terrainY + 1.0f)
            {
                transform.position = new Vector3(transform.position.x, terrainY + 1.0f, transform.position.z);
            }
        }

        private void HandleStuckRecovery()
        {
            stuckRecoveryAttempts++;

            if (habitatZone != null)
            {
                Vector3 newPoint = habitatZone.SampleRandomRoamingPoint();
                SetDestination(newPoint);
            }
            else
            {
                Vector2 circle = UnityEngine.Random.insideUnitCircle * 8f;
                Vector3 newPoint = transform.position + new Vector3(circle.x, 0f, circle.y);
                SetDestination(newPoint);
            }

            OnStuckRecovered?.Invoke();
        }

        private void EnforceHabitatContainment()
        {
            if (habitatZone != null && !habitatZone.IsPositionInside(transform.position))
            {
                // Outside boundary! Turn back toward habitat center
                Vector3 center = habitatZone.WorldBounds.center;
                SetDestination(center, isRunning: true);
            }
        }

        private float SampleGroundHeight(Vector3 pos)
        {
            if (Physics.Raycast(new Vector3(pos.x, pos.y + 20f, pos.z), Vector3.down, out RaycastHit hit, 50f))
            {
                return hit.point.y;
            }
            return pos.y;
        }
    }
}
