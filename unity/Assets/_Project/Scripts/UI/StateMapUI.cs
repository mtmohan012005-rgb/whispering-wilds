using System;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.World;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Interactive Tamil Nadu State Map and Regional Map interface.
    /// Visualizes authentic OpenStreetMap highway networks, regional landmarks,
    /// discovery pins, and fast-travel transit points.
    /// </summary>
    [DisallowMultipleComponent]
    public class StateMapUI : MonoBehaviour
    {
        public static StateMapUI Instance { get; private set; }

        [Header("UI Panels")]
        [SerializeField] private GameObject mapCanvas;
        [SerializeField] private bool isOpen = false;

        public bool IsOpen => isOpen;

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
        }

        private void Update()
        {
#if ENABLE_INPUT_SYSTEM
            var kb = Keyboard.current;
            if (kb != null && kb.mKey.wasPressedThisFrame)
            {
                ToggleMap();
            }
#endif
        }

        public void ToggleMap()
        {
            isOpen = !isOpen;
            if (mapCanvas != null)
            {
                mapCanvas.SetActive(isOpen);
            }

            if (isOpen)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
            else
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

/// <summary>
        /// Whether the map should offer this destination as travelable. Map buttons query this to
        /// render locked and deferred markers instead of presenting every region as equally open.
        /// </summary>
        public static bool IsRegionSelectable(string regionId) => RegionUnlocks.IsUnlocked(regionId);

        /// <summary>
        /// Handles a click on a map destination.
        ///
        /// The map only closes on an accepted click. A refused destination keeps the map open and
        /// still routes through <see cref="RegionalSceneManager.TravelToRegion"/> so the refusal is
        /// explained rather than the click silently doing nothing; that method re-checks the gate
        /// itself, which is what keeps the gate authoritative instead of a UI-level courtesy.
        /// </summary>
        public void SelectRegionForTravel(string regionId)
        {
            if (RegionalSceneManager.Instance == null) return;

            if (RegionUnlocks.IsUnlocked(regionId)) ToggleMap();

            RegionalSceneManager.Instance.TravelToRegion(regionId);
        }
    }
}
