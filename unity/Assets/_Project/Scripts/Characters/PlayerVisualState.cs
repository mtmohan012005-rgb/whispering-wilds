using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Player;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Runtime bridge that turns <see cref="PlayerAppearanceManager"/> state into visible result on
    /// the authored STEP 29 player rig. The manager remains a pure state owner
    /// (5-token permanent change rule, profile, outfit). This component is the visual
    /// application layer: skin tone, hair colour, regional outfit garments and height scale.
    ///
    /// Garments are represented by three skinned renderers (upper body / lower body / accessory
    /// cloth such as pallu or thundu). Skin and hair are material slots on the referenced
    /// renderers (0 = skin, 1 = facial features, 2 = hair).
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerVisualState : MonoBehaviour
    {
        [Serializable]
        public class MaterialOption
        {
            public string id;
            public Material material;
        }

        [Serializable]
        public class OutfitGarments
        {
            public RegionalOutfitType outfit;
            public Material upper;
            public Material lower;
            public Material accessory;
        }

        [Header("Garment Renderers")]
        [SerializeField] private SkinnedMeshRenderer garmentUpper;
        [SerializeField] private SkinnedMeshRenderer garmentLower;
        [SerializeField] private SkinnedMeshRenderer garmentAccessory;

        [Header("Skin / Hair Renderers")]
        [SerializeField] private SkinnedMeshRenderer skinBodyRenderer;
        [SerializeField] private SkinnedMeshRenderer skinHandsRenderer;
        [SerializeField] private SkinnedMeshRenderer headRenderer;
        [SerializeField] private SkinnedMeshRenderer hairBraidRenderer;

        [Header("Options")]
        [SerializeField] private List<MaterialOption> skinTones = new List<MaterialOption>();
        [SerializeField] private List<MaterialOption> hairColors = new List<MaterialOption>();
        [SerializeField] private List<OutfitGarments> outfits = new List<OutfitGarments>();

        [Header("Pose")]
        [SerializeField] private Transform rootBone;
        [Space]
        [SerializeField] private float authoredHipHeight = 0.98f;

        private const int SkinSlot = 0;
        private const int FeatureSlot = 1;
        private const int HairSlot = 2;

        private PlayerAppearanceManager appearance;
        private bool subscribed;

        private void Start()
        {
            rootBone ??= FindBone("Root");
            appearance = GetComponentInParent<PlayerAppearanceManager>();
            if (appearance == null)
            {
                var managers = FindObjectsByType<PlayerAppearanceManager>();
                appearance = managers.Length > 0 ? managers[0] : null;
            }

            if (appearance != null)
            {
                ApplyProfile(appearance.CurrentProfile, appearance.RemainingPermanentChanges);
                ApplyOutfit(appearance.CurrentOutfit);
                Subscribe();
            }
            else
            {
                // No state owner (e.g. stand-alone visual test) - show the default look.
                ApplyProfile(default, 0);
                ApplyOutfit(RegionalOutfitType.EverydayChennai);
            }
        }

        private void OnDestroy()
        {
            Unsubscribe();
        }

        private void Subscribe()
        {
            if (subscribed || appearance == null) return;
            appearance.OnPermanentAppearanceChanged += ApplyProfile;
            appearance.OnOutfitChanged += ApplyOutfit;
            subscribed = true;
        }

        private void Unsubscribe()
        {
            if (!subscribed || appearance == null) return;
            appearance.OnPermanentAppearanceChanged -= ApplyProfile;
            appearance.OnOutfitChanged -= ApplyOutfit;
            subscribed = false;
        }

        private void ApplyProfile(AppearanceProfile profile, int remainingChanges)
        {
            Material skin = FindMaterialOption(skinTones, profile.skinToneId);
            if (skin == null && skinTones.Count > 0) skin = skinTones[0].material;

            if (skin != null)
            {
                SetSlot(skinBodyRenderer, SkinSlot, skin);
                SetSlot(skinHandsRenderer, SkinSlot, skin);
                SetSlot(headRenderer, SkinSlot, skin);
            }

            Material hair = FindMaterialOption(hairColors, profile.hairstyleId);
            if (hair == null && hairColors.Count > 0) hair = hairColors[0].material;
            if (hair != null)
            {
                SetSlot(headRenderer, HairSlot, hair);
                if (hairBraidRenderer != null) SetSlot(hairBraidRenderer, 0, hair);
            }

            float scale = profile.heightScale > 0f ? profile.heightScale : 1f;
            ApplyHeightScale(scale);
        }

        private void ApplyOutfit(RegionalOutfitType outfit)
        {
            OutfitGarments garments = null;
            for (int i = 0; i < outfits.Count; i++)
            {
                if (outfits[i].outfit == outfit) { garments = outfits[i]; break; }
            }
            if (garments == null && outfits.Count > 0) garments = outfits[0];

            if (garments == null) return;
            if (garmentUpper != null) garmentUpper.sharedMaterial = garments.upper;
            if (garmentLower != null) garmentLower.sharedMaterial = garments.lower;
            if (garmentAccessory != null) garmentAccessory.sharedMaterial = garments.accessory;
        }

        private void ApplyHeightScale(float scale)
        {
            scale = Mathf.Clamp(scale, 0.9f, 1.15f);
            if (rootBone == null) return;
            rootBone.localScale = Vector3.one * scale;
            rootBone.localPosition = new Vector3(0f, (1f - scale) * authoredHipHeight, 0f);
        }

        private static Material FindMaterialOption(List<MaterialOption> options, string id)
        {
            if (string.IsNullOrEmpty(id)) return null;
            for (int i = 0; i < options.Count; i++)
            {
                if (string.Equals(options[i].id, id, StringComparison.OrdinalIgnoreCase)) return options[i].material;
            }
            return null;
        }

        private static void SetSlot(SkinnedMeshRenderer renderer, int slot, Material material)
        {
            if (renderer == null || material == null) return;
            Material[] mats = renderer.sharedMaterials;
            if (mats == null || slot >= mats.Length) return;
            mats[slot] = material;
            renderer.sharedMaterials = mats;
        }

        /// <summary>Editor/companion helper: returns the named bone anywhere in this visual.</summary>
        public Transform FindBone(string boneName)
        {
            var animator = GetComponentInChildren<Animator>();
            if (animator != null)
            {
                var bone = FindBoneRecursive(animator.transform, boneName);
                if (bone != null) return bone;
            }
            return FindBoneRecursive(transform, boneName);
        }

        private static Transform FindBoneRecursive(Transform parent, string name)
        {
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform child = parent.GetChild(i);
                if (child.name == name) return child;
                Transform nested = FindBoneRecursive(child, name);
                if (nested != null) return nested;
            }
            return null;
        }
    }
}