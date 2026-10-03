using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.UI;

namespace WhisperingWilds.QA
{
    /// <summary>
    /// Development-only runtime visual diagnostics.
    ///
    /// Self-bootstraps without any scene edit and stays completely inert unless the
    /// player is launched with -qaVisualDiag (or the WW_QA_VISUAL_DIAG env var is set
    /// to something other than "0"). Retail launches never activate it.
    ///
    /// Purpose: identify why the 3D world renders almost black while the HUD stays
    /// visible. Dumps camera, lighting, environment, volume and render-pipeline state
    /// so the cause can be established from evidence instead of guesswork.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class QAVisualDiagnostics : MonoBehaviour
    {
        private const string FlagName = "-qaVisualDiag";
        private static bool _active;
        private readonly StringBuilder _sb = new StringBuilder();
        private int _dumpIndex;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            _active = HasFlag();
            if (!_active) return;

            var go = new GameObject("~QAVisualDiagnostics");
            DontDestroyOnLoad(go);
            // NOTE: deliberately NOT HideAndDontSave - that includes DontUnloadUnusedAsset,
            // so the game's Resources.UnloadUnusedAssets() call would destroy this object
            // during a region transition and silently stop the diagnostics.
            go.hideFlags = HideFlags.DontSave;
            go.AddComponent<QAVisualDiagnostics>();
        }

        private static bool HasFlag()
        {
            foreach (var a in Environment.GetCommandLineArgs())
            {
                if (string.Equals(a, FlagName, StringComparison.OrdinalIgnoreCase)) return true;
            }
            var env = Environment.GetEnvironmentVariable("WW_QA_VISUAL_DIAG");
            return !string.IsNullOrEmpty(env) && env != "0";
        }

        private void Start()
        {
            // Dump once immediately, then again on every game-state transition, and a few
            // times on a timer. Frame-based dumping would only ever sample the Boot scene.
            Dump("startup");

            var gm = GameManager.Instance;
            if (gm != null) gm.OnGameStateChanged += OnGameStateChanged;
            else Debug.LogWarning("[QA_VISUAL_DIAG] GameManager.Instance was null at Start()");

            StartCoroutine(TimedDumps());
            if (HasCliFlag("-qaAutoNewGame")) StartCoroutine(AutoNewGame());
            if (HasCliFlag("-qaFrameAudit")) StartCoroutine(InEngineFrameAudit());
        }

