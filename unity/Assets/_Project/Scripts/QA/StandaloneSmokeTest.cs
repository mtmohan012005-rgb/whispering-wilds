using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.Quality;
using WhisperingWilds.World;

namespace WhisperingWilds.QA
{
    /// <summary>
    /// Step 11 Phase 20 automated standalone runtime test.
    ///
    /// Exercises the whole player journey inside a real player build:
    /// boot -> New Game -> movement -> scene load -> NPC spawn/movement ->
    /// Tamil UI -> English UI -> save -> load -> region transition -> graphics settings.
    ///
    /// Two hard rules this suite follows:
    ///
    /// 1. It never touches the player's real save. The save folder is moved aside for the
    ///    whole run and restored afterwards, so a smoke test cannot destroy a developer's
    ///    (or a player's) progress. Destructive save/load tests operate on that temporary
    ///    profile only.
    ///
    /// 2. It records exceptions, errors and missing references instead of letting them
    ///    scroll past. Application.logMessageReceived is captured for the entire run, so a
    ///    repeating NullReferenceException inside an NPC tick is caught even though it does
    ///    not break the frame.
    ///
    /// Activate with -smokeTest (or WW_SMOKE_TEST=1). Completely inert otherwise.
    ///
    /// Note on structure: a C# iterator cannot return a value, so each test coroutine
    /// communicates its verdict through <see cref="_status"/> and <see cref="_detail"/>,
    /// which <see cref="Step"/> snapshots after the coroutine finishes.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class StandaloneSmokeTest : MonoBehaviour
    {
        private const string FlagName = "-smokeTest";
        private const string EnvName = "WW_SMOKE_TEST";

        private enum StepStatus { Pass, Fail, Skip }

        private sealed class StepResult
        {
            public string name;
            public StepStatus status;
            public string detail;
            public float seconds;
        }

        private readonly List<StepResult> _results = new List<StepResult>();
        private readonly List<string> _errors = new List<string>();
        private readonly List<string> _warnings = new List<string>();
        private readonly StringBuilder _log = new StringBuilder();

        /// <summary>Verdict slot written by each test coroutine, read by <see cref="Step"/>.</summary>
        private StepStatus _status = StepStatus.Pass;
        private string _detail = "";

        private bool _ran;
        private float _suiteStart;

        private static StandaloneSmokeTest _instance;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            if (!IsRequested()) return;
            if (_instance != null) return;

            var go = new GameObject("~StandaloneSmokeTest");
            DontDestroyOnLoad(go);
            go.hideFlags = HideFlags.DontSave;
            go.AddComponent<StandaloneSmokeTest>();
        }

        private static bool IsRequested()
        {
            var args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (string.Equals(args[i], FlagName, StringComparison.OrdinalIgnoreCase)) return true;
            }

            string env = Environment.GetEnvironmentVariable(EnvName);
            return !string.IsNullOrEmpty(env) && env != "0";
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(this);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(this);

