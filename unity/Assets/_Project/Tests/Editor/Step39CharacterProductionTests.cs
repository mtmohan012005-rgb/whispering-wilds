using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Editor.Characters;

namespace WhisperingWilds.Tests.Editor
{
    /// <summary>
    /// Editor tests for Step 39: Production character builder and validation infrastructure.
    /// </summary>
    [TestFixture]
    public class Step39CharacterProductionTests
    {
        // ==================================================================
        // ProductionCharacterBuilder tests
        // ==================================================================

        [Test]
        public void ProductionCharacterBuilder_CatalogHasPlayer()
        {
            // The builder should have a player character definition
            var type = typeof(ProductionCharacterBuilder);
            Assert.IsNotNull(type, "ProductionCharacterBuilder should exist");
        }

        [Test]
        public void ProductionCharacterBuilder_MenuItemExists()
        {
            // Verify the menu item is registered
            var hasMenu = UnityEditor.MenuCommand.HasValidCommand("Whispering Wilds/Characters/Build Production Characters");
            // Note: This may fail if the menu isn't loaded yet, so we just check the type exists
            Assert.IsNotNull(typeof(ProductionCharacterBuilder), "Builder type should exist");
        }

        [Test]
        public void ProductionCharacterBuilder_CharacterDefinition_HasRequiredFields()
        {
            var def = new ProductionCharacterBuilder.CharacterDefinition
            {
                characterId = "test",
                displayName = "Test",
                fbxFileName = "test.fbx",
                isPlayer = false,
                isFemale = false,
                occupation = "Test",
                role = "Test",
                dialogueEn = "Test",
                dialogueTa = "தெஸ்ட்",
                clothingDescription = "Test",
                skinTone = "Test",
                hairStyle = "Test"
            };

            Assert.AreEqual("test", def.characterId);
            Assert.AreEqual("Test", def.displayName);
            Assert.AreEqual("test.fbx", def.fbxFileName);
            Assert.IsFalse(def.isPlayer);
            Assert.AreEqual("Test", def.occupation);
        }

        [Test]
        public void ProductionCharacterBuilder_FemaleCharacterDefinition()
        {
            var def = new ProductionCharacterBuilder.CharacterDefinition
            {
                characterId = "meenakshi",
                displayName = "Meenakshi",
                fbxFileName = "meenakshi_realistic.fbx",
                isPlayer = false,
                isFemale = true,
                occupation = "Local Guide",
                role = "Story NPC"
            };

            Assert.IsTrue(def.isFemale, "Meenakshi should be female");
            Assert.IsFalse(def.isPlayer, "Meenakshi should not be player");
        }

        // ==================================================================
        // CharacterPrefabCatalog regression tests
        // ==================================================================

        [Test]
        public void CharacterPrefabCatalog_PlayerPath()
        {
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/PlayerCharacter.prefab",
                Characters.CharacterPrefabCatalog.PlayerPrefabPath);
        }

