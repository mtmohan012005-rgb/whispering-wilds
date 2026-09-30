using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Quality;

namespace WhisperingWilds.NPC
{
    public enum NPCTier
    {
        Near = 0,       // < 20m: Full 10Hz AI tick, full Animator, full interaction
        Medium = 1,     // 20m - 50m: 2.5Hz AI tick, reduced Animator culling, full visual model
        Far = 2,        // 50m - 120m: 0.5Hz coarse AI tick, culled Animator, interaction collider off
        Hibernating = 3 // > 120m: 0.1Hz logical check only, zero Animator, stopped navigation
    }

    /// <summary>
    /// Distributes CPU animation and AI simulation budgets across crowds of NPCs
    /// based on distance to the main camera, using hysteresis buffers to eliminate tier flipping,
    /// staggering updates across frames, and exposing profiler-friendly telemetry metrics.
    /// </summary>
    [DisallowMultipleComponent]
    public class NPCPerformanceTierManager : MonoBehaviour
    {
        public static NPCPerformanceTierManager Instance { get; private set; }

        [Header("Distance Thresholds (Meters)")]
        [SerializeField] private float nearDistance = 20f;
        [SerializeField] private float mediumDistance = 50f;
        [SerializeField] private float farDistance = 120f;
        [SerializeField] private float hysteresisBuffer = 4.0f; // Eliminates rapid tier flip-flopping

        [Header("AI Tick Intervals")]
        [SerializeField] private float nearTickInterval = 0.1f;    // 10 Hz
        [SerializeField] private float mediumTickInterval = 0.4f;  // 2.5 Hz
        [SerializeField] private float farTickInterval = 2.0f;     // 0.5 Hz
        [SerializeField] private float hibernatingTickInterval = 10f; // 0.1 Hz

        [Header("Batch Budget")]
        [SerializeField] private int maxDistanceEvalsPerFrame = 8;
        [SerializeField] private int maxActiveNPCBudget = 32;

        // Telemetry Counters
        public int ActiveNPCCount => activeNPCs.Count;
        public int NearCount { get; private set; }
        public int MediumCount { get; private set; }
        public int FarCount { get; private set; }
        public int HibernatingCount { get; private set; }
        public int DecisionTicksLastSecond { get; private set; }
        public int PathRequestsLastSecond { get; private set; }
        public int TotalStuckRecoveries { get; private set; }

        private readonly List<NPCCharacter> activeNPCs = new List<NPCCharacter>();
        private readonly List<float> npcTimers = new List<float>();

        private Transform playerCameraTransform;
        private int currentBatchCursor = 0;
        private float telemetryTimer = 0f;
        private int tickCounter = 0;
        private int pathRequestCounter = 0;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            AcquireCamera();
            RefreshNPCList();