            Application.logMessageReceived += OnLogMessage;
        }

        private void OnDestroy()
        {
            Application.logMessageReceived -= OnLogMessage;
            if (_instance == this) _instance = null;
        }

        private void OnLogMessage(string condition, string stackTrace, LogType type)
        {
            switch (type)
            {
                case LogType.Error:
                case LogType.Exception:
                case LogType.Assert:
                    lock (_errors)
                    {
                        if (_errors.Count < 300) _errors.Add("[" + type + "] " + condition);
                    }
                    break;

                case LogType.Warning:
                    lock (_warnings)
                    {
                        if (_warnings.Count < 300) _warnings.Add(condition);
                    }
                    break;
            }
        }

        private void Start()
        {
            if (_ran) return;
            _ran = true;
            StartCoroutine(RunSuite());
        }

        // ------------------------------------------------------------------- suite

        private IEnumerator RunSuite()
        {
            _suiteStart = Time.realtimeSinceStartup;

            Header("THE WHISPERING WILDS - STEP 11 STANDALONE SMOKE TEST");
            Line("UTC           : " + DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture));
            Line("Unity         : " + Application.unityVersion);
            Line("Platform      : " + Application.platform);
            Line("GPU           : " + SystemInfo.graphicsDeviceName);
            Line("ComputeShaders: " + SystemInfo.supportsComputeShaders);
            Line("Save folder   : " + SaveSystem.SaveDirectory);

            // Isolate the save folder before anything can touch it.
            IsolateSaveDirectory();

            yield return Step("boot_scene_loaded", TestBootScene, 8f);
            yield return Step("new_game_reaches_gameplay", TestNewGame, 25f);
            yield return Step("player_spawns_with_camera", TestPlayerAndCamera, 12f);
            yield return Step("player_movement", TestPlayerMovement, 8f);
            yield return Step("ground_detection_mask", TestGroundDetection, 5f);
            yield return Step("world_renders", TestWorldRendering, 8f);
            yield return Step("npc_population_spawns", TestNpcPopulation, 14f);
            yield return Step("npc_simulation_ticks", TestNpcMovement, 12f);
            yield return Step("tamil_ui_renders", TestTamilUi, 8f);
            yield return Step("english_ui_renders", TestEnglishUi, 8f);
            yield return Step("language_persists", TestLanguagePersistence, 5f);
            yield return Step("save_writes", TestSave, 10f);
            yield return Step("load_restores_player", TestLoad, 12f);
            yield return Step("save_rejects_nan_infinity", TestNaNRejection, 5f);
            yield return Step("region_transition", TestRegionTransition, 35f);
            yield return Step("region_gating_chettinad_mamallapuram", TestRegionGating, 12f);
            yield return Step("mamallapuram_quest_chain", TestMamallapuramQuestChain, 25f);
            yield return Step("graphics_tiers_apply", TestGraphicsSettings, 10f);
            yield return Step("no_repeating_exceptions", TestNoRepeatingExceptions, 6f);

            RestoreSaveDirectory();

            Conclude();
        }

        private IEnumerator Step(string name, Func<IEnumerator> body, float timeoutSeconds)
        {
            float start = Time.realtimeSinceStartup;
            _status = StepStatus.Pass;
            _detail = "";

            _log.AppendLine();
            _log.AppendLine("### STEP " + name);
            Debug.Log("[SMOKE] " + name + " ...");

            float deadline = start + timeoutSeconds;
            IEnumerator routine = null;
            try
            {
                routine = body();
            }
            catch (Exception ex)
            {
                _status = StepStatus.Fail;
                _detail = "threw " + ex.GetType().Name + ": " + ex.Message;
            }

            if (routine != null)
            {
                while (true)
                {
                    bool moved;
                    try
                    {
                        moved = routine.MoveNext();
                    }
                    catch (Exception ex)
                    {
                        _status = StepStatus.Fail;
                        _detail = "threw " + ex.GetType().Name + ": " + ex.Message;
                        break;
                    }

                    if (!moved) break;

                    if (Time.realtimeSinceStartup > deadline)
                    {
                        _status = StepStatus.Fail;
                        _detail = "timed out after " + timeoutSeconds + "s";
                        break;
                    }

                    yield return null;
                }
            }

            var result = new StepResult
            {
                name = name,
                status = _status,
                detail = _detail,
                seconds = Time.realtimeSinceStartup - start
            };
            _results.Add(result);

            Line("  status : " + result.status);
            Line("  detail : " + result.detail);
            Line("  elapsed: " + result.seconds.ToString("F2", CultureInfo.InvariantCulture) + "s");
        }

        private void Pass() { _status = StepStatus.Pass; _detail = ""; }
        private void Pass(string note) { _status = StepStatus.Pass; _detail = note; }
        private void Fail(string why) { _status = StepStatus.Fail; _detail = why; }
        private void Skip(string why) { _status = StepStatus.Skip; _detail = why; }

        // -------------------------------------------------------------------- steps

        private IEnumerator TestBootScene()
        {
            float deadline = Time.realtimeSinceStartup + 8f;
            string bootName = null;

            while (Time.realtimeSinceStartup < deadline)
            {
                Scene s = SceneManager.GetActiveScene();
                if (s.IsValid() && s.isLoaded && !string.IsNullOrEmpty(s.name))
                {
                    bootName = s.name;
                    break;
                }
                yield return null;
            }

            if (string.IsNullOrEmpty(bootName)) { Fail("no active scene loaded"); yield break; }
            if (!bootName.StartsWith("00_Boot", StringComparison.Ordinal))
            {
                Fail("expected 00_Boot, active scene is '" + bootName + "'");
                yield break;
            }

            if (GameManager.Instance == null)
            {
                // Not fatal: the boot scene may hand off before this polls. The New Game
                // step is the real authority on whether the manager exists.
                Skip("00_Boot loaded but GameManager.Instance is not present yet");
                yield break;
            }

            Pass("scene=" + bootName + " state=" + GameManager.Instance.CurrentState);
        }

        private IEnumerator TestNewGame()
        {
            bool clicked = TryClickNewGameButton();

            if (!clicked)
            {
                var gm0 = GameManager.Instance;
                if (gm0 != null) gm0.SetGameState(GameState.Gameplay);
                _log.AppendLine("    (no New Game button found; drove GameManager directly)");
            }

            bool reached = false;
            var waiter = new WaitForState(GameState.Gameplay, 22f);
            while (waiter.MoveNext()) yield return null;
            reached = waiter.Current;

            if (!reached)
            {
                var gm = GameManager.Instance;
                Fail("never reached Gameplay; state=" + (gm != null ? gm.CurrentState.ToString() : "no GameManager"));
                yield break;
            }

            Pass(clicked ? "reached Gameplay via New Game button" : "reached Gameplay (fallback path)");
        }

        private IEnumerator TestPlayerAndCamera()
        {
            yield return new WaitForSecondsRealtime(2f);

            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no object tagged 'Player' spawned"); yield break; }

            if (Camera.main == null) { Fail("no Camera.main after New Game"); yield break; }

            var cc = player.GetComponent<CharacterController>();
            if (cc == null) { Fail("player has no CharacterController"); yield break; }

            Vector3 p = player.transform.position;
            if (!IsFinite(p)) { Fail("player spawn position is not finite: " + p); yield break; }

            if (player.GetComponent<Player.PlayerInputHandler>() == null)
            {
                Fail("player has no PlayerInputHandler");
                yield break;
            }

            Pass("player at " + p.ToString("F2") + " camera=" + Camera.main.name);
        }

        private IEnumerator TestPlayerMovement()
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no player"); yield break; }

            var cc = player.GetComponent<CharacterController>();
            if (cc == null || !cc.enabled) { Fail("player CharacterController missing/disabled"); yield break; }

            Vector3 before = player.transform.position;

            // Drive the controller directly: we are verifying the movement + collision +
            // ground pipeline actually integrates, not that a physical keyboard is wired
            // up inside a batch player.
            Vector3 probe = before + new Vector3(0f, 1.0f, 0f);
            cc.enabled = false;
            player.transform.position = probe;
            cc.enabled = true;

            for (int i = 0; i < 12; i++)
            {
                cc.Move(new Vector3(0.3f, -0.6f, 0f));
                yield return new WaitForFixedUpdate();
            }

            Vector3 after = player.transform.position;
            if (!IsFinite(after)) { Fail("player position became non-finite: " + after); yield break; }
            if (Vector3.Distance(after, probe) < 0.001f)
            {
                Fail("controller did not integrate at all (still at " + after + ")");
                yield break;
            }

            Pass("moved " + Vector3.Distance(before, after).ToString("F3") + "m; grounded resolves");
        }

        private IEnumerator TestGroundDetection()
        {
            var pm = UnityEngine.Object.FindFirstObjectByType<Player.PlayerMovement>();
            if (pm == null) { Fail("no PlayerMovement component found"); yield break; }

            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no player"); yield break; }

            System.Reflection.FieldInfo fi = typeof(Player.PlayerMovement).GetField(
                "cachedGroundMask",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (fi == null) { Fail("could not reflect cachedGroundMask"); yield break; }

            int mask = (int)fi.GetValue(pm);
            if (mask == 0)
            {
                var flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
                var gl = typeof(Player.PlayerMovement).GetField("groundLayers", flags);
                var ct = typeof(Player.PlayerMovement).GetField("controller", flags);
                int serialized = -999;
                if (gl != null && gl.GetValue(pm) is LayerMask lm) serialized = lm.value;
                object controllerValue = ct != null ? ct.GetValue(pm) : null;
                var tagged = GameObject.FindWithTag("Player");
                Fail("cachedGroundMask is empty; the player can never be grounded" +
                     " [diag: pmObject=" + pm.gameObject.name +
                     " pmActive=" + pm.gameObject.activeInHierarchy +
                     " pmEnabled=" + pm.enabled +
                     " awakeRan=" + (controllerValue != null) +
                     " sameAsTagged=" + (tagged != null && ReferenceEquals(pm.gameObject, tagged)) +
                     " playerLayer=" + pm.gameObject.layer +
                     " groundLayers=" + serialized +
                     " groundLayersDefault=" + gl?.FieldType.Name +
                     " getMask=" + LayerMask.GetMask("Ground", "Default", "Structure") +
                     " scene=" + pm.gameObject.scene.name + "]");
                yield break;
            }

            string[] forbidden = { "Character", "Wildlife", "Trigger", "Prop", "Ignore Raycast", "UI", "Water" };
            var bad = new List<string>();
            for (int i = 0; i < forbidden.Length; i++)
            {
                int layer = LayerMask.NameToLayer(forbidden[i]);
                if (layer < 0) continue; // layer not authored in this project - not a defect
                if ((mask & (1 << layer)) != 0) bad.Add(forbidden[i] + "(" + layer + ")");
            }

            if (bad.Count > 0)
            {
                Fail("ground mask still contains non-ground layers: " + string.Join(", ", bad.ToArray()));
                yield break;
            }

            Pass("mask=0x" + mask.ToString("X") + " excludes all authored non-ground layers");
        }

        private IEnumerator TestWorldRendering()
        {
            yield return new WaitForSecondsRealtime(0.5f);

            var renderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
            if (renderers.Length == 0) { Fail("no Renderer in the active gameplay scene"); yield break; }

            int withMesh = 0;
            for (int i = 0; i < renderers.Length; i++)
            {
                if (renderers[i].GetComponent<MeshFilter>() != null) withMesh++;
            }
            if (withMesh == 0) { Fail("renderers exist but none has a MeshFilter"); yield break; }

            var lights = FindObjectsByType<Light>(FindObjectsSortMode.None);
            bool hasSun = false;
            for (int i = 0; i < lights.Length; i++)
            {
                if (lights[i].type == LightType.Directional && lights[i].enabled) hasSun = true;
            }
            if (!hasSun) { Fail("no enabled directional light in gameplay scene"); yield break; }

            var vols = FindObjectsByType<Volume>(FindObjectsSortMode.None);
            int profiled = 0;
            for (int i = 0; i < vols.Length; i++)
            {
                if (vols[i].sharedProfile != null) profiled++;
            }

            Pass("renderers=" + renderers.Length + " meshRenderers=" + withMesh +
                 " lights=" + lights.Length + " volumes=" + vols.Length + " profiled=" + profiled);
        }

        private IEnumerator TestNpcPopulation()
        {
            float deadline = Time.realtimeSinceStartup + 14f;
            int npcCount = 0;

            while (Time.realtimeSinceStartup < deadline)
            {
                npcCount = FindObjectsByType<NPCCharacter>(FindObjectsSortMode.None).Length;
                if (npcCount > 0) break;
                yield return null;
            }

            if (npcCount == 0) { Fail("no NPCCharacter present in the gameplay scene after 14s"); yield break; }

            int mains = MainCharacterRegistry.MainCount;
            int residents = MainCharacterRegistry.ResidentCount;

            if (mains < 5) { Fail("registry declares only " + mains + " main characters (brief requires 5)"); yield break; }
            if (residents < 12) { Fail("registry declares only " + residents + " residents (brief requires 12+)"); yield break; }

            var unbound = new List<MainCharacterData>();
            MainCharacterRegistry.CollectMissingAssetBindings(unbound);

            var unboundNames = new List<string>();
            for (int i = 0; i < unbound.Count; i++) unboundNames.Add(unbound[i].characterId);

            _log.AppendLine("    roster: live=" + npcCount + " mains=" + mains + " residents=" + residents +
                            " unboundAssets=" + unbound.Count);
            if (unboundNames.Count > 0)
            {
                // Recorded, not failed: an absent production model is a MISSING ASSET
                // report item, not a runtime defect. The brief forbids substituting a
                // primitive, so the honest outcome is to name the gap.
                _log.AppendLine("    MISSING_PRODUCTION_ASSET: " + string.Join(", ", unboundNames.ToArray()));
            }

            Pass("live=" + npcCount + " roster mains=" + mains + " residents=" + residents);
        }

        private IEnumerator TestNpcMovement()
        {
            var tier = NPCPerformanceTierManager.Instance;
            if (tier == null) { Skip("NPCPerformanceTierManager not present in this scene"); yield break; }

            var npcs = FindObjectsByType<NPCCharacter>(FindObjectsSortMode.None);
            if (npcs.Length == 0) { Fail("no NPC to observe"); yield break; }

            var before = new Vector3[npcs.Length];
            for (int i = 0; i < npcs.Length; i++) before[i] = npcs[i].transform.position;

            float deadline = Time.realtimeSinceStartup + 9f;
            while (Time.realtimeSinceStartup < deadline) yield return null;

            if (tier.DecisionTicksLastSecond <= 0)
            {
                var tflags = System.Reflection.BindingFlags.NonPublic |
                             System.Reflection.BindingFlags.Instance;
                var listField = typeof(NPCPerformanceTierManager).GetField("activeNPCs", tflags);
                int activeCount = -1;
                if (listField != null)
                {
                    var list = listField.GetValue(tier) as System.Collections.ICollection;
                    if (list != null) activeCount = list.Count;
                }
                var camField = typeof(NPCPerformanceTierManager).GetField("playerCameraTransform", tflags);
                bool camNull = camField == null || camField.GetValue(tier) == null;
                var upField = typeof(NPCPerformanceTierManager).GetField("tickCounter", tflags);
                int tickCounter = upField != null ? (int)upField.GetValue(tier) : -1;
                Fail("NPC tier manager recorded 0 decision ticks in 9s; the simulation is not running" +
                     " [diag: activeNPCs=" + activeCount + " cameraNull=" + camNull +
                     " tierActive=" + tier.isActiveAndEnabled +
                     " tickCounter=" + tickCounter +
                     " sceneNPCs=" + npcs.Length +
                     " near=" + tier.NearCount + " med=" + tier.MediumCount + "]");
                yield break;
            }

            int moved = 0;
            for (int i = 0; i < npcs.Length; i++)
            {
                if (Vector3.Distance(npcs[i].transform.position, before[i]) > 0.05f) moved++;
            }

            // NPCs asleep at the current in-game hour legitimately do not move, so motion
            // is reported rather than required. A non-zero tick count is the real proof
            // that the tiered simulation is alive.
            Pass("ticks/s=" + tier.DecisionTicksLastSecond +
                 " near=" + tier.NearCount + " med=" + tier.MediumCount +
                 " far=" + tier.FarCount + " hibernate=" + tier.HibernatingCount +
                 " moved=" + moved + "/" + npcs.Length);
        }

        private IEnumerator TestTamilUi()
        {
            var lm = LocalizationManager.Instance;
            if (lm == null) { Fail("no LocalizationManager.Instance"); yield break; }

            lm.SetLanguage(Language.Tamil);
            yield return new WaitForSecondsRealtime(0.5f);

            LocalizationEntry entry;
            if (!LocalizationDatabase.TryGetEntry("menu.new_game", out entry))
            {
                Fail("missing localization key menu.new_game");
                yield break;
            }

            if (string.IsNullOrEmpty(entry.tamil)) { Fail("menu.new_game has no Tamil string"); yield break; }
            if (!ContainsTamil(entry.tamil))
            {
                Fail("menu.new_game Tamil string has no Tamil codepoints: " + entry.tamil);
                yield break;
            }

            string[] required = { "menu.new_game", "menu.continue", "menu.settings", "menu.quit" };
            var missing = new List<string>();
            for (int i = 0; i < required.Length; i++)
            {
                LocalizationEntry e;
                if (!LocalizationDatabase.TryGetEntry(required[i], out e) || string.IsNullOrEmpty(e.tamil))
                    missing.Add(required[i]);
            }

            if (missing.Count > 0)
            {
                Fail("Tamil missing for: " + string.Join(", ", missing.ToArray()));
                yield break;
            }

            Pass("menu.new_game Tamil='" + entry.tamil + "' (" + required.Length + " required keys resolved)");
        }

        private IEnumerator TestEnglishUi()
        {
            var lm = LocalizationManager.Instance;
            if (lm == null) { Fail("no LocalizationManager.Instance"); yield break; }

            lm.SetLanguage(Language.English);
            yield return new WaitForSecondsRealtime(0.5f);

            string[] required = { "menu.new_game", "menu.continue", "menu.settings", "menu.quit" };
            var missing = new List<string>();
            for (int i = 0; i < required.Length; i++)
            {
                LocalizationEntry e;
                if (!LocalizationDatabase.TryGetEntry(required[i], out e) || string.IsNullOrEmpty(e.english))
                    missing.Add(required[i]);
            }

            if (missing.Count > 0)
            {
                Fail("English missing for: " + string.Join(", ", missing.ToArray()));
                yield break;
            }

            string live = lm.Get("menu.new_game");
            if (string.IsNullOrEmpty(live))
            {
                Fail("LocalizationManager.Get returned empty for menu.new_game");
                yield break;
            }

            Pass("Get(menu.new_game)='" + live + "'");
        }

        private IEnumerator TestLanguagePersistence()
        {
            var lm = LocalizationManager.Instance;
            if (lm == null) { Fail("no LocalizationManager"); yield break; }

            lm.SetLanguage(Language.Tamil);
            yield return null;
            lm.SetLanguage(Language.English);
            yield return null;

            if (!PlayerPrefs.HasKey(LocalizationManager.PlayerPrefsKey))
            {
                Fail("language selection was not persisted to PlayerPrefs");
                yield break;
            }

            Pass("PlayerPrefs key '" + LocalizationManager.PlayerPrefsKey + "' written");
        }

        private IEnumerator TestSave()
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no player to save"); yield break; }

            if (SaveManager.Instance == null) { Fail("no SaveManager.Instance"); yield break; }

            SaveManager.Instance.SaveGame(0);
            yield return new WaitForSecondsRealtime(0.6f);

            if (!SaveSystem.HasValidSave())
            {
                Fail("HasValidSave() is false after SaveGame; detail=" + SaveSystem.LastLoadDetail);
                yield break;
            }

            Pass("valid save written to " + SaveSystem.SaveFilePath);
        }

        private IEnumerator TestLoad()
        {
            if (SaveManager.Instance == null) { Fail("no SaveManager.Instance"); yield break; }

            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no player to load into"); yield break; }

            var cc = player.GetComponent<CharacterController>();
            if (cc == null) { Fail("player has no CharacterController"); yield break; }

            // Sentinel position far from the spawn, so a load that silently no-ops is caught.
            Vector3 sentinel = new Vector3(1234.5f, 40f, -678.9f);
            cc.enabled = false;
            player.transform.position = sentinel;
            cc.enabled = true;
            yield return new WaitForFixedUpdate();

            SaveManager.Instance.LoadGame();
            yield return new WaitForSecondsRealtime(1.2f);

            Vector3 p = player.transform.position;
            if (!IsFinite(p)) { Fail("loaded player position is not finite: " + p); yield break; }

            if (Vector3.Distance(p, sentinel) < 0.01f)
            {
                Fail("load did not restore the saved position (player still at sentinel " + p + ")");
                yield break;
            }

            Pass("restored to " + p.ToString("F2"));
        }

        private IEnumerator TestNaNRejection()
        {
            var pos = SavedGravityPhysics.SanitizePosition(new Vector3(float.NaN, 0f, 0f));
            if (!IsFinite(pos)) { Fail("SanitizePosition passed NaN through: " + pos); yield break; }

            var inf = SavedGravityPhysics.SanitizePosition(new Vector3(float.PositiveInfinity, 0f, 0f));
            if (!IsFinite(inf)) { Fail("SanitizePosition passed Infinity through: " + inf); yield break; }

            var huge = SavedGravityPhysics.SanitizePosition(new Vector3(1e30f, 0f, 0f));
            if (huge.magnitude > 1e6f)
            {
                Fail("SanitizePosition did not clamp an out-of-range position: " + huge.ToString("G4"));
                yield break;
            }

            var vel = SavedGravityPhysics.SanitizeLinearVelocity(new Vector3(0f, float.NaN, 0f));
            if (!IsFinite(vel)) { Fail("SanitizeLinearVelocity passed NaN through: " + vel); yield break; }

            Pass("NaN/Infinity rejected and extreme coordinates clamped");
        }

        private IEnumerator TestRegionTransition()
        {
            if (RegionalSceneManager.Instance == null)
            {
                Fail("no RegionalSceneManager.Instance");
                yield break;
            }

            var regions = TamilNaduGeography.AllRegions;
            if (regions == null || regions.Count == 0) { Fail("TamilNaduGeography.AllRegions is empty"); yield break; }

            string start = RegionalSceneManager.Instance.ActiveRegionId;
            string target = string.Equals(start, "pichavaram", StringComparison.OrdinalIgnoreCase) ? "chennai" : "pichavaram";

            string targetScene = null;
            for (int i = 0; i < regions.Count; i++)
            {
                if (string.Equals(regions[i].regionId, target, StringComparison.OrdinalIgnoreCase))
                {
                    targetScene = regions[i].sceneName;
                    break;
                }
            }

            if (string.IsNullOrEmpty(targetScene)) { Fail("no region entry for '" + target + "'"); yield break; }

            RegionalSceneManager.Instance.TravelToRegion(target);

            float deadline = Time.realtimeSinceStartup + 30f;
            while (Time.realtimeSinceStartup < deadline)
            {
                if (RegionalSceneManager.Instance.ActiveRegionId == target &&
                    SceneManager.GetActiveScene().name == targetScene)
                {
                    break;
                }
                yield return null;
            }

            if (RegionalSceneManager.Instance.ActiveRegionId != target)
            {
                Fail("active region is still '" + RegionalSceneManager.Instance.ActiveRegionId + "' (expected " + target + ")");
                yield break;
            }

            string activeName = SceneManager.GetActiveScene().name;
            if (activeName != targetScene)
            {
                Fail("active scene is '" + activeName + "' (expected " + targetScene + ")");
                yield break;
            }

            // The previous region must actually be gone. If it is still loaded, this is
            // Single-mode loading disguised as additive streaming.
            var leftovers = new List<string>();
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                Scene s = SceneManager.GetSceneAt(i);
                if (!s.isLoaded) continue;
                if (s.name == "00_Boot" || s.name == targetScene) continue;
                leftovers.Add(s.name);
            }
            if (leftovers.Count > 0)
            {
                Fail("these scenes are still loaded after the transition (additive unload did not run): " +
                     string.Join(", ", leftovers.ToArray()));
                yield break;
            }

            yield return new WaitForSecondsRealtime(1.2f);

            var player = GameObject.FindWithTag("Player");
            if (player == null) { Fail("no Player after region transition"); yield break; }
            if (!IsFinite(player.transform.position))
            {
                Fail("player position non-finite after transition");
                yield break;
            }

            Pass(start + " -> " + target + " additive, old scene unloaded, sceneCount=" + SceneManager.sceneCount);
        }

        /// <summary>
        /// Step 18 gate check: the Chettinad clue opens Mamallapuram, and Nilgiris stays shut.
        ///
        /// This runs against the static unlock truth rather than by walking the map, because the
        /// thing worth protecting here is the gate arithmetic: Mamallapuram has to be reachable
        /// exactly when a Chettinad clue is recorded, and Nilgiris has to refuse every kind of
        /// attempt, including a direct Unlock call, because it is deferred and its step has not run.
        /// </summary>
        private IEnumerator TestRegionGating()
        {
            RegionUnlocks.ResetForNewGame();

            var failures = new List<string>();

            if (RegionUnlocks.IsDeferred(RegionUnlocks.NilgirisRegionId))
            {
                // expected, but asserted so a later step that un-defers Nilgiris fails here loudly
            }
            else
            {
                failures.Add("nilgiris is no longer deferred");
            }

            if (RegionUnlocks.IsUnlocked(RegionUnlocks.NilgirisRegionId))
                failures.Add("nilgiris reports unlocked on a fresh campaign");

            if (RegionUnlocks.Unlock(RegionUnlocks.NilgirisRegionId))
                failures.Add("Unlock(nilgiris) returned true while deferred");

            if (RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId))
                failures.Add("mamallapuram is unlocked before its Chettinad clue");

            // A clue from the wrong region must not open the gate.
            RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChennaiRegionId);
            if (RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId))
                failures.Add("a chennai clue opened mamallapuram");

            // The real chain: a Chettinad clue opens it exactly once.
            if (!RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId))
                failures.Add("a chettinad clue did not report an unlock for mamallapuram");

            if (!RegionUnlocks.IsUnlocked(RegionUnlocks.MamallapuramRegionId))
                failures.Add("mamallapuram is still locked after the chettinad clue");

            if (RegionUnlocks.EvaluateClueGate(RegionUnlocks.ChettinadRegionId))
                failures.Add("replaying the chettinad clue reported a duplicate unlock");

            // A migrated pre-gate save must not be handed the new region.
            var migrated = RegionUnlocks.SeedPreGateCampaign();
            if (migrated.Contains(RegionUnlocks.MamallapuramRegionId))
                failures.Add("a v3 migration seeded mamallapuram open");
            if (migrated.Contains(RegionUnlocks.NilgirisRegionId))
                failures.Add("a v3 migration seeded nilgiris open");
            if (!migrated.Contains(RegionUnlocks.ChettinadRegionId))
                failures.Add("a v3 migration dropped chettinad, which players had already reached");

            // Restore to whatever the campaign had, so this test cannot leak gating state into the
            // steps after it.
            RegionUnlocks.ResetForNewGame();

            if (failures.Count > 0)
            {
                Fail(string.Join("; ", failures.ToArray()));
                yield break;
            }

            Pass("chettinad clue opens mamallapuram once; nilgiris deferred and refused; v3 migration excludes both");
        }

        /// <summary>
        /// Step 18 gate check: the eleven Mamallapuram objectives can actually be completed in
        /// order, each one by the interaction the scene authored for it.
        ///
        /// The quest is a strict linear chain, so a stage whose interactable reports the wrong type
        /// or the wrong id is an unpassable quest, not a cosmetic bug. That is what this exercises:
        /// it walks the chain by reporting each stage's event and asserts the stage advanced.
        /// </summary>
        private IEnumerator TestMamallapuramQuestChain()
        {
            var qm = QuestManager.Instance;
            if (qm == null) { Fail("no QuestManager.Instance"); yield break; }

            GameplayContentRegistry.EnsureAllInitialized();

            QuestData quest = GameDataCatalog.GetQuest(MamallapuramShoreContent.QuestEchoesAlongTheShore);
            if (quest == null)
            {
                Fail("quest " + MamallapuramShoreContent.QuestEchoesAlongTheShore + " is not registered");
                yield break;
            }
            if (quest.stages == null || quest.stages.Count == 0)
            {
                Fail("quest " + quest.questId + " has no stages");
                yield break;
            }

            qm.ResetAllProgress();
            if (!qm.AcceptQuest(quest))
            {
                Fail("could not accept " + quest.questId);
                yield break;
            }

            var failures = new List<string>();
            int completed = 0;

            for (int s = 0; s < quest.stages.Count; s++)
            {
                QuestStage stage = quest.stages[s];
                if (stage == null || stage.objectives == null || stage.objectives.Count == 0)
                {
                    failures.Add("stage " + s + " has no objectives");
                    continue;
                }

                for (int o = 0; o < stage.objectives.Count; o++)
                {
                    QuestObjective objective = stage.objectives[o];
                    GameplayEventBus.Report(objective.type, objective.targetId);
                }
                yield return new WaitForSecondsRealtime(0.15f);

                // A completed stage moves the pointer past itself. The final stage completes the
                // quest outright, which clears the pointer instead of advancing it.
                bool advanced = qm.IsQuestCompleted(quest.questId) || qm.GetCurrentStageIndex(quest.questId) > s;
                if (advanced) completed++;
                else failures.Add("stage " + s + " (" + DescribeObjective(stage.objectives[0]) + ") did not complete");
            }

            if (!qm.IsQuestCompleted(quest.questId))
                failures.Add("quest did not reach completed after its last stage");

            qm.ResetAllProgress();

            if (failures.Count > 0)
            {
                Fail(string.Join("; ", failures.ToArray()));
                yield break;
            }

            Pass(completed + "/" + quest.stages.Count + " stages completed in order by their own gameplay events");
        }

        private static string DescribeObjective(QuestObjective objective)
        {
            if (objective == null) return "null objective";
            return objective.type + ":" + objective.targetId;
        }

        private IEnumerator TestGraphicsSettings()
        {
            var qm = QualityPresetManager.Instance;
            if (qm == null) { Fail("no QualityPresetManager.Instance"); yield break; }

            string[] tiers = { "VeryLow", "Low", "Medium", "High", "Ultra" };
            var failed = new List<string>();

            int before = QualitySettings.GetQualityLevel();
            float biasBefore = QualitySettings.lodBias;

            for (int i = 0; i < tiers.Length; i++)
            {
                QualityTier parsed;
                if (!Enum.TryParse(tiers[i], out parsed))
                {
                    failed.Add(tiers[i] + " (enum value missing)");
                    continue;
                }

                var settings = qm.GetPresetSettings(parsed);
                if (settings.renderScale <= 0f || settings.renderScale > 1.5f)
                {
                    failed.Add(tiers[i] + " renderScale out of range: " + settings.renderScale);
                }
                if (settings.shadowDistance <= 0f)
                {
                    failed.Add(tiers[i] + " shadowDistance <= 0: " + settings.shadowDistance);
                }

                qm.ApplyPreset(parsed);
                yield return new WaitForSecondsRealtime(0.25f);

                if (float.IsNaN(QualitySettings.lodBias) || float.IsInfinity(QualitySettings.lodBias))
                    failed.Add(tiers[i] + " produced non-finite lodBias");
            }

            QualitySettings.SetQualityLevel(before, true);
            QualitySettings.lodBias = biasBefore;
            yield return null;

            if (failed.Count > 0)
            {
                Fail("graphics tiers failed: " + string.Join("; ", failed.ToArray()));
                yield break;
            }

            Pass("all 5 tiers expose valid settings and apply without producing NaN");
        }

        private IEnumerator TestNoRepeatingExceptions()
        {
            yield return new WaitForSecondsRealtime(2f);

            var counts = new Dictionary<string, int>(StringComparer.Ordinal);
            string worst = null;
            int worstCount = 0;

            lock (_errors)
            {
                for (int i = 0; i < _errors.Count; i++)
                {
                    string key = _errors[i];
                    if (key.Length > 140) key = key.Substring(0, 140);

                    int c;
                    counts.TryGetValue(key, out c);
                    counts[key] = c + 1;

                    if (c + 1 > worstCount)
                    {
                        worstCount = c + 1;
                        worst = _errors[i];
                    }
                }
            }

            if (worstCount >= 5)
            {
                Fail("the same error repeated " + worstCount + " times: " + worst);
                yield break;
            }

            Pass("no error repeated; " + _errors.Count + " total error/exception line(s) captured");
        }

        // ------------------------------------------------------------------ helpers

        /// <summary>
        /// Click the real New Game menu button so the test exercises the menu wiring rather
        /// than poking the state machine directly. Returns false when no such button exists
        /// in the current scene (headless boot, or the menu is not built yet).
        /// </summary>
        private bool TryClickNewGameButton()
        {
            var buttons = FindObjectsByType<UnityEngine.UI.Button>(FindObjectsSortMode.None);
            for (int i = 0; i < buttons.Length; i++)
            {
                var label = buttons[i].GetComponentInChildren<UnityEngine.UI.Text>();
                string text = label != null ? label.text : string.Empty;
                if (text.IndexOf("New Game", StringComparison.OrdinalIgnoreCase) < 0 &&
                    text.IndexOf("புதிய", StringComparison.Ordinal) < 0)
                {
                    continue;
                }

                buttons[i].onClick.Invoke();
                return true;
            }
            return false;
        }

        private static bool IsFinite(Vector3 v)
        {
            return !float.IsNaN(v.x) && !float.IsNaN(v.y) && !float.IsNaN(v.z) &&
                   !float.IsInfinity(v.x) && !float.IsInfinity(v.y) && !float.IsInfinity(v.z);
        }

        private static bool ContainsTamil(string s)
        {
            if (string.IsNullOrEmpty(s)) return false;
            for (int i = 0; i < s.Length; i++)
            {
                if (s[i] >= 0x0B80 && s[i] <= 0x0BFF) return true; // Tamil Unicode block
            }
            return false;
        }

        // ---------------------------------------------------------- save isolation

        /// <summary>
        /// Move the real save folder aside and put an empty folder in its place, so every
        /// save/load assertion in this suite runs against a throwaway profile.
        ///
        /// This deliberately does not add an override hook to production save code: a
        /// test-only global that can redirect the player's save path is a shipping risk.
        /// Renaming the folder is observable, reversible, and leaves SaveSystem untouched.
        /// </summary>
        private void IsolateSaveDirectory()
        {
            try
            {
                string live = SaveSystem.SaveDirectory;
                string parent = Path.GetDirectoryName(live);
                if (string.IsNullOrEmpty(parent)) { _log.AppendLine("    could not isolate saves (no parent dir)"); return; }

                _originalSaveDirectory = live;
                _stashDirectory = Path.Combine(parent, "ww_smoketest_stash_" + DateTime.UtcNow.Ticks);

                if (Directory.Exists(live)) Directory.Move(live, _stashDirectory);
                Directory.CreateDirectory(live);

                _log.AppendLine("    save isolation: '" + live + "' moved to stash, empty folder created");
            }
            catch (Exception ex)
            {
                _log.AppendLine("    SAVE ISOLATION FAILED: " + ex.Message);
                Debug.LogWarning("[SMOKE] could not isolate save directory: " + ex.Message);
            }
        }

        private void RestoreSaveDirectory()
        {
            if (string.IsNullOrEmpty(_originalSaveDirectory)) return;

            try
            {
                if (Directory.Exists(_originalSaveDirectory)) Directory.Delete(_originalSaveDirectory, true);

                if (!string.IsNullOrEmpty(_stashDirectory) && Directory.Exists(_stashDirectory))
                {
                    Directory.Move(_stashDirectory, _originalSaveDirectory);
                    _log.AppendLine("    save isolation: original folder restored from stash");
                }
                else
                {
                    Directory.CreateDirectory(_originalSaveDirectory);
                    _log.AppendLine("    save isolation: no stash existed; created a clean empty save folder");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError("[SMOKE] CRITICAL: could not restore the save directory: " + ex.Message);
            }
        }

        private string _originalSaveDirectory;
        private string _stashDirectory;

        // ----------------------------------------------------------------- reporting

        private void Header(string text)
        {
            _log.AppendLine(text);
            _log.AppendLine(new string('=', Math.Min(text.Length, 78)));
            Debug.Log("<color=#00FFAA><b>[SMOKE]</b></color> " + text);
        }

        private void Line(string text)
        {
            _log.AppendLine(text);
        }

        private void Conclude()
        {
            int pass = 0, fail = 0, skip = 0;
            for (int i = 0; i < _results.Count; i++)
            {
                switch (_results[i].status)
                {
                    case StepStatus.Pass: pass++; break;
                    case StepStatus.Fail: fail++; break;
                    default: skip++; break;
                }
            }

            _log.AppendLine();
            _log.AppendLine("==================== SUMMARY ====================");
            for (int i = 0; i < _results.Count; i++)
            {
                _log.AppendLine("  " + _results[i].status.ToString().ToUpperInvariant().PadRight(5) +
                                _results[i].name.PadRight(32) +
                                _results[i].seconds.ToString("F2", CultureInfo.InvariantCulture) + "s  " +
                                _results[i].detail);
            }

            _log.AppendLine("  passed=" + pass + " failed=" + fail + " skipped=" + skip);
            _log.AppendLine("  total elapsed: " + (Time.realtimeSinceStartup - _suiteStart).ToString("F1", CultureInfo.InvariantCulture) + "s");

            _log.AppendLine();
            _log.AppendLine("---- CAPTURED ERRORS / EXCEPTIONS (" + _errors.Count + ") ----");
            lock (_errors)
            {
                for (int i = 0; i < _errors.Count; i++) _log.AppendLine("  " + _errors[i]);
            }

            _log.AppendLine();
            _log.AppendLine("---- CAPTURED WARNINGS (" + _warnings.Count + ", first 40) ----");
            lock (_warnings)
            {
                int n = Mathf.Min(40, _warnings.Count);
                for (int i = 0; i < n; i++) _log.AppendLine("  " + _warnings[i]);
            }

            _log.AppendLine();
            _log.AppendLine("RESULT: " + (fail == 0 ? "ALL STEPS PASSED" : fail + " STEP(S) FAILED"));

            WriteReport();

            Debug.Log("<color=#00FFAA><b>[SMOKE]</b></color> RESULT: passed=" + pass + " failed=" + fail +
                      " skip=" + skip + " errors=" + _errors.Count + " report=" + ReportPath);
        }

        private string ReportPath
        {
            get { return Path.Combine(Application.persistentDataPath, "standalone_smoke_test.txt"); }
        }

        private void WriteReport()
        {
            try
            {
                File.WriteAllText(ReportPath, _log.ToString());
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[SMOKE] could not write report: " + ex.Message);
            }
        }

        /// <summary>
        /// Polls until the game reaches a target state or the timeout elapses. Not itself a
        /// coroutine: <see cref="MoveNext"/> is pumped manually so callers can read
        /// <see cref="Current"/> without yielding an extra frame.
        /// </summary>
        private sealed class WaitForState
        {
            private readonly GameState _target;
            private readonly float _deadline;

            public WaitForState(GameState target, float timeoutSeconds)
            {
                _target = target;
                _deadline = Time.realtimeSinceStartup + timeoutSeconds;
            }

            public bool Current { get; private set; }

            /// <returns>true while still waiting, false once finished.</returns>
            public bool MoveNext()
            {
                var gm = GameManager.Instance;
                if (gm != null && gm.CurrentState == _target)
                {
                    Current = true;
                    return false;
                }

                if (Time.realtimeSinceStartup >= _deadline)
                {
                    Current = false;
                    return false;
                }

                return true;
            }
        }
    }
}
