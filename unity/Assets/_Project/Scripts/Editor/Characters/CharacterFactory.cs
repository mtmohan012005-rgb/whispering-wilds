using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;

namespace WhisperingWilds.Editor.Characters
{
    /// <summary>
    /// Procedural authoring of production humanoids for STEP 29: skeleton + generic Avatar,
    /// skinned body/hands/head/clothing meshes, procedural albedo/normal/roughness textures,
    /// HDRP/Lit materials and authored animation clips. Everything here is deterministic and
    /// ships as real Unity assets; it does not claim to be photoreal — characters are stylized,
    /// properly rigged, textured and animated humanoids (see CHARACTER_ASSET_AUDIT.md).
    /// </summary>
    public static class CharacterFactory
    {
        public const float HipWorldY = 0.98f;

        // ------------------------------------------------------------------
        // Skeleton definition (single source of truth for rig and mesh indices)
        // ------------------------------------------------------------------
        public static readonly string[] RigBoneNames =
        {
            "Root", "Hips", "Spine", "Chest", "UpperChest", "Neck", "Head",
            "LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand",
            // 10 left fingers
            "LeftThumbProximal", "LeftThumbDistal",
            "LeftIndexProximal", "LeftIndexDistal",
            "LeftMiddleProximal", "LeftMiddleDistal",
            "LeftRingProximal", "LeftRingDistal",
            "LeftLittleProximal", "LeftLittleDistal",
            "RightShoulder", "RightUpperArm", "RightLowerArm", "RightHand",
            // 10 right fingers
            "RightThumbProximal", "RightThumbDistal",
            "RightIndexProximal", "RightIndexDistal",
            "RightMiddleProximal", "RightMiddleDistal",
            "RightRingProximal", "RightRingDistal",
            "RightLittleProximal", "RightLittleDistal",
            "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "LeftToes",
            "RightUpperLeg", "RightLowerLeg", "RightFoot", "RightToes",
        };

        public const string CharacterOffsetNode = "CharacterOffset";
        public const string RootBone = "Root";

        private static readonly (string name, string parent, Vector3 pos)[] RigDef =
        {
            (RootBone, null, new Vector3(0f, HipWorldY, 0f)),
            ("Hips", RootBone, Vector3.zero),
            ("Spine", "Hips", new Vector3(0f, 0.12f, 0f)),
            ("Chest", "Spine", new Vector3(0f, 0.16f, 0f)),
            ("UpperChest", "Chest", new Vector3(0f, 0.06f, 0f)),
            ("Neck", "UpperChest", new Vector3(0f, 0.13f, 0f)),
            ("Head", "Neck", new Vector3(0f, 0.09f, 0f)),
            // Left arm (T-pose, +x). Shoulder is the joint at the torso edge.
            ("LeftShoulder", "UpperChest", new Vector3(0.16f, 0f, 0f)),
            ("LeftUpperArm", "LeftShoulder", Vector3.zero),
            ("LeftLowerArm", "LeftUpperArm", new Vector3(0.20f, 0f, 0f)),
            ("LeftHand", "LeftLowerArm", new Vector3(0.15f, 0f, 0f)),
            // 10 fingers (2 phalanx bones each)
            ("LeftThumbProximal", "LeftHand", new Vector3(0.045f, 0.022f, 0.012f)),
            ("LeftThumbDistal", "LeftThumbProximal", new Vector3(0.016f, 0.018f, 0.010f)),
            ("LeftIndexProximal", "LeftHand", new Vector3(0.030f, 0.020f, 0.012f)),
            ("LeftIndexDistal", "LeftIndexProximal", new Vector3(0.030f, 0.002f, 0f)),
            ("LeftMiddleProximal", "LeftHand", new Vector3(0.030f, 0.020f, 0.004f)),
            ("LeftMiddleDistal", "LeftMiddleProximal", new Vector3(0.030f, 0.002f, 0f)),
            ("LeftRingProximal", "LeftHand", new Vector3(0.030f, 0.020f, -0.004f)),
            ("LeftRingDistal", "LeftRingProximal", new Vector3(0.030f, 0.002f, 0f)),
            ("LeftLittleProximal", "LeftHand", new Vector3(0.030f, 0.020f, -0.012f)),
            ("LeftLittleDistal", "LeftLittleProximal", new Vector3(0.030f, 0.002f, 0f)),
            // Right arm (mirror, -x)
            ("RightShoulder", "UpperChest", new Vector3(-0.16f, 0f, 0f)),
            ("RightUpperArm", "RightShoulder", Vector3.zero),
            ("RightLowerArm", "RightUpperArm", new Vector3(-0.20f, 0f, 0f)),
            ("RightHand", "RightLowerArm", new Vector3(-0.15f, 0f, 0f)),
            ("RightThumbProximal", "RightHand", new Vector3(-0.045f, 0.022f, 0.012f)),
            ("RightThumbDistal", "RightThumbProximal", new Vector3(-0.016f, 0.018f, 0.010f)),
            ("RightIndexProximal", "RightHand", new Vector3(-0.030f, 0.020f, 0.012f)),
            ("RightIndexDistal", "RightIndexProximal", new Vector3(-0.030f, 0.002f, 0f)),
            ("RightMiddleProximal", "RightHand", new Vector3(-0.030f, 0.020f, 0.004f)),
            ("RightMiddleDistal", "RightMiddleProximal", new Vector3(-0.030f, 0.002f, 0f)),
            ("RightRingProximal", "RightHand", new Vector3(-0.030f, 0.020f, -0.004f)),
            ("RightRingDistal", "RightRingProximal", new Vector3(-0.030f, 0.002f, 0f)),
            ("RightLittleProximal", "RightHand", new Vector3(-0.030f, 0.020f, -0.012f)),
            ("RightLittleDistal", "RightLittleProximal", new Vector3(-0.030f, 0.002f, 0f)),
            // Legs
            ("LeftUpperLeg", "Hips", new Vector3(0.09f, -0.02f, 0f)),
            ("LeftLowerLeg", "LeftUpperLeg", new Vector3(0.008f, -0.42f, 0f)),
            ("LeftFoot", "LeftLowerLeg", new Vector3(0f, -0.42f, 0f)),
            ("LeftToes", "LeftFoot", new Vector3(0f, -0.08f, 0.06f)),
            ("RightUpperLeg", "Hips", new Vector3(-0.09f, -0.02f, 0f)),
            ("RightLowerLeg", "RightUpperLeg", new Vector3(-0.008f, -0.42f, 0f)),
            ("RightFoot", "RightLowerLeg", new Vector3(0f, -0.42f, 0f)),
            ("RightToes", "RightFoot", new Vector3(0f, -0.08f, 0.06f)),
        };

        // ------------------------------------------------------------------
        // Rig
        // ------------------------------------------------------------------

