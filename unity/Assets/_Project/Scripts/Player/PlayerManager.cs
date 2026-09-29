using System;
using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Single authoritative Player Governor orchestrating character state,
    /// locomotion, cultural regional outfits, and strictly enforcing the
    /// maximum 5 permanent appearance changes ceiling.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerManager : MonoBehaviour
    {
        public static PlayerManager Instance { get; private set; }

        public const int MaxPermanentAppearanceChanges = 5;

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
                Destroy(gameObject);
                return;
            }
            Instance = this;

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
