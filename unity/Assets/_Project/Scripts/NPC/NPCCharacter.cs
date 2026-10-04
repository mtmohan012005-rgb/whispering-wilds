using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
using WhisperingWilds.Player;
using WhisperingWilds.World;
using WhisperingWilds.Vegetation;
using WhisperingWilds.Localization;

namespace WhisperingWilds.NPC
{
    [Serializable]
    public class DialogueChoice
    {
        public string choiceTextEn;
        public string choiceTextTa;
        public int nextNodeIndex;

        /// <summary>Clue that must already be discovered for this choice to be offered.</summary>
        public string requiredClueId;

        /// <summary>Clue revealed when this choice is taken.</summary>
        public string revealClueId;

        /// <summary>
        /// Legacy clue reference kept for older authored content. Read as a fallback for
        /// <see cref="revealClueId"/> so existing dialogue graphs keep working.
        /// </summary>
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
    /// authentic occupation actions (farming, fishing, tea plucking, shopkeeping, artisan carving),
    /// throttled AI ticks, and branching bilingual dialogue with player memory.
    /// Completely eliminates direct transform teleportation for ordinary movement.
    /// </summary>
    [RequireComponent(typeof(NPCNavigationController))]
    [DisallowMultipleComponent]
    public class NPCCharacter : MonoBehaviour, IInteractable
    {
        [Header("Identity & Occupation")]
        [SerializeField] private string npcId = "resident";
        [SerializeField] private string displayNameEn = "Villager";
        [SerializeField] private string displayNameTa = "ஊரார்";
        [SerializeField] private NPCOccupation occupation = NPCOccupation.Resident;
        [SerializeField] private string profession = "Resident";
        [SerializeField] private string profileDescription = "Local resident";

        public void SetCharacterProfile(string nameEn, string nameTa, string location, string description)
        {
            displayNameEn = nameEn;
            displayNameTa = nameTa;
            profileDescription = description;
            npcId = nameEn.ToLowerInvariant().Replace(" ", "_").Replace("(", "").Replace(")", "");
        }

        [Header("State Machine")]
        [SerializeField] private NPCState currentState = NPCState.Idle;
        [SerializeField] private NPCState scheduledState = NPCState.Idle;
        [SerializeField] private NPCTier currentTier = NPCTier.Near;
        [SerializeField] private Vector3 targetDestination;
        [SerializeField] private float stateActionTimer = 0f;

        [Header("Daily Schedule")]
        [SerializeField] private List<NPCScheduleAction> structuredSchedule = new List<NPCScheduleAction>();
        [SerializeField] private List<ScheduleWaypoint> legacySchedule = new List<ScheduleWaypoint>();

        [Header("Dialogue Content")]
        [SerializeField] private List<DialogueNode> dialogueNodes = new List<DialogueNode>();

        /// <summary>Dialogue graph for this resident. Exposed so UI can traverse node indices.</summary>
        public IReadOnlyList<DialogueNode> DialogueNodes => dialogueNodes;

        /// <summary>
        /// Replaces the dialogue graph from code. Used by the region bootstrap so the opening
        /// conversation lives beside the other opening content instead of being hand-authored into
        /// the scene, where its clue ids would silently drift from the catalogue.
        /// </summary>
        public void SetDialogueNodes(List<DialogueNode> nodes)
        {
            dialogueNodes = nodes ?? new List<DialogueNode>();
        }

        [Header("Work & Living Anchors")]
        [SerializeField] private Transform workAnchor;
        [SerializeField] private Transform homeAnchor;
        [SerializeField] private Transform socialAnchor;

        // Subsystems
        private NPCNavigationController navController;
        private NPCStateMachine stateMachine;
        private Animator animator;
        private Collider interactionCollider;

        // NPC Memory: Stores choices, favors, clues discussed
        private readonly HashSet<string> memoryFlags = new HashSet<string>();

