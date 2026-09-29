using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Quality;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    public enum CellStreamingState
    {
        Unloaded,
        Loading,
        Loaded,
        Active,
        Inactive,
        Unloading
    }

    [Serializable]
    public class WorldStreamingCell
    {
        public string cellId;
        public string regionId;
        public Vector3 worldBoundsCenter;
        public float activationRadius = 80f;
        public float prefetchRadius = 140f;
        public CellStreamingState state = CellStreamingState.Unloaded;
        public GameObject cellRootObject;
    }

    /// <summary>
    /// Single authoritative World Streaming Governor managing regional transitions,
    /// cell state machines (UNLOADED, LOADING, LOADED, ACTIVE, INACTIVE, UNLOADING),
    /// and predictive directional prefetching without frame hitches or race conditions.
    /// </summary>
    [DisallowMultipleComponent]
    public class WorldStreamingManager : MonoBehaviour
    {
        public static WorldStreamingManager Instance { get; private set; }

        [Header("Active Region")]
        [SerializeField] private string activeRegionId = "chennai";
        [SerializeField] private bool isTransitioningRegion = false;

        [Header("Cell Streaming")]
        [SerializeField] private List<WorldStreamingCell> registeredCells = new List<WorldStreamingCell>();
        [SerializeField] private float cellEvaluationInterval = 0.5f;

        public string ActiveRegionId => activeRegionId;
        public bool IsTransitioning => isTransitioningRegion;

        public event Action<string> OnRegionTransitionStarted;
        public event Action<string> OnRegionTransitionCompleted;
        public event Action<string, CellStreamingState> OnCellStateChanged;

        private Transform playerTransform;
        private Vector3 lastPlayerPosition;
        private Vector3 playerVelocityDir;
        private float evalTimer = 0f;

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
            LocatePlayer();
            InitializeDefaultCellsForRegion(activeRegionId);
        }

        private void LocatePlayer()
        {
            var p = GameObject.FindWithTag("Player");
            if (p != null)
            {
                playerTransform = p.transform;
                lastPlayerPosition = playerTransform.position;
            }
        }

        private void Update()
        {
            if (playerTransform == null)
            {
                LocatePlayer();
                return;
            }

            evalTimer += Time.deltaTime;
            if (evalTimer >= cellEvaluationInterval)
            {
                evalTimer = 0f;
                UpdatePlayerDirection();
                EvaluateStreamingCells();
            }
        }

        private void UpdatePlayerDirection()
        {
            Vector3 delta = playerTransform.position - lastPlayerPosition;
            if (delta.sqrMagnitude > 0.05f)
            {
                playerVelocityDir = delta.normalized;
            }
            lastPlayerPosition = playerTransform.position;
        }

        private void EvaluateStreamingCells()
        {
            if (isTransitioningRegion) return;

            Vector3 pPos = playerTransform.position;

            for (int i = 0; i < registeredCells.Count; i++)
            {
                var cell = registeredCells[i];
                if (cell == null || cell.regionId != activeRegionId) continue;

                float dist = Vector3.Distance(pPos, cell.worldBoundsCenter);

                // Predictive direction bonus: prefetch cells in player's forward vector
                Vector3 toCell = (cell.worldBoundsCenter - pPos).normalized;
                float forwardDot = Vector3.Dot(playerVelocityDir, toCell);
                float effectiveDistance = forwardDot > 0.4f ? dist - 25f : dist;

                if (effectiveDistance <= cell.activationRadius)
                {
                    if (cell.state != CellStreamingState.Active && cell.state != CellStreamingState.Loading)
                    {
                        SetCellState(cell, CellStreamingState.Active);
                    }
                }
                else if (effectiveDistance <= cell.prefetchRadius)
                {
                    if (cell.state == CellStreamingState.Unloaded)
                    {
                        SetCellState(cell, CellStreamingState.Loaded);
                    }
                    else if (cell.state == CellStreamingState.Active)
                    {
                        SetCellState(cell, CellStreamingState.Inactive);
                    }
                }
                else
                {
                    if (cell.state != CellStreamingState.Unloaded && cell.state != CellStreamingState.Unloading)
                    {
                        SetCellState(cell, CellStreamingState.Unloaded);
                    }
                }
            }
        }

        private void SetCellState(WorldStreamingCell cell, CellStreamingState newState)
        {
            cell.state = newState;
            if (cell.cellRootObject != null)
            {
                bool shouldBeActive = newState == CellStreamingState.Active;
                cell.cellRootObject.SetActive(shouldBeActive);
            }
            OnCellStateChanged?.Invoke(cell.cellId, newState);
        }

        public void TransitionToRegion(string targetRegionId)
        {
            if (isTransitioningRegion)
            {
                Debug.LogWarning("[WorldStreamingManager] Transition already active.");
                return;
            }

            StartCoroutine(RegionTransitionRoutine(targetRegionId));
        }

        private IEnumerator RegionTransitionRoutine(string targetRegionId)
        {
            isTransitioningRegion = true;
            RegionGeoLocation geo = TamilNaduGeography.GetRegion(targetRegionId);
            OnRegionTransitionStarted?.Invoke(targetRegionId);

            Debug.Log($"<color=#00D2FF><b>[WorldStreamingManager]</b></color> Commencing streaming transition: {activeRegionId} -> {geo.englishName} ({geo.tamilName})");

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.SetRegionName(geo.englishName, geo.tamilName);
            }

            // 1. Boundary Memory Cleanup of prior region
            if (MemoryManager.Instance != null)
            {
                bool cleanupDone = false;
                MemoryManager.Instance.ExecuteControlledBoundaryCleanup(() => cleanupDone = true);
                while (!cleanupDone) yield return null;
            }

            yield return new WaitForSecondsRealtime(0.15f);

            // 2. Asynchronous Scene Load
            string sceneName = geo.sceneName;
            AsyncOperation op = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            if (op != null)
            {
                while (!op.isDone) yield return null;
            }

            activeRegionId = targetRegionId;
            isTransitioningRegion = false;
            InitializeDefaultCellsForRegion(targetRegionId);
            LocatePlayer();

            Debug.Log($"<color=#00FF99><b>[WorldStreamingManager]</b></color> Region arrival complete: {geo.englishName}");
            OnRegionTransitionCompleted?.Invoke(targetRegionId);
        }

        public void RegisterCell(WorldStreamingCell cell)
        {
            if (!registeredCells.Contains(cell))
            {
                registeredCells.Add(cell);
            }
        }

        private void InitializeDefaultCellsForRegion(string region)
        {
            registeredCells.Clear();

            // Default 3 playable cells per region (Core Plaza, Perimeter, Approach Road)
            registeredCells.Add(new WorldStreamingCell
            {
                cellId = $"{region}_cell_core",
                regionId = region,
                worldBoundsCenter = Vector3.zero,
                activationRadius = 90f,
                prefetchRadius = 160f,
                state = CellStreamingState.Active
            });

            registeredCells.Add(new WorldStreamingCell
            {
                cellId = $"{region}_cell_north",
                regionId = region,
                worldBoundsCenter = new Vector3(0f, 0f, 100f),
                activationRadius = 90f,
                prefetchRadius = 160f,
                state = CellStreamingState.Loaded
            });

            registeredCells.Add(new WorldStreamingCell
            {
                cellId = $"{region}_cell_south",
                regionId = region,
                worldBoundsCenter = new Vector3(0f, 0f, -100f),
                activationRadius = 90f,
                prefetchRadius = 160f,
                state = CellStreamingState.Loaded
            });
        }
    }
}