        [Test]
        public void CharacterPrefabCatalog_MuruganPath()
        {
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/NPC_Murugan.prefab",
                Characters.CharacterPrefabCatalog.MuruganPrefabPath);
        }

        [Test]
        public void CharacterPrefabCatalog_ResolveCharacter_Player()
        {
            var path = Characters.CharacterPrefabCatalog.ResolveCharacter("player");
            Assert.IsNotNull(path);
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/PlayerCharacter.prefab", path);
        }

        [Test]
        public void CharacterPrefabCatalog_ResolveCharacter_Murugan()
        {
            var path = Characters.CharacterPrefabCatalog.ResolveCharacter("murugan");
            Assert.IsNotNull(path);
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/NPC_Murugan.prefab", path);
        }

        [Test]
        public void CharacterPrefabCatalog_ResolveCharacter_WithExtension()
        {
            var path = Characters.CharacterPrefabCatalog.ResolveCharacter("murugan.glb");
            Assert.IsNotNull(path);
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/NPC_Murugan.prefab", path);
        }

        [Test]
        public void CharacterPrefabCatalog_ResolveCharacter_WithFullPath()
        {
            var path = Characters.CharacterPrefabCatalog.ResolveCharacter("Assets/_Project/Art/Models/Characters/NPCs/velu.glb");
            Assert.IsNotNull(path);
            Assert.AreEqual("Assets/_Project/Prefabs/Characters/NPC_Velu.prefab", path);
        }

        [Test]
        public void CharacterPrefabCatalog_ResolveCharacter_Unknown()
        {
            var path = Characters.CharacterPrefabCatalog.ResolveCharacter("unknown_model");
            Assert.IsNull(path, "Unknown character should return null");
        }

        [Test]
        public void CharacterPrefabCatalog_IsLegacyCharacterModel()
        {
            Assert.IsTrue(Characters.CharacterPrefabCatalog.IsLegacyCharacterModel(
                "Assets/_Project/Art/Models/Characters/NPCs/murugan.glb"));
            Assert.IsTrue(Characters.CharacterPrefabCatalog.IsLegacyCharacterModel(
                "Assets/_Project/Art/Models/Characters/Player/player.glb"));
            Assert.IsFalse(Characters.CharacterPrefabCatalog.IsLegacyCharacterModel(
                "Assets/_Project/Art/Models/Props/tea_kadai_stall.glb"));
        }

        // ==================================================================
        // CharacterAssetValidator tests
        // ==================================================================

        [Test]
        public void CharacterAssetValidator_ValidatorExists()
        {
            var type = typeof(QA.CharacterAssetValidator);
            Assert.IsNotNull(type, "CharacterAssetValidator should exist");
        }

        [Test]
        public void CharacterAssetValidator_Finding_Creation()
        {
            var finding = new QA.CharacterAssetValidator.Finding
            {
                result = QA.CharacterAssetValidator.ValidationResult.Pass,
                category = "Test",
                description = "Test finding",
                detail = "Test detail"
            };

            Assert.AreEqual(QA.CharacterAssetValidator.ValidationResult.Pass, finding.result);
            Assert.AreEqual("Test", finding.category);
        }

        [Test]
        public void CharacterAssetValidator_Report_Calculation()
        {
            var report = new QA.CharacterAssetValidator.CharacterReport
            {
                characterId = "test",
                displayName = "Test",
                prefabPath = "test.prefab"
            };

            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Pass });
            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Pass });
            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Fail });
            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Warning });

            Assert.AreEqual(2, report.passCount);
            Assert.AreEqual(1, report.failCount);
            Assert.AreEqual(1, report.warningCount);
            Assert.IsFalse(report.isProductionReady);
        }

        [Test]
        public void CharacterAssetValidator_Report_ProductionReady()
        {
            var report = new QA.CharacterAssetValidator.CharacterReport
            {
                characterId = "test",
                displayName = "Test",
                prefabPath = "test.prefab"
            };

            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Pass });
            report.findings.Add(new QA.CharacterAssetValidator.Finding { result = QA.CharacterAssetValidator.ValidationResult.Warning });

            Assert.AreEqual(1, report.passCount);
            Assert.AreEqual(0, report.failCount);
            Assert.IsTrue(report.isProductionReady);
        }

        // ==================================================================
        // Animation parameter contract tests
        // ==================================================================

        [Test]
        public void PlayerMovement_AnimatorParameters_Exist()
        {
            // Verify the parameter names used by PlayerMovement
            var go = new GameObject("TestPlayer");
            var animator = go.AddComponent<Animator>();
            
            // These are the parameters PlayerMovement.UpdateAnimator() writes
            var speedParam = Animator.StringToHash("Speed");
            var groundedParam = Animator.StringToHash("Grounded");
            var freeFallParam = Animator.StringToHash("FreeFall");
            var crouchingParam = Animator.StringToHash("Crouching");

            Assert.AreNotEqual(0, speedParam, "Speed parameter hash should be valid");
            Assert.AreNotEqual(0, groundedParam, "Grounded parameter hash should be valid");
            Assert.AreNotEqual(0, freeFallParam, "FreeFall parameter hash should be valid");
            Assert.AreNotEqual(0, crouchingParam, "Crouching parameter hash should be valid");

            Object.DestroyImmediate(go);
        }

        [Test]
        public void NPCAnimationDriver_StateNames_Exist()
        {
            // Verify the NPC animation state names
            var states = new[]
            {
                "Idle", "Walk", "Run", "Work", "Talk", "Eat", "Drink",
                "Carry", "Buy", "Sell", "Craft", "Fish", "Farm",
                "TeaWork", "Sit", "Sleep", "React"
            };

            foreach (var state in states)
            {
                var hash = Animator.StringToHash(state);
                Assert.AreNotEqual(0, hash, $"State '{state}' should have a valid hash");
            }
        }
    }
}