        /// <summary>
        /// Measures the actual rendered frame from the backbuffer.
        ///
        /// External screen-grab tooling proved unreliable here (identical statistics
        /// before and after a confirmed lighting fix), so luminance is computed in-engine
        /// from a real captured frame instead. This is the objective ground truth for
        /// "is the world actually visible".
        /// </summary>
        private System.Collections.IEnumerator InEngineFrameAudit()
        {
            // Only meaningful once the gameplay world is actually on screen.
            float deadline = Time.realtimeSinceStartup + 180f;
            while (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Gameplay)
            {
                if (Time.realtimeSinceStartup > deadline)
                {
                    Line("### FRAME AUDIT aborted: never reached Gameplay within 180s");
                    Flush();
                    yield break;
                }
                yield return null;
            }

            // Staged ablation: apply exactly one change per stage, then measure. This isolates
            // which subsystem is responsible instead of guessing at the cause.
            // Cumulative ablation: each stage disables one MORE component, so the stage at which
            // the frame brightens identifies the minimal set of responsible overrides.
            void Off(params string[] names)
            {
                foreach (var n in names) SetVolumeComponent(n, false);
            }

            bool ablate = HasCliFlag("-qaAblate");

            var stages = new (string label, Action apply)[]
            {
                ("baseline", null),
                ("off[VisualEnv]", () => Off("VisualEnvironment")),
                ("off[VisualEnv,PBSky]", () => Off("VisualEnvironment", "PhysicallyBasedSky")),
                ("off[+Fog]", () => Off("VisualEnvironment", "PhysicallyBasedSky", "Fog")),
                ("off[+Exposure]", () => Off("VisualEnvironment", "PhysicallyBasedSky", "Fog", "Exposure")),
                ("whole-volume-off", DisableGlobalVolumes),
            };

            // Without -qaAblate this must be a pure, non-destructive measurement pass.
            if (!ablate)
            {
                stages = new (string label, Action apply)[]
                {
                    ("measure-0", null), ("measure-1", null), ("measure-2", null), ("measure-3", null),
                };
            }

            for (int i = 0; i < stages.Length; i++)
            {
                if (ablate) ResetVolumeOverrides();
                if (stages[i].apply != null)
                {
                    stages[i].apply();
                    Line("### ABLATION STAGE '" + stages[i].label + "' applied");
                    Flush();
                }
                yield return new WaitForSecondsRealtime(3f);
                yield return new WaitForEndOfFrame();

                Texture2D shot = null;
                try { shot = ScreenCapture.CaptureScreenshotAsTexture(); }
                catch (Exception ex) { Line("### capture failed: " + ex.Message); Flush(); continue; }
                if (shot == null) { Line("### capture returned null"); Flush(); continue; }

                int w = shot.width, h = shot.height;
                try
                {
                    Color32[] px = shot.GetPixels32();
                    long sum = 0, dark16 = 0, dark40 = 0, bright = 0, opaque = 0;
                    var rowSum = new long[3];
                    var colSum = new long[4];

                    for (int y = 0; y < h; y++)
                    {
                        int gi = h <= 1 ? 0 : 2 * y / h;
                        for (int x = 0; x < w; x++)
                        {
                            Color32 c = px[y * w + x];
                            if (c.a > 8) opaque++;
                            int l = (c.r * 77 + c.g * 151 + c.b * 28) >> 8;
                            sum += l;
                            if (l < 16) dark16++;
                            if (l < 40) dark40++;
                            if (l > 200) bright++;
                            rowSum[gi] += l;
                            colSum[w <= 1 ? 0 : 3 * x / w] += l;
                        }
                    }

                    long n = (long)w * h;
                    var sun = UnityEngine.Object.FindObjectsByType<Light>();
                    float sunI = -1f;
                    foreach (var l in sun) if (l.type == LightType.Directional) { sunI = l.intensity; break; }

                    // Actual on-screen presence: isVisible is set by the renderer itself,
                    // so this proves geometry reached the frame instead of inferring it.
                    int visR = 0, totR = 0, playerVis = 0;
                    foreach (var r in UnityEngine.Object.FindObjectsByType<Renderer>())
                    {
                        totR++;
                        if (!r.isVisible) continue;
                        visR++;
                        var t = r.GetComponentInParent<Transform>();
                        if (t != null && t.CompareTag("Player")) playerVis++;
                    }

                    Line($"### IN-ENGINE FRAME AUDIT stage={stages[i].label} sample={i} size={w}x{h}"
                       + $" meanLuma={sum / (double)n:F1}"
                       + $" dark<16={100.0 * dark16 / n:F1}%"
                       + $" dark<40={100.0 * dark40 / n:F1}%"
                       + $" bright>200={100.0 * bright / n:F2}%"
                       + $" opaquePixels={100.0 * opaque / n:F1}%"
                       + $" sunIntensity={sunI:F3}"
                       + $" renderersVisible={visR}/{totR} playerRenderersVisible={playerVis}");

                    var g = new StringBuilder("    grid rows(top->bottom): ");
                    for (int gi = 0; gi < 3; gi++) g.Append($"[{rowSum[gi] / (double)(w / 4.0):F0}]");
                    g.Append("  cols: ");
                    for (int gj = 0; gj < 4; gj++) g.Append($"[{colSum[gj] / (double)(h / 3.0):F0}]");
                    Line(g.ToString());

                    if (i == 0 || i == 3 || i == 5)
                    {
                        try
                        {
                            string dir = Path.Combine(Application.persistentDataPath, "QADiagnostics");
                            Directory.CreateDirectory(dir);
                            File.WriteAllBytes(Path.Combine(dir, $"inengine_{stages[i].label}_f{i}.png"), shot.EncodeToPNG());
                            Line($"### wrote inengine_{stages[i].label}_f{i}.png");
                        }
                        catch (Exception ex) { Line("### png write failed: " + ex.Message); }
                    }
                }
                finally
                {
                    if (shot != null) Destroy(shot);
                }
                Flush();
            }
        }

