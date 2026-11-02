using System;
using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Coordinates high-level gameplay animation states for the player:
    /// - Agricultural harvesting (paddy scythe swing, tea leaf plucking)
    /// - Wildlife research camera viewfinder aim pose
    /// - Dravidian puzzle interactions (turning Navagraha shadow dials, striking musical pillars)
    /// Employs cached Animator parameter hashes for zero garbage collection overhead.
    /// </summary>
    public class PlayerAnimationStateController : MonoBehaviour
    {
        [Header("Animation Component")]
        [SerializeField] private Animator animator;

        [Header("Runtime State")]
        public bool isAimingCamera = false;
        public bool isHarvesting = false;
        public bool isInteracting = false;
        public InteractionType currentInteractionType = InteractionType.None;

        // Cached parameter hashes
        private static readonly int HashSpeed = Animator.StringToHash("Speed");
        private static readonly int HashGrounded = Animator.StringToHash("Grounded");
        private static readonly int HashIsAimingCamera = Animator.StringToHash("IsAimingCamera");
        private static readonly int HashHarvestTrigger = Animator.StringToHash("HarvestTrigger");
        private static readonly int HashInteractTrigger = Animator.StringToHash("InteractTrigger");
        private static readonly int HashInteractionType = Animator.StringToHash("InteractionType");

        public event Action<bool> OnCameraAimStateChanged;
        public event Action<string> OnHarvestActionTriggered;
        public event Action<InteractionType> OnInteractionPoseTriggered;

        private void Awake()
        {
            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
            }
        }

        /// <summary>
        /// Updates the aiming pose for the research camera viewfinder.
        /// </summary>
        public void SetAimingCamera(bool aiming)
        {
            if (isAimingCamera == aiming) return;
            isAimingCamera = aiming;

            if (animator != null && animator.gameObject.activeInHierarchy)
            {
                animator.SetBool(HashIsAimingCamera, isAimingCamera);
            }

            OnCameraAimStateChanged?.Invoke(isAimingCamera);
        }

        /// <summary>
        /// Triggers the regional harvest animation (e.g. paddy sickle swing in Cauvery Delta).
        /// </summary>
        public void TriggerHarvest(string cropId)
        {
            isHarvesting = true;
            if (animator != null && animator.gameObject.activeInHierarchy)
            {
                animator.SetTrigger(HashHarvestTrigger);
            }

            OnHarvestActionTriggered?.Invoke(cropId);
        }

        /// <summary>
        /// Triggers an interaction pose matching the specific world interactable type.
        /// </summary>
        public void TriggerInteraction(InteractionType type)
        {
            isInteracting = true;
            currentInteractionType = type;

            if (animator != null && animator.gameObject.activeInHierarchy)
            {
                animator.SetInteger(HashInteractionType, (int)type);
                animator.SetTrigger(HashInteractTrigger);
            }

            OnInteractionPoseTriggered?.Invoke(type);
        }

        /// <summary>
        /// Called when animation completes via animation event or timer.
        /// </summary>
        public void ResetInteractionFlags()
        {
            isHarvesting = false;
            isInteracting = false;
            currentInteractionType = InteractionType.None;
        }

        /// <summary>
        /// Updates basic locomotion speed and grounded status from PlayerMovement.
        /// </summary>
        public void UpdateLocomotion(float speed, bool grounded)
        {
            if (animator == null || !animator.gameObject.activeInHierarchy) return;
            animator.SetFloat(HashSpeed, speed);
            animator.SetBool(HashGrounded, grounded);
        }
    }
}
