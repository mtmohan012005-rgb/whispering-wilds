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
                Destroy(gameObject);
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

        public void SelectRegionForTravel(string regionId)
        {
            if (RegionalSceneManager.Instance != null)
            {
                ToggleMap();
                RegionalSceneManager.Instance.TravelToRegion(regionId);
            }
        }
    }
}
