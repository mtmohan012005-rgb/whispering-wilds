using System;
using UnityEngine;
using Unity.Mathematics;

namespace WhisperingWilds.Player
{
    [System.Serializable]
    public struct AppearanceProfile : IEquatable<AppearanceProfile>
    {
        public string hairstyleId;
        public string skinToneId;
        public string facialFeaturesId;
        public string culturalMarkingId;
        public float heightScale;
        public string genderPresentation;

        public bool Equals(AppearanceProfile other)
        {
            return hairstyleId == other.hairstyleId &&
                   skinToneId == other.skinToneId &&
                   facialFeaturesId == other.facialFeaturesId &&
                   culturalMarkingId == other.culturalMarkingId &&
                   Mathf.Approximately(heightScale, other.heightScale) &&
                   genderPresentation == other.genderPresentation;
        }

        public override bool Equals(object obj) => obj is AppearanceProfile other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(hairstyleId, skinToneId, heightScale);
    }

    public enum RegionalOutfitType
    {
        EverydayChennai,
        CauveryVillage,
        ThanjavurFestival,
        PichavaramFisher,
        NilgiriColdWeather
    }

    /// <summary>
    /// Enforces the strict rule: MAXIMUM 5 PERMANENT APPEARANCE CHANGES.
    /// Manages permanent physical customization and unrestricted regional outfits.
    /// Employs TryGetComponent protection and allocation-free state transitions.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerAppearanceManager : MonoBehaviour
    {
        public const int MaxPermanentAppearanceChanges = 5;

        [Header("State Persistence")]
        [SerializeField] private int remainingPermanentChanges = MaxPermanentAppearanceChanges;
        [SerializeField] private AppearanceProfile currentProfile;
        [SerializeField] private RegionalOutfitType currentOutfit = RegionalOutfitType.EverydayChennai;

        // Public properties
        public int RemainingPermanentChanges => remainingPermanentChanges;
        public AppearanceProfile CurrentProfile => currentProfile;
        public RegionalOutfitType CurrentOutfit => currentOutfit;
        public bool CanMakePermanentChange => remainingPermanentChanges > 0;

        // Events
        public event Action<AppearanceProfile, int> OnPermanentAppearanceChanged;
        public event Action OnAppearanceLimitReached;
        public event Action<RegionalOutfitType> OnOutfitChanged;

        // Cached physics references (TryGetComponent guarded)
        private VeshtiClothPhysicsController clothController;

        private void Awake()
        {
            TryGetComponent(out clothController);
        }

        /// <summary>
        /// Attempts to apply a permanent character appearance change.
        /// Fails if the player has exhausted their 5 allocated changes.
        /// </summary>
        public bool TryApplyPermanentAppearance(AppearanceProfile newProfile)
        {
            if (remainingPermanentChanges <= 0)
            {
                Debug.LogWarning("<color=#FF4444><b>[Appearance]</b></color> Permanent appearance change REJECTED: Maximum of 5 permanent changes reached!");
                OnAppearanceLimitReached?.Invoke();
                return false;
            }

            remainingPermanentChanges--;
            currentProfile = newProfile;

            Debug.Log($"<color=#00FF88><b>[Appearance]</b></color> Permanent change applied successfully. Remaining changes: {remainingPermanentChanges}/{MaxPermanentAppearanceChanges}");
            OnPermanentAppearanceChanged?.Invoke(currentProfile, remainingPermanentChanges);

            if (remainingPermanentChanges == 0)
            {
                Debug.LogWarning("<color=#FFAA00><b>[Appearance]</b></color> Notice: You have used your FINAL permanent appearance change!");
                OnAppearanceLimitReached?.Invoke();
            }

            return true;
        }

        /// <summary>
        /// Equips a cultural regional outfit (veshti, thundu, nilgiri wool, etc.).
        /// Outfits are temporary attire and do NOT consume permanent appearance change tokens.
        /// </summary>
        public void EquipRegionalOutfit(RegionalOutfitType outfit)
        {
            currentOutfit = outfit;
            Debug.Log($"<color=#00D2FF><b>[Appearance]</b></color> Equipped regional outfit: {outfit}");
            OnOutfitChanged?.Invoke(currentOutfit);

            if (clothController == null)
            {
                TryGetComponent(out clothController);
            }

            if (clothController != null)
            {
                clothController.ApplyAttirePreset(outfit);
            }
        }

        /// <summary>
        /// Restores state from versioned save data.
        /// </summary>
        public void RestoreState(int remainingChanges, AppearanceProfile profile, RegionalOutfitType outfit)
        {
            remainingPermanentChanges = math.clamp(remainingChanges, 0, MaxPermanentAppearanceChanges);
            currentProfile = profile;
            currentOutfit = outfit;

            if (clothController == null)
            {
                TryGetComponent(out clothController);
            }

            if (clothController != null)
            {
                clothController.ApplyAttirePreset(outfit);
            }
        }

        /// <summary>
        /// Returns the player to a brand new campaign's appearance: the full permanent change
        /// allowance, a default profile, and the Chennai everyday outfit.
        /// </summary>
        public void ResetToNewGameDefaults()
        {
            remainingPermanentChanges = MaxPermanentAppearanceChanges;
            currentProfile = default;
            currentOutfit = RegionalOutfitType.EverydayChennai;

            OnPermanentAppearanceChanged?.Invoke(currentProfile, remainingPermanentChanges);
            OnOutfitChanged?.Invoke(currentOutfit);

            if (clothController == null)
            {
                TryGetComponent(out clothController);
            }

            if (clothController != null)
            {
                clothController.ApplyAttirePreset(currentOutfit);
            }
        }
    }
}
