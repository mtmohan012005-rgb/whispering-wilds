using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
using WhisperingWilds.Player;
using WhisperingWilds.World;
using WhisperingWilds.Vegetation;

namespace WhisperingWilds.NPC
{
    [Serializable]
    public class DialogueChoice
    {
        public string choiceTextEn;
        public string choiceTextTa;
        public int nextNodeIndex;
        public string requiredClueId;
        public string questTriggerId;
    }

    [Serializable]
    public class DialogueNode
    {
        public int nodeIndex;
        [TextArea(2, 4)] public string speakerTextEn;
        [TextArea(2, 4)] public string speakerTextTa;
        public List<DialogueChoice> choices = new List<DialogueChoice>();
    }

    [Serializable]
    public struct ScheduleWaypoint
    {
        public int hour24;
        public Vector3 position;
        public string activityDescription;
        public NPCState state;
    }

    /// <summary>
    /// Autonomous community resident implementing 11-state FSM, living daily routines,
    /// authentic occupation actions (farming, fishing, tea plucking, shopkeeping),
    /// throttled AI ticks, and branching bilingual dialogue with player memory.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCCharacter : MonoBehaviour, IInteractable
    {
        [Header("Identity & Occupation")]
        [SerializeField] private string npcId = "resident";
        [SerializeField] private string displayNameEn = "Villager";
        [SerializeField] private string displayNameTa = "ஊரார்";
        [SerializeField] private NPCOccupation occupation = NPCOccupation.Resident;

        [Header("State Machine")]
        [SerializeField] private NPCState currentState = NPCState.Idle;
        [SerializeField] private NPCState scheduledState = NPCState.Idle;
        [SerializeField] private NPCTier currentTier = NPCTier.Near;
        [SerializeField] private Vector3 targetDestination;
        [SerializeField] private float stateActionTimer = 0f;

        [Header("Dialogue Content")]
        [SerializeField] private List<DialogueNode> dialogueNodes = new List<DialogueNode>();

        [Header("Daily Schedule")]
        [SerializeField] private List<ScheduleWaypoint> schedule = new List<ScheduleWaypoint>();

        [Header("Work Anchors")]
        [SerializeField] private Transform workAnchor;
        [SerializeField] private Transform homeAnchor;
        [SerializeField] private Transform socialAnchor;

        // Components
        private NavMeshAgent navAgent;
        private Animator animator;
        private Collider interactionCollider;

        // NPC Memory: Stores choices, favors, clues discussed
        private readonly HashSet<string> memoryFlags = new HashSet<string>();

        // Public getters
        public string NpcId => npcId;
        public string DisplayNameEn => displayNameEn;
        public string DisplayNameTa => displayNameTa;
        public NPCOccupation Occupation => occupation;
        public NPCState CurrentState => currentState;
        public NPCTier CurrentTier => currentTier;

        // IInteractable implementation
        public string InteractionPrompt => $"Talk to {displayNameEn} ({displayNameTa}) [E]";
        public InteractionType Type => InteractionType.Talk;

        public event Action<NPCCharacter, DialogueNode> OnDialogueStarted;
        public event Action<NPCCharacter, NPCState> OnStateChanged;

        private void Awake()
        {
            navAgent = GetComponent<NavMeshAgent>();
            animator = GetComponentInChildren<Animator>();
            interactionCollider = GetComponent<Collider>();

            if (navAgent != null)
            {
                navAgent.speed = 1.6f;
                navAgent.stoppingDistance = 0.8f;
                navAgent.acceleration = 4.0f;
            }

            if (string.IsNullOrEmpty(npcId))
            {
                npcId = displayNameEn.ToLowerInvariant().Replace(" ", "_");
            }
        }

        private void Start()
        {
            if (NPCScheduleManager.Instance != null)
            {
                NPCScheduleManager.Instance.RegisterNPC(this);
            }

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += HandleHourChanged;
                EvaluateScheduleForHour(WorldTimeSystem.Instance.CurrentHour);
            }
            else if (TimeOfDayManager.Instance != null)
            {
                TimeOfDayManager.Instance.OnHourChanged += HandleHourChanged;
                EvaluateScheduleForHour((int)TimeOfDayManager.Instance.CurrentTime24);
            }
        }

