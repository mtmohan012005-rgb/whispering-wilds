using System;
using UnityEngine;
using UnityEngine.AI;
using WhisperingWilds.World;

namespace WhisperingWilds.Wildlife
{
    public enum WildlifeBehaviorState
    {
        Idle,
        Wander,
        Walk,
        Run,
        Graze,
        Feed,
        Drink,
        Rest,
        Sleep,
        LookAround,
        Flee,
        FollowGroup,
        SearchForWater,
        SearchForFood
    }

    public enum WildlifeLODTier
    {
        Tier0_NearFull,   // < 35m: Full updates, dynamic obstacle avoidance, active look-at
        Tier1_Medium,     // 35m - 75m: Lower tick rate (0.4s), simpler navigation
        Tier2_FarLowCost, // 75m - 150m: Rare tick rate (1.2s), low simulation cost
        Tier3_Culled      // > 150m: Hidden, simulated logically by WildlifeManager
    }

    /// <summary>
    /// Autonomous animal simulation entity implementing authentic Tamil Nadu wildlife behaviors,
    /// species-specific daily routines, seasonal adaptations, herd cohesion, and distance performance tiers.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeEntity : MonoBehaviour
    {
        [Header("Species & Habitat Assignment")]
        [SerializeField] private WildlifeSpecies species = WildlifeSpecies.NilgiriTahr;
        [SerializeField] private WildlifeHabitatZone assignedHabitat;
        [SerializeField] private WildlifeGroup assignedGroup;

        [Header("Active AI State")]
        [SerializeField] private WildlifeBehaviorState currentState = WildlifeBehaviorState.Idle;
        [SerializeField] private WildlifeLODTier currentTier = WildlifeLODTier.Tier0_NearFull;
        [SerializeField] private float stateTimer = 3.0f;
        [SerializeField] private Vector3 currentDestination;

        [Header("Navigation")]
        [SerializeField] private NavMeshAgent navAgent;
        [SerializeField] private float moveSpeedMultiplier = 1.0f;

        // Runtime profile
        public SpeciesProfile Profile { get; private set; }
        public WildlifeSpecies Species => species;
        public WildlifeBehaviorState CurrentState => currentState;
        public WildlifeLODTier CurrentTier => currentTier;
        public WildlifeHabitatZone AssignedHabitat => assignedHabitat;

        // Internal state
        private Transform playerTransform;
        private float distanceToPlayer = 999f;
        private float updateInterval = 0.1f;
        private float updateTimer = 0f;
        private Vector3 spawnPosition;
        private Animator animator;

        private void Awake()
        {
            spawnPosition = transform.position;
            Profile = WildlifeSpeciesCatalog.GetProfile(species);
            navAgent = GetComponent<NavMeshAgent>();
            animator = GetComponentInChildren<Animator>();

            if (navAgent != null)
            {
                navAgent.speed = Profile.baseWalkSpeed;
                navAgent.stoppingDistance = 0.5f;
                navAgent.acceleration = 6.0f;
            }
        }

        private void Start()
        {
            LocatePlayer();
            AcquireHabitatIfMissing();

            if (assignedGroup != null)
            {
                assignedGroup.RegisterMember(this);
            }

            PickNextBehaviorAccordingToSchedule();
        }

        private void OnDestroy()
        {
            if (assignedGroup != null)
            {
                assignedGroup.UnregisterMember(this);
            }
        }

        public void Initialize(WildlifeSpecies targetSpecies, WildlifeHabitatZone habitat, WildlifeGroup group = null)
        {
            species = targetSpecies;
            assignedHabitat = habitat;
            assignedGroup = group;
            Profile = WildlifeSpeciesCatalog.GetProfile(species);

            if (assignedGroup != null)
            {
                assignedGroup.RegisterMember(this);
            }
        }

        private void LocatePlayer()
        {
            var p = GameObject.FindWithTag("Player");
            if (p != null) playerTransform = p.transform;
        }

        private void AcquireHabitatIfMissing()
        {
            if (assignedHabitat == null)
            {
                var habitats = FindObjectsByType<WildlifeHabitatZone>();
                foreach (var h in habitats)
                {
                    if (h.IsPositionInside(transform.position) && h.IsSpeciesAllowed(species))
                    {
                        assignedHabitat = h;
                        break;
                    }
                }
            }
        }

        private void Update()
        {
            // Evaluate Distance to Player & Performance Tier
            if (playerTransform == null) LocatePlayer();
            if (playerTransform != null)
            {
                distanceToPlayer = Vector3.Distance(transform.position, playerTransform.position);
            }

            EvaluatePerformanceTier();

            if (currentTier == WildlifeLODTier.Tier3_Culled) return;

            // Throttled AI evaluation tick based on LOD tier
            updateTimer += Time.deltaTime;
            if (updateTimer >= updateInterval)
            {
                updateTimer = 0f;
                EvaluateAITick();
            }

            // Continuous movement execution
            ExecuteMovementStep();
        }

        private void EvaluatePerformanceTier()
        {
            if (distanceToPlayer < 35f)
            {
                currentTier = WildlifeLODTier.Tier0_NearFull;
                updateInterval = 0.1f;
            }
            else if (distanceToPlayer < 75f)
            {
                currentTier = WildlifeLODTier.Tier1_Medium;
                updateInterval = 0.35f;
            }
            else if (distanceToPlayer < 150f)
            {
                currentTier = WildlifeLODTier.Tier2_FarLowCost;
                updateInterval = 1.0f;
            }
            else
            {
                currentTier = WildlifeLODTier.Tier3_Culled;
            }
        }

        private void EvaluateAITick()
        {
            stateTimer -= updateInterval;

            // 1. Reactive Player Proximity Check
            if (playerTransform != null && currentState != WildlifeBehaviorState.Flee)
            {
                if (distanceToPlayer < Profile.fleeDistance)
                {
                    TriggerFlee(playerTransform.position);
                    return;
                }
                else if (distanceToPlayer < Profile.noticeDistance && currentState != WildlifeBehaviorState.LookAround)
                {
                    // Curious or cautious pause
                    LookAtSource(playerTransform.position);
                    return;
                }
            }

            // 2. State expiration transition
            if (stateTimer <= 0f)
            {
                PickNextBehaviorAccordingToSchedule();
            }
        }

        private void ExecuteMovementStep()
        {
            if (currentState == WildlifeBehaviorState.Idle || 
                currentState == WildlifeBehaviorState.Rest || 
                currentState == WildlifeBehaviorState.Sleep)
            {
                if (navAgent != null && navAgent.isOnNavMesh && navAgent.hasPath)
                {
                    navAgent.ResetPath();
                }
                return;
            }

            if (navAgent != null && navAgent.isOnNavMesh)
            {
                float targetSpeed = (currentState == WildlifeBehaviorState.Run || currentState == WildlifeBehaviorState.Flee) 
                    ? Profile.baseRunSpeed 
                    : Profile.baseWalkSpeed;

                navAgent.speed = targetSpeed * moveSpeedMultiplier;
                if (!navAgent.hasPath || Vector3.Distance(navAgent.destination, currentDestination) > 1.5f)
                {
                    navAgent.SetDestination(currentDestination);
                }
            }
            else
            {
                // Fallback direct movement if NavMesh is absent in test scenes
                Vector3 toDest = currentDestination - transform.position;
                toDest.y = 0;
                if (toDest.sqrMagnitude > 0.2f)
                {
                    Quaternion rot = Quaternion.LookRotation(toDest);
                    transform.rotation = Quaternion.Slerp(transform.rotation, rot, Time.deltaTime * 4f);
                    float spd = (currentState == WildlifeBehaviorState.Run || currentState == WildlifeBehaviorState.Flee)
                        ? Profile.baseRunSpeed
                        : Profile.baseWalkSpeed;
                    transform.position += transform.forward * (spd * Time.deltaTime);
                }
            }
        }

        public void TriggerFlee(Vector3 dangerSource)
        {
            currentState = WildlifeBehaviorState.Flee;
            stateTimer = UnityEngine.Random.Range(4.0f, 7.0f);

            Vector3 fleeDirection = (transform.position - dangerSource).normalized;
            Vector3 rawTarget = transform.position + (fleeDirection * UnityEngine.Random.Range(18f, 30f));

            currentDestination = ClampToHabitat(rawTarget);

            if (assignedGroup != null && assignedGroup.Leader == this)
            {
                assignedGroup.NotifyGroupFlee(dangerSource);
            }
        }

        public void LookAtSource(Vector3 lookTarget)
        {
            currentState = WildlifeBehaviorState.LookAround;
            stateTimer = UnityEngine.Random.Range(2.0f, 4.0f);
            Vector3 lookDir = (lookTarget - transform.position).normalized;
            lookDir.y = 0;
            if (lookDir.sqrMagnitude > 0.01f)
            {
                transform.rotation = Quaternion.LookRotation(lookDir);
            }
        }

        private void PickNextBehaviorAccordingToSchedule()
        {
            DayPhase phase = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentDayPhase : DayPhase.Morning;
            TamilNaduSeason season = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentSeason : TamilNaduSeason.NortheastMonsoon;
            float hour = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.HourOfDay : 10f;

            // 1. Night Behavior (Sleep unless nocturnal)
            if (phase == DayPhase.Night || phase == DayPhase.LateNight)
            {
                if (!Profile.isNocturnal)
                {
                    currentState = WildlifeBehaviorState.Sleep;
                    stateTimer = UnityEngine.Random.Range(10f, 25f);
                    currentDestination = assignedHabitat != null ? assignedHabitat.GetRestingPoint() : transform.position;
                    return;
                }
            }

            // 2. Hot Summer Midday (Seek Shade and Rest)
            if (season == TamilNaduSeason.Summer && (hour >= 11.5f && hour <= 15.5f))
            {
                if (UnityEngine.Random.value < 0.7f)
                {
                    currentState = WildlifeBehaviorState.Rest;
                    stateTimer = UnityEngine.Random.Range(8f, 18f);
                    currentDestination = assignedHabitat != null ? assignedHabitat.GetRestingPoint() : transform.position;
                    return;
                }
                else
                {
                    SeekWaterSource();
                    return;
                }
            }

            // 3. Early Morning / Afternoon (Feeding & Movement)
            float roll = UnityEngine.Random.value;
            if (roll < 0.40f)
            {
                SeekFoodSource();
            }
            else if (roll < 0.65f)
            {
                SeekWaterSource();
            }
            else if (roll < 0.85f)
            {
                WanderWithinHabitat();
            }
            else
            {
                currentState = WildlifeBehaviorState.Idle;
                stateTimer = UnityEngine.Random.Range(3f, 6f);
            }
        }

        private void SeekFoodSource()
        {
            currentState = WildlifeBehaviorState.Feed;
            stateTimer = Profile.feedingDuration + UnityEngine.Random.Range(-2f, 3f);

            if (assignedHabitat != null)
            {
                var food = assignedHabitat.GetBestFoodSource(Profile.diet);
                if (food != null)
                {
                    currentDestination = food.GetFeedPosition();
                    return;
                }
            }

            WanderWithinHabitat();
        }

        private void SeekWaterSource()
        {
            currentState = WildlifeBehaviorState.Drink;
            stateTimer = Profile.waterDrinkDuration + UnityEngine.Random.Range(-1f, 2f);

            if (assignedHabitat != null)
            {
                var water = assignedHabitat.GetBestWaterSource();
                if (water != null)
                {
                    currentDestination = water.GetDrinkPosition();
                    return;
                }
            }

            WanderWithinHabitat();
        }

        private void WanderWithinHabitat()
        {
            currentState = WildlifeBehaviorState.Wander;
            stateTimer = UnityEngine.Random.Range(5f, 10f);

            if (assignedGroup != null && assignedGroup.Leader != null && assignedGroup.Leader != this)
            {
                currentDestination = assignedGroup.GetFlockOffset(this, assignedGroup.Leader.currentDestination);
            }
            else if (assignedHabitat != null)
            {
                currentDestination = assignedHabitat.SampleRandomRoamingPoint();
            }
            else
            {
                Vector2 circle = UnityEngine.Random.insideUnitCircle * 15f;
                currentDestination = spawnPosition + new Vector3(circle.x, 0f, circle.y);
            }
        }

        private Vector3 ClampToHabitat(Vector3 target)
        {
            if (assignedHabitat != null)
            {
                Bounds b = assignedHabitat.WorldBounds;
                target.x = Mathf.Clamp(target.x, b.min.x, b.max.x);
                target.z = Mathf.Clamp(target.z, b.min.z, b.max.z);
            }
            return target;
        }
    }
}
