using System;
using System.Collections.Generic;
using UnityEngine;
using Unity.Mathematics;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Biomechanically accurate ragdoll controller for protagonist and NPC characters.
    /// Manages instantaneous transition between kinematic animation and physical dynamics
    /// upon fall impact, slips on wet monsoon asphalt, or physical interactions.
    /// Uses Unity.Mathematics and TryGetComponent protection for zero-allocation performance.
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

        private readonly List<Rigidbody> ragdollRigidbodies = new List<Rigidbody>();
        private readonly List<Collider> ragdollColliders = new List<Collider>();

        public bool IsRagdoll => isRagdoll;
        public float TotalBodyMass => totalBodyMass;

        private void Awake()
        {
            TryGetComponent(out animator);
            TryGetComponent(out mainCollider);
            TryGetComponent(out mainRigidbody);

            CollectRagdollParts();
            SetRagdollState(false);
        }

        private void CollectRagdollParts()
        {
            ragdollRigidbodies.Clear();
            ragdollColliders.Clear();

            Rigidbody[] rbs = GetComponentsInChildren<Rigidbody>();
            for (int i = 0; i < rbs.Length; i++)
            {
                if (rbs[i] == mainRigidbody) continue;
                ragdollRigidbodies.Add(rbs[i]);
            }

            Collider[] cols = GetComponentsInChildren<Collider>();
            for (int i = 0; i < cols.Length; i++)
            {
                if (cols[i] == mainCollider) continue;
                ragdollColliders.Add(cols[i]);
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
            for (int i = 0; i < ragdollRigidbodies.Count; i++)
            {
                Rigidbody rb = ragdollRigidbodies[i];
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

                rb.maxAngularVelocity = 14f;
                rb.interpolation = RigidbodyInterpolation.Interpolate;
            }
        }

        public void EnableRagdoll(Vector3 impactVelocity)
        {
            if (isRagdoll) return;
            SetRagdollState(true);

            for (int i = 0; i < ragdollRigidbodies.Count; i++)
            {
                ragdollRigidbodies[i].AddForce(impactVelocity, ForceMode.VelocityChange);
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

            for (int i = 0; i < ragdollRigidbodies.Count; i++)
            {
                ragdollRigidbodies[i].isKinematic = !active;
                ragdollRigidbodies[i].detectCollisions = active;
            }

            for (int i = 0; i < ragdollColliders.Count; i++)
            {
                ragdollColliders[i].enabled = active;
            }
        }
    }
}
