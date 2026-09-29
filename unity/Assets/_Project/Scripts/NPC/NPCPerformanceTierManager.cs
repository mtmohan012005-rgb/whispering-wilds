using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    public enum NPCTier
    {
        Near = 0,     // < 20m: Full 60Hz, IK, dialogue
        Medium = 1,   // 20m - 50m: 10Hz tick, full mesh
        Far = 2,      // 50m - 120m: 2Hz tick, simplified simulation
        Hibernating = 3 // > 120m: Culled / sleeping
    }

    /// <summary>
    /// Distributes CPU animation and AI simulation budgets across crowds of NPCs
    /// based on distance to the main camera and active quality preset.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCPerformanceTierManager : MonoBehaviour
    {
        public static NPCPerformanceTierManager Instance { get; private set; }

        [Header("Distance Thresholds (Meters)")]
        [SerializeField] private float nearDistance = 20f;
        [SerializeField] private float mediumDistance = 50f;
        [SerializeField] private float farDistance = 120f;

        [Header("Update Pacing")]
        [SerializeField] private float evaluationInterval = 0.5f;

        private List<NPCCharacter> activeNPCs = new List<NPCCharacter>();
        private Transform playerCameraTransform;
        private float evalTimer = 0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (Camera.main != null)
            {
                playerCameraTransform = Camera.main.transform;
            }
            RefreshNPCList();
        }

        public void RefreshNPCList()
        {
            activeNPCs.Clear();
            activeNPCs.AddRange(Object.FindObjectsByType<NPCCharacter>());
        }

        private void Update()
        {
            evalTimer += Time.deltaTime;
            if (evalTimer >= evaluationInterval)
            {
                evalTimer = 0f;
                UpdateTiers();
            }
        }

        private void UpdateTiers()
        {
            if (playerCameraTransform == null)
            {
                if (Camera.main != null) playerCameraTransform = Camera.main.transform;
                else return;
            }

            Vector3 camPos = playerCameraTransform.position;

            for (int i = 0; i < activeNPCs.Count; i++)
            {
                var npc = activeNPCs[i];
                if (npc == null) continue;

                float distSqr = (npc.transform.position - camPos).sqrMagnitude;

                if (distSqr < nearDistance * nearDistance)
                {
                    ApplyNPCTier(npc, NPCTier.Near);
                }
                else if (distSqr < mediumDistance * mediumDistance)
                {
                    ApplyNPCTier(npc, NPCTier.Medium);
                }
                else if (distSqr < farDistance * farDistance)
                {
                    ApplyNPCTier(npc, NPCTier.Far);
                }
                else
                {
                    ApplyNPCTier(npc, NPCTier.Hibernating);
                }
            }
        }

        private void ApplyNPCTier(NPCCharacter npc, NPCTier tier)
        {
            var animator = npc.GetComponentInChildren<Animator>();
            if (animator == null) return;

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
    }
}
