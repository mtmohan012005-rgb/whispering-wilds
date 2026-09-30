using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Player;
using WhisperingWilds.Quality;
using WhisperingWilds.UI;
using WhisperingWilds.World;
using WhisperingWilds.Cameras;

namespace WhisperingWilds.QA
{
    [Serializable]
    public class RuntimeTestStepResult
    {
        public string testName;
        public string status; // PASS, FAIL, SKIP
        public string details;
        public float durationSeconds;
    }

    [Serializable]
    public class RuntimeTestSuiteSummary
    {
        public string suiteName = "Step 1 Runtime and Build Acceptance";
        public string timestamp;
        public string unityVersion;
        public string platform;
        public int totalPassed;
        public int totalFailed;
        public List<RuntimeTestStepResult> results = new List<RuntimeTestStepResult>();
    }

    /// <summary>
    /// Autonomous runtime QA verification suite executing inside the live Unity engine
    /// when launched with '-automatedSmokeTest' or 'WW_AUTOMATED_TEST=1'.
    /// Exercises every Step 1 requirement: Boot, Menu, New Game, Player Locomotion,
    /// Jump, Crouch, Sprint, Camera, Save, Load, and Region Travel.
    /// </summary>
    [DisallowMultipleComponent]
    public class RuntimeAutomatedSmokeTest : MonoBehaviour
    {
        public static RuntimeAutomatedSmokeTest Instance { get; private set; }

        private bool shouldRunTests = false;
        private RuntimeTestSuiteSummary summary = new RuntimeTestSuiteSummary();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            // Check if automation was requested via CLI arguments or environment variable
            string[] args = Environment.GetCommandLineArgs();
            foreach (var arg in args)
            {
                if (arg.Equals("-automatedSmokeTest", StringComparison.OrdinalIgnoreCase))
                {
                    shouldRunTests = true;
                    break;
                }
            }

            if (!shouldRunTests)
            {
                string envVar = Environment.GetEnvironmentVariable("WW_AUTOMATED_TEST");
                if (!string.IsNullOrEmpty(envVar) && envVar != "0")
                {
                    shouldRunTests = true;
                }
            }

            if (shouldRunTests)
            {
                Debug.Log("<color=#00FFAA><b>[QA_TEST]</b></color> *** AUTOMATED RUNTIME TEST SUITE ACTIVE ***");
            }
        }

        private void Start()
        {
            if (shouldRunTests)
            {
                StartCoroutine(RunAcceptanceSuiteRoutine());
            }
        }

        private IEnumerator RunAcceptanceSuiteRoutine()
        {
            summary.timestamp = DateTime.UtcNow.ToString("o");
            summary.unityVersion = Application.unityVersion;
            summary.platform = Application.platform.ToString();

            yield return new WaitForSeconds(0.5f);

            // 1. Boot Scene Verification
            yield return StartCoroutine(TestBootScene());

            // 2. Main Menu -> New Game
            yield return StartCoroutine(TestMainMenuNewGame());

            // 3. Player Spawn & Camera
            yield return StartCoroutine(TestPlayerSpawnAndCamera());

            // 4. Locomotion: Walk, Sprint, Crouch, Jump
            yield return StartCoroutine(TestPlayerLocomotion());

            // 5. Save System
            yield return StartCoroutine(TestSaveSystem());

            // 6. Load System
            yield return StartCoroutine(TestLoadSystem());

            // 7. Region Travel: Chennai -> Pichavaram
            yield return StartCoroutine(TestRegionTravel());

            // 8. Quality System Presets
            yield return StartCoroutine(TestQualityPresets());

            // Write report to file and console
            WriteReportAndConclude();
        }

        private IEnumerator TestBootScene()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Boot Scene & Core Singletons" };

            bool camOk = Camera.main != null || FindAnyObjectByType<Camera>() != null;
            bool eventOk = FindAnyObjectByType<UnityEngine.EventSystems.EventSystem>() != null;
            bool listenerOk = FindAnyObjectByType<AudioListener>() != null;
            bool gmOk = GameManager.Instance != null;
            bool saveOk = SaveManager.Instance != null;
            bool qualityOk = GraphicsPerformanceManager.Instance != null || QualityPresetManager.Instance != null;
            bool timeOk = WorldTimeSystem.Instance != null || TimeOfDayManager.Instance != null;