        /// <summary>Builds the skeleton under <paramref name="rigRoot"/> (the subject of the Animator).</summary>
        public static Dictionary<string, Transform> BuildRig(Transform rigRoot)
        {
            var bones = new Dictionary<string, Transform>(StringComparer.Ordinal);

            var charOffset = new GameObject(CharacterOffsetNode).transform;
            charOffset.SetParent(rigRoot, false);
            charOffset.localPosition = Vector3.zero;
            charOffset.localRotation = Quaternion.identity;
            charOffset.localScale = Vector3.one;

            foreach (var def in RigDef)
            {
                var go = new GameObject(def.name);
                Transform parent = string.IsNullOrEmpty(def.parent)
                    ? charOffset
                    : bones[def.parent];
                go.transform.SetParent(parent, false);
                go.transform.localPosition = def.pos;
                go.transform.localRotation = Quaternion.identity;
                go.transform.localScale = Vector3.one;
                bones[def.name] = go.transform;
            }
            return bones;
        }

        public static Avatar BuildGenericAvatar(GameObject rigRoot)
        {
            Avatar avatar = AvatarBuilder.BuildGenericAvatar(rigRoot, RootBone);
            if (avatar != null) avatar.name = rigRoot.name + "Avatar";
            return avatar;
        }

        // ------------------------------------------------------------------
        // Meshes (built once, saved as .asset, shared by every character prefab)
        // ------------------------------------------------------------------
        public static Mesh BuildBodyMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();

            // === IMPROVED BODY: More natural human proportions ===

            // Pelvis/hips - rounded shape
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 0.90f, 0f), 0.140f, 6, 10), bones["Hips"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 0.90f, 0f), 0.130f, 0.15f, 10, true), bones["Hips"], 0);

            // Abdomen - tapered waist
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.05f, 0f), 0.130f, 6, 10), bones["Spine"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.12f, 0f), 0.125f, 6, 10), bones["Spine"], 0);

            // Chest - broader and more defined
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.25f, 0f), 0.160f, 6, 10), bones["Chest"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.32f, 0f), 0.165f, 6, 10), bones["Chest"], 0);
            // Pectoral definition
            mb.Append(PartFactory.SpherePart(new Vector3(0.060f, 1.33f, 0.080f), 0.055f, 5, 6), bones["Chest"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.060f, 1.33f, 0.080f), 0.055f, 5, 6), bones["Chest"], 0);

            // Shoulders - rounded deltoids
            mb.Append(PartFactory.SpherePart(new Vector3(0.170f, 1.40f, 0f), 0.065f, 5, 8), bones["LeftShoulder"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.170f, 1.40f, 0f), 0.065f, 5, 8), bones["RightShoulder"], 0);

            // Neck - tapered
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.47f, 0f), 0.045f, 0.06f, 8, true), bones["Neck"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.50f, 0f), 0.055f, 0.04f, 8, true), bones["Neck"], 0);

            // Upper arms - bicep/tricep definition
            mb.Append(PartFactory.CylinderPart(new Vector3(0.258f, 1.36f, 0f), 0.050f, 0.10f, 8, true), bones["LeftUpperArm"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0.258f, 1.39f, 0f), 0.055f, 5, 6), bones["LeftUpperArm"], 0); // bicep
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.258f, 1.36f, 0f), 0.050f, 0.10f, 8, true), bones["RightUpperArm"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.258f, 1.39f, 0f), 0.055f, 5, 6), bones["RightUpperArm"], 0); // bicep

            // Elbows - joint definition
            mb.Append(PartFactory.SpherePart(new Vector3(0.358f, 1.33f, 0f), 0.040f, 5, 6), bones["LeftUpperArm"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.358f, 1.33f, 0f), 0.040f, 5, 6), bones["RightUpperArm"], 0);

            // Lower arms - tapered forearms
            mb.Append(PartFactory.CylinderPart(new Vector3(0.435f, 1.33f, 0f), 0.038f, 0.15f, 8, true), bones["LeftLowerArm"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.435f, 1.33f, 0f), 0.038f, 0.15f, 8, true), bones["RightLowerArm"], 0);

            // Upper legs - thigh definition
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.72f, 0f), 0.080f, 0.20f, 8, true), bones["LeftUpperLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0.098f, 0.78f, 0.020f), 0.085f, 5, 8), bones["LeftUpperLeg"], 0); // quad
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.72f, 0f), 0.080f, 0.20f, 8, true), bones["RightUpperLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.098f, 0.78f, 0.020f), 0.085f, 5, 8), bones["RightUpperLeg"], 0); // quad

            // Knees - joint definition
            mb.Append(PartFactory.SpherePart(new Vector3(0.098f, 0.55f, 0.020f), 0.055f, 5, 6), bones["LeftUpperLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.098f, 0.55f, 0.020f), 0.055f, 5, 6), bones["RightUpperLeg"], 0);

            // Lower legs - calf definition
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.34f, 0f), 0.060f, 0.30f, 8, true), bones["LeftLowerLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0.098f, 0.40f, -0.020f), 0.065f, 5, 6), bones["LeftLowerLeg"], 0); // calf
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.34f, 0f), 0.060f, 0.30f, 8, true), bones["RightLowerLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.098f, 0.40f, -0.020f), 0.065f, 5, 6), bones["RightLowerLeg"], 0); // calf

            // Ankles
            mb.Append(PartFactory.SpherePart(new Vector3(0.098f, 0.15f, 0f), 0.040f, 4, 6), bones["LeftLowerLeg"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.098f, 0.15f, 0f), 0.040f, 4, 6), bones["RightLowerLeg"], 0);

            // Feet - more natural shape
            mb.Append(PartFactory.BoxPart(new Vector3(0.098f, 0.055f, 0.025f), new Vector3(0.090f, 0.070f, 0.220f)), bones["LeftFoot"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(0.098f, 0.055f, 0.120f), 0.040f, 4, 6), bones["LeftFoot"], 0); // toes
            mb.Append(PartFactory.BoxPart(new Vector3(-0.098f, 0.055f, 0.025f), new Vector3(0.090f, 0.070f, 0.220f)), bones["RightFoot"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.098f, 0.055f, 0.120f), 0.040f, 4, 6), bones["RightFoot"], 0); // toes

            return mb.Finalize("Procedure_Body");
        }

        public static Mesh BuildHandsMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();

            // === IMPROVED HANDS: More natural palm and finger shapes ===

            // Palms - rounded shape
            mb.Append(PartFactory.SpherePart(new Vector3(0.505f, 1.33f, 0f), 0.040f, 5, 6), bones["LeftHand"], 0);
            mb.Append(PartFactory.BoxPart(new Vector3(0.505f, 1.33f, 0f), new Vector3(0.070f, 0.075f, 0.040f)), bones["LeftHand"], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.505f, 1.33f, 0f), 0.040f, 5, 6), bones["RightHand"], 0);
            mb.Append(PartFactory.BoxPart(new Vector3(-0.505f, 1.33f, 0f), new Vector3(0.070f, 0.075f, 0.040f)), bones["RightHand"], 0);

            // Left fingers - rounded capsules instead of boxes
            AddRoundedFinger(mb, bones, true, "Index", 0.012f);
            AddRoundedFinger(mb, bones, true, "Middle", 0.004f);
            AddRoundedFinger(mb, bones, true, "Ring", -0.004f);
            AddRoundedFinger(mb, bones, true, "Little", -0.012f);
            AddRoundedThumb(mb, bones, true);
            AddRoundedFinger(mb, bones, false, "Index", 0.012f);
            AddRoundedFinger(mb, bones, false, "Middle", 0.004f);
            AddRoundedFinger(mb, bones, false, "Ring", -0.004f);
            AddRoundedFinger(mb, bones, false, "Little", -0.012f);
            AddRoundedThumb(mb, bones, false);
            return mb.Finalize("Procedure_Hands");
        }

        private static void AddRoundedFinger(MeshBuilder mb, Dictionary<string, int> bones, bool left, string finger, float zOffset)
        {
            int sign = left ? 1 : -1;
            string prefix = left ? "Left" : "Right";
            string boneProx = $"{prefix}{finger}Proximal";
            string boneDist = $"{prefix}{finger}Distal";

            float baseX = sign * 0.54f;
            float y = 1.35f;

            // Proximal phalanx - rounded
            mb.Append(PartFactory.CylinderPart(new Vector3(baseX + sign * 0.0085f, y, zOffset), 0.007f, 0.021f, 5, true), bones[boneProx], 0);
            // Distal phalanx - rounded tip
            mb.Append(PartFactory.CylinderPart(new Vector3(baseX + sign * 0.0265f, y + 0.002f, zOffset), 0.006f, 0.019f, 5, true), bones[boneDist], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(baseX + sign * 0.036f, y + 0.002f, zOffset), 0.006f, 4, 4), bones[boneDist], 0);
        }

        private static void AddRoundedThumb(MeshBuilder mb, Dictionary<string, int> bones, bool left)
        {
            int sign = left ? 1 : -1;
            string prefix = left ? "Left" : "Right";
            string boneProx = $"{prefix}ThumbProximal";
            string boneDist = $"{prefix}ThumbDistal";

            float bx = sign * 0.53f;
            // Proximal phalanx
            mb.Append(PartFactory.CylinderPart(new Vector3(bx + sign * 0.008f, 1.362f, 0.014f), 0.010f, 0.020f, 5, true), bones[boneProx], 0);
            // Distal phalanx
            mb.Append(PartFactory.CylinderPart(new Vector3(bx + sign * 0.020f, 1.378f, 0.024f), 0.009f, 0.018f, 5, true), bones[boneDist], 0);
            mb.Append(PartFactory.SpherePart(new Vector3(bx + sign * 0.028f, 1.385f, 0.030f), 0.008f, 4, 4), bones[boneDist], 0);
        }

        public enum NpcHeadRole
        {
            GenericMale,
            Murugan,
            Velu,
            Selvam,
            Meenakshi,
            Artisan,
            Farmer,
            Fisher,
            ForestGuide,
            TeaWorker
        }

        public static Mesh BuildHeadMesh(Dictionary<string, int> bones, bool female)
        {
            return BuildRoleHeadMesh(bones, female ? NpcHeadRole.Meenakshi : NpcHeadRole.GenericMale);
        }

        public static Mesh BuildRoleHeadMesh(Dictionary<string, int> bones, NpcHeadRole role)
        {
            var mb = new MeshBuilder();
            const int Skin = 0, Feature = 1, Hair = 2;
            mb.EnsureSubmesh(3);

            bool female = (role == NpcHeadRole.Meenakshi);

            // === 1. Base Skull & Head Anatomy ===
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.610f, 0f), 0.105f, 8, 14), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.660f, 0.020f), 0.080f, 6, 10), bones["Head"], Skin);

            // Cheekbones
            float cheekWidth = (role == NpcHeadRole.Fisher || role == NpcHeadRole.Murugan) ? 0.080f : 0.075f;
            mb.Append(PartFactory.SpherePart(new Vector3(cheekWidth, 1.590f, 0.040f), 0.055f, 5, 8), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(-cheekWidth, 1.590f, 0.040f), 0.055f, 5, 8), bones["Head"], Skin);

            // Jaw & Chin
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.530f, 0.030f), 0.065f, 5, 8), bones["Head"], Skin);
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.510f, 0.040f), new Vector3(0.070f, 0.030f, 0.040f)), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.495f, 0.055f), 0.030f, 4, 6), bones["Head"], Skin);

            // Ears & Lobes
            mb.Append(PartFactory.SpherePart(new Vector3(0.108f, 1.610f, -0.010f), 0.025f, 5, 6), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.108f, 1.610f, -0.010f), 0.025f, 5, 6), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(0.108f, 1.585f, 0.005f), 0.015f, 4, 4), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.108f, 1.585f, 0.005f), 0.015f, 4, 4), bones["Head"], Skin);

            // Nose
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.610f, 0.085f), 0.012f, 0.040f, 6, true), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.590f, 0.110f), 0.022f, 5, 6), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(0.015f, 1.578f, 0.105f), 0.010f, 4, 4), bones["Head"], Skin);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.015f, 1.578f, 0.105f), 0.010f, 4, 4), bones["Head"], Skin);

            // Eyes & Features
            mb.Append(PartFactory.SpherePart(new Vector3(0.042f, 1.625f, 0.075f), 0.028f, 5, 6), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.042f, 1.625f, 0.075f), 0.028f, 5, 6), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(0.042f, 1.625f, 0.090f), 0.018f, 5, 6), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.042f, 1.625f, 0.090f), 0.018f, 5, 6), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(0.042f, 1.625f, 0.102f), 0.008f, 4, 4), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.042f, 1.625f, 0.102f), 0.008f, 4, 4), bones["Head"], Feature);

            // Eyebrows
            mb.Append(PartFactory.BoxPart(new Vector3(0.045f, 1.648f, 0.085f), new Vector3(0.040f, 0.006f, 0.012f), Quaternion.Euler(0f, 0f, -5f)), bones["Head"], Hair);
            mb.Append(PartFactory.BoxPart(new Vector3(-0.045f, 1.648f, 0.085f), new Vector3(0.040f, 0.006f, 0.012f), Quaternion.Euler(0f, 0f, 5f)), bones["Head"], Hair);

            // Lips & Mouth
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.555f, 0.095f), new Vector3(0.045f, 0.008f, 0.015f), Quaternion.Euler(5f, 0f, 0f)), bones["Head"], Feature);
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.545f, 0.098f), new Vector3(0.050f, 0.010f, 0.018f), Quaternion.Euler(-5f, 0f, 0f)), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(0.028f, 1.550f, 0.090f), 0.006f, 3, 4), bones["Head"], Feature);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.028f, 1.550f, 0.090f), 0.006f, 3, 4), bones["Head"], Feature);

            // === 2. Base Hair Cap ===
            mb.Append(PartFactory.HairCapPart(new Vector3(0f, 1.640f, -0.010f), 0.115f, 5, 12), bones["Head"], Hair);
            mb.Append(PartFactory.SpherePart(new Vector3(0.090f, 1.630f, -0.020f), 0.040f, 4, 6), bones["Head"], Hair);
            mb.Append(PartFactory.SpherePart(new Vector3(-0.090f, 1.630f, -0.020f), 0.040f, 4, 6), bones["Head"], Hair);

            // === 3. Role-Specific Tamil Nadu Facial Silhouettes & Hair Architecture ===
            switch (role)
            {
                case NpcHeadRole.Murugan:
                    // Iconic Madurai/Chennai chevron moustache ('Meesai') + thick sideburns
                    mb.Append(PartFactory.BoxPart(new Vector3(0.024f, 1.562f, 0.104f), new Vector3(0.042f, 0.014f, 0.020f), Quaternion.Euler(0f, 0f, -18f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.024f, 1.562f, 0.104f), new Vector3(0.042f, 0.014f, 0.020f), Quaternion.Euler(0f, 0f, 18f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(0.096f, 1.585f, 0.015f), new Vector3(0.018f, 0.045f, 0.022f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.096f, 1.585f, 0.015f), new Vector3(0.018f, 0.045f, 0.022f)), bones["Head"], Hair);
                    break;

                case NpcHeadRole.Velu:
                    // Stylish auto-rickshaw driver handlebar moustache with pointed tips + driver forehead towel band
                    mb.Append(PartFactory.BoxPart(new Vector3(0.025f, 1.565f, 0.102f), new Vector3(0.046f, 0.011f, 0.018f), Quaternion.Euler(0f, 0f, -25f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.025f, 1.565f, 0.102f), new Vector3(0.046f, 0.011f, 0.018f), Quaternion.Euler(0f, 0f, 25f)), bones["Head"], Hair);
                    mb.Append(PartFactory.SpherePart(new Vector3(0.052f, 1.572f, 0.096f), 0.010f, 4, 4), bones["Head"], Hair); // upturned tip
                    mb.Append(PartFactory.SpherePart(new Vector3(-0.052f, 1.572f, 0.096f), 0.010f, 4, 4), bones["Head"], Hair); // upturned tip
                    // Forehead band
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.662f, 0.025f), 0.095f, 0.025f, 10, true), bones["Head"], Feature);
                    break;

                case NpcHeadRole.Selvam:
                    // Elder archaeologist - full dignified beard across jaw and chin + traditional kudumi hair knot
                    mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.482f, 0.065f), 0.042f, 5, 8), bones["Head"], Hair); // chin beard
                    mb.Append(PartFactory.BoxPart(new Vector3(0.055f, 1.512f, 0.042f), new Vector3(0.028f, 0.048f, 0.055f)), bones["Head"], Hair); // jaw beard R
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.055f, 1.512f, 0.042f), new Vector3(0.028f, 0.048f, 0.055f)), bones["Head"], Hair); // jaw beard L
                    mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.620f, -0.118f), 0.048f, 6, 8), bones["Head"], Hair); // traditional kudumi/bun
                    break;

                case NpcHeadRole.Artisan:
                    // Mamallapuram stone sculptor - topknot bun on crown + sculptor goatee
                    mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.738f, -0.010f), 0.045f, 5, 8), bones["Head"], Hair); // topknot
                    mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.488f, 0.062f), new Vector3(0.028f, 0.032f, 0.022f)), bones["Head"], Hair); // goatee
                    break;

                case NpcHeadRole.Farmer:
                    // Cauvery Delta farmer - cotton headwrap / thalappa wrapped around brow
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.665f, 0.015f), 0.125f, 0.065f, 12, true), bones["Head"], Hair); // turban
                    mb.Append(PartFactory.SpherePart(new Vector3(0.090f, 1.680f, 0.015f), 0.035f, 4, 6), bones["Head"], Hair); // cloth knot
                    mb.Append(PartFactory.BoxPart(new Vector3(0.020f, 1.560f, 0.100f), new Vector3(0.035f, 0.010f, 0.016f), Quaternion.Euler(0f, 0f, -10f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.020f, 1.560f, 0.100f), new Vector3(0.035f, 0.010f, 0.016f), Quaternion.Euler(0f, 0f, 10f)), bones["Head"], Hair);
                    break;

                case NpcHeadRole.Fisher:
                    // Pichavaram fisherman - weather cap / knit head covering + neat trimmed moustache
                    mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.670f, 0.005f), 0.110f, 6, 10), bones["Head"], Hair); // fisher cap
                    mb.Append(PartFactory.BoxPart(new Vector3(0.020f, 1.560f, 0.100f), new Vector3(0.036f, 0.010f, 0.016f)), bones["Head"], Hair);
                    mb.Append(PartFactory.BoxPart(new Vector3(-0.020f, 1.560f, 0.100f), new Vector3(0.036f, 0.010f, 0.016f)), bones["Head"], Hair);
                    break;

                case NpcHeadRole.ForestGuide:
                    // Nilgiris forest ranger - ranger brimmed cap trim
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.650f, 0.035f), 0.145f, 0.020f, 12, true), bones["Head"], Hair); // brim
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.680f, 0.015f), 0.115f, 0.045f, 10, true), bones["Head"], Hair); // crown
                    break;

                case NpcHeadRole.TeaWorker:
                    // Nilgiri tea picker Kannan - woollen ear muffler wrap
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.590f, 0.005f), 0.118f, 0.085f, 10, true), bones["Head"], Hair); // muffler
                    break;

                case NpcHeadRole.Meenakshi:
                    // Traditional South Indian female hairstyle: low kondai bun + jasmine garland ring (Malligai poo) + long braid
                    mb.Append(PartFactory.SpherePart(new Vector3(0f, 1.585f, -0.122f), 0.056f, 6, 10), bones["Head"], Hair); // kondai bun
                    mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.585f, -0.108f), 0.065f, 0.020f, 10, true), bones["Head"], Feature); // jasmine garland
                    // Long back braid
                    float yBraid = 1.55f;
                    for (int i = 0; i < 6; i++)
                    {
                        float w = 0.035f - i * 0.003f;
                        mb.Append(PartFactory.SpherePart(new Vector3(0f, yBraid, -0.060f - i * 0.015f), w, 4, 6), bones["Head"], Hair);
                        yBraid -= 0.065f;
                    }
                    break;

                default:
                    // GenericMale (Arun Kumar) - neat modern hairline
                    break;
            }

            string meshName = $"Procedure_Head_{role}";
            return mb.Finalize(meshName);
        }

        public static Mesh BuildUpperShirtMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.10f, 0f), 0.165f, 0.24f, 10, true), bones["Spine"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.30f, 0f), 0.19f, 0.24f, 10, true), bones["Chest"], 0);
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.375f, 0f), new Vector3(0.45f, 0.10f, 0.29f)), bones["Chest"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.285f, 1.33f, 0f), 0.066f, 0.24f, 8, true), bones["LeftUpperArm"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.285f, 1.33f, 0f), 0.066f, 0.24f, 8, true), bones["RightUpperArm"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.43f, 1.33f, 0f), 0.056f, 0.16f, 8, true), bones["LeftLowerArm"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.43f, 1.33f, 0f), 0.056f, 0.16f, 8, true), bones["RightLowerArm"], 0);
            return mb.Finalize("Procedure_UpperShirt");
        }

        public static Mesh BuildUpperBlouseMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.11f, 0f), 0.155f, 0.18f, 10, true), bones["Spine"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 1.26f, 0f), 0.165f, 0.20f, 10, true), bones["Chest"], 0);
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.34f, 0f), new Vector3(0.38f, 0.09f, 0.25f)), bones["Chest"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.27f, 1.32f, 0f), 0.060f, 0.14f, 8, true), bones["LeftUpperArm"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.27f, 1.32f, 0f), 0.060f, 0.14f, 8, true), bones["RightUpperArm"], 0);
            return mb.Finalize("Procedure_UpperBlouse");
        }

        public static Mesh BuildLowerVeshtiMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 0.99f, 0f), new Vector3(0.34f, 0.09f, 0.27f)), bones["Spine"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.78f, 0f), 0.083f, 0.36f, 10, true), bones["LeftUpperLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.78f, 0f), 0.083f, 0.36f, 10, true), bones["RightUpperLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.42f, 0f), 0.080f, 0.58f, 10, true), bones["LeftLowerLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.42f, 0f), 0.080f, 0.58f, 10, true), bones["RightLowerLeg"], 0);
            return mb.Finalize("Procedure_LowerVeshti");
        }

        public static Mesh BuildLowerLungiMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 0.99f, 0f), new Vector3(0.35f, 0.10f, 0.27f)), bones["Spine"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.82f, 0f), 0.098f, 0.38f, 10, true), bones["LeftUpperLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.82f, 0f), 0.098f, 0.38f, 10, true), bones["RightUpperLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0.098f, 0.53f, 0f), 0.094f, 0.46f, 10, true), bones["LeftLowerLeg"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(-0.098f, 0.53f, 0f), 0.094f, 0.46f, 10, true), bones["RightLowerLeg"], 0);
            return mb.Finalize("Procedure_LowerLungi");
        }

        public static Mesh BuildLowerSariSkirtMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.BoxPart(new Vector3(0f, 1.00f, 0f), new Vector3(0.36f, 0.10f, 0.27f)), bones["Spine"], 0);
            mb.Append(PartFactory.CylinderPart(new Vector3(0f, 0.50f, 0f), 0.145f, 0.92f, 12, true), bones["Spine"], 0);
            return mb.Finalize("Procedure_LowerSariSkirt");
        }

        public static Mesh BuildAccessoryThunduMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.BoxPart(new Vector3(0.20f, 1.375f, -0.03f), new Vector3(0.06f, 0.27f, 0.016f), Quaternion.Euler(0f, 0f, -20f)), bones["LeftShoulder"], 0);
            return mb.Finalize("Procedure_AccessoryThundu");
        }

        public static Mesh BuildAccessoryPalluMesh(Dictionary<string, int> bones)
        {
            var mb = new MeshBuilder();
            mb.Append(PartFactory.BoxPart(new Vector3(0.21f, 1.37f, 0.05f), new Vector3(0.055f, 0.35f, 0.05f), Quaternion.Euler(0f, 0f, -12f)), bones["LeftShoulder"], 0);
            return mb.Finalize("Procedure_AccessoryPallu");
        }

        // ------------------------------------------------------------------
        // Textures
        // ------------------------------------------------------------------
        public static Dictionary<string, Texture2D> BuildTextures()
        {
            var results = new Dictionary<string, Texture2D>();
            void Add(string key, Color baseColor, bool stripes = false, bool checks = false, Color stripeColor = default, bool border = false, Color borderColor = default, int noise = 18)
            {
                results[key] = PaintFabric(256, baseColor, stripes, checks, stripeColor, border, borderColor, noise);
            }

            Add("skin_fair", new Color(0.93f, 0.78f, 0.68f), noise: 24);
            Add("skin_wheat", new Color(0.84f, 0.66f, 0.52f), noise: 26);
            Add("skin_bronze", new Color(0.70f, 0.50f, 0.36f), noise: 28);
            Add("skin_deep", new Color(0.55f, 0.38f, 0.27f), noise: 30);

            Add("hair_black", new Color(0.10f, 0.09f, 0.10f), noise: 12);
            Add("hair_brown", new Color(0.26f, 0.17f, 0.12f), noise: 14);
            Add("hair_grey", new Color(0.62f, 0.60f, 0.58f), noise: 12);

            Add("fabric_white", new Color(0.96f, 0.95f, 0.93f), noise: 6);
            Add("fabric_cream", new Color(0.93f, 0.88f, 0.76f), noise: 6);
            Add("fabric_blue", new Color(0.24f, 0.36f, 0.55f), noise: 8);
            Add("fabric_mustard", new Color(0.78f, 0.58f, 0.18f), noise: 8);
            Add("fabric_green", new Color(0.25f, 0.42f, 0.30f), noise: 8);

            Add("veshti_white", new Color(0.96f, 0.94f, 0.88f), stripes: true, stripeColor: new Color(0.65f, 0.12f, 0.10f), noise: 8);
            Add("veshti_navy", new Color(0.10f, 0.16f, 0.34f), stripes: true, stripeColor: new Color(0.80f, 0.55f, 0.15f), noise: 8);
            Add("veshti_festival", new Color(0.85f, 0.48f, 0.12f), stripes: true, stripeColor: new Color(0.95f, 0.88f, 0.45f), noise: 8);
            Add("lungi_red", new Color(0.60f, 0.12f, 0.14f), checks: true, stripeColor: new Color(0.95f, 0.75f, 0.25f), noise: 10);
            Add("lungi_blue", new Color(0.12f, 0.25f, 0.42f), checks: true, stripeColor: new Color(0.88f, 0.85f, 0.55f), noise: 10);
            Add("sari_crimson", new Color(0.55f, 0.09f, 0.14f), stripes: true, stripeColor: new Color(0.85f, 0.55f, 0.18f), border: true, borderColor: new Color(0.90f, 0.70f, 0.22f), noise: 10);
            Add("sari_green", new Color(0.16f, 0.38f, 0.24f), stripes: true, stripeColor: new Color(0.90f, 0.65f, 0.20f), border: true, borderColor: new Color(0.92f, 0.75f, 0.30f), noise: 10);
            Add("pallu_red", new Color(0.70f, 0.14f, 0.16f), stripes: true, stripeColor: new Color(0.95f, 0.80f, 0.30f), noise: 8);
            Add("pallu_cream", new Color(0.94f, 0.88f, 0.74f), stripes: true, stripeColor: new Color(0.75f, 0.30f, 0.18f), noise: 8);
            Add("thundu_red", new Color(0.70f, 0.14f, 0.16f), stripes: true, stripeColor: new Color(0.95f, 0.80f, 0.30f), noise: 8);
            Add("wool_shawl", new Color(0.55f, 0.40f, 0.30f), checks: true, stripeColor: new Color(0.75f, 0.20f, 0.16f), noise: 14);
            Add("features", new Color(0.08f, 0.05f, 0.04f), noise: 4);
            return results;
        }

        public static Dictionary<string, Texture2D> BuildNormals(Dictionary<string, Texture2D> albedo)
        {
            var normals = new Dictionary<string, Texture2D>();
            foreach (var pair in albedo)
            {
                normals[pair.Key] = PaintNormalFromHeight(pair.Value, 256);
            }
            return normals;
        }

        private static Texture2D PaintFabric(int size, Color color, bool stripes, bool checks, Color stripeColor,
            bool border, Color borderColor, int noise)
        {
            Texture2D tex = NewTexture(size);
            var pixels = new Color32[size * size];
            var noiseRng = new System.Random(1337);
            int bandCount = 6;
            int bandWidth = size / bandCount;
            bool selectedStripe = false;
            for (int y = 0; y < size; y++)
            {
                selectedStripe = (y / bandWidth) % 3 == 0;
                bool vStripe = stripes && ((y / (bandWidth / 2)) % 2 == 1);
                for (int x = 0; x < size; x++)
                {
                    Color c = color;
                    if (stripes && vStripe) c = Color.Lerp(c, stripeColor, 0.55f);
                    if (checks)
                    {
                        bool check = ((x / (bandWidth / 2)) % 2 == 1) ^ ((y / (bandWidth / 2)) % 2 == 1 && CheckBias(x));
                        if (check) c = Color.Lerp(c, stripeColor, 0.4f);
                    }
                    if (border && (x < 10 || x > size - 11 || y < 10 || y > size - 11)) c = Color.Lerp(c, borderColor, 0.8f);
                    if ((selectedStripe) && stripes && noiseRng.Next(100) < 2) c = Color.Lerp(c, Color.black, 0.15f);
                    float jitter = (float)(noiseRng.NextDouble() - 0.5) * noise / 255f;
                    pixels[y * size + x] = new Color32(
                        (byte)Mathf.Clamp(c.r * 255f + jitter * 255f, 0, 255),
                        (byte)Mathf.Clamp(c.g * 255f + jitter * 255f, 0, 255),
                        (byte)Mathf.Clamp(c.b * 255f + jitter * 255f, 0, 255),
                        255);
                }
            }
            tex.SetPixels32(pixels, 0);
            tex.Apply(false, false);
            return tex;
        }

        private static bool CheckBias(int x) => (x / 11) % 2 == 0;

        private static Texture2D PaintNormalFromHeight(Texture2D height, int size)
        {
            Texture2D normal = NewTexture(size);
            Color[] src = height.GetPixels();
            var pixels = new Color[size * size];
            const float strength = 2.0f;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    int x0 = (x + size - 1) % size, x1 = (x + 1) % size;
                    int y0 = (y + size - 1) % size, y1 = (y + 1) % size;
                    float hL = src[y * size + x0].r, hR = src[y * size + x1].r;
                    float hD = src[y0 * size + x].r, hU = src[y1 * size + x].r;
                    Vector3 n = new Vector3((hL - hR) * strength, (hD - hU) * strength, 1f).normalized;
                    pixels[y * size + x] = new Color(n.x * 0.5f + 0.5f, n.y * 0.5f + 0.5f, n.z * 0.5f + 0.5f, 1f);
                }
            }
            normal.SetPixels(pixels, 0);
            normal.Apply(false, false);
            return normal;
        }

        private static Texture2D NewTexture(int size) => new Texture2D(size, size, TextureFormat.RGBA32, true, true);

        public static void SaveTexture(string path, Texture2D tex)
        {
            byte[] png = tex.EncodeToPNG();
            string dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
            File.WriteAllBytes(path, png);
            AssetDatabase.ImportAsset(path);
        }

        // ------------------------------------------------------------------
        // Materials (HDRP/Lit)
        // ------------------------------------------------------------------
        public static Material BuildHdrpMaterial(string name, Texture2D albedo, Texture2D normal, float smoothness)
        {
            var mat = new Material(Shader.Find("HDRP/Lit"));
            mat.name = name;
            if (albedo != null)
            {
                mat.SetTexture("_BaseColorMap", albedo);
                mat.SetColor("_BaseColor", Color.white);
            }
            if (normal != null) mat.SetTexture("_NormalMap", normal);
            mat.SetFloat("_Smoothness", smoothness);
            return mat;
        }

        // ------------------------------------------------------------------
        // Animation clips (local bone rotation curves; generic avatar friendly)
        // ------------------------------------------------------------------
        private sealed class ClipContext
        {
            public readonly AnimationClip Clip;
            public readonly Dictionary<string, Transform> Bones;
            public readonly float Duration;

            public ClipContext(AnimationClip clip, Dictionary<string, Transform> bones, float duration)
            {
                Clip = clip;
                Bones = bones;
                Duration = duration;
            }

            public string Path(string bone) => CharacterOffsetNode + "/" + bone;

            public void Rotate(string bone, Func<float, Vector3> eulerFunc)
            {
                AuthorEuler(Clip, Path(bone), eulerFunc, Duration);
            }

            public void HipsLocalY(Func<float, float> yFunc)
            {
                AuthorPositionY(Clip, Path("Hips"), yFunc, Duration);
            }

            public void OffsetRotation(Func<float, Quaternion> rotFunc)
            {
                AuthorQuat(Clip, CharacterOffsetNode, rotFunc, Duration);
            }

            public void OffsetPositionY(Func<float, float> yFunc)
            {
                AuthorPositionY(Clip, CharacterOffsetNode, yFunc, Duration);
            }
        }

        private static void AuthorEuler(AnimationClip clip, string path, Func<float, Vector3> eulerFunc, float duration)
        {
            int fps = 30;
            int frames = Mathf.Max(2, Mathf.CeilToInt(duration * fps));
            var rotX = new AnimationCurve();
            var rotY = new AnimationCurve();
            var rotZ = new AnimationCurve();
            for (int i = 0; i <= frames; i++)
            {
                float t = duration * i / frames;
                Quaternion q = Quaternion.Euler(eulerFunc(t));
                double time = t;
                rotX.AddKey((float)time, q.x);
                rotY.AddKey((float)time, q.y);
                rotZ.AddKey((float)time, q.z);
            }
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.x", rotX);
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.y", rotY);
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.z", rotZ);
        }

        private static void AuthorQuat(AnimationClip clip, string path, Func<float, Quaternion> quatFunc, float duration)
        {
            int fps = 30;
            int frames = Mathf.Max(2, Mathf.CeilToInt(duration * fps));
            var rotX = new AnimationCurve();
            var rotY = new AnimationCurve();
            var rotZ = new AnimationCurve();
            var rotW = new AnimationCurve();
            for (int i = 0; i <= frames; i++)
            {
                float t = duration * i / frames;
                Quaternion q = quatFunc(t);
                double time = t;
                rotX.AddKey((float)time, q.x);
                rotY.AddKey((float)time, q.y);
                rotZ.AddKey((float)time, q.z);
                rotW.AddKey((float)time, q.w);
            }
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.x", rotX);
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.y", rotY);
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.z", rotZ);
            clip.SetCurve(path, typeof(Transform), "m_LocalRotation.w", rotW);
        }

        private static void AuthorPositionY(AnimationClip clip, string path, Func<float, float> yFunc, float duration)
        {
            int fps = 30;
            int frames = Mathf.Max(2, Mathf.CeilToInt(duration * fps));
            var posY = new AnimationCurve();
            for (int i = 0; i <= frames; i++)
            {
                float t = duration * i / frames;
                posY.AddKey((float)t, yFunc(t));
            }
            clip.SetCurve(path, typeof(Transform), "m_LocalPosition.y", posY);
        }

        private static AnimationClip MakeClip(string name, Dictionary<string, Transform> bones, float duration, Action<ClipContext> author)
        {
            var clip = new AnimationClip { name = name, frameRate = 30, wrapMode = WrapMode.Loop };
            var ctx = new ClipContext(clip, bones, duration);
            author(ctx);
            return clip;
        }

        private static float Phase(float t, float cycle) => (t % cycle) / cycle * Mathf.PI * 2f;
        private static float SinClamp(float rad) => Mathf.Sin(rad);

        public static Dictionary<string, AnimationClip> BuildClips(Dictionary<string, Transform> bones)
        {
            var clips = new Dictionary<string, AnimationClip>();

            clips["PlayerIdle"] = MakeClip("PlayerIdle", bones, 2.0f, ctx =>
            {
                ctx.Rotate("Chest", t => new Vector3(0.02f * Mathf.Sin(Phase(t, 2f)), 0f, 0f));
                ctx.Rotate("UpperChest", t => new Vector3(0.03f * Mathf.Sin(Phase(t, 2f)), 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(0f, 0.02f * Mathf.Sin(Phase(t, 2f)), 0.04f));
                ctx.Rotate("RightUpperArm", t => new Vector3(0f, -0.02f * Mathf.Sin(Phase(t, 2f)), -0.04f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(0f, 0f, 0.02f));
                ctx.Rotate("RightLowerArm", t => new Vector3(0f, 0f, -0.02f));
                ctx.HipsLocalY(t => 0.006f * Mathf.Sin(Phase(t, 2f)));
            });

            clips["PlayerWalk"] = MakeClip("PlayerWalk", bones, 1.1f, ctx =>
            {
                float swing = 30f;
                WalkClips(ctx, swing, 1.1f, 8f);
            });

            clips["PlayerRun"] = MakeClip("PlayerRun", bones, 0.7f, ctx =>
            {
                WalkClips(ctx, 45f, 0.7f, 14f);
            });

            clips["PlayerSprint"] = MakeClip("PlayerSprint", bones, 0.55f, ctx =>
            {
                WalkClips(ctx, 52f, 0.55f, 20f);
            });

            clips["PlayerCrouchIdle"] = MakeClip("PlayerCrouchIdle", bones, 2.0f, ctx =>
            {
                ctx.OffsetPositionY(t => -0.32f);
                ctx.HipsLocalY(t => -0.26f + 0.01f * Mathf.Sin(Phase(t, 2f)));
                ctx.Rotate("LeftUpperLeg", t => new Vector3(0f, 0f, 28f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(0f, 0f, -28f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(-54f, 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(-54f, 0f, 0f));
                ctx.Rotate("Spine", t => new Vector3(10f, 0f, 0f));
                ctx.Rotate("Chest", t => new Vector3(8f, 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(24f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(24f, 0f, 0f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-42f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-42f, 0f, 0f));
            });

            clips["PlayerCrouchWalk"] = MakeClip("PlayerCrouchWalk", bones, 1.3f, ctx =>
            {
                ctx.OffsetPositionY(t => -0.32f);
                ctx.HipsLocalY(t => -0.26f);
                ctx.Rotate("LeftUpperArm", t => new Vector3(24f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(24f, 0f, 0f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-42f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-42f, 0f, 0f));
                ctx.Rotate("Spine", t => new Vector3(10f, 0f, 0f));
                WalkClips(ctx, 34f, 1.3f, 6f);
            });

            clips["PlayerJump"] = MakeClip("PlayerJump", bones, 0.55f, ctx =>
            {
                ctx.Rotate("LeftUpperLeg", t => new Vector3(28f * Mathf.Clamp01((t - 0.08f) / 0.2f), 0f, 0f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(28f * Mathf.Clamp01((t - 0.08f) / 0.2f), 0f, 0f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(-98f * Mathf.Clamp01(t / 0.3f), 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(-98f * Mathf.Clamp01(t / 0.3f), 0f, 0f));
                ctx.HipsLocalY(t => 0.16f * Mathf.Sin(Mathf.Min(1f, t / 0.55f) * Mathf.PI));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-38f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-38f, 0f, 0f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-30f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-30f, 0f, 0f));
            });

            clips["PlayerFall"] = MakeClip("PlayerFall", bones, 1.0f, ctx =>
            {
                ctx.Rotate("LeftUpperArm", t => new Vector3(-56f, 0f, 14f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-56f, 0f, -14f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-22f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-22f, 0f, 0f));
                ctx.Rotate("LeftUpperLeg", t => new Vector3(-12f, 0f, 8f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(-12f, 0f, -8f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(18f, 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(18f, 0f, 0f));
            });

            clips["PlayerLand"] = MakeClip("PlayerLand", bones, 0.4f, ctx =>
            {
                ApplyLand(ctx, 0.4f);
            });

            clips["NPCIdle"] = MakeClip("NPCIdle", bones, 2.2f, ctx =>
            {
                ctx.Rotate("Chest", t => new Vector3(0.02f * Mathf.Sin(Phase(t, 2.2f)), 0f, 0f));
                ctx.HipsLocalY(t => 0.005f * Mathf.Sin(Phase(t, 2.2f)));
            });

            clips["NPCWalk"] = MakeClip("NPCWalk", bones, 1.15f, ctx => WalkClips(ctx, 26f, 1.15f, 5f));

            clips["NPCRun"] = MakeClip("NPCRun", bones, 0.7f, ctx => WalkClips(ctx, 40f, 0.7f, 12f));

            clips["NPCWork"] = MakeClip("NPCWork", bones, 1.6f, ctx =>
            {
                ctx.HipsLocalY(t => 0.015f * Mathf.Sin(Phase(t, 1.6f)));
                ctx.Rotate("Spine", t => new Vector3(14f, 0f, 0f));
                ctx.Rotate("Chest", t => new Vector3(12f, 0f, 0f));
                ctx.Rotate("LeftUpperLeg", t => new Vector3(6f, 0f, 0f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(6f, 0f, 0f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(-30f, 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(-30f, 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-70f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(-50f, 0f, 0f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-40f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-20f, 0f, 0f));
            });

            clips["NPCFish"] = MakeClip("NPCFish", bones, 1.8f, ctx =>
            {
                ctx.HipsLocalY(t => 0.02f * Mathf.Sin(Phase(t, 1.8f)));
                ctx.Rotate("RightUpperArm", t => new Vector3(-85f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-60f, 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(-20f, 0f, 0f) + new Vector3(0f, 0f, 15f * Mathf.Sin(Phase(t, 0.9f))));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-45f, 0f, 0f));
            });

            clips["NPCTalk"] = MakeClip("NPCTalk", bones, 1.4f, ctx =>
            {
                ctx.Rotate("Head", t => new Vector3(0f, 8f * Mathf.Sin(Phase(t, 1.4f)), 0f));
                ctx.Rotate("Chest", t => new Vector3(0f, 4f * Mathf.Sin(Phase(t, 1.4f)), 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(6f, 0f, 30f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(8f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(6f, 0f, -30f));
                ctx.Rotate("RightLowerArm", t => new Vector3(8f, 0f, 0f));
            });

            clips["NPCSit"] = MakeClip("NPCSit", bones, 2.0f, ctx =>
            {
                ctx.OffsetPositionY(t => -0.42f);
                ctx.HipsLocalY(t => -0.20f);
                ctx.Rotate("LeftUpperLeg", t => new Vector3(94f, 0f, 0f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(94f, 0f, 0f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(-86f, 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(-86f, 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(18f, 0f, 0f));
                ctx.Rotate("RightUpperArm", t => new Vector3(18f, 0f, 0f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-30f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-30f, 0f, 0f));
                ctx.Rotate("Spine", t => new Vector3(8f, 0f, 0f));
            });

            clips["NPCSleep"] = MakeClip("NPCSleep", bones, 2.0f, ctx =>
            {
                ctx.OffsetRotation(t => Quaternion.Euler(-90f, 0f, 90f));
                ctx.OffsetPositionY(t => -0.92f);
                ctx.Rotate("LeftUpperLeg", t => new Vector3(-12f, 0f, 0f));
                ctx.Rotate("RightUpperLeg", t => new Vector3(-12f, 0f, 0f));
                ctx.Rotate("LeftLowerLeg", t => new Vector3(26f, 0f, 0f));
                ctx.Rotate("RightLowerLeg", t => new Vector3(26f, 0f, 0f));
                ctx.Rotate("LeftUpperArm", t => new Vector3(10f, 0f, 4f));
                ctx.Rotate("RightUpperArm", t => new Vector3(10f, 0f, -4f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-60f, 0f, 0f));
                ctx.Rotate("RightLowerArm", t => new Vector3(-60f, 0f, 0f));
                ctx.Rotate("Spine", t => new Vector3(-8f, 0f, 0f));
            });

            clips["NPCEat"] = MakeClip("NPCEat", bones, 1.5f, ctx =>
            {
                ctx.Rotate("LeftUpperArm", t => new Vector3(22f, 0f, 18f));
                ctx.Rotate("LeftLowerArm", t => new Vector3(-88f, 0f, 0f));
                ctx.Rotate("Head", t => new Vector3(-8f, 0f, 0f) + new Vector3(14f * Mathf.Max(0f, Mathf.Sin(Phase(t, 1.5f))), 0f, 0f));
            });

            return clips;
        }

        private static void ApplyLand(ClipContext ctx, float duration)
        {
            ctx.Rotate("LeftUpperLeg", t => new Vector3(26f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
            ctx.Rotate("RightUpperLeg", t => new Vector3(26f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
            ctx.Rotate("LeftLowerLeg", t => new Vector3(-10f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
            ctx.Rotate("RightLowerLeg", t => new Vector3(-10f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
            ctx.HipsLocalY(t => -0.05f * Mathf.Clamp01(1f - t / duration));
            ctx.Rotate("LeftUpperArm", t => new Vector3(12f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
            ctx.Rotate("RightUpperArm", t => new Vector3(12f * Mathf.Clamp01(1f - t / duration), 0f, 0f));
        }

        private static void WalkClips(ClipContext ctx, float swing, float cycle, float bob)
        {
            ctx.Rotate("LeftUpperLeg", t => new Vector3(swing * Mathf.Sin(Phase(t, cycle)), 0f, 0f));
            ctx.Rotate("RightUpperLeg", t => new Vector3(swing * Mathf.Sin(Phase(t, cycle) + Mathf.PI), 0f, 0f));
            ctx.Rotate("LeftLowerLeg", t => new Vector3(swing * 0.12f * Mathf.Cos(Phase(t, cycle)) - 14f, 0f, 0f));
            ctx.Rotate("RightLowerLeg", t => new Vector3(swing * 0.12f * Mathf.Cos(Phase(t, cycle) + Mathf.PI) - 14f, 0f, 0f));
            ctx.Rotate("LeftFoot", t => new Vector3(0f, 0f, 0f));
            ctx.Rotate("RightFoot", t => new Vector3(0f, 0f, 0f));
            ctx.Rotate("LeftUpperArm", t => new Vector3(0f, 0f, -swing * 0.55f * Mathf.Sin(Phase(t, cycle) + Mathf.PI)));
            ctx.Rotate("RightUpperArm", t => new Vector3(0f, 0f, -swing * 0.55f * Mathf.Sin(Phase(t, cycle))));
            ctx.Rotate("LeftLowerArm", t => new Vector3(-8f, 0f, 0f));
            ctx.Rotate("RightLowerArm", t => new Vector3(-8f, 0f, 0f));
            ctx.Rotate("Spine", t => new Vector3(3f * Mathf.Sin(Phase(t, cycle)), 0f, 0f));
            ctx.HipsLocalY(t => bob * 0.002f * Mathf.Sin(Phase(t, cycle) * 2f) + bob * 0.001f);
        }
    }
}