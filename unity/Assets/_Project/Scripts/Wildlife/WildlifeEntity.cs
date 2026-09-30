using System;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Wildlife
{
    public enum WildlifeBehaviorState
    {
        Idle,
        Forage,
        Graze,
        Drink,
        Observe,
        Alert,
        Flee,
        ReturnToHabitat,
        Rest,
        Sleep,
        GroupMove,
        Defend,
        Fly,
        Land,
        Climb
    }

    public enum WildlifeLODTier
    {
        Tier0_NearFull,   // < 35m: Full updates, dynamic obstacle avoidance, reactive look-at
        Tier1_Medium,     // 35m - 75m: Lower tick rate (0.4s), simpler navigation
        Tier2_FarLowCost, // 75m - 150m: Rare tick rate (1.2s), low simulation cost
        Tier3_Culled      // > 150m: Hidden, simulated logically by WildlifeManager
    }

    /// <summary>
    /// Autonomous animal simulation entity implementing authentic Tamil Nadu wildlife behaviors,
    /// species-specific daily routines, herd cohesion, player proximity reactions,
    /// and distance performance tiers.
    /// Completely eliminates direct transform teleportation for ordinary movement.
    /// </summary>
    [RequireComponent(typeof(WildlifeNavigationController))]
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

        // Subsystems
        private WildlifeNavigationController navController;
        private Animator animator;

        // Runtime profile
        public SpeciesProfile Profile { get; private set; }
        public WildlifeSpecies Species => species;
        public WildlifeBehaviorState CurrentState => currentState;
        public WildlifeLODTier CurrentTier => currentTier;
        public WildlifeHabitatZone AssignedHabitat => assignedHabitat;
        public WildlifeNavigationController NavController => navController;

        // Internal state
        private Transform playerTransform;
        private float distanceToPlayer = 999f;
        private float updateInterval = 0.1f;
        private float updateTimer = 0f;
        private Vector3 spawnPosition;

        // Hysteresis buffers for LOD switching
        private const float LOD_HYSTERESIS = 5.0f;

        private void Awake()
        {
            spawnPosition = transform.position;
            Profile = WildlifeSpeciesCatalog.GetProfile(species);
            navController = GetComponent<WildlifeNavigationController>();
            animator = GetComponentInChildren<Animator>();

            if (navController != null)
            {
                navController.Initialize(Profile, assignedHabitat);
                navController.OnDestinationReached += HandleDestinationReached;
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
            if (navController != null)
            {
                navController.OnDestinationReached -= HandleDestinationReached;
            }
        }

        public void Initialize(WildlifeSpecies targetSpecies, WildlifeHabitatZone habitat, WildlifeGroup group = null)
        {
            species = targetSpecies;
            assignedHabitat = habitat;
            assignedGroup = group;
            Profile = WildlifeSpeciesCatalog.GetProfile(species);

            if (navController != null)
            {
                navController.Initialize(Profile, assignedHabitat);
            }

            if (assignedGroup != null)
            {
                assignedGroup.RegisterMember(this);
            }

            TransitionToState(WildlifeBehaviorState.Idle);
            PickNextBehaviorAccordingToSchedule();
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
                    if (h != null && h.IsPositionInside(transform.position) && h.IsSpeciesAllowed(species))
                    {
                        assignedHabitat = h;
                        break;
                    }
                }
            }
        }

        private void Update()
        {
            float dt = Time.deltaTime;

            // 1. Evaluate Distance to Player & Performance Tier with Hysteresis
            if (playerTransform == null) LocatePlayer();
            if (playerTransform != null)
            {
                distanceToPlayer = Vector3.Distance(transform.position, playerTransform.position);
            }

            EvaluatePerformanceTier();

            if (currentTier == WildlifeLODTier.Tier3_Culled) return;

            // 2. Throttled AI evaluation tick based on LOD tier
            updateTimer += dt;
            if (updateTimer >= updateInterval)
            {
                updateTimer = 0f;
                EvaluateAITick();
            }

            // 3. Movement execution tick via navController
            if (navController != null)
            {
                navController.TickNavigation(dt);
            }
        }

        private void EvaluatePerformanceTier()
        {
            switch (currentTier)
            {
                case WildlifeLODTier.Tier0_NearFull:
                    if (distanceToPlayer > 35f + LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier1_Medium, 0.4f);
                    break;

                case WildlifeLODTier.Tier1_Medium:
                    if (distanceToPlayer < 35f - LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier0_NearFull, 0.1f);
                    else if (distanceToPlayer > 75f + LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier2_FarLowCost, 1.2f);
                    break;

                case WildlifeLODTier.Tier2_FarLowCost:
                    if (distanceToPlayer < 75f - LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier1_Medium, 0.4f);
                    else if (distanceToPlayer > 150f + LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier3_Culled, 5.0f);
                    break;

                case WildlifeLODTier.Tier3_Culled:
                    if (distanceToPlayer < 150f - LOD_HYSTERESIS)
                        SetTier(WildlifeLODTier.Tier2_FarLowCost, 1.2f);
                    break;
            }
        }

        private void SetTier(WildlifeLODTier tier, float interval)
        {
            currentTier = tier;
            updateInterval = interval;

            if (animator != null)
            {
                switch (tier)
                {
                    case WildlifeLODTier.Tier0_NearFull:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
                        break;
                    case WildlifeLODTier.Tier1_Medium:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.CullUpdateTransforms;
                        break;
                    case WildlifeLODTier.Tier2_FarLowCost:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.CullCompletely;
                        break;
                    case WildlifeLODTier.Tier3_Culled:
                        animator.enabled = false;
                        break;
                }
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
                    // Check if species defends instead of fleeing (e.g., Gaur / Elephant if cornered)
                    if ((species == WildlifeSpecies.IndianGaur || species == WildlifeSpecies.AsianElephant) && UnityEngine.Random.value < 0.4f)
                    {
                        TriggerDefend(playerTransform.position);
                    }
                    else
                    {
                        TriggerFlee(playerTransform.position);
                    }
                    return;
                }
                else if (distanceToPlayer < Profile.alertDistance && currentState != WildlifeBehaviorState.Alert && currentState != WildlifeBehaviorState.Observe)
                {
                    TriggerAlert(playerTransform.position);
                    return;
                }
                else if (distanceToPlayer < Profile.noticeDistance && currentState == WildlifeBehaviorState.Idle)
                {
                    TriggerObserve(playerTransform.position);
                    return;
                }
            }

            // 2. State expiration transition
            if (stateTimer <= 0f)
            {
                PickNextBehaviorAccordingToSchedule();
            }
        }

        private void HandleDestinationReached()
        {
            if (currentState == WildlifeBehaviorState.Flee || currentState == WildlifeBehaviorState.ReturnToHabitat)
            {
                TransitionToState(WildlifeBehaviorState.Observe);
                stateTimer = UnityEngine.Random.Range(3f, 6f);
            }
            else if (currentState == WildlifeBehaviorState.Fly)
            {
                TransitionToState(WildlifeBehaviorState.Land);
            }
        }

        public void TriggerFlee(Vector3 dangerSource)
        {
            TransitionToState(WildlifeBehaviorState.Flee);
            stateTimer = UnityEngine.Random.Range(4.0f, 8.0f);

            Vector3 fleeDirection = (transform.position - dangerSource).normalized;
            fleeDirection.y = 0;

            if (Profile.canFly)
            {
                // Avian takeoff and flight away
                if (navController != null)
                {
                    navController.TakeOff();
                }
                TransitionToState(WildlifeBehaviorState.Fly);
                return;
            }

            Vector3 rawTarget = transform.position + (fleeDirection * UnityEngine.Random.Range(18f, 32f));
            if (navController != null)
            {
                navController.SetDestination(rawTarget, isRunning: true);
            }

            // Group alert
            if (assignedGroup != null && assignedGroup.Leader == this)
            {
                assignedGroup.NotifyGroupFlee(dangerSource);
            }
        }

        public void TriggerAlert(Vector3 source)
        {
            TransitionToState(WildlifeBehaviorState.Alert);
            stateTimer = UnityEngine.Random.Range(2.5f, 4.5f);
            if (navController != null) navController.Stop();

            LookAtSource(source);
        }

        public void TriggerObserve(Vector3 source)
        {
            TransitionToState(WildlifeBehaviorState.Observe);
            stateTimer = UnityEngine.Random.Range(3.0f, 5.0f);
            if (navController != null) navController.Stop();

            LookAtSource(source);
        }

        public void TriggerDefend(Vector3 threatSource)
        {
            TransitionToState(WildlifeBehaviorState.Defend);
            stateTimer = UnityEngine.Random.Range(3.0f, 5.0f);
            if (navController != null) navController.Stop();

            LookAtSource(threatSource);
            if (animator != null) animator.SetTrigger("Defend");
        }

        public void LookAtSource(Vector3 lookTarget)
        {
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
                    TransitionToState(WildlifeBehaviorState.Sleep);
                    stateTimer = UnityEngine.Random.Range(12f, 25f);
                    Vector3 restPt = assignedHabitat != null ? assignedHabitat.GetRestingPoint() : transform.position;
                    if (navController != null) navController.SetDestination(restPt);
                    return;
                }
            }

            // 2. Hot Midday Summer: Seek Shade / Rest / Water
            if (season == TamilNaduSeason.Summer && (hour >= 11.5f && hour <= 15.0f))
            {
                if (UnityEngine.Random.value < 0.65f)
                {
                    TransitionToState(WildlifeBehaviorState.Rest);
                    stateTimer = UnityEngine.Random.Range(10f, 20f);
                    Vector3 restPt = assignedHabitat != null ? assignedHabitat.GetRestingPoint() : transform.position;
                    if (navController != null) navController.SetDestination(restPt);
                    return;
                }
                else
                {
                    SeekWaterSource();
                    return;
                }
            }

            // 3. Species-Specific Routine
            if (Profile.canFly && UnityEngine.Random.value < 0.45f)
            {
                // Avian flight transition
                TransitionToState(WildlifeBehaviorState.Fly);
                stateTimer = UnityEngine.Random.Range(6f, 12f);
                if (navController != null) navController.TakeOff();
                return;
            }

            // 4. Daytime Foraging, Grazing, Drinking, or Wandering
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
                TransitionToState(WildlifeBehaviorState.Idle);
                stateTimer = UnityEngine.Random.Range(4f, 8f);
                if (navController != null) navController.Stop();
            }
        }

        private void SeekFoodSource()
        {
            WildlifeBehaviorState feedState = (Profile.diet == WildlifeDietType.HerbivoreGrazer) 
                ? WildlifeBehaviorState.Graze 
                : WildlifeBehaviorState.Forage;

            TransitionToState(feedState);
            stateTimer = Profile.feedingDuration + UnityEngine.Random.Range(-1f, 3f);

            if (assignedHabitat != null)
            {
                var food = assignedHabitat.GetBestFoodSource(Profile.diet);
                if (food != null)
                {
                    if (navController != null) navController.SetDestination(food.GetFeedPosition());
                    return;
                }
            }

            WanderWithinHabitat();
        }

        private void SeekWaterSource()
        {
            TransitionToState(WildlifeBehaviorState.Drink);
            stateTimer = Profile.waterDrinkDuration + UnityEngine.Random.Range(-1f, 2f);

            if (assignedHabitat != null)
            {
                var water = assignedHabitat.GetBestWaterSource();
                if (water != null)
                {
                    if (navController != null) navController.SetDestination(water.GetDrinkPosition());
                    return;
                }
            }

            WanderWithinHabitat();
        }

        private void WanderWithinHabitat()
        {
            TransitionToState(WildlifeBehaviorState.GroupMove);
            stateTimer = UnityEngine.Random.Range(6f, 12f);

            if (assignedGroup != null && assignedGroup.Leader != null && assignedGroup.Leader != this)
            {
                Vector3 flockPos = assignedGroup.GetFlockOffset(this, assignedGroup.Leader.transform.position);
                if (navController != null) navController.SetDestination(flockPos);
            }
            else if (assignedHabitat != null)
            {
                Vector3 roamPoint = assignedHabitat.SampleRandomRoamingPoint();
                if (navController != null) navController.SetDestination(roamPoint);
            }
            else
            {
                Vector2 circle = UnityEngine.Random.insideUnitCircle * 12f;
                Vector3 dest = spawnPosition + new Vector3(circle.x, 0f, circle.y);
                if (navController != null) navController.SetDestination(dest);
            }
        }

        private void TransitionToState(WildlifeBehaviorState newState)
        {
            currentState = newState;

            if (animator != null && currentTier != WildlifeLODTier.Tier3_Culled)
            {
                animator.SetInteger("State", (int)currentState);
                animator.SetBool("IsMoving", currentState == WildlifeBehaviorState.GroupMove || 
                                             currentState == WildlifeBehaviorState.Flee || 
                                             currentState == WildlifeBehaviorState.ReturnToHabitat);
                animator.SetBool("IsSleeping", currentState == WildlifeBehaviorState.Sleep);
                animator.SetBool("IsFeeding", currentState == WildlifeBehaviorState.Graze || currentState == WildlifeBehaviorState.Forage);
            }
        }
    }
}
