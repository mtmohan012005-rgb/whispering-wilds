using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Biomechanically accurate ragdoll controller for protagonist and NPC characters.
    /// Manages instantaneous transition between kinematic animation and physical dynamics
    /// upon fall impact, slips on wet monsoon asphalt, or physical interactions.
    /// </summary>
    [DisallowMultipleComponent]
    public class CharacterRagdollController : MonoBehaviour
    {
        [Header("State")]
        [SerializeField] private bool isRagdoll = false;
        [SerializeField] private float totalBodyMass = 72.0f; // Average adult male mass (kg)

        [Header("Components")]
        private Animator animator;
        private Collider mainCollider;
        private Rigidbody mainRigidbody;

        private List<Rigidbody> ragdollRigidbodies = new List<Rigidbody>();
        private List<Collider> ragdollColliders = new List<Collider>();

        public bool IsRagdoll => isRagdoll;

        void Awake()
        {
            animator = GetComponent<Animator>();
            mainCollider = GetComponent<Collider>();
            mainRigidbody = GetComponent<Rigidbody>();

            CollectRagdollParts();
            SetRagdollState(false);
        }

        private void CollectRagdollParts()
        {
            ragdollRigidbodies.Clear();
            ragdollColliders.Clear();

            Rigidbody[] rbs = GetComponentsInChildren<Rigidbody>();
            foreach (Rigidbody rb in rbs)
            {
                if (rb == mainRigidbody) continue; // Skip root body
                ragdollRigidbodies.Add(rb);
            }

            Collider[] cols = GetComponentsInChildren<Collider>();
            foreach (Collider col in cols)
            {
                if (col == mainCollider) continue; // Skip root collider
                ragdollColliders.Add(col);
            }

            DistributeRealisticMass();
        }

        /// <summary>
        /// Distributes total body mass using standard human biomechanical weight proportions:
        /// Torso ~43%, Head ~7%, Each Arm ~5%, Each Leg ~16%
        /// </summary>
        private void DistributeRealisticMass()
        {
            if (ragdollRigidbodies.Count == 0) return;

            float perBoneMass = totalBodyMass / ragdollRigidbodies.Count;
            foreach (Rigidbody rb in ragdollRigidbodies)
            {
                string boneName = rb.name.ToLower();
                if (boneName.Contains("head"))
                    rb.mass = totalBodyMass * 0.07f;
                else if (boneName.Contains("spine") || boneName.Contains("hips") || boneName.Contains("torso"))
                    rb.mass = totalBodyMass * 0.43f / 3f;
                else if (boneName.Contains("leg") || boneName.Contains("thigh") || boneName.Contains("calf"))
                    rb.mass = totalBodyMass * 0.16f / 2f;
                else if (boneName.Contains("arm") || boneName.Contains("forearm"))
                    rb.mass = totalBodyMass * 0.05f / 2f;
                else
                    rb.mass = perBoneMass;

                // Max angular velocity for natural joint response
                rb.maxAngularVelocity = 14f;
                rb.interpolation = RigidbodyInterpolation.Interpolate;
            }
        }

        public void EnableRagdoll(Vector3 impactVelocity)
        {
            if (isRagdoll) return;
            SetRagdollState(true);

            // Apply impact impulse to hips/torso
            foreach (Rigidbody rb in ragdollRigidbodies)
            {
                rb.AddForce(impactVelocity, ForceMode.VelocityChange);
            }
        }

        public void DisableRagdoll()
        {
            if (!isRagdoll) return;
            SetRagdollState(false);
        }

        private void SetRagdollState(bool active)
        {
            isRagdoll = active;

            if (animator != null) animator.enabled = !active;
            if (mainCollider != null) mainCollider.enabled = !active;
            if (mainRigidbody != null) mainRigidbody.isKinematic = active;

            foreach (Rigidbody rb in ragdollRigidbodies)
            {
                rb.isKinematic = !active;
                rb.detectCollisions = active;
            }

            foreach (Collider col in ragdollColliders)
            {
                col.enabled = active;
            }
        }
    }
}
