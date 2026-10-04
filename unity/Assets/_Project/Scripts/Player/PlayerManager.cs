using System;
using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Player facade used by gameplay systems for movement, the regional outfit, and the
        /// permanent appearance change allowance.
        ///
        /// The allowance itself is owned by <see cref="PlayerAppearanceManager"/>, which applies the
        /// actual profile change. This counter mirrors it so systems that only need to know the
        /// remaining budget do not have to reference the appearance stack, and both sides clamp to
        /// the single shared ceiling.
        /// </summary>
    [DisallowMultipleComponent]
    public class PlayerManager : MonoBehaviour
    {
        public static PlayerManager Instance { get; private set; }

        /// <summary>Shared ceiling for permanent appearance changes across the whole project.</summary>
        public const int MaxPermanentAppearanceChanges = PlayerAppearanceManager.MaxPermanentAppearanceChanges;

        [Header("Appearance & Customization Limit")]
        [SerializeField] private int remainingPermanentAppearanceChanges = MaxPermanentAppearanceChanges;
        [SerializeField] private RegionalOutfitType currentRegionalOutfit = RegionalOutfitType.EverydayChennai;

        [Header("Locomotion & Controller References")]
        [SerializeField] private PlayerMovement movement;
        [SerializeField] private PlayerInteractor interactor;
        [SerializeField] private PlayerAppearanceManager appearance;

        public int RemainingPermanentChanges => remainingPermanentAppearanceChanges;
        public RegionalOutfitType CurrentRegionalOutfit => currentRegionalOutfit;
        public Transform PlayerTransform => transform;

        public event Action<int> OnAppearanceChangesUpdated;
        public event Action<RegionalOutfitType> OnRegionalOutfitChanged;

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

            movement = GetComponent<PlayerMovement>();
            interactor = GetComponent<PlayerInteractor>();
            appearance = GetComponent<PlayerAppearanceManager>();
        }

        public bool TryConsumePermanentAppearanceChange()
        {
            if (remainingPermanentAppearanceChanges <= 0)
            {
                Debug.LogWarning("<color=#FF3300><b>[PlayerManager]</b></color> Permanent appearance change REJECTED: Absolute limit of 5 changes reached!");
                return false;
            }

            remainingPermanentAppearanceChanges--;
            Debug.Log($"<color=#00D2FF><b>[PlayerManager]</b></color> Permanent appearance change applied. Remaining: {remainingPermanentAppearanceChanges}/{MaxPermanentAppearanceChanges}");
            OnAppearanceChangesUpdated?.Invoke(remainingPermanentAppearanceChanges);
            return true;
        }

        public void SetRemainingPermanentChanges(int count)
        {
            remainingPermanentAppearanceChanges = Mathf.Clamp(count, 0, MaxPermanentAppearanceChanges);
            OnAppearanceChangesUpdated?.Invoke(remainingPermanentAppearanceChanges);
        }

        /// <summary>
        /// Restores the full allowance for a new campaign, keeping this mirror in step with
        /// <see cref="PlayerAppearanceManager.ResetToNewGameDefaults"/>.
        /// </summary>
        public void ResetAppearanceAllowance()
        {
            SetRemainingPermanentChanges(MaxPermanentAppearanceChanges);
        }

        public void EquipRegionalOutfit(RegionalOutfitType outfit)
        {
            // Regional cultural outfits (e.g. Nilgiri wool, Thanjavur silk) are unrestricted
            currentRegionalOutfit = outfit;
            if (appearance != null)
            {
                appearance.EquipRegionalOutfit(outfit);
            }
            OnRegionalOutfitChanged?.Invoke(outfit);
            Debug.Log($"<color=#00FF99><b>[PlayerManager]</b></color> Equipped regional outfit: {outfit}");
        }
    }
}