            if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.OnQualityPresetChanged += HandleQualityPresetApplied;
                HandleQualityPresetApplied(QualityPresetManager.Instance.CurrentTier, QualityPresetManager.Instance.GetPresetSettings(QualityPresetManager.Instance.CurrentTier));
            }
        }

        private void OnDestroy()
        {
            if (QualityPresetManager.Instance != null)
            {
                QualityPresetManager.Instance.OnQualityPresetChanged -= HandleQualityPresetApplied;
            }
        }

        private void AcquireCamera()
        {
            if (Camera.main != null)
            {
                playerCameraTransform = Camera.main.transform;
            }
            else
            {
                var cam = FindAnyObjectByType<Camera>();
                if (cam != null) playerCameraTransform = cam.transform;
            }
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
                    npcTimers.Add(UnityEngine.Random.Range(0f, 0.2f)); // Stagger phase
                }
            }
            UpdateTierCounts();
        }

        public void RegisterNPC(NPCCharacter npc)
        {
            if (npc != null && !activeNPCs.Contains(npc))
            {
                activeNPCs.Add(npc);
                npcTimers.Add(0f);
                UpdateTierCounts();
            }
        }

        public void UnregisterNPC(NPCCharacter npc)
        {
            int idx = activeNPCs.IndexOf(npc);
            if (idx >= 0)
            {
                activeNPCs.RemoveAt(idx);
                npcTimers.RemoveAt(idx);
                UpdateTierCounts();
            }
        }

        public void NotifyStuckRecovery()
        {
            TotalStuckRecoveries++;
        }

        public void NotifyPathRequest()
        {
            pathRequestCounter++;
        }

        private void Update()
        {
            if (playerCameraTransform == null)
            {
                AcquireCamera();
            }

            float dt = Time.deltaTime;
            Vector3 camPos = playerCameraTransform != null ? playerCameraTransform.position : Vector3.zero;

            // 1. Staggered distance tier evaluation with hysteresis
            if (activeNPCs.Count > 0)
            {
                EvaluateTiersBatch(camPos);
                TickActiveNPCs(dt);
            }

            // 2. Telemetry tracking
            telemetryTimer += dt;
            if (telemetryTimer >= 1.0f)
            {
                DecisionTicksLastSecond = tickCounter;
                PathRequestsLastSecond = pathRequestCounter;
                tickCounter = 0;
                pathRequestCounter = 0;
                telemetryTimer = 0f;
            }
        }

        private void EvaluateTiersBatch(Vector3 camPos)
        {
            int count = activeNPCs.Count;
            int evals = Mathf.Min(maxDistanceEvalsPerFrame, count);

            for (int i = 0; i < evals; i++)
            {
                currentBatchCursor = (currentBatchCursor + 1) % count;
                var npc = activeNPCs[currentBatchCursor];
                if (npc == null) continue;

                float dist = Vector3.Distance(npc.transform.position, camPos);
                NPCTier current = npc.CurrentTier;
                NPCTier targetTier = current;

                // Hysteresis-safe tier boundaries to avoid ping-ponging
                switch (current)
                {
                    case NPCTier.Near:
                        if (dist > nearDistance + hysteresisBuffer)
                            targetTier = NPCTier.Medium;
                        break;

                    case NPCTier.Medium:
                        if (dist < nearDistance - hysteresisBuffer)
                            targetTier = NPCTier.Near;
                        else if (dist > mediumDistance + hysteresisBuffer)
                            targetTier = NPCTier.Far;
                        break;

                    case NPCTier.Far:
                        if (dist < mediumDistance - hysteresisBuffer)
                            targetTier = NPCTier.Medium;
                        else if (dist > farDistance + hysteresisBuffer)
                            targetTier = NPCTier.Hibernating;
                        break;

                    case NPCTier.Hibernating:
                        if (dist < farDistance - hysteresisBuffer)
                            targetTier = NPCTier.Far;
                        break;
                }

                if (current != targetTier)
                {
                    npc.SetTier(targetTier);
                    UpdateTierCounts();
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
                    tickCounter++;
                    timer = 0f;
                }

                npcTimers[i] = timer;
            }
        }

        private void UpdateTierCounts()
        {
            int near = 0, med = 0, far = 0, hib = 0;
            for (int i = 0; i < activeNPCs.Count; i++)
            {
                var npc = activeNPCs[i];
                if (npc == null) continue;
                switch (npc.CurrentTier)
                {
                    case NPCTier.Near: near++; break;
                    case NPCTier.Medium: med++; break;
                    case NPCTier.Far: far++; break;
                    case NPCTier.Hibernating: hib++; break;
                }
            }
            NearCount = near;
            MediumCount = med;
            FarCount = far;
            HibernatingCount = hib;
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

        private void HandleQualityPresetApplied(QualityTier preset, QualityPresetSettings settings)
        {
            // Tick cadence and distances are simulation-quality choices, so they stay here.
            // The active-entity budget is scaled by the preset's own npcDensityFactor so the
            // QualityPresetManager table actually drives population instead of being ignored.
            int baseBudget = 10;

            switch (preset)
            {
                case QualityTier.VeryLow:
                    baseBudget = 10;
                    nearTickInterval = 0.15f;
                    mediumTickInterval = 0.6f;
                    farTickInterval = 3.0f;
                    nearDistance = 15f;
                    mediumDistance = 35f;
                    break;

                case QualityTier.Low:
                    baseBudget = 16;
                    nearTickInterval = 0.12f;
                    mediumTickInterval = 0.5f;
                    farTickInterval = 2.5f;
                    nearDistance = 18f;
                    mediumDistance = 45f;
                    break;

                case QualityTier.Medium:
                    baseBudget = 24;
                    nearTickInterval = 0.1f;
                    mediumTickInterval = 0.4f;
                    farTickInterval = 2.0f;
                    nearDistance = 20f;
                    mediumDistance = 50f;
                    break;

                case QualityTier.High:
                case QualityTier.Ultra:
                    baseBudget = 40;
                    nearTickInterval = 0.08f;
                    mediumTickInterval = 0.35f;
                    farTickInterval = 1.8f;
                    nearDistance = 25f;
                    mediumDistance = 60f;
                    break;
            }

            float densityFactor = settings != null ? settings.npcDensityFactor : 1f;
            maxActiveNPCBudget = Mathf.Max(1, Mathf.RoundToInt(baseBudget * densityFactor));

            RefreshNPCList();
        }
    }
}