        // Public getters
        public string NpcId => npcId;
        public string DisplayNameEn => displayNameEn;
        public string DisplayNameTa => displayNameTa;
        public NPCOccupation Occupation => occupation;
        public NPCState CurrentState => stateMachine != null ? stateMachine.CurrentState : currentState;
        public NPCTier CurrentTier => currentTier;
        public NPCNavigationController NavController => navController;
        public NPCScheduleAction ActiveSchedule { get; private set; }
        public NPCActivityAnchor CurrentAnchor { get; private set; }

        public void InteractWithAnchor(NPCActivityAnchor anchor)
        {
            if (anchor == null) return;
            if (CurrentAnchor != null && CurrentAnchor != anchor)
            {
                CurrentAnchor.Release(this);
            }
            CurrentAnchor = anchor;
            anchor.Occupy(this);
            transform.position = anchor.DockPosition;
            transform.rotation = anchor.DockRotation;
        }

        // IInteractable implementation
        public string InteractionPrompt
        {
            get
            {
                LocalizationManager loc = LocalizationManager.Instance;
                if (loc == null) return string.Empty;

                // Prefer the NPC's own prompt key (e.g. talk.meenakshi).
                if (loc.HasKey("talk." + npcId))
                {
                    return loc.GetForDisplay("talk." + npcId);
                }

                // Get()/GetForDisplay() return the missing-key placeholder or an empty string for an
                // unknown key, so an unknown NPC used to surface "missing.talk.<id>" to the player.
                // It now falls back to the bilingual talk.default template with the NPC's already
                // localized display name, which stays readable in both languages and still reports
                // the gap to the log.
                string displayName = loc.CurrentLanguage == Language.Tamil && !string.IsNullOrEmpty(displayNameTa)
                    ? displayNameTa
                    : displayNameEn;
                return loc.GetForDisplay("talk.default", displayName).Replace("{0}", displayName);
            }
        }
        public InteractionType Type => InteractionType.Talk;

        public event Action<NPCCharacter, DialogueNode> OnDialogueStarted;
        public event Action<NPCCharacter, NPCState> OnStateChanged;

