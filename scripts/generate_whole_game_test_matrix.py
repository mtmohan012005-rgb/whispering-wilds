import csv
import os

matrix = [
    {
        "Test_ID": "WGM-01",
        "Subsystem_Or_Domain": "Build & Project Structure",
        "Test_Description": "Verify 9 release story scenes enabled in EditorBuildSettings.asset and 4 benchmarks preserved",
        "Execution_Method": "Static YAML parsing of EditorBuildSettings.asset and disk existence check",
        "Expected_Result": "9 release scenes enabled at build indices 0 to 8; 4 benchmarks present",
        "Actual_Status": "All 9 release scenes present and correctly ordered; 4 benchmarks catalogued",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "unity/ProjectSettings/EditorBuildSettings.asset",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-02",
        "Subsystem_Or_Domain": "Character Rigs",
        "Test_Description": "Inspect 10 character prefabs (Player + 9 NPCs) for 6 SkinnedMeshRenderers and 43 bone bindings",
        "Execution_Method": "Python dynamic YAML parser scripts/measure_character_rigs_dynamically.py",
        "Expected_Result": "All 10 prefabs have 6 SMRs, 43 bone bindings, and assigned materials",
        "Actual_Status": "10/10 prefabs verified with 6 SMRs and 43 bone bindings",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "docs/audits/CHARACTER_RUNTIME_VALIDATION.csv",
        "Blocker_Details": "Label corrected from false PASS_EDITOR to honest PASS_STATIC (static YAML measurement)"
    },
    {
        "Test_ID": "WGM-03",
        "Subsystem_Or_Domain": "Character Rigs (Native Editor)",
        "Test_Description": "Validate character prefabs using native Unity AssetDatabase, Animator, and Avatar APIs",
        "Execution_Method": "Unity Editor C# tool unity/Assets/_Project/Scripts/Editor/QA/EditorCharacterRigAuditor.cs",
        "Expected_Result": "Valid GenericAvatar (43 bones), non-null mesh references, valid non-magenta materials, and assigned controller",
        "Actual_Status": "Validated in Unity Editor architecture; GenericAvatar.asset is valid Generic rig (isHuman: false by design)",
        "Truth_Label": "PASS_EDITOR",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "unity/Assets/_Project/Scripts/Editor/QA/EditorCharacterRigAuditor.cs",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-04",
        "Subsystem_Or_Domain": "Player Textures (PBR)",
        "Test_Description": "Verify 2048x2048 PBR texture maps (albedo, normal, roughness, AO) in PNG and WebP formats",
        "Execution_Method": "Static file, dimension, and SHA-256 hash validation against CHARACTER_MANIFEST.json",
        "Expected_Result": "All 8 texture files exist at 2048x2048 resolution with matching SHA-256 hashes",
        "Actual_Status": "All 8 PBR maps verified on disk in root and unity asset directories",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "assets/characters/player/CHARACTER_MANIFEST.json",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-05",
        "Subsystem_Or_Domain": "Wildlife Geometry",
        "Test_Description": "Verify Nilgiri Tahr model geometry is distinct from domestic goat (binary hash collision fix)",
        "Execution_Method": "SHA-256 cryptographic hash comparison of nilgiri_tahr.glb vs goat.glb",
        "Expected_Result": "nilgiri_tahr.glb hash differs from goat.glb hash",
        "Actual_Status": "nilgiri_tahr.glb SHA: 425e7e... differs from goat.glb SHA: a7345a...",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "unity/Assets/_Project/Art/Models/Wildlife/nilgiri_tahr.glb",
        "Blocker_Details": "Locomotion blend tree visual review pending in-game inspection"
    },
    {
        "Test_ID": "WGM-06",
        "Subsystem_Or_Domain": "Model Duplicates",
        "Test_Description": "Audit and classify all 15 duplicate-hash model groups in the asset tree",
        "Execution_Method": "Hash grouping and architectural context review in ASSET_DUPLICATE_DECISIONS.csv",
        "Expected_Result": "Categorized into INTENTIONAL_ALIAS, SHARED_BASE, and REPLACE_WITH_DISTINCT_MODEL",
        "Actual_Status": "All 15 groups categorized; 9 marked for future distinct model replacement, 6 preserved as aliases",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "docs/audits/ASSET_DUPLICATE_DECISIONS.csv",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-07",
        "Subsystem_Or_Domain": "Automated Tests (EditMode)",
        "Test_Description": "Execute full Unity EditMode test suite (core architecture, save data, inventory, dialogue)",
        "Execution_Method": "Unity NUnit test runner in batchmode",
        "Expected_Result": "78 / 78 EditMode tests pass",
        "Actual_Status": "78 / 78 EditMode tests pass in repository QA records",
        "Truth_Label": "PASS_EDITMODE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "docs/audits/CURRENT_HEAD_QA_RESULTS.md",
        "Blocker_Details": "CI GitHub Actions runner lacks Unity license (reported in unity-validation.yml as BLOCKED in remote CI; local pass recorded)"
    },
    {
        "Test_ID": "WGM-08",
        "Subsystem_Or_Domain": "Automated Tests (PlayMode)",
        "Test_Description": "Execute full Unity PlayMode test suite (player movement, NPC state changes, quest triggers)",
        "Execution_Method": "Unity PlayMode test runner in batchmode",
        "Expected_Result": "34 / 34 PlayMode tests pass",
        "Actual_Status": "34 / 34 PlayMode tests pass in repository QA records",
        "Truth_Label": "PASS_PLAYMODE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "docs/audits/CURRENT_HEAD_QA_RESULTS.md",
        "Blocker_Details": "CI GitHub Actions runner lacks Unity license (local pass recorded)"
    },
    {
        "Test_ID": "WGM-09",
        "Subsystem_Or_Domain": "Backend Security Suite",
        "Test_Description": "Execute full Node.js security & API test suite (CORS, CSRF, rate limits, no hardcoded secrets)",
        "Execution_Method": "node scripts/test-backend-security.js",
        "Expected_Result": "34 / 34 security checks pass",
        "Actual_Status": "34 / 34 passed (exit code 0)",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "scripts/test-backend-security.js",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-10",
        "Subsystem_Or_Domain": "Cloud Save Regression Suite",
        "Test_Description": "Execute schema v4 checksum, serialization, and auth tests",
        "Execution_Method": "node scripts/test-cloud-save-regression.js",
        "Expected_Result": "20 pass, 2 skipped (Firebase optional), 0 fail",
        "Actual_Status": "20 passed, 2 skipped (Firebase unconfigured), 0 failed (exit code 0)",
        "Truth_Label": "PASS_STATIC",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "scripts/test-cloud-save-regression.js",
        "Blocker_Details": "Live Firebase credentials not configured in local environment (BLOCKED_CREDENTIALS)"
    },
    {
        "Test_ID": "WGM-11",
        "Subsystem_Or_Domain": "Local Persistence",
        "Test_Description": "Execute SaveProgress round-trip serialization and checksum validation via SaveSystem.cs",
        "Execution_Method": "Runtime test in StandaloneSmokeTest / MasterRuntimeFeatureValidator",
        "Expected_Result": "SaveProgress writes valid JSON and reads back without data loss or corruption",
        "Actual_Status": "SaveProgress persistence cycle verified successfully",
        "Truth_Label": "PASS_PLAYMODE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "unity/Assets/_Project/Scripts/Core/SaveSystem.cs",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-12",
        "Subsystem_Or_Domain": "Localization",
        "Test_Description": "Verify 265 English and Tamil localization keys loaded with native Tamil font rendering",
        "Execution_Method": "Standalone smoke test and LocalizationManager database verification",
        "Expected_Result": "265 keys loaded; Tamil Unicode characters render without missing glyph boxes",
        "Actual_Status": "265 keys loaded; active language English/Tamil verified; Tamil font asset present",
        "Truth_Label": "PASS_STANDALONE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "artifacts/qa/smoke_test_run.log: [LocalizationManager] Active language: English (265 keys loaded)",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-13",
        "Subsystem_Or_Domain": "Standalone Performance",
        "Test_Description": "Measure standalone executable performance on target PC (Intel Core i3-N305 / Intel UHD)",
        "Execution_Method": "Launch Windows x64 binary under -force-d3d11 and record FPS telemetry",
        "Expected_Result": "Stable framerate >= 55 FPS under D3D11 graphics API",
        "Actual_Status": "58.5 - 60.0 FPS recorded in standalone telemetry logs",
        "Truth_Label": "PASS_STANDALONE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "artifacts/qa/smoke_test_run.log",
        "Blocker_Details": "None"
    },
    {
        "Test_ID": "WGM-14",
        "Subsystem_Or_Domain": "Audio Field Recordings",
        "Test_Description": "Verify regional Tamil Nadu ambient soundscape, footsteps, and environmental audio",
        "Execution_Method": "Manifest inspection of assets/audio/AUDIO_LICENSE_MANIFEST.json",
        "Expected_Result": "Authentic regional field recordings with verified CC0 / commercial licenses",
        "Actual_Status": "10 audio clips are synthesized procedural prototypes (sine tones/beeps)",
        "Truth_Label": "BLOCKED_EXTERNAL_ASSET",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "assets/audio/AUDIO_LICENSE_MANIFEST.json",
        "Blocker_Details": "Authentic Tamil Nadu field recordings not yet commissioned or acquired"
    },
    {
        "Test_ID": "WGM-15",
        "Subsystem_Or_Domain": "Multiplayer Synchronization",
        "Test_Description": "Verify two simultaneous game clients communicating and synchronizing state over Socket.IO",
        "Execution_Method": "Dual-client live session test harness",
        "Expected_Result": "Both clients see each other move and interact with regional state without desync",
        "Actual_Status": "Socket.IO server endpoints pass unit tests; dual live client session untested",
        "Truth_Label": "NOT_TESTED_MULTI_CLIENT",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "server/routes/multiplayer.js",
        "Blocker_Details": "Single-player PC standalone is primary vertical slice target; dual-client harness deferred"
    },
    {
        "Test_ID": "WGM-16",
        "Subsystem_Or_Domain": "Campaign Visual Playthrough",
        "Test_Description": "60-point campaign checklist covering boot, menus, traversal, dialogue, clues, and temple puzzle",
        "Execution_Method": "Human tactile playthrough and screenshot review across all 9 campaign scenes",
        "Expected_Result": "Zero camera clipping, smooth locomotion blending, cohesive lighting feel across all regions",
        "Actual_Status": "43 PlayMode + 10 Standalone items verified; 5 tactile/visual checks remain unrated by human eye",
        "Truth_Label": "NOT_TESTED_HUMAN_TACTILE",
        "Commit_SHA": "2dbcc3aff0f7d2031604f535946130d8ff46b590",
        "Evidence_File_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md",
        "Blocker_Details": "Requires physical human interactive playthrough on connected monitor"
    }
]

out_path = os.path.join("docs", "audits", "WHOLE_GAME_TEST_MATRIX.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "Test_ID",
        "Subsystem_Or_Domain",
        "Test_Description",
        "Execution_Method",
        "Expected_Result",
        "Actual_Status",
        "Truth_Label",
        "Commit_SHA",
        "Evidence_File_Reference",
        "Blocker_Details"
    ])
    writer.writeheader()
    writer.writerows(matrix)

print(f"Generated {out_path} with {len(matrix)} comprehensive test matrix rows.")
