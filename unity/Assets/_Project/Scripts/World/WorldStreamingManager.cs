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
    /// Cell streaming governor: drives authored <see cref="WorldStreamingCell"/> visibility from the
    /// player's position with predictive directional prefetching, without frame hitches.
    ///
    /// It deliberately does NOT own region travel. Region loading (additive pre-load, spawn
    /// positioning, old-scene unload, boundary cleanup) belongs to
    /// <see cref="RegionalSceneManager"/>, which is the single authoritative path used by the state
    /// map, the game manager and QA. This class previously carried a second, unused
    /// <c>LoadSceneMode.Single</c> travel coroutine; a Single load destroys the shared
    /// '--- MANAGERS ---' GameObject and therefore killed its own coroutine mid-transition, so the
    /// two paths could never both be correct. <see cref="TransitionToRegion"/> now delegates.
    ///
    /// No cells are fabricated at startup. A cell exists only if a region scene actually authored
    /// and registered one via <see cref="RegisterCell"/>; a region with none reports that fact once
    /// instead of pretending three placeholder cells exist at hard-coded coordinates.
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
        private float playerRelocateTimer = 0f;
        private bool reportedMissingPlayer = false;

        private const float PlayerRelocateInterval = 1.0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            LocatePlayer();
            PruneCellsForRegion(activeRegionId);

            // Travel is delegated, so this manager mirrors the authoritative transition instead of
            // running its own. That keeps OnRegionTransitionStarted/OnRegionTransitionCompleted and
            // IsTransitioning reporting the real scene load rather than a dead local flag.
            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadStarted += HandleRegionLoadStarted;
                RegionalSceneManager.Instance.OnRegionLoadCompleted += HandleRegionLoadCompleted;
                RegionalSceneManager.Instance.OnRegionLoadFailed += HandleRegionLoadFailed;
            }
        }

        private void OnDestroy()
        {
            if (RegionalSceneManager.Instance != null)
            {
                RegionalSceneManager.Instance.OnRegionLoadStarted -= HandleRegionLoadStarted;
                RegionalSceneManager.Instance.OnRegionLoadCompleted -= HandleRegionLoadCompleted;
                RegionalSceneManager.Instance.OnRegionLoadFailed -= HandleRegionLoadFailed;
            }
        }

        private void HandleRegionLoadStarted(string regionId)
        {
            isTransitioningRegion = true;
            OnRegionTransitionStarted?.Invoke(regionId);
        }

        private void HandleRegionLoadCompleted(string regionId)
        {
            activeRegionId = regionId;
            isTransitioningRegion = false;
            LocatePlayer();
            PruneCellsForRegion(regionId);
            OnRegionTransitionCompleted?.Invoke(regionId);
        }

        private void HandleRegionLoadFailed(string regionId, string error)
        {
            isTransitioningRegion = false;
            Debug.LogError($"[WorldStreamingManager] Region transition to '{regionId}' failed: {error}");
        }

        /// <summary>
        /// FindWithTag walks every active GameObject, so a missing player reference must not be
        /// retried every frame. Retried on a timer instead, and reported once so a genuinely
        /// missing player is visible rather than silently retried forever.
        /// </summary>
        private void LocatePlayer()
        {
            GameObject p = GameObject.FindWithTag("Player");
            if (p != null)
            {
                playerTransform = p.transform;
                lastPlayerPosition = playerTransform.position;
                reportedMissingPlayer = false;
            }
            else if (!reportedMissingPlayer)
            {
                reportedMissingPlayer = true;
                Debug.LogWarning(
                    "[WorldStreamingManager] No GameObject tagged 'Player' is active. " +
                    "Cell streaming evaluation is suspended until one appears.");
            }
        }

        private void Update()
        {
            if (playerTransform == null)
            {
                playerRelocateTimer += Time.unscaledDeltaTime;
                if (playerRelocateTimer >= PlayerRelocateInterval) playerRelocateTimer = 0f;
                else return;
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

        /// <summary>
        /// Region travel is owned by <see cref="RegionalSceneManager"/>. This entry point is kept so
        /// external callers and existing serialized references do not break, but it no longer runs a
        /// second, competing load path.
        /// </summary>
        public void TransitionToRegion(string targetRegionId)
        {
            if (isTransitioningRegion)
            {
                Debug.LogWarning("[WorldStreamingManager] A region transition is already active.");
                return;
            }

            // TryGetRegion, not GetRegion: GetRegion silently substitutes Chennai for an unknown id, which
            // would report travel to a region the player never asked for.
            if (!TamilNaduGeography.TryGetRegion(targetRegionId, out RegionGeoLocation geo))
            {
                Debug.LogError($"[WorldStreamingManager] Unknown region id '{targetRegionId}'; travel not started.");
                return;
            }

            RegionalSceneManager sceneManager = RegionalSceneManager.Instance;
            if (sceneManager == null)
            {
                Debug.LogError("[WorldStreamingManager] RegionalSceneManager is not present; travel not started.");
                return;
            }

            Debug.Log($"[WorldStreamingManager] Delegating travel to {DescribeGeo(geo)} to RegionalSceneManager (single authoritative scene-transition path).");
            sceneManager.TravelToRegion(targetRegionId);
        }

        private static string DescribeGeo(RegionGeoLocation geo)
        {
            // RegionGeoLocation is a struct, so "no geo" is represented by the failed TryGetRegion
            // rather than by a null check.
            return $"{geo.englishName} ({geo.tamilName})";
        }

        public void RegisterCell(WorldStreamingCell cell)
        {
            if (cell == null) return;
            if (registeredCells.Contains(cell)) return;

            registeredCells.Add(cell);
            Debug.Log($"[WorldStreamingManager] Registered authored streaming cell '{cell.cellId}' for region '{cell.regionId}'.");
        }

        /// <summary>
        /// Drops cells belonging to other regions and activates whatever the incoming region actually
        /// authored. Reports honestly when the region authored none - it does not substitute
        /// placeholder cells, because fabricated cells report streaming activity that is not happening.
        /// </summary>
        private void PruneCellsForRegion(string region)
        {
            for (int i = registeredCells.Count - 1; i >= 0; i--)
            {
                WorldStreamingCell cell = registeredCells[i];
                if (cell == null || cell.regionId != region)
                {
                    registeredCells.RemoveAt(i);
                }
            }

            int authored = 0;
            for (int i = 0; i < registeredCells.Count; i++)
            {
                WorldStreamingCell cell = registeredCells[i];
                if (cell == null) continue;

                authored++;
                // Everything authored for this region starts active; EvaluateStreamingCells takes
                // over from here. A cell with no root object is a scene authoring error and is
                // reported rather than silently advanced through its state machine.
                if (cell.cellRootObject == null)
                {
                    Debug.LogError(
                        $"[WorldStreamingManager] Streaming cell '{cell.cellId}' has no cellRootObject. " +
                        "It cannot be streamed, so its state transitions are inert.");
                    continue;
                }

                SetCellState(cell, CellStreamingState.Active);
            }

            if (authored == 0)
            {
                Debug.LogWarning(
                    $"[WorldStreamingManager] Region '{region}' authored no streaming cells. " +
                    "Streaming evaluation is inactive for this region; this is a content gap, not a failure.");
            }
        }
    }
}