        private void Awake()
        {
            navController = GetComponent<NPCNavigationController>();
            animator = GetComponentInChildren<Animator>();
            interactionCollider = GetComponent<Collider>();

            stateMachine = new NPCStateMachine();
            stateMachine.Initialize(currentState);
            stateMachine.OnStateTransition += HandleStateTransition;

            if (navController != null)
            {
                navController.OnDestinationReached += HandleDestinationReached;
                navController.OnStuckRecovered += HandleStuckRecovered;
                navController.OnPathFailed += HandlePathFailed;
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
            else
            {
                EvaluateScheduleForHour(8);
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

            if (navController != null)
            {
                navController.OnDestinationReached -= HandleDestinationReached;
                navController.OnStuckRecovered -= HandleStuckRecovered;
                navController.OnPathFailed -= HandlePathFailed;
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
                // In hibernation, update only logical schedule progression
                return;
            }

            stateMachine.Tick(dt);
            stateActionTimer = stateMachine.StateTimer;

            // Tick active navigation controller
            if (navController != null)
            {
                navController.TickNavigation(dt);
            }

            switch (stateMachine.CurrentState)
            {
                case NPCState.GoToTarget:
                case NPCState.ReturningHome:
                    // Movement is driven by navController
                    break;

                case NPCState.Working:
                    PerformOccupationWork(dt);
                    break;

                case NPCState.Talking:
                case NPCState.Interrupted:
                    // Await player dialogue completion or auto-resume on timeout
                    if (stateActionTimer > 25.0f)
                    {
                        ResumeScheduledActivity();
                    }
                    break;

                case NPCState.Eating:
                case NPCState.Resting:
                case NPCState.Socializing:
                case NPCState.Sleeping:
                case NPCState.Idle:
                default:
                    // Periodic idle activity variation
                    if (stateActionTimer > 8.0f)
                    {
                        TriggerSubtleStateAction();
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
                        // Suspend animator execution in hibernation without breaking state
                        animator.enabled = false;
                        break;
                }
            }

            if (navController != null && tier == NPCTier.Hibernating)
            {
                navController.StopNavigation();
            }

            if (interactionCollider != null)
            {
                // Disable collision in far/hibernating tiers to accelerate physics queries
                interactionCollider.enabled = (tier == NPCTier.Near || tier == NPCTier.Medium);
            }
        }

        private void HandleDestinationReached()
        {
            if (stateMachine.CurrentState == NPCState.GoToTarget)
            {
                stateMachine.TransitionTo(scheduledState);
            }
            else if (stateMachine.CurrentState == NPCState.ReturningHome)
            {
                stateMachine.TransitionTo(NPCState.Sleeping);
            }
        }

        private void HandleStuckRecovered()
        {
            // Successfully shifted off collision obstacle; continue towards destination
            if (stateMachine.CurrentState == NPCState.GoToTarget || stateMachine.CurrentState == NPCState.ReturningHome)
            {
                navController.SetDestination(targetDestination);
            }
        }

        private void HandlePathFailed(Vector3 failedDest)
        {
            // Safe fallback: Do not teleport. Transition to resting or idle at current valid location.
            navController.StopNavigation();
            stateMachine.TransitionTo(NPCState.Resting);
        }

        private void PerformOccupationWork(float dt)
        {
            switch (occupation)
            {
                case NPCOccupation.Farmer:
                    // Tending local farm plot
                    if (stateActionTimer > 15.0f)
                    {
                        var plot = GetComponentInParent<FarmPlot>() ?? FindNearbyFarmPlot();
                        if (plot != null)
                        {
                            plot.NPCPerformFarmTending();
                        }
                    }
                    break;

                case NPCOccupation.Fisherman:
                case NPCOccupation.TeaWorker:
                case NPCOccupation.CraftWorker:
                    if (stateActionTimer > 14.0f)
                    {
                        if (animator != null && currentTier == NPCTier.Near)
                        {
                            animator.SetTrigger("WorkAction");
                        }
                    }
                    break;

                case NPCOccupation.Shopkeeper:
                case NPCOccupation.Elder:
                case NPCOccupation.Resident:
                default:
                    break;
            }
        }

        private void TriggerSubtleStateAction()
        {
            if (animator != null && currentTier == NPCTier.Near)
            {
                animator.SetTrigger("IdleAction");
            }
        }

        private FarmPlot FindNearbyFarmPlot()
        {
            var plots = FindObjectsByType<FarmPlot>();
            foreach (var p in plots)
            {
                if (p != null && Vector3.Distance(transform.position, p.transform.position) < 10.0f)
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
            // 1. Check structured schedule actions
            foreach (var action in structuredSchedule)
            {
                if (action != null && action.IsActiveAtHour(currentHour))
                {
                    ActiveSchedule = action;
                    Vector3 dest = action.ResolvedPosition;
                    scheduledState = action.state;
                    stateMachine.SetScheduledState(scheduledState);

                    if (Vector3.Distance(transform.position, dest) > 1.5f)
                    {
                        NavigateToDestination(dest, scheduledState);
                    }
                    else
                    {
                        stateMachine.TransitionTo(scheduledState);
                    }
                    return;
                }
            }

            // 2. Check legacy schedule waypoints
            foreach (var waypoint in legacySchedule)
            {
                if (waypoint.hour24 == currentHour)
                {
                    scheduledState = waypoint.state != NPCState.Idle ? waypoint.state : NPCState.Working;
                    ActiveSchedule = new NPCScheduleAction
                    {
                        startHour24 = waypoint.hour24,
                        durationHours = 1f,
                        state = scheduledState,
                        targetPosition = waypoint.position,
                        activityDescriptionEn = waypoint.activityDescription
                    };
                    stateMachine.SetScheduledState(scheduledState);
                    NavigateToDestination(waypoint.position, scheduledState);
                    return;
                }
            }

            // 3. Fall back to standard occupation routine
            NPCState defaultState = GetStandardOccupationState(occupation, currentHour);
            Vector3 fallbackDest = GetDestinationForState(defaultState);
            scheduledState = defaultState;
            ActiveSchedule = new NPCScheduleAction
            {
                startHour24 = currentHour,
                durationHours = 1f,
                state = defaultState,
                targetPosition = fallbackDest,
                activityDescriptionEn = defaultState.ToString()
            };
            stateMachine.SetScheduledState(scheduledState);

            if (Vector3.Distance(transform.position, fallbackDest) > 1.8f)
            {
                NavigateToDestination(fallbackDest, defaultState);
            }
            else
            {
                stateMachine.TransitionTo(defaultState);
            }
        }

        private NPCState GetStandardOccupationState(NPCOccupation occ, int hour)
        {
            // Night hours: Sleep
            if (hour >= 22 || hour < 5) return NPCState.Sleeping;

            // Early morning commute: 5 AM
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
            stateMachine.SetScheduledState(scheduledState);

            NPCState travelState = (nextState == NPCState.Sleeping) ? NPCState.ReturningHome : NPCState.GoToTarget;
            stateMachine.TransitionTo(travelState);

            if (navController != null && navController.HasValidNavMesh)
            {
                navController.SetDestination(targetDestination);
            }
            else
            {
                // Safe failure: never teleport transform. Transition directly to state in place.
                stateMachine.TransitionTo(nextState);
            }
        }

        private void HandleStateTransition(NPCState oldState, NPCState newState)
        {
            currentState = newState;

            // Stop navigation before stationary states
            if (newState == NPCState.Sleeping || 
                newState == NPCState.Resting || 
                newState == NPCState.Eating || 
                newState == NPCState.Talking || 
                newState == NPCState.Interacting)
            {
                if (navController != null)
                {
                    navController.StopNavigation();
                }
            }

            if (animator != null && currentTier != NPCTier.Hibernating)
            {
                animator.SetInteger("State", (int)newState);
                animator.SetBool("IsWalking", newState == NPCState.GoToTarget || newState == NPCState.ReturningHome);
                animator.SetBool("IsSleeping", newState == NPCState.Sleeping);
                animator.SetBool("IsWorking", newState == NPCState.Working);
                animator.SetBool("IsTalking", newState == NPCState.Talking);
            }

            OnStateChanged?.Invoke(this, newState);
        }

        public void ResumeScheduledActivity()
        {
            stateMachine.ResumeScheduledState();
        }

        // --- IInteractable Implementation ---

        public bool CanInteract(PlayerInteractor interactor) => stateMachine.CurrentState != NPCState.Sleeping;

        public void Interact(PlayerInteractor interactor)
        {
            if (!CanInteract(interactor)) return;

            // Stop walking during conversation
            if (navController != null)
            {
                navController.StopNavigation();
            }

            // Face interactor smoothly
            if (interactor != null)
            {
                Vector3 toPlayer = interactor.transform.position - transform.position;
                toPlayer.y = 0;
                if (toPlayer.sqrMagnitude > 0.01f)
                {
                    transform.rotation = Quaternion.LookRotation(toPlayer);
                }
            }

            stateMachine.TransitionTo(NPCState.Talking);

            // Meeting the resident is recorded here as well as in the dialogue UI, so the record
            // survives even if no dialogue view is present in the scene.
            RegisterConversationWithPlayer();

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
                Debug.Log($"<color=#00FF99><b>[NPC Memory]</b></color> {displayNameEn} remembers: {key}");
            }
        }

        public bool HasMemory(string key) => memoryFlags.Contains(key);

        /// <summary>
        /// Records that this resident has met the player and reports the single gameplay event
        /// for this conversation.
        ///
        /// This is the only place a talk event is emitted: it runs exactly once per interaction,
        /// before any dialogue node is rendered. The durable record lives in
        /// <see cref="NPCInteractionLog"/> because scene objects are recreated on travel.
        /// </summary>
        public void RegisterConversationWithPlayer()
        {
            if (string.IsNullOrEmpty(npcId)) return;

            NPCInteractionLog.Record(npcId);
            Gameplay.GameplayEventBus.ReportTalkedToNpc(npcId);
        }
    }
}
