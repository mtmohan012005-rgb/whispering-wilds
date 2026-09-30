using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.NPC
{
    public enum NPCTier
    {
        Near = 0,       // < 20m: Full 10Hz AI tick, full Animator, full interaction
        Medium = 1,     // 20m - 50m: 3Hz AI tick, reduced Animator culling, full visual model
        Far = 2,        // 50m - 120m: 0.5Hz coarse AI tick, culled Animator, interaction collider off
        Hibernating = 3 // > 120m: 0.1Hz logical check only, zero Animator, stopped navigation
    }

    /// <summary>
    /// Distributes CPU animation and AI simulation budgets across crowds of NPCs
    /// based on distance to the main camera, staggering updates across frames to prevent CPU spikes.
    /// Throttles both the Animator and the actual AI logic/navigation.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCPerformanceTierManager : MonoBehaviour
    {
        public static NPCPerformanceTierManager Instance { get; private set; }

        [Header("Distance Thresholds (Meters)")]
        [SerializeField] private float nearDistance = 20f;
        [SerializeField] private float mediumDistance = 50f;
        [SerializeField] private float farDistance = 120f;

        [Header("AI Tick Intervals")]
        [SerializeField] private float nearTickInterval = 0.1f;    // 10 Hz
        [SerializeField] private float mediumTickInterval = 0.35f; // ~3 Hz
        [SerializeField] private float farTickInterval = 2.0f;     // 0.5 Hz
        [SerializeField] private float hibernatingTickInterval = 10f; // 0.1 Hz

        [Header("Batch Budget")]
        [SerializeField] private int maxDistanceEvalsPerFrame = 8;

        private readonly List<NPCCharacter> activeNPCs = new List<NPCCharacter>();
        private readonly List<float> npcTimers = new List<float>();

        private Transform playerCameraTransform;
        private int currentBatchCursor = 0;

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
            npcTimers.Clear();

            var found = FindObjectsByType<NPCCharacter>();
            foreach (var npc in found)
            {
                if (npc != null)
                {
                    activeNPCs.Add(npc);
                    npcTimers.Add(Random.Range(0f, 0.2f)); // Stagger starting phases
                }
            }
        }

        public void RegisterNPC(NPCCharacter npc)
        {
            if (npc != null && !activeNPCs.Contains(npc))
            {
                activeNPCs.Add(npc);
                npcTimers.Add(0f);
            }
        }

        public void UnregisterNPC(NPCCharacter npc)
        {
            int idx = activeNPCs.IndexOf(npc);
            if (idx >= 0)
            {
                activeNPCs.RemoveAt(idx);
                npcTimers.RemoveAt(idx);
            }
        }

        private void Update()
        {
            if (activeNPCs.Count == 0) return;

            if (playerCameraTransform == null && Camera.main != null)
            {
                playerCameraTransform = Camera.main.transform;
            }

            float dt = Time.deltaTime;
            Vector3 camPos = playerCameraTransform != null ? playerCameraTransform.position : Vector3.zero;

            // 1. Staggered distance tier evaluation
            EvaluateTiersBatch(camPos);

            // 2. Throttled AI execution per NPC
            TickActiveNPCs(dt);
        }

        private void EvaluateTiersBatch(Vector3 camPos)
        {
            int count = activeNPCs.Count;
            int evals = Mathf.Min(maxDistanceEvalsPerFrame, count);

            float nearSqr = nearDistance * nearDistance;
            float medSqr = mediumDistance * mediumDistance;
            float farSqr = farDistance * farDistance;

            for (int i = 0; i < evals; i++)
            {
                currentBatchCursor = (currentBatchCursor + 1) % count;
                var npc = activeNPCs[currentBatchCursor];
                if (npc == null) continue;

                float distSqr = (npc.transform.position - camPos).sqrMagnitude;
                NPCTier targetTier;

                if (distSqr < nearSqr)
                {
                    targetTier = NPCTier.Near;
                }
                else if (distSqr < medSqr)
                {
                    targetTier = NPCTier.Medium;
                }
                else if (distSqr < farSqr)
                {
                    targetTier = NPCTier.Far;
                }
                else
                {
                    targetTier = NPCTier.Hibernating;
                }

                if (npc.CurrentTier != targetTier)
                {
                    npc.SetTier(targetTier);
                }
            }
        }

        private void TickActiveNPCs(float dt)
        {
            for (int i = 0; i < activeNPCs.Count; i++)
            {
                var npc = activeNPCs[i];
                if (npc == null) continue;

                float timer = npcTimers[i] + dt;
                float interval = GetIntervalForTier(npc.CurrentTier);

                if (timer >= interval)
                {
                    npc.TickAI(timer);
                    timer = 0f;
                }

                npcTimers[i] = timer;
            }
        }

        private float GetIntervalForTier(NPCTier tier)
        {
            switch (tier)
            {
                case NPCTier.Near: return nearTickInterval;
                case NPCTier.Medium: return mediumTickInterval;
                case NPCTier.Far: return farTickInterval;
                case NPCTier.Hibernating: return hibernatingTickInterval;
                default: return 1.0f;
            }
        }
    }
}
