using System.Collections.Generic;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Authoritative resolver between the legacy placeholder GLB assets and the STEP 29
    /// authored character prefabs. Any *character* model path (player or NPCs) resolves to
    /// its authored prefab; every non-character path passes through unchanged so this helper
    /// is safe to run over arbitrary model paths (vegetation, props, vehicles, wildlife).
    ///
    /// The nine legacy character GLBs are audited PLACEHOLDER (see CHARACTER_ASSET_AUDIT.md)
    /// and are intentionally no longer referenced for people by this catalog.
    /// </summary>
    public static class CharacterPrefabCatalog
    {
        public const string CharacterPrefabRoot = "Assets/_Project/Prefabs/Characters/";

        public const string PlayerPrefabPath = CharacterPrefabRoot + "PlayerCharacter.prefab";

        public const string MuruganPrefabPath = CharacterPrefabRoot + "NPC_Murugan.prefab";
        public const string VeluPrefabPath = CharacterPrefabRoot + "NPC_Velu.prefab";
        public const string SelvamPrefabPath = CharacterPrefabRoot + "NPC_Selvam.prefab";
        public const string MeenakshiPrefabPath = CharacterPrefabRoot + "NPC_Meenakshi.prefab";
        public const string ArtisanPrefabPath = CharacterPrefabRoot + "NPC_Artisan.prefab";
        public const string FarmerPrefabPath = CharacterPrefabRoot + "NPC_Farmer.prefab";
        public const string FisherPrefabPath = CharacterPrefabRoot + "NPC_Fisher.prefab";
        public const string ForestGuidePrefabPath = CharacterPrefabRoot + "NPC_ForestGuide.prefab";
        public const string TeaWorkerPrefabPath = CharacterPrefabRoot + "NPC_TeaWorker.prefab";

        /// <summary>
        /// File-name key (GLB base name, e.g. "selvam") -> prefab asset path.
        /// </summary>
        private static readonly Dictionary<string, string> CharacterModelToPrefab = new Dictionary<string, string>
        {
            { "player", PlayerPrefabPath },
            { "murugan", MuruganPrefabPath },
            { "velu", VeluPrefabPath },
            { "selvam", SelvamPrefabPath },
            { "meenakshi", MeenakshiPrefabPath },
            { "artisan", ArtisanPrefabPath },
            { "farmer", FarmerPrefabPath },
            { "fisher", FisherPrefabPath },
            { "forest-guide", ForestGuidePrefabPath },
            { "kannan", TeaWorkerPrefabPath },
        };

        /// <summary>
        /// Resolves a character model file name (with or without extension) to its authored
        /// prefab path. Returns null when the key is not a known character.
        /// </summary>
        public static string ResolveCharacter(string modelFileNameOrId)
        {
            if (string.IsNullOrEmpty(modelFileNameOrId)) return null;
            string key = modelFileNameOrId
                .Replace('\\', '/')
                .Trim();
            int slash = key.LastIndexOf('/');
            if (slash >= 0) key = key.Substring(slash + 1);
            int dot = key.LastIndexOf('.');
            if (dot >= 0) key = key.Substring(0, dot);
            key = key.ToLowerInvariant();

            CharacterModelToPrefab.TryGetValue(key, out string path);
            return path;
        }

        /// <summary>
        /// Full path resolver used by the scene builders. Recognizes any model path under the
        /// character model folders; every other path (props/vegetation/vehicles/etc.) is returned
        /// unchanged so callers keep one instantiation path regardless of asset class.
        /// </summary>
        public static string ResolveVisualPath(string modelAssetPath)
        {
            string prefabPath = ResolveCharacter(modelAssetPath);
            return prefabPath ?? modelAssetPath;
        }

        /// <summary>
        /// True when the asset path points at a legacy character GLB (a placeholder by this audit).
        /// </summary>
        public static bool IsLegacyCharacterModel(string modelAssetPath)
        {
            string lower = string.IsNullOrEmpty(modelAssetPath) ? "" : modelAssetPath.Replace('\\', '/').ToLowerInvariant();
            return lower.Contains("/characters/npcs/")
                || lower.Contains("/characters/player/");
        }
    }
}