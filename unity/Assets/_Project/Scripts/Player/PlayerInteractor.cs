using System;
using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Detects interactable objects within player range and manages interaction execution.
    /// Emits events for UI prompt updates (e.g., "[E] Talk to Murugan").
    /// </summary>
    [RequireComponent(typeof(PlayerInputHandler))]
    public class PlayerInteractor : MonoBehaviour
    {
        [Header("Detection Settings")]
        [SerializeField] private float interactionRadius = 2.5f;
        [SerializeField] private LayerMask interactableLayers = ~0;
        [SerializeField] private Transform rayOrigin;

        private PlayerInputHandler input;
        private IInteractable currentTarget;

        public IInteractable CurrentTarget => currentTarget;

        public event Action<IInteractable> OnFocusChanged;
        public event Action<IInteractable> OnInteracted;

        private void Awake()
        {
            input = GetComponent<PlayerInputHandler>();
            if (rayOrigin == null) rayOrigin = transform;
        }

        private void Update()
        {
            ScanForInteractables();
            HandleInteractionInput();
        }

        private void ScanForInteractables()
        {
            Vector3 origin = rayOrigin.position + Vector3.up * 0.8f;
            Vector3 direction = transform.forward;

            Collider[] hits = Physics.OverlapSphere(origin, interactionRadius, interactableLayers, QueryTriggerInteraction.Collide);
            IInteractable bestTarget = null;
            float bestDistance = float.MaxValue;

            foreach (var hit in hits)
            {
                if (hit.gameObject == gameObject) continue;

                var interactable = hit.GetComponent<IInteractable>() ?? hit.GetComponentInParent<IInteractable>();
                if (interactable != null && interactable.CanInteract(this))
                {
                    float dist = Vector3.Distance(origin, hit.transform.position);
                    if (dist < bestDistance)
                    {
                        bestDistance = dist;
                        bestTarget = interactable;
                    }
                }
            }

            if (bestTarget != currentTarget)
            {
                currentTarget?.OnFocusExit();
                currentTarget = bestTarget;
                currentTarget?.OnFocusEnter();
                OnFocusChanged?.Invoke(currentTarget);
            }
        }

        private void HandleInteractionInput()
        {
            if (input.InteractTriggered && currentTarget != null)
            {
                if (currentTarget.CanInteract(this))
                {
                    currentTarget.Interact(this);
                    OnInteracted?.Invoke(currentTarget);
                    input.ConsumeInteract();
                }
            }
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Vector3 origin = (rayOrigin != null ? rayOrigin.position : transform.position) + Vector3.up * 0.8f;
            Gizmos.DrawWireSphere(origin, interactionRadius);
        }
    }
}