        /// <summary>
        /// Drives the exact code path a player's "New Game" click takes, so the gameplay
        /// camera/lighting state can be captured without OS-level input synthesis.
        /// </summary>
        private System.Collections.IEnumerator AutoNewGame()
        {
            yield return new WaitForSecondsRealtime(3f);

            var menus = UnityEngine.Object.FindObjectsByType<TitleMenuController>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Debug.Log("[QA_VISUAL_DIAG] TitleMenuController instances found = " + menus.Length);
            foreach (var m in menus)
            {
                if (m == null) continue;
                Line("### invoking TitleMenuController.OnNewGameClicked() on '" + m.gameObject.name + "'");
                Flush();
                try { m.OnNewGameClicked(); }
                catch (Exception ex) { Debug.LogError("[QA_VISUAL_DIAG] OnNewGameClicked threw: " + ex); }
            }

            // Report what the scene graph looks like a moment later.
            yield return new WaitForSecondsRealtime(6f);
            Dump("after-newgame+6s");
            yield return new WaitForSecondsRealtime(10f);
            Dump("after-newgame+16s");
        }

        private static bool HasCliFlag(string flag)
        {
            foreach (var a in Environment.GetCommandLineArgs())
            {
                if (string.Equals(a, flag, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private void OnGameStateChanged(GameState state)
        {
            // One frame of slack so camera/lighting settles after the scene swap.
            StartCoroutine(DumpNextFrame("state-change:" + state));
        }

        private System.Collections.IEnumerator TimedDumps()
        {
            yield return new WaitForSecondsRealtime(3f);  Dump("t+3s");
            yield return new WaitForSecondsRealtime(5f);  Dump("t+8s");
            yield return new WaitForSecondsRealtime(10f); Dump("t+18s");
            yield return new WaitForSecondsRealtime(20f); Dump("t+38s");
            yield return new WaitForSecondsRealtime(22f); Dump("t+60s");
            yield return new WaitForSecondsRealtime(30f); Dump("t+90s");
        }

        private System.Collections.IEnumerator DumpNextFrame(string tag)
        {
            yield return null;
            Dump(tag);
        }

        private void Dump(string trigger)
        {
            _dumpIndex++;
            var gm = GameManager.Instance;
            string state = gm != null ? gm.CurrentState.ToString() : "n/a";

            Line("################ QA VISUAL DIAG DUMP #" + _dumpIndex + "  trigger=" + trigger + " ################");
            Line("time=" + Time.realtimeSinceStartup.ToString("F1")
                 + "s  frame=" + Time.frameCount
                 + "  fps~" + (1f / Mathf.Max(0.0001f, Time.smoothDeltaTime)).ToString("F1")
                 + "  gameState=" + state
                 + "  activeSceneLoaded=" + SceneManager.GetActiveScene().isLoaded);
            DumpScenes();
            DumpCameras();
            DumpLights();
            DumpEnvironment();
            DumpVolumes();
            DumpRenderPipeline();
            DumpDynamicResolution();
            DumpPlayers();
            Flush();
        }

        private void DumpScenes()
        {
            Line("");
            Line("--- SCENES ---");
            var active = SceneManager.GetActiveScene();
            Line("  active: '" + active.name + "' valid=" + active.IsValid() + " loaded=" + active.isLoaded
                 + " rootCount=" + (active.isLoaded ? active.rootCount : 0));
            Line("  loadedSceneCount=" + SceneManager.sceneCount);
            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                var s = SceneManager.GetSceneAt(i);
                Line("   [" + i + "] '" + s.name + "' loaded=" + s.isLoaded
                     + " rootCount=" + (s.isLoaded ? s.rootCount : 0));
                if (!s.isLoaded) continue;

                // Are the roots actually enabled? An inactive world root renders nothing.
                foreach (var root in s.GetRootGameObjects())
                {
                    Line("        root '" + root.name + "' activeSelf=" + root.activeSelf
                         + " activeInHierarchy=" + root.activeInHierarchy
                         + " children=" + root.transform.childCount);
                }
            }
        }

        private void DumpCameras()
        {
            Line("");
            Line("--- CAMERAS ---");
            var cams = UnityEngine.Object.FindObjectsByType<Camera>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Line("  cameraCount(incl. disabled)=" + cams.Length);
            foreach (var c in cams.OrderByDescending(x => x.depth))
            {
                if (c == null) continue;
                Line("   '" + c.gameObject.name + "'");
                Line("      enabled=" + c.enabled + " activeInHierarchy=" + c.gameObject.activeInHierarchy
                     + " isMainCamera=" + (Camera.main == c));
                Line("      pos=" + Fmt(c.transform.position) + " rot=" + Fmt(c.transform.eulerAngles));
                Line("      fov=" + c.fieldOfView + " ortho=" + c.orthographic
                     + " near=" + c.nearClipPlane + " far=" + c.farClipPlane
                     + " depth=" + c.depth + " targetDisplay=" + c.targetDisplay);
                Line("      clearFlags=" + c.clearFlags + " bg=" + Fmt(c.backgroundColor)
                     + " cullingMask=" + c.cullingMask + " cullingMaskHex=0x" + c.cullingMask.ToString("X8"));
                Line("      allowHDR=" + c.allowHDR + " allowMSAA=" + c.allowMSAA
                     + " allowDynamicResolution=" + c.allowDynamicResolution
                     + " useOcclusionCulling=" + c.useOcclusionCulling);
            }
            var main = Camera.main;
            if (main == null)
            {
                Line("  !! Camera.main is NULL - a camera tagged MainCamera is required for the player view");
            }
            else
            {
                Line("  Camera.main = '" + main.gameObject.name + "' pos=" + Fmt(main.transform.position));
            }
        }

        private void DumpLights()
        {
            Line("");
            Line("--- LIGHTS ---");
            var lights = UnityEngine.Object.FindObjectsByType<Light>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Line("  lightCount=" + lights.Length);
            foreach (var l in lights)
            {
                if (l == null) continue;
                Line("   '" + l.gameObject.name + "' type=" + l.type + " enabled=" + l.enabled
                     + " activeInHierarchy=" + l.gameObject.activeInHierarchy
                     + " intensity=" + l.intensity + " color=" + Fmt(l.color)
                     + " shadows=" + l.shadows + " cullingMask=" + l.cullingMask);
                Line("      pos=" + Fmt(l.transform.position)
                     + " rot=" + Fmt(l.transform.eulerAngles));
            }
            if (lights.Length == 0) Line("  !! NO LIGHTS IN ANY LOADED SCENE");
        }

        private void DumpEnvironment()
        {
            Line("");
            Line("--- ENVIRONMENT / RENDER SETTINGS ---");
            Line("  skybox=" + (RenderSettings.skybox == null
                 ? "NULL (!! no skybox => ambient from sky is black and the background has nothing to draw)"
                 : RenderSettings.skybox.name));
            Line("  ambientMode=" + RenderSettings.ambientMode
                 + " (0=Skybox 1=Trilight/Gradient 3=Flat)");
            Line("  ambientSkyColor=" + Fmt(RenderSettings.ambientSkyColor)
                 + " equator=" + Fmt(RenderSettings.ambientEquatorColor)
                 + " ground=" + Fmt(RenderSettings.ambientGroundColor));
            Line("  ambientIntensity=" + RenderSettings.ambientIntensity
                 + " reflectionIntensity=" + RenderSettings.reflectionIntensity
                 + " fog=" + RenderSettings.fog);
            Line("  defaultReflectionMode=" + RenderSettings.defaultReflectionMode
                 + " reflectionBounces=" + RenderSettings.reflectionBounces);
        }

        private void DumpVolumes()
        {
            Line("");
            Line("--- VOLUMES (exposure / tonemapping can black out the frame) ---");
            var vols = UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Line("  volumeCount=" + vols.Length);
            foreach (var v in vols.OrderByDescending(x => x.priority))
            {
                if (v == null) continue;
                Line("   '" + v.gameObject.name + "' enabled=" + v.enabled
                     + " isGlobal=" + v.isGlobal + " weight=" + v.weight + " priority=" + v.priority);
                if (v.profile == null)
                {
                    Line("      profile=NULL");
                    continue;
                }
                var comps = v.profile.components.Where(x => x != null && x.active).ToArray();
                Line("      profile='" + v.profile.name + "' activeComponents=" + comps.Length);
                foreach (var comp in comps)
                {
                    string extra = "";
                    // Read the interesting numeric fields without a hard HDRP assembly dependency.
                    var t = comp.GetType();
                    if (t.Name == "Tonemapping")
                    {
                        extra = " tonemappingMode=" + SafeGet(comp, "mode")
                              + " tonemapValue=" + SafeGet(comp, "value");
                    }
                    else if (t.Name == "Exposure")
                    {
                        extra = " exposureMode=" + SafeGet(comp, "mode")
                              + " fixedExposure=" + SafeGet(comp, "fixedExposure")
                              + " compensation=" + SafeGet(comp, "compensation");
                    }
                    Line("         - " + t.Name + extra);
                }
            }
        }

        private void DumpRenderPipeline()
        {
            Line("");
            Line("--- RENDER PIPELINE / QUALITY ---");
            var rp = GraphicsSettings.currentRenderPipeline;
            var def = GraphicsSettings.defaultRenderPipeline;
            var q = QualitySettings.renderPipeline;
            Line("  qualityLevel=" + QualitySettings.names[QualitySettings.GetQualityLevel()]
                 + " (" + QualitySettings.GetQualityLevel() + "/" + QualitySettings.names.Length + ")");
            Line("  currentRenderPipeline=" + (rp == null ? "NULL" : rp.name)
                 + "  defaultRenderPipeline=" + (def == null ? "NULL" : def.name)
                 + "  qualityRenderPipeline=" + (q == null ? "NULL" : q.name));
            Line("  vsyncCount=" + QualitySettings.vSyncCount
                 + " antiAliasing=" + QualitySettings.antiAliasing);
            Line("  asyncUploadTimeSlice=" + QualitySettings.asyncUploadTimeSlice
                 + " textureStreaming=" + QualitySettings.streamingMipmapsActive);
            if (rp == null)
            {
                Line("  !! No render pipeline asset active. An HDRP project rendering with the "
                     + "built-in pipeline (or none) produces black geometry.");
            }
        }

        private void DumpDynamicResolution()
        {
            Line("");
            Line("--- DYNAMIC RESOLUTION / RENDER SCALE ---");
            Line("  ScalableBufferManager.widthScaleFactor=" + ScalableBufferManager.widthScaleFactor.ToString("F3")
                 + " heightScaleFactor=" + ScalableBufferManager.heightScaleFactor.ToString("F3"));
            Line("  screen=" + Screen.width + "x" + Screen.height
                 + " fullscreen=" + Screen.fullScreen
                 + " (resolution " + Screen.currentResolution.width + "x" + Screen.currentResolution.height + ")");
        }

        private void DumpPlayers()
        {
            Line("");
            Line("--- PLAYER / RENDERERS ---");
            var players = GameObject.FindGameObjectsWithTag("Player");
            Line("  playerCount(tag Player)=" + players.Length);
            foreach (var p in players)
            {
                if (p == null) continue;
                Line("   '" + p.name + "' activeInHierarchy=" + p.activeInHierarchy
                     + " pos=" + Fmt(p.transform.position)
                     + " layer=" + LayerMask.LayerToName(p.layer));
                foreach (var mf in p.GetComponentsInChildren<MeshRenderer>(true))
                {
                    if (mf == null) continue;
                    Line("      renderer '" + mf.gameObject.name + "' enabled=" + mf.enabled
                         + " activeInHierarchy=" + mf.gameObject.activeInHierarchy
                         + " shadowCasting=" + mf.shadowCastingMode
                         + " matCount=" + (mf.sharedMaterials == null ? 0 : mf.sharedMaterials.Length)
                         + " bounds=" + mf.bounds.size);
                }
            }
            var renderers = UnityEngine.Object.FindObjectsByType<MeshRenderer>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            Line("  totalMeshRenderers=" + renderers.Length);
            int disabled = renderers.Count(r => r != null && (!r.enabled || !r.gameObject.activeInHierarchy));
            Line("  disabledOrInactiveRenderers=" + disabled);
        }

        private static string SafeGet(object target, string field)
        {
            try
            {
                var t = target.GetType();
                var f = t.GetField(field, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                if (f != null) return Convert.ToString(f.GetValue(target));
                var p = t.GetProperty(field, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                if (p != null) return Convert.ToString(p.GetValue(target, null));
            }
            catch (Exception) { /* diagnostics must never throw */ }
            return "?";
        }

        private static string Fmt(Vector3 v) => $"({v.x:F2},{v.y:F2},{v.z:F2})";
        private static VolumeProfile ActiveProfile(Volume v)
        {
            if (v == null) return null;
            return v.sharedProfile != null ? v.sharedProfile : v.profile;
        }

        private static void ResetVolumeOverrides()
        {
            foreach (var v in UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (v == null) continue;
                v.enabled = true;
                var p = ActiveProfile(v);
                if (p == null) continue;
                foreach (var c in p.components) if (c != null) c.active = true;
            }
        }

        private static void SetVolumeComponent(string typeName, bool active)
        {
            foreach (var v in UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                var p = ActiveProfile(v);
                if (p == null) continue;
                foreach (var c in p.components)
                {
                    if (c == null) continue;
                    if (string.Equals(c.GetType().Name, typeName, StringComparison.OrdinalIgnoreCase))
                    {
                        c.active = active;
                        Debug.Log("[QA_VISUAL_DIAG] " + typeName + ".active = " + active + " on '" + v.name + "'");
                    }
                }
            }
        }

        private static void DisableGlobalVolumes()
        {
            foreach (var v in UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (v == null || !v.isGlobal) continue;
                v.enabled = false;
                Debug.Log("[QA_VISUAL_DIAG] disabled global volume '" + v.name + "'");
            }
        }

        private static void DisableExposureOverrides()
        {
            foreach (var v in UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsInactive.Include, FindObjectsSortMode.None))
            {
                if (v == null || v.profile == null) continue;
                foreach (var c in v.profile.components)
                {
                    if (c == null) continue;
                    string tn = c.GetType().Name;
                    if (tn.IndexOf("Exposure", StringComparison.OrdinalIgnoreCase) >= 0
                        || tn.IndexOf("Tonemapping", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        c.active = false;
                        Debug.Log("[QA_VISUAL_DIAG] disabled override '" + tn + "'");
                    }
                }
            }
        }

        private static string Fmt(Color c) => $"({c.r:F3},{c.g:F3},{c.b:F3},{c.a:F3})";

        private void Line(string s) => _sb.AppendLine(s);

        private void Flush()
        {
            string text = _sb.ToString();
            Debug.Log("[QA_VISUAL_DIAG]\n" + text);
            _sb.Clear();
            try
            {
                string dir = Path.Combine(Application.persistentDataPath, "QADiagnostics");
                Directory.CreateDirectory(dir);
                File.AppendAllText(Path.Combine(dir, "visual_diag.txt"), text);
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[QA_VISUAL_DIAG] file write failed: " + ex.Message);
            }
        }
    }
}