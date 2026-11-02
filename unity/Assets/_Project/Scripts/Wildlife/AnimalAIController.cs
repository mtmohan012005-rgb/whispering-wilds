using System;
using UnityEngine;
using UnityEngine.AI;

namespace WhisperingWilds.Ecology
{
    public enum AnimalState
    {
        Idle,
        Grazing,
        Alert,
        Fleeing,
        Wandering
    }

    /// <summary>
    /// Runtime AI controller for fauna across Tamil Nadu biomes (Nilgiri Tahr, Mangrove Kingfishers, Chettinad cattle).
    /// Manages NavMesh-assisted state machine transitions between Grazing, Alert, Fleeing, and Wandering
    /// influenced by player proximity, sprint noise, and WildlifeEcologySystem herd stress levels.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class AnimalAIController : MonoBehaviour
    {
        [Header("Identity & Biome")]
        public string speciesId = "nilgiri_tahr";
        public AnimalState currentState = AnimalState.Grazing;

        [Header("Perception & Detection")]
        [Tooltip("Radius at which the animal stops grazing and looks attentively towards the disturbance.")]
        public float alertDistance = 12f;
        [Tooltip("Radius at which the animal flees rapidly away from the player.")]
        public float fleeDistance = 6f;
        [Tooltip("Speed when wandering or grazing.")]
        public float walkSpeed = 2f;
        [Tooltip("Speed when fleeing or alarmed.")]
        public float runSpeed = 5.5f;

        [Header("Flocking & Herd Dynamics")]
        public Vector3 herdCentroid = Vector3.zero;
        public float cohesionWeight = 0.35f;

        [Header("System References")]
        public WildlifeEcologySystem ecologySystem;
        public Transform targetThreat;

        private NavMeshAgent navMeshAgent;
        private CharacterController characterController;
        private float stateTimer = 0f;
        private Vector3 currentVelocity = Vector3.zero;

        public event Action<AnimalState> OnStateChanged;
        public event Action<Vector3> OnSpooked;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            navMeshAgent = GetComponent<NavMeshAgent>();
            if (navMeshAgent != null)
            {
                navMeshAgent.speed = walkSpeed;
            }
        }

        private void Start()
        {
            if (targetThreat == null)
            {
                var player = GameObject.FindGameObjectWithTag("Player");
                if (player != null) targetThreat = player.transform;
            }
        }

        private void Update()
        {
            stateTimer += Time.deltaTime;
            EvaluateThreatProximity();
            ExecuteCurrentStateBehavior();
        }

        /// <summary>
        /// Evaluates player proximity and herd stress to determine the appropriate behavior state.
        /// </summary>
        public void EvaluateThreatProximity()
        {
            float threatDistance = targetThreat != null 
                ? Vector3.Distance(transform.position, targetThreat.position) 
                : float.MaxValue;

            float effectiveFleeDist = fleeDistance;
            float effectiveAlertDist = alertDistance;

            // Elevated herd stress lowers the threat threshold
            if (ecologySystem != null && ecologySystem.herdStressLevel > 50f)
            {
                float stressScale = 1f + (ecologySystem.herdStressLevel - 50f) / 100f;
                effectiveFleeDist *= stressScale;
                effectiveAlertDist *= stressScale;
            }

            if (threatDistance <= effectiveFleeDist)
            {
                if (currentState != AnimalState.Fleeing)
                {
                    SetState(AnimalState.Fleeing);
                    Vector3 awayDir = (transform.position - targetThreat.position).normalized;
                    OnSpooked?.Invoke(awayDir);
                    if (ecologySystem != null)
                    {
                        ecologySystem.herdStressLevel = Mathf.Min(100f, ecologySystem.herdStressLevel + 15f);
                    }
                }
            }
            else if (threatDistance <= effectiveAlertDist)
            {
                if (currentState != AnimalState.Alert && currentState != AnimalState.Fleeing)
                {
                    SetState(AnimalState.Alert);
                }
            }
            else
            {
                if (currentState == AnimalState.Alert || (currentState == AnimalState.Fleeing && stateTimer > 4f))
                {
                    SetState(AnimalState.Grazing);
                }
            }
        }

        /// <summary>
        /// Executes locomotion and orientation depending on active state.
        /// </summary>
        private void ExecuteCurrentStateBehavior()
        {
            switch (currentState)
            {
                case AnimalState.Idle:
                case AnimalState.Grazing:
                    if (stateTimer > 8f)
                    {
                        SetState(AnimalState.Wandering);
                    }
                    break;

                case AnimalState.Alert:
                    if (targetThreat != null)
                    {
                        Vector3 lookDir = (targetThreat.position - transform.position).normalized;
                        lookDir.y = 0;
                        if (lookDir != Vector3.zero)
                        {
                            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(lookDir), Time.deltaTime * 3f);
                        }
                    }
                    break;

                case AnimalState.Wandering:
                    if (stateTimer > 5f)
                    {
                        SetState(AnimalState.Grazing);
                    }
                    break;

                case AnimalState.Fleeing:
                    if (targetThreat != null)
                    {
                        Vector3 fleeDir = (transform.position - targetThreat.position).normalized;
                        fleeDir.y = 0;

                        // Blend flee direction with herd cohesion
                        if (herdCentroid != Vector3.zero)
                        {
                            Vector3 toCentroid = (herdCentroid - transform.position).normalized;
                            fleeDir = Vector3.Lerp(fleeDir, toCentroid, cohesionWeight).normalized;
                        }

                        MoveInDirection(fleeDir, runSpeed);
                    }
                    break;
            }
        }

        public void MoveInDirection(Vector3 direction, float speed)
        {
            if (navMeshAgent != null && navMeshAgent.isActiveAndEnabled && navMeshAgent.isOnNavMesh)
            {
                Vector3 target = transform.position + direction * speed;
                navMeshAgent.speed = speed;
                navMeshAgent.SetDestination(target);
            }
            else if (characterController != null && characterController.enabled)
            {
                Vector3 moveDelta = direction * (speed * Time.deltaTime);
                characterController.Move(moveDelta);
            }
            else
            {
                transform.position += direction * (speed * Time.deltaTime);
            }

            if (direction != Vector3.zero)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), Time.deltaTime * 6f);
            }
        }

        public void SetState(AnimalState newState)
        {
            if (currentState == newState) return;
            currentState = newState;
            stateTimer = 0f;
            OnStateChanged?.Invoke(newState);
        }
    }
}
