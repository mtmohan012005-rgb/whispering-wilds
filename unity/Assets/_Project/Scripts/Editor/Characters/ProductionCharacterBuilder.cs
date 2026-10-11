using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.Animations;
using WhisperingWilds.Characters;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Editor.Characters
{
    /// <summary>
    /// STEP 39 — Production character builder for realistic 3D human models.
    /// 
    /// This editor tool imports realistic FBX models (from Mixamo or other sources)
    /// and builds production-ready character prefabs with all required gameplay components.
    /// 
    /// Workflow:
    /// 1. Download realistic human models from Mixamo or other free sources
    /// 2. Place FBX files in Assets/_Project/Art/Models/Characters/Production/
    /// 3. Run: Tools/Whispering Wilds/Characters/Build Production Characters
    /// 4. The builder imports models, configures Humanoid Avatars, and creates prefabs
    /// 
    /// Each character must have a corresponding entry in ProductionCharacterCatalog.
    /// </summary>
    public static class ProductionCharacterBuilder
    {
        const string ProductionModelsRoot = "Assets/_Project/Art/Models/Characters/Production";
        const string PrefabRoot = "Assets/_Project/Prefabs/Characters/";
        const string NpcControllerPath = "Assets/_Project/Art/Animations/Characters/NPCCharacter.controller";
        const string PlayerControllerPath = "Assets/_Project/Art/Animations/Characters/PlayerCharacter.controller";

        /// <summary>
        /// Character definition for the production builder.
        /// </summary>
        public class CharacterDefinition
        {
            public string characterId;        // "player", "murugan", "velu", etc.
            public string displayName;        // "Murugan", "Velu", etc.
            public string fbxFileName;        // "murugan_realistic.fbx"
            public bool isPlayer;             // true for player character
            public bool isFemale;             // for clothing/appearance
            public string occupation;         // "Tea Shop Owner", "Farmer", etc.
            public string role;              // "Story NPC", "Vendor", etc.
            
            // Dialogue (bilingual)
            public string dialogueEn;
            public string dialogueTa;
            
            // Appearance overrides
            public string clothingDescription;
            public string skinTone;
            public string hairStyle;
        }

        /// <summary>
        /// Catalog of production characters to build.
        /// Add your downloaded models here with their FBX file names.
        /// </summary>
        private static readonly CharacterDefinition[] CharacterCatalog = new CharacterDefinition[]
        {
            new CharacterDefinition
            {
                characterId = "player",
                displayName = "Player",
                fbxFileName = "player_realistic.fbx",
                isPlayer = true,
                isFemale = false,
                occupation = "Traveler",
                role = "Player Character",
                dialogueEn = "",
                dialogueTa = "",
                clothingDescription = "Tamil Nadu traditional attire",
                skinTone = "Wheat",
                hairStyle = "Short black hair"
            },
            new CharacterDefinition
            {
                characterId = "murugan",
                displayName = "Murugan",
                fbxFileName = "murugan_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Tea Shop Owner",
                role = "Story NPC / Vendor",
                dialogueEn = "Welcome! Would you like some tea?",
                dialogueTa = "வரவேற்கிறேன்! தேநீர் வேண்டுமா?",
                clothingDescription = "White veshti and shirt",
                skinTone = "Wheat",
                hairStyle = "Short black hair, receding"
            },
            new CharacterDefinition
            {
                characterId = "velu",
                displayName = "Velu",
                fbxFileName = "velu_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Auto Driver",
                role = "Story NPC",
                dialogueEn = "Need a ride? I know all the roads around here.",
                dialogueTa = "வண்டி வேண்டுமா? இந்த வழிகளை நான் அறிவேன்.",
                clothingDescription = "Casual shirt and veshti",
                skinTone = "Bronze",
                hairStyle = "Short black hair"
            },
            new CharacterDefinition
            {
                characterId = "selvam",
                displayName = "Selvam",
                fbxFileName = "selvam_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Farmer",
                role = "Story NPC",
                dialogueEn = "The fields have been dry this season.",
                dialogueTa = "இந்த காலத்தில் வயல்கள் வறண்டிருக்கின்றன.",
                clothingDescription = "Lungi and shirt",
                skinTone = "Deep",
                hairStyle = "Short black hair"
            },
            new CharacterDefinition
            {
                characterId = "meenakshi",
                displayName = "Meenakshi",
                fbxFileName = "meenakshi_realistic.fbx",
                isPlayer = false,
                isFemale = true,
                occupation = "Local Guide",
                role = "Story NPC",
                dialogueEn = "I can show you the way through the old town.",
                dialogueTa = "பழைய நகரத்தின் வழியை நான் காட்டுவேன்.",
                clothingDescription = "Sari",
                skinTone = "Wheat",
                hairStyle = "Long black hair"
            },
            new CharacterDefinition
            {
                characterId = "artisan",
                displayName = "Artisan",
                fbxFileName = "artisan_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Craftsman",
                role = "Vendor",
                dialogueEn = "I make traditional bronze sculptures.",
                dialogueTa = "பாரம்பரிய வெண்கல சிற்பங்களை நான் செய்கிறேன்.",
                clothingDescription = "Work clothes",
                skinTone = "Bronze",
                hairStyle = "Short black hair"
            },
            new CharacterDefinition
            {
                characterId = "farmer",
                displayName = "Farmer",
                fbxFileName = "farmer_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Rice Farmer",
                role = "Environmental NPC",
                dialogueEn = "The paddy is growing well this year.",
                dialogueTa = "இந்த ஆண்டு நெல் நன்றாக வளர்கிறது.",
                clothingDescription = "Lungi and shirt",
                skinTone = "Wheat",
                hairStyle = "Short black hair"
            },
            new CharacterDefinition
            {
                characterId = "fisher",
                displayName = "Fisher",
                fbxFileName = "fisher_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Fisherman",
                role = "Environmental NPC",
                dialogueEn = "The catch has been good today.",
                dialogueTa = "இன்று மீன் பிடி நன்றாக இருக்கிறது.",
                clothingDescription = "Lungi and vest",
                skinTone = "Deep",
                hairStyle = "Short brown hair"
            },
            new CharacterDefinition
            {
                characterId = "forestguide",
                displayName = "Forest Guide",
                fbxFileName = "forestguide_realistic.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Forest Ranger",
                role = "Story NPC",
                dialogueEn = "The forest holds many secrets.",
                dialogueTa = "காடு பல ரகசியங்களைக் கொண்டுள்ளது.",
                clothingDescription = "Ranger uniform",
                skinTone = "Wheat",
                hairStyle = "Short black hair"
            }
        };

        [MenuItem("Whispering Wilds/Characters/Build Production Characters")]
        public static void BuildProductionCharacters()
        {
            Debug.Log("<color=#FFD700><b>[ProductionCharacterBuilder]</b></color> Starting production character build...");
            
            int successCount = 0;
            int failCount = 0;
            int skipCount = 0;

            foreach (var def in CharacterCatalog)
            {
                try
                {
                    if (BuildCharacter(def))
                    {
                        successCount++;
                        Debug.Log($"<color=#00FF88><b>[ProductionCharacterBuilder]</b></color> Built: {def.displayName}");
                    }
                    else
                    {
                        skipCount++;
                        Debug.LogWarning($"<color=#FFAA00><b>[ProductionCharacterBuilder]</b></color> Skipped: {def.displayName} (FBX not found)");
                    }
                }
                catch (Exception ex)
                {
                    failCount++;
                    Debug.LogError($"<color=#FF4444><b>[ProductionCharacterBuilder]</b></color> Failed to build {def.displayName}: {ex.Message}");
                }
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"<color=#FFD700><b>[ProductionCharacterBuilder]</b></color> Build complete: {successCount} succeeded, {skipCount} skipped, {failCount} failed");
        }

        private static bool BuildCharacter(CharacterDefinition def)
        {
            // Find the FBX file
            string fbxPath = FindFbxInProductionFolder(def.fbxFileName);
            if (string.IsNullOrEmpty(fbxPath))
            {
                Debug.LogWarning($"[ProductionCharacterBuilder] FBX not found for {def.displayName}: {def.fbxFileName}");
                return false;
            }

            // Load the FBX model
            GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(fbxPath);
            if (model == null)
            {
                Debug.LogError($"[ProductionCharacterBuilder] Failed to load FBX: {fbxPath}");
                return false;
            }

            // Verify Humanoid Avatar
            var animator = model.GetComponentInChildren<Animator>();
            if (animator == null)
            {
                Debug.LogError($"[ProductionCharacterBuilder] No Animator found on {def.displayName}. Ensure FBX has Humanoid rig.");
                return false;
            }

            if (animator.avatar == null || !animator.avatar.isHuman)
            {
                Debug.LogError($"[ProductionCharacterBuilder] {def.displayName} does not have a valid Humanoid Avatar. " +
                    "Set Animation Type to Humanoid in the FBX import settings.");
                return false;
            }

            // Build the prefab
            string prefabPath = GetPrefabPath(def);
            GameObject prefab = BuildPrefab(model, def, animator);
            
            if (prefab != null)
            {
                PrefabUtility.SaveAsPrefabAsset(prefab, prefabPath);
                GameObject.DestroyImmediate(prefab);
                return true;
            }

            return false;
        }

        private static GameObject BuildPrefab(GameObject model, CharacterDefinition def, Animator sourceAnimator)
        {
            // Create the root GameObject
            string rootName = def.isPlayer ? "PlayerCharacter" : $"NPC_{def.displayName}";
            var root = new GameObject(rootName);
            root.layer = LayerMask.NameToLayer("Character");

            // Create CharacterOffset child (matches existing hierarchy)
            var characterOffset = new GameObject("CharacterOffset");
            characterOffset.transform.SetParent(root.transform, false);
            characterOffset.transform.localPosition = Vector3.zero;
            characterOffset.transform.localRotation = Quaternion.identity;

            // Instantiate the model under CharacterOffset
            var modelInstance = GameObject.Instantiate(model);
            modelInstance.transform.SetParent(characterOffset.transform, false);
            modelInstance.transform.localPosition = Vector3.zero;
            modelInstance.transform.localRotation = Quaternion.identity;
            modelInstance.transform.localScale = Vector3.one;

            // Copy the Animator from the model
            var animatorComponent = root.AddComponent<Animator>();
            animatorComponent.runtimeAnimatorController = sourceAnimator.runtimeAnimatorController;

            if (def.isPlayer)
            {
                // Player-specific components
                var pm = root.AddComponent<WhisperingWilds.Player.PlayerMovement>();
                root.AddComponent<WhisperingWilds.Player.PlayerInputHandler>();
                
                // CharacterController for physics
                var cc = root.AddComponent<CharacterController>();
                cc.height = 1.8f;
                cc.radius = 0.25f;
                cc.center = new Vector3(0, 0.9f, 0);
            }
            else
            {
                // NPC-specific components
                var npcChar = root.AddComponent<NPCCharacter>();
                ConfigureNPCCharacter(npcChar, def);

                root.AddComponent<NPCNavigationController>();
                
                var animDriver = root.AddComponent<NPCAnimationDriver>();
                
                root.AddComponent<NPCScheduleManager>();

                // Interaction collider
                var collider = root.AddComponent<CapsuleCollider>();
                collider.height = 1.8f;
                collider.radius = 0.5f;
                collider.center = new Vector3(0, 0.9f, 0);
                collider.isTrigger = true;
            }

            return root;
        }

        private static void ConfigureNPCCharacter(NPCCharacter npc, CharacterDefinition def)
        {
            // Use reflection to set serialized fields
            var so = new SerializedObject(npc);
            
            var nameProp = so.FindProperty("displayName");
            if (nameProp != null) nameProp.stringValue = def.displayName;

            var occupationProp = so.FindProperty("occupation");
            if (occupationProp != null) occupationProp.stringValue = def.occupation;

            var roleProp = so.FindProperty("role");
            if (roleProp != null) roleProp.stringValue = def.role;

            // Dialogue
            var dialogueEnProp = so.FindProperty("dialogueEn");
            if (dialogueEnProp != null) dialogueEnProp.stringValue = def.dialogueEn;

            var dialogueTaProp = so.FindProperty("dialogueTa");
            if (dialogueTaProp != null) dialogueTaProp.stringValue = def.dialogueTa;

            so.ApplyModifiedPropertiesWithoutUndo();
        }

        private static string GetPrefabPath(CharacterDefinition def)
        {
            if (def.isPlayer)
            {
                return PrefabRoot + "PlayerCharacter.prefab";
            }
            else
            {
                return PrefabRoot + $"NPC_{def.displayName}.prefab";
            }
        }

        private static string FindFbxInProductionFolder(string fileName)
        {
            // Search in the production folder
            string searchPath = ProductionModelsRoot;
            if (!Directory.Exists(Path.Combine(Application.dataPath, "..", "..", "..", "..", searchPath.Replace("Assets/", ""))))
            {
                // Create the folder if it doesn't exist
                Directory.CreateDirectory(Path.Combine(Application.dataPath, "_Project/Art/Models/Characters/Production"));
                AssetDatabase.Refresh();
            }

            // Search for the file
            var guids = AssetDatabase.FindAssets($"t:Model {fileName}");
            foreach (var guid in guids)
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.Contains("/Production/") && (path.EndsWith(".fbx") || path.EndsWith(".FBX")))
                {
                    return path;
                }
            }

            // Also search by exact name
            var allGuids = AssetDatabase.FindAssets("t:Model");
            foreach (var guid in allGuids)
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                if (path.Contains("/Production/") && Path.GetFileName(path).ToLower() == fileName.ToLower())
                {
                    return path;
                }
            }

            return null;
        }
    }
}
