using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.World;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// In-game Heads-Up Display (HUD) manager.
    /// Controls interaction prompts, currency counters, clock, and notification toasts.
    /// </summary>
    public class HUDManager : MonoBehaviour
    {
        public static HUDManager Instance { get; private set; }

        [Header("Interaction Prompt")]
        [SerializeField] private GameObject interactionPromptRoot;
        [SerializeField] private Text interactionPromptText;

        [Header("Clock & Region Display")]
        [SerializeField] private Text clockText;
        [SerializeField] private Text regionText;

        [Header("Status Counters")]
        [SerializeField] private Text currencyText;
        [SerializeField] private Text appearanceChangesText;

        [Header("Notification Toasts")]
        [SerializeField] private GameObject notificationToastRoot;
        [SerializeField] private Text notificationToastText;

        private Coroutine toastCoroutine;
        private PlayerInteractor boundInteractor;
        private PlayerAppearanceManager boundAppearance;

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
            if (interactionPromptRoot != null) interactionPromptRoot.SetActive(false);
            if (notificationToastRoot != null) notificationToastRoot.SetActive(false);

            BindPlayerEvents();

            if (InventoryManager.Instance != null)
            {
                InventoryManager.Instance.OnCurrencyChanged += UpdateCurrencyDisplay;
                UpdateCurrencyDisplay(InventoryManager.Instance.Currency);
            }
        }

        private void Update()
        {
            UpdateClockDisplay();
        }

        private void BindPlayerEvents()
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null)
            {
                var interactor = FindAnyObjectByType<PlayerInteractor>();
                if (interactor != null) player = interactor.gameObject;
            }

            if (player != null)
            {
                boundInteractor = player.GetComponent<PlayerInteractor>();
                if (boundInteractor != null)
                {
                    boundInteractor.OnFocusChanged += HandleFocusChanged;
                }

                boundAppearance = player.GetComponent<PlayerAppearanceManager>();
                if (boundAppearance != null)
                {
                    boundAppearance.OnPermanentAppearanceChanged += (profile, remaining) => UpdateAppearanceDisplay(remaining);
                    UpdateAppearanceDisplay(boundAppearance.RemainingPermanentChanges);
                }
            }
        }

        private void HandleFocusChanged(IInteractable interactable)
        {
            if (interactionPromptRoot == null || interactionPromptText == null) return;

            if (interactable != null)
            {
                interactionPromptRoot.SetActive(true);
                interactionPromptText.text = $"[E] {interactable.InteractionPrompt}";
            }
            else
            {
                interactionPromptRoot.SetActive(false);
            }
        }

        private void UpdateClockDisplay()
        {
            if (clockText != null && TimeOfDayManager.Instance != null)
            {
                int hour = TimeOfDayManager.Instance.WholeHour;
                int minute = TimeOfDayManager.Instance.Minutes;
                string period = hour >= 12 ? "PM" : "AM";
                int displayHour = hour % 12;
                if (displayHour == 0) displayHour = 12;

                clockText.text = $"{displayHour:00}:{minute:00} {period}";
            }
        }

        public void SetRegionName(string regionEn, string regionTa)
        {
            if (regionText != null)
            {
                regionText.text = $"{regionTa} • {regionEn}";
            }
        }

        private void UpdateCurrencyDisplay(int amount)
        {
            if (currencyText != null)
            {
                currencyText.text = $"{amount} 🪙";
            }
        }

        private void UpdateAppearanceDisplay(int remaining)
        {
            if (appearanceChangesText != null)
            {
                appearanceChangesText.text = $"Appearance Changes: {remaining}/5";
            }
        }

        public void ShowNotification(string message, float duration = 3.5f)
        {
            if (notificationToastRoot == null || notificationToastText == null) return;

            if (toastCoroutine != null) StopCoroutine(toastCoroutine);
            toastCoroutine = StartCoroutine(ToastRoutine(message, duration));
        }

        private IEnumerator ToastRoutine(string message, float duration)
        {
            notificationToastText.text = message;
            notificationToastRoot.SetActive(true);
            yield return new WaitForSeconds(duration);
            notificationToastRoot.SetActive(false);
        }
    }
}
