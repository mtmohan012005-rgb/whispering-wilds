using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.World;
using WhisperingWilds.Localization;
using WhisperingWilds.PhysicsZones;

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

        [Header("Antigravity Field")]
        [SerializeField] private GameObject antigravityRoot;
        [SerializeField] private Text antigravityTitleText;
        [SerializeField] private Text antigravityPromptText;
        [SerializeField] private Text antigravityEnergyText;
        [SerializeField] private Image antigravityEnergyFill;

        private bool antigravityVisible;
        private int antigravityLastBodyCount = -1;
        private float antigravityRefreshTimer;

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

        /// <summary>
        /// Permanent appearance change cap, surfaced as a localized value instead of the
        /// previously hardcoded "/5" inside a format string.
        /// </summary>
        public const int MaxPermanentAppearanceChanges = WhisperingWilds.Player.PlayerManager.MaxPermanentAppearanceChanges;

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }

            // Paired unsubscribe in OnDisable. An event left dangling here would
            // re-fire forever and re-render the panel after every language switch.
            AntigravityZoneManager.PlayerFieldStateChanged += HandlePlayerFieldStateChanged;

            // Adopt current state on enable: the player may already be in a field.
            HandlePlayerFieldStateChanged(AntigravityZoneManager.IsPlayerInField);
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }

            AntigravityZoneManager.PlayerFieldStateChanged -= HandlePlayerFieldStateChanged;
        }

        private void HandlePlayerFieldStateChanged(bool inField)
        {
            antigravityVisible = inField;
            antigravityLastBodyCount = -1;

            if (antigravityRoot != null) antigravityRoot.SetActive(inField);
            if (inField) RefreshAntigravityDisplay();
        }

        /// <summary>
        /// Renders the antigravity panel. Called on state change and on language switch
        /// only. The floating-body count is refreshed lazily so the common case does no
        /// per-frame string formatting.
        /// </summary>
        private void RefreshAntigravityDisplay()
        {
            if (!antigravityVisible) return;

            if (antigravityTitleText != null)
            {
                antigravityTitleText.text = T("hud.gravity.inverted", "Gravity Field Inverted");
            }

            if (antigravityPromptText != null)
            {
                antigravityPromptText.text = T("hud.gravity.descend", "C: Descend / Sink");
            }

            if (antigravityEnergyText != null)
            {
                antigravityEnergyText.text = T("hud.gravity.energy", "Field Energy");
            }

            RefreshAntigravityBodyCount(force: true);
        }

        private void RefreshAntigravityBodyCount(bool force = false)
        {
            if (!antigravityVisible) return;

            int count = 0;
            var zones = AntigravityZoneManager.ActiveZones;
            for (int i = 0; i < zones.Count; i++)
            {
                if (zones[i] != null) count += zones[i].ActiveBodyCount;
            }

            if (!force && count == antigravityLastBodyCount) return;
            antigravityLastBodyCount = count;

            if (antigravityEnergyText != null)
            {
                antigravityEnergyText.text = T("hud.gravity.bodies", "Floating Objects: {0}", count);
            }

            if (antigravityEnergyFill != null)
            {
                // Normalised against the highest tier cap so the bar is meaningful
                // across quality settings.
                float cap = Mathf.Max(1f, HighestZoneCapacity());
                antigravityEnergyFill.fillAmount = Mathf.Clamp01(count / cap);
            }
        }

        private static float HighestZoneCapacity()
        {
            float cap = 1f;
            var zones = AntigravityZoneManager.ActiveZones;
            for (int i = 0; i < zones.Count; i++)
            {
                if (zones[i] != null && zones[i].MaxActiveBodies > cap) cap = zones[i].MaxActiveBodies;
            }
            return cap;
        }

        /// <summary>Re-renders every localized HUD label after a live language switch.</summary>
        private void OnLanguageChanged(Language language)
        {
            ApplyFonts();
            RefreshRegionDisplay();
            RefreshCurrencyDisplay();
            RefreshAppearanceDisplay();
            RefreshAntigravityDisplay();
        }

        /// <summary>Applies the resolved bilingual font to every HUD label.</summary>
        public void ApplyFonts()
        {
            LocalizedFontProvider.Apply(interactionPromptText);
            LocalizedFontProvider.Apply(clockText);
            LocalizedFontProvider.Apply(regionText);
            LocalizedFontProvider.Apply(currencyText);
            LocalizedFontProvider.Apply(appearanceChangesText);
            LocalizedFontProvider.Apply(notificationToastText);
            LocalizedFontProvider.Apply(antigravityTitleText);
            LocalizedFontProvider.Apply(antigravityPromptText);
            LocalizedFontProvider.Apply(antigravityEnergyText);
        }

        private static string T(string key, string fallback)
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            return mgr != null ? mgr.Get(key) : fallback;
        }

        private static string T(string key, string fallback, params object[] args)
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (mgr == null)
            {
                try { return string.Format(fallback, args); } catch (FormatException) { return fallback; }
            }
            return mgr.Get(key, args);
        }

        // Cached so the region label can be rebuilt on a language switch without the caller
        // having to re-supply it.
        private string lastRegionEn;
        private string lastRegionTa;

        private void Start()
        {
            if (interactionPromptRoot != null) interactionPromptRoot.SetActive(false);
            if (notificationToastRoot != null) notificationToastRoot.SetActive(false);

            ApplyFonts();
            BindPlayerEvents();

            if (InventoryManager.Instance != null)
            {
                InventoryManager.Instance.OnCurrencyChanged += UpdateCurrencyDisplay;
                RefreshCurrencyDisplay();
            }

            // Pick up a region name set before this HUD finished starting.
            if (lastRegionEn != null) RefreshRegionDisplay();
        }

        private void Update()
        {
            UpdateClockDisplay();

            // Antigravity body count is polled on a slow timer rather than every frame:
            // the count only changes on admission/release, and formatting a localized
            // string per frame would allocate needlessly.
            if (antigravityVisible)
            {
                antigravityRefreshTimer -= Time.unscaledDeltaTime;
                if (antigravityRefreshTimer <= 0f)
                {
                    antigravityRefreshTimer = 0.25f;
                    RefreshAntigravityBodyCount();
                }
            }
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
                interactionPromptText.text = T("hud.press_to_interact", "Press {0}", "[E] ")
                                         + interactable.InteractionPrompt;
            }
            else
            {
                interactionPromptRoot.SetActive(false);
            }
        }

        private void UpdateClockDisplay()
        {
            if (clockText == null || TimeOfDayManager.Instance == null) return;

            int hour = TimeOfDayManager.Instance.WholeHour;
            int minute = TimeOfDayManager.Instance.Minutes;
            string period = hour >= 12 ? T("hud.pm", "PM") : T("hud.am", "AM");
            int displayHour = hour % 12;
            if (displayHour == 0) displayHour = 12;

            clockText.text = $"{displayHour:00}:{minute:00} {period}";
        }

        public void SetRegionName(string regionEn, string regionTa)
        {
            lastRegionEn = regionEn;
            lastRegionTa = regionTa;
            RefreshRegionDisplay();
        }

        private void RefreshRegionDisplay()
        {
            if (regionText == null || lastRegionEn == null) return;

            // Tamil reads first in Tamil mode; a single string carries both so either language
            // is complete without a conditional on the caller's side.
            bool tamil = LocalizationManager.Instance != null
                         && LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            regionText.text = tamil
                ? $"{lastRegionTa} • {lastRegionEn}"
                : $"{lastRegionEn} • {lastRegionTa}";
        }

        private void UpdateCurrencyDisplay(int amount)
        {
            lastCurrency = amount;
            RefreshCurrencyDisplay();
        }

        private int lastCurrency;

        private void RefreshCurrencyDisplay()
        {
            if (currencyText == null) return;
            // No coin emoji: the glyph is absent from every font available here and would
            // render as tofu. A localized word is also clearer than a symbol.
            currencyText.text = T("hud.currency_value", "Coins: {0}", lastCurrency);
        }

        private void UpdateAppearanceDisplay(int remaining)
        {
            lastRemainingChanges = remaining;
            RefreshAppearanceDisplay();
        }

        private int lastRemainingChanges = MaxPermanentAppearanceChanges;

        private void RefreshAppearanceDisplay()
        {
            if (appearanceChangesText == null) return;
            appearanceChangesText.text = T(
                "hud.appearance_value",
                "Appearance Changes: {0}/{1}",
                lastRemainingChanges,
                MaxPermanentAppearanceChanges);
        }

        /// <summary>
        /// Shows a notification toast. Prefer <see cref="ShowNotificationKey"/> so the text
        /// follows the active language.
        /// </summary>
        public void ShowNotification(string message, float duration = 3.5f)
        {
            if (notificationToastRoot == null || notificationToastText == null) return;

            if (toastCoroutine != null) StopCoroutine(toastCoroutine);
            toastCoroutine = StartCoroutine(ToastRoutine(message, duration));
        }

        /// <summary>Shows a toast from a localization key, with optional format arguments.</summary>
        public void ShowNotificationKey(string key, float duration = 3.5f, params object[] args)
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            ShowNotification(mgr != null ? mgr.Get(key, args) : key, duration);
        }

        private IEnumerator ToastRoutine(string message, float duration)
        {
            notificationToastText.text = message;
            LocalizedFontProvider.Apply(notificationToastText);
            notificationToastRoot.SetActive(true);
            yield return new WaitForSeconds(duration);
            notificationToastRoot.SetActive(false);
        }
    }
}
