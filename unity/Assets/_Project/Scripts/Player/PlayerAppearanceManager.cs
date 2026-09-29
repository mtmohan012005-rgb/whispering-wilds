using System;
using UnityEngine;

namespace WhisperingWilds.Player
{
    [System.Serializable]
    public struct AppearanceProfile
    {
        public string hairstyleId;
        public string skinToneId;
        public string facialFeaturesId;
        public string culturalMarkingId;
        public float heightScale;
        public string genderPresentation;
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
        }

        /// <summary>
        /// Restores state from versioned save data.
        /// </summary>
        public void RestoreState(int remainingChanges, AppearanceProfile profile, RegionalOutfitType outfit)
        {
            // Clamp remaining changes between 0 and 5
            remainingPermanentChanges = Mathf.Clamp(remainingChanges, 0, MaxPermanentAppearanceChanges);
            currentProfile = profile;
            currentOutfit = outfit;
        }
    }
}