        private void OnDestroy()
        {
            if (NPCScheduleManager.Instance != null)
            {
                NPCScheduleManager.Instance.UnregisterNPC(this);
            }

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= HandleHourChanged;
            }
            if (TimeOfDayManager.Instance != null)
            {
                TimeOfDayManager.Instance.OnHourChanged -= HandleHourChanged;
            }
        }

        /// <summary>
        /// Centralized throttled AI tick invoked by NPCPerformanceTierManager.
        /// Eliminates hundreds of unbudgeted per-frame Update() loops.
        /// </summary>
        public void TickAI(float dt)
        {
            if (currentTier == NPCTier.Hibernating)
            {
                // In hibernation, only minimal state progression
                return;
            }

            stateActionTimer += dt;

            switch (currentState)
            {
                case NPCState.GoToTarget:
                    UpdateTravelState();
                    break;

                case NPCState.Working:
                    PerformOccupationWork(dt);
                    break;

                case NPCState.ReturningHome:
                    UpdateHomeTravelState();
                    break;

                case NPCState.Talking:
                case NPCState.Interrupted:
                    // Await player dialogue completion or timeout
                    if (stateActionTimer > 25.0f)
                    {
                        ResumeScheduledActivity();
                    }
                    break;

                case NPCState.Resting:
                case NPCState.Eating:
                case NPCState.Socializing:
                case NPCState.Sleeping:
                case NPCState.Idle:
                default:
                    // Periodic idle variation
                    if (stateActionTimer > 6.0f)
                    {
                        stateActionTimer = 0f;
                    }
                    break;
            }
        }

        public void SetTier(NPCTier tier)
        {
            currentTier = tier;

            if (animator != null)
            {
                switch (tier)
                {
                    case NPCTier.Near:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
                        break;
                    case NPCTier.Medium:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.CullUpdateTransforms;
                        break;
                    case NPCTier.Far:
                        animator.enabled = true;
                        animator.cullingMode = AnimatorCullingMode.CullCompletely;
                        break;
                    case NPCTier.Hibernating:
                        animator.enabled = false;
                        break;
                }
            }

            if (navAgent != null && navAgent.isOnNavMesh)
            {
                navAgent.isStopped = (tier == NPCTier.Hibernating);
            }

            if (interactionCollider != null)
            {
                // Disable collision in far/hibernating tiers to accelerate physics queries
                interactionCollider.enabled = (tier == NPCTier.Near || tier == NPCTier.Medium);
            }
        }

        private void UpdateTravelState()
        {
            float dist = Vector3.Distance(transform.position, targetDestination);
            if (dist <= 1.2f || (navAgent != null && navAgent.isOnNavMesh && !navAgent.pathPending && navAgent.remainingDistance <= navAgent.stoppingDistance))
            {
                TransitionToState(scheduledState);
            }
        }

        private void UpdateHomeTravelState()
        {
            Vector3 homePos = homeAnchor != null ? homeAnchor.position : transform.position;
            float dist = Vector3.Distance(transform.position, homePos);
            if (dist <= 1.5f || (navAgent != null && navAgent.isOnNavMesh && !navAgent.pathPending && navAgent.remainingDistance <= navAgent.stoppingDistance))
            {
                TransitionToState(NPCState.Sleeping);
            }
        }

        private void PerformOccupationWork(float dt)
        {
            switch (occupation)
            {
                case NPCOccupation.Farmer:
                    // Tending local farm plot
                    if (stateActionTimer > 15.0f)
                    {
                        stateActionTimer = 0f;
                        var plot = GetComponentInParent<FarmPlot>() ?? FindNearbyFarmPlot();
                        if (plot != null)
                        {
                            plot.NPCPerformFarmTending();
                        }
                    }
                    break;

                case NPCOccupation.Fisherman:
                    // Coastal net handling / fish inspection
                    if (stateActionTimer > 18.0f)
                    {
                        stateActionTimer = 0f;
                        if (animator != null && currentTier == NPCTier.Near)
                        {
                            animator.SetTrigger("WorkAction");
                        }
                    }
                    break;

                case NPCOccupation.TeaWorker:
                    // Plucking tea foliage on slope rows
                    if (stateActionTimer > 12.0f)
                    {
                        stateActionTimer = 0f;
                        if (animator != null && currentTier == NPCTier.Near)
                        {
                            animator.SetTrigger("WorkAction");
                        }
                    }
                    break;

                case NPCOccupation.Shopkeeper:
                case NPCOccupation.Elder:
                case NPCOccupation.CraftWorker:
                default:
                    if (stateActionTimer > 20.0f)
                    {
                        stateActionTimer = 0f;
                    }
                    break;
            }
        }

        private FarmPlot FindNearbyFarmPlot()
        {
            var plots = FindObjectsByType<FarmPlot>();
            foreach (var p in plots)
            {
                if (Vector3.Distance(transform.position, p.transform.position) < 8.0f)
                    return p;
            }
            return null;
        }

        public void HandleHourChanged(int currentHour)
        {
            EvaluateScheduleForHour(currentHour);
        }

        public void EvaluateScheduleForHour(int currentHour)
        {
            // 1. Check custom authored schedule waypoints first
            foreach (var waypoint in schedule)
            {
                if (waypoint.hour24 == currentHour)
                {
                    NavigateToDestination(waypoint.position, waypoint.state != NPCState.Idle ? waypoint.state : NPCState.Working);
                    return;
                }
            }

            // 2. Fall back to standard occupation routine
            NPCState defaultState = GetStandardOccupationState(occupation, currentHour);
            Vector3 dest = GetDestinationForState(defaultState);

            if (Vector3.Distance(transform.position, dest) > 2.0f)
            {
                NavigateToDestination(dest, defaultState);
            }
            else
            {
                TransitionToState(defaultState);
            }
        }

        private NPCState GetStandardOccupationState(NPCOccupation occ, int hour)
        {
            // Night hours: Sleep
            if (hour >= 22 || hour < 5) return NPCState.Sleeping;

            // Early morning: Wake and commute
            if (hour == 5) return NPCState.ReturningHome;

            // Afternoon lunch / rest: 12 to 14
            if (hour >= 12 && hour < 14) return NPCState.Eating;

            // Evening leisure / prayer / socializing: 18 to 21
            if (hour >= 18 && hour < 21) return NPCState.Socializing;

            // Late evening return: 21
            if (hour == 21) return NPCState.ReturningHome;

            // Default daytime slot: Work
            return NPCState.Working;
        }

        private Vector3 GetDestinationForState(NPCState state)
        {
            switch (state)
            {
                case NPCState.Working:
                    if (workAnchor != null) return workAnchor.position;
                    break;
                case NPCState.Sleeping:
                case NPCState.ReturningHome:
                    if (homeAnchor != null) return homeAnchor.position;
                    break;
                case NPCState.Socializing:
                case NPCState.Eating:
                    if (socialAnchor != null) return socialAnchor.position;
                    break;
            }
            return transform.position;
        }

        public void NavigateToDestination(Vector3 dest, NPCState nextState)
        {
            targetDestination = dest;
            scheduledState = nextState;
            TransitionToState(NPCState.GoToTarget);

            if (navAgent != null && navAgent.isOnNavMesh)
            {
                navAgent.isStopped = false;
                navAgent.SetDestination(targetDestination);
            }
            else
            {
                // Fallback: direct placement or step
                transform.position = dest;
                TransitionToState(nextState);
            }
        }

        private void TransitionToState(NPCState newState)
        {
            currentState = newState;
            stateActionTimer = 0f;

            if (animator != null && currentTier != NPCTier.Hibernating)
            {
                animator.SetInteger("State", (int)currentState);
                animator.SetBool("IsWalking", currentState == NPCState.GoToTarget || currentState == NPCState.ReturningHome);
                animator.SetBool("IsSleeping", currentState == NPCState.Sleeping);
            }

            OnStateChanged?.Invoke(this, currentState);
        }

        public void ResumeScheduledActivity()
        {
            TransitionToState(scheduledState);
        }

        // --- IInteractable Implementation ---

        public bool CanInteract(PlayerInteractor interactor) => currentState != NPCState.Sleeping;

        public void Interact(PlayerInteractor interactor)
        {
            if (!CanInteract(interactor)) return;

            // Stop walking during conversation
            if (navAgent != null && navAgent.isOnNavMesh)
            {
                navAgent.isStopped = true;
            }

            TransitionToState(NPCState.Talking);

            if (dialogueNodes != null && dialogueNodes.Count > 0)
            {
                Debug.Log($"<color=#00D2FF><b>[Dialogue]</b></color> Speaking with {displayNameEn} ({displayNameTa})");
                OnDialogueStarted?.Invoke(this, dialogueNodes[0]);
            }
        }

        public void OnFocusEnter() { }
        public void OnFocusExit() { }

        public void RecordMemory(string key)
        {
            if (!memoryFlags.Contains(key))
            {
                memoryFlags.Add(key);
                Debug.Log($"<color=#00FF88><b>[NPC Memory]</b></color> {displayNameEn} remembers: {key}");
            }
        }

        public bool HasMemory(string key) => memoryFlags.Contains(key);
    }
}