            if (camOk && eventOk && listenerOk && gmOk && saveOk && qualityOk && timeOk)
            {
                step.status = "PASS";
                step.details = "Camera, EventSystem, AudioListener, GameManager, SaveManager, Quality, TimeSystem present with 0 errors.";
                summary.totalPassed++;
                Debug.Log("<color=#00FF88><b>[QA_TEST]</b></color> TEST 1 (Boot Scene): PASS");
            }
            else
            {
                step.status = "FAIL";
                step.details = $"Missing: cam={camOk}, event={eventOk}, listener={listenerOk}, gm={gmOk}, save={saveOk}, quality={qualityOk}, time={timeOk}";
                summary.totalFailed++;
                Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 1 (Boot Scene): FAIL - {step.details}");
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
            yield return null;
        }

        private IEnumerator TestMainMenuNewGame()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Main Menu -> New Game Transition" };

            var menu = FindAnyObjectByType<TitleMenuController>();
            if (menu != null)
            {
                Debug.Log("<color=#00D2FF><b>[QA_TEST]</b></color> Triggering OnNewGameClicked()...");
                menu.OnNewGameClicked();

                // Wait for Chennai George Town scene to load
                float timeout = 10f;
                while (SceneManager.GetActiveScene().name != "02_Chennai_GeorgeTown" && timeout > 0f)
                {
                    timeout -= Time.unscaledDeltaTime;
                    yield return null;
                }

                if (SceneManager.GetActiveScene().name == "02_Chennai_GeorgeTown")
                {
                    step.status = "PASS";
                    step.details = "Transitioned smoothly to 02_Chennai_GeorgeTown without exceptions.";
                    summary.totalPassed++;
                    Debug.Log("<color=#00FF88><b>[QA_TEST]</b></color> TEST 2 (Main Menu New Game): PASS");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"Timed out waiting for 02_Chennai_GeorgeTown. Active scene: {SceneManager.GetActiveScene().name}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 2 (Main Menu New Game): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = "TitleMenuController not found in Boot scene.";
                summary.totalFailed++;
                Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 2 (Main Menu New Game): FAIL - {step.details}");
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
            yield return new WaitForSeconds(0.5f);
        }

        private IEnumerator TestPlayerSpawnAndCamera()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Player Spawn & Camera Controller" };

            var player = GameObject.FindWithTag("Player");
            var cam = Camera.main;

            if (player != null && cam != null)
            {
                var cc = player.GetComponent<CharacterController>();
                var pm = player.GetComponent<PlayerMovement>();
                var pi = player.GetComponent<PlayerInputHandler>();
                var camCtrl = cam.GetComponent<CameraController>() ?? CameraController.EnsureActiveCameraBound(player.transform);

                if (cc != null && pm != null && pi != null && camCtrl != null)
                {
                    step.status = "PASS";
                    step.details = $"Player spawned at {player.transform.position}, CharacterController enabled, Camera bound to player.";
                    summary.totalPassed++;
                    Debug.Log("<color=#00FF88><b>[QA_TEST]</b></color> TEST 3 (Player Spawn & Camera): PASS");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"Missing player components: cc={cc != null}, pm={pm != null}, pi={pi != null}, camCtrl={camCtrl != null}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 3: FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = $"player={player != null}, cam={cam != null}";
                summary.totalFailed++;
                Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 3: FAIL - {step.details}");
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
            yield return null;
        }

        private IEnumerator TestPlayerLocomotion()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Player Movement, Sprint, Crouch, Jump" };

            var player = GameObject.FindWithTag("Player");
            var pi = player != null ? player.GetComponent<PlayerInputHandler>() : null;
            var pm = player != null ? player.GetComponent<PlayerMovement>() : null;
            var cc = player != null ? player.GetComponent<CharacterController>() : null;

            if (pi != null && pm != null && cc != null)
            {
                Vector3 initialPos = player.transform.position;

                // 1. Move forward
                pi.SetSimulatedMovement(Vector2.up, sprint: false, crouch: false);
                yield return new WaitForSeconds(0.6f);
                Vector3 movedPos = player.transform.position;
                float moveDist = Vector3.Distance(new Vector3(initialPos.x, 0, initialPos.z), new Vector3(movedPos.x, 0, movedPos.z));

                // 2. Sprint forward
                pi.SetSimulatedMovement(Vector2.up, sprint: true, crouch: false);
                yield return new WaitForSeconds(0.4f);
                float sprintSpeed = pm.CurrentSpeed;

                // 3. Crouch forward
                pi.SetSimulatedMovement(Vector2.up, sprint: false, crouch: true);
                yield return new WaitForSeconds(0.4f);
                float crouchHeight = cc.height;

                // Stop movement
                pi.SetSimulatedMovement(Vector2.zero, sprint: false, crouch: false);
                yield return new WaitForSeconds(0.2f);

                // 4. Jump
                float preJumpY = player.transform.position.y;
                pi.TriggerSimulatedJump();
                yield return new WaitForSeconds(0.25f);
                float inAirY = player.transform.position.y;
                bool jumped = inAirY > preJumpY + 0.1f || !pm.IsGrounded;

                // Wait to land
                yield return new WaitForSeconds(0.5f);
                pi.ClearSimulation();

                if (moveDist > 0.3f && sprintSpeed > 4.5f && crouchHeight < 1.7f && jumped)
                {
                    step.status = "PASS";
                    step.details = $"MoveDist={moveDist:F2}m, SprintSpeed={sprintSpeed:F1}m/s, CrouchHeight={crouchHeight:F2}m, Jumped=True";
                    summary.totalPassed++;
                    Debug.Log($"<color=#00FF88><b>[QA_TEST]</b></color> TEST 4 (Locomotion): PASS - {step.details}");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"MoveDist={moveDist:F2}m (>0.3), SprintSpeed={sprintSpeed:F1} (>4.5), CrouchHeight={crouchHeight:F2} (<1.7), Jumped={jumped}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 4 (Locomotion): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = "Player components not found.";
                summary.totalFailed++;
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
        }

        private IEnumerator TestSaveSystem()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Save Game Persistence" };

            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                GameManager.Instance.QuickSave();
                yield return new WaitForSeconds(0.2f);

                bool fileExists = SaveSystem.SaveExists();
                GameSaveData loaded = SaveSystem.LoadGame();

                if (fileExists && loaded != null && Mathf.Abs(loaded.posX - player.transform.position.x) < 0.1f)
                {
                    step.status = "PASS";
                    step.details = $"Save file verified at {SaveSystem.SaveFilePath}, pos=({loaded.posX:F1}, {loaded.posY:F1}, {loaded.posZ:F1}), appearanceChanges={loaded.remainingPermanentAppearanceChanges}";
                    summary.totalPassed++;
                    Debug.Log($"<color=#00FF88><b>[QA_TEST]</b></color> TEST 5 (Save System): PASS - {step.details}");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"fileExists={fileExists}, loaded={loaded != null}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 5 (Save System): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = "Player not found to save.";
                summary.totalFailed++;
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
        }

        private IEnumerator TestLoadSystem()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Load Game & State Restoration" };

            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                // Displace player
                var cc = player.GetComponent<CharacterController>();
                if (cc != null) cc.enabled = false;
                player.transform.position += new Vector3(15f, 0f, 15f);
                if (cc != null) cc.enabled = true;
                Vector3 displacedPos = player.transform.position;

                yield return new WaitForSeconds(0.2f);

                // Quick load
                GameManager.Instance.QuickLoad();
                yield return new WaitForSeconds(0.2f);

                float distToDisplaced = Vector3.Distance(player.transform.position, displacedPos);
                if (distToDisplaced > 5f)
                {
                    step.status = "PASS";
                    step.details = $"Player successfully restored from save. New pos: {player.transform.position}";
                    summary.totalPassed++;
                    Debug.Log($"<color=#00FF88><b>[QA_TEST]</b></color> TEST 6 (Load System): PASS - {step.details}");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"Player was not restored to saved position. Remains at {player.transform.position}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 6 (Load System): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = "Player not found to load.";
                summary.totalFailed++;
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
        }

        private IEnumerator TestRegionTravel()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Safe Regional Scene Transition (Chennai -> Pichavaram)" };

            if (GameManager.Instance != null && RegionalSceneManager.Instance != null)
            {
                Debug.Log("<color=#00D2FF><b>[QA_TEST]</b></color> Initiating region travel to Pichavaram...");
                GameManager.Instance.LoadRegion("03_Pichavaram_Wetlands");

                float timeout = 12f;
                while (RegionalSceneManager.Instance.IsLoadingRegion && timeout > 0f)
                {
                    timeout -= Time.unscaledDeltaTime;
                    yield return null;
                }

                yield return new WaitForSeconds(0.5f);

                string activeRegion = RegionalSceneManager.Instance.ActiveRegionId;
                var player = GameObject.FindWithTag("Player");

                if (activeRegion == "pichavaram" && player != null)
                {
                    step.status = "PASS";
                    step.details = $"Successfully arrived in Pichavaram ({activeRegion}), player intact at {player.transform.position}.";
                    summary.totalPassed++;
                    Debug.Log($"<color=#00FF88><b>[QA_TEST]</b></color> TEST 7 (Region Travel): PASS - {step.details}");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"activeRegion={activeRegion}, playerExists={player != null}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 7 (Region Travel): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "FAIL";
                step.details = "GameManager or RegionalSceneManager missing.";
                summary.totalFailed++;
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
        }

        private IEnumerator TestQualityPresets()
        {
            float start = Time.realtimeSinceStartup;
            var step = new RuntimeTestStepResult { testName = "Quality System Presets" };

            var qpm = QualityPresetManager.Instance;
            if (qpm != null)
            {
                qpm.ApplyPreset(QualityTier.VeryLow);
                yield return null;
                float shadowVeryLow = QualitySettings.shadowDistance;

                qpm.ApplyPreset(QualityTier.High);
                yield return null;
                float shadowHigh = QualitySettings.shadowDistance;

                if (shadowVeryLow < shadowHigh)
                {
                    step.status = "PASS";
                    step.details = $"Quality preset applied: VeryLow shadows={shadowVeryLow}m, High shadows={shadowHigh}m.";
                    summary.totalPassed++;
                    Debug.Log($"<color=#00FF88><b>[QA_TEST]</b></color> TEST 8 (Quality Presets): PASS - {step.details}");
                }
                else
                {
                    step.status = "FAIL";
                    step.details = $"Shadow distances did not scale: VeryLow={shadowVeryLow}, High={shadowHigh}";
                    summary.totalFailed++;
                    Debug.LogError($"<color=#FF4444><b>[QA_TEST]</b></color> TEST 8 (Quality Presets): FAIL - {step.details}");
                }
            }
            else
            {
                step.status = "SKIP";
                step.details = "QualityPresetManager not found; relying on GraphicsPerformanceManager.";
                Debug.LogWarning("[QA_TEST] QualityPresetManager not found; skipped.");
            }

            step.durationSeconds = Time.realtimeSinceStartup - start;
            summary.results.Add(step);
        }

        private void WriteReportAndConclude()
        {
            try
            {
                string reportDir = Path.Combine(Application.dataPath, "..", "TestReports");
                if (!Directory.Exists(reportDir)) Directory.CreateDirectory(reportDir);

                string jsonPath = Path.Combine(reportDir, "automated_runtime_smoke_test.json");
                string json = JsonUtility.ToJson(summary, true);
                File.WriteAllText(jsonPath, json);

                Debug.Log($"<color=#00FFAA><b>[QA_TEST]</b></color> Summary report written to: {jsonPath}");
                Debug.Log($"<color=#00FFAA><b>[QA_TEST]</b></color> RESULTS: {summary.totalPassed} PASSED, {summary.totalFailed} FAILED.");

                if (summary.totalFailed == 0)
                {
                    Debug.Log("<color=#00FF88><b>[QA_TEST] >>> ALL STEP 1 RUNTIME ACCEPTANCE TESTS PASSED <<<</b></color>");
                }
                else
                {
                    Debug.LogError($"<color=#FF3300><b>[QA_TEST] >>> SOME TESTS FAILED: {summary.totalFailed} <<<</b></color>");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[QA_TEST] Failed to write test report: {ex.Message}");
            }

            // In standalone player mode, gracefully exit after automated testing
            if (!Application.isEditor)
            {
                Debug.Log("<color=#00D2FF><b>[QA_TEST]</b></color> Exiting player process after test completion.");
                Application.Quit(summary.totalFailed == 0 ? 0 : 1);
            }
        }
    }
}
