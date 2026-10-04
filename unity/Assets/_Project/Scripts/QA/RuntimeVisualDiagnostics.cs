using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.QA
{
    /// <summary>
    /// Step 11 Phase 2 runtime visual diagnostics.
    ///
    /// Reports the actual, named causes behind black / unlit / incorrect-looking objects
    /// instead of guessing. Every check below maps to one requirement:
    ///
    ///   missing materials        -> renderer slots whose material reference is null
    ///   missing shaders          -> materials whose shader is null or "Hidden/InternalError"
    ///   pink materials           -> Unity's magenta error shader (missing/unsupported shader)
    ///   disabled lights          -> Light components present but switched off
    ///   missing HDRP volume      -> no Volume with a sharedProfile / no global volume
    ///   camera clipping problems  -> near >= far, near <= 0, far too small for world scale
    ///   zero scale objects        -> transform.localScale == 0 (invisible but shipped)
    ///   out-of-bounds objects     -> geometry far outside the region's expected world box
    ///
    /// Inert unless launched with -runtimeVisualDiag or WW_RUNTIME_VISUAL_DIAG != 0, so a
    /// retail launch never pays for it.
    ///
    /// Findings are written outside the repository (persistentDataPath) so QA output can
    /// never be committed.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class RuntimeVisualDiagnostics : MonoBehaviour
    {
        private const string FlagName = "-runtimeVisualDiag";
        private const string EnvName = "WW_RUNTIME_VISUAL_DIAG";

        /// <summary>Diagnostics run at most this often, in seconds of scaled time.</summary>
        private const float IntervalSeconds = 5f;

        /// <summary>
        /// A camera whose far plane is closer than this cannot see across a region,
        /// which is a genuine clipping bug rather than a tuning choice.
        /// </summary>
        private const float MinAcceptableFarPlane = 500f;

        private readonly StringBuilder _sb = new StringBuilder();
        private readonly List<string> _findings = new List<string>();
        private float _nextRunTime;
        private int _runIndex;
        private bool _active;

        private static RuntimeVisualDiagnostics _instance;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            if (!IsRequested()) return;
            if (_instance != null) return;

            var go = new GameObject("~RuntimeVisualDiagnostics");
            DontDestroyOnLoad(go);
            go.hideFlags = HideFlags.DontSave;
            go.AddComponent<RuntimeVisualDiagnostics>();
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
            _active = true;
        }

        private void Start()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
            Run("startup");
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
            if (_instance == this) _instance = null;
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            Run("sceneLoaded:" + scene.name);
        }

        private void Update()
        {
            if (!_active) return;
            if (Time.time < _nextRunTime) return;
            _nextRunTime = Time.time + IntervalSeconds;
            Run("interval");
        }

        private void Run(string trigger)
        {
            _runIndex++;
            _findings.Clear();

            _sb.AppendLine();
            _sb.AppendLine("========================================================");
            _sb.AppendLine("RUN #" + _runIndex + "  trigger=" + trigger);
            _sb.AppendLine("Time      : " + DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture));
            _sb.AppendLine("Scene     : " + SceneManager.GetActiveScene().name);
            _sb.AppendLine("Platform  : " + Application.platform);
            _sb.AppendLine("Unity     : " + Application.unityVersion);
            _sb.AppendLine("GPU       : " + SystemInfo.graphicsDeviceName);
            _sb.AppendLine("========================================================");

            CheckRenderPipeline();
            CheckHdrpGlobalSettings();
            CheckCameras();
            CheckLights();
            CheckVolumes();
            CheckPostProcessing();
            CheckMaterials();
            CheckZeroScale();
            CheckWorldBounds();
            CheckVisibleRenderers();
            CheckSceneIntegrity();
            CheckProbes();

            _sb.AppendLine("--- FINDINGS (" + _findings.Count + ") ---");
            if (_findings.Count == 0)
            {
                _sb.AppendLine("  (none)");
            }
            else
            {
                for (int i = 0; i < _findings.Count; i++) _sb.AppendLine("  " + _findings[i]);
            }

            Debug.Log("[RUNTIME_VISUAL_DIAG] " + trigger + " -> " + _findings.Count + " finding(s); full report at " + ReportPath);
            Flush();
        }

        // ----------------------------------------------------------------- pipeline

        /// <summary>
        /// HDRP needs a <c>HDRenderPipelineGlobalSettings</c> asset assigned in
        /// Project Settings &gt; Graphics &gt; Pipeline Specific Settings, and it needs that asset's
        /// runtime-settings list to actually contain an entry. A global settings asset with an empty
        /// runtime list is the single most common cause of "everything renders but lighting is
        /// wrong / the scene looks washed out", and it is invisible from the inspector at runtime, so
        /// it gets an explicit check.
        ///
        /// The concrete HDRP type is deliberately not referenced here: the base
        /// <see cref="RenderPipelineGlobalSettings"/> is enough to answer "does an asset exist, and is
        /// it the HDRP one", and staying on the base type keeps this file compiling against the
        /// built-in pipeline too.
        /// </summary>
        private void CheckHdrpGlobalSettings()
        {
            _sb.AppendLine();
            _sb.AppendLine("[GLOBAL PIPELINE SETTINGS]");

            var rp = GraphicsSettings.currentRenderPipeline;
            if (rp == null)
            {
                _findings.Add("NO_RENDER_PIPELINE_ASSET: GraphicsSettings.currentRenderPipeline is null; " +
                              "this project is configured for HDRP, so the scene falls back to the " +
                              "built-in pipeline and renders with the wrong lighting model.");
                _sb.AppendLine("  no render pipeline asset assigned");
                return;
            }

            var globalSettings = Resources.FindObjectsOfTypeAll<RenderPipelineGlobalSettings>();
            _sb.AppendLine("  RenderPipelineGlobalSettings assets loaded: " + globalSettings.Length);

            bool sawHdrp = false;
            for (int i = 0; i < globalSettings.Length; i++)
            {
                var gs = globalSettings[i];
                _sb.AppendLine("  - " + gs.GetType().Name + " '" + gs.name + "'");
                if (gs.GetType().Name.Contains("HighDefinition")) sawHdrp = true;
            }

            if (!sawHdrp)
            {
                _findings.Add("MISSING_HDRP_GLOBAL_SETTINGS: no HDRenderPipelineGlobalSettings asset is " +
                              "loaded. HDRP falls back to default global settings, so shadow, decal and " +
                              "post-processing defaults will not match what the project authored.");
            }

            // HDRP's own diagnostics surface the empty-runtime-list case as a startup error, so the
            // asset being present but empty has to be called out explicitly.
            var hdrAsset = rp as UnityEngine.Rendering.HighDefinition.HDRenderPipelineAsset;
            if (hdrAsset != null)
            {
                var hasDefaultProfile = hdrAsset.volumeProfile != null;
                _sb.AppendLine("  HDRP default volume profile : " +
                              (hasDefaultProfile ? hdrAsset.volumeProfile.name : "NULL"));
                if (!hasDefaultProfile)
                {
                    _findings.Add("INVALID_HDRP_GLOBAL_SETTINGS: the HDRP asset '" + hdrAsset.name +
                                  "' has no default volume profile bound; HDRP builds one at runtime and " +
                                  "the authored default frame settings (exposure, tonemapping, fog) are lost.");
                }
            }
        }

        private void CheckRenderPipeline()
        {
            _sb.AppendLine();
            _sb.AppendLine("[RENDER PIPELINE]");

            var rp = GraphicsSettings.currentRenderPipeline;
            if (rp == null)
            {
                // Built-in RP with no SRP asset assigned is a valid, if legacy, state.
                _sb.AppendLine("  currentRenderPipeline: Built-in (no SRP asset assigned)");
            }
            else
            {
                _sb.AppendLine("  currentRenderPipeline: " + rp.GetType().Name);

                var hdr = rp as UnityEngine.Rendering.HighDefinition.HDRenderPipelineAsset;
                if (hdr != null)
                {
                    _sb.AppendLine("  HDRP asset: " + hdr.name);

                    // HDRP 17 exposes feature flags on RenderPipelineSettings itself.
                    var s = hdr.currentPlatformRenderPipelineSettings;

                    _sb.AppendLine("  MSAA sample count  : " + s.msaaSampleCount + "  (supportMSAA=" + s.supportMSAA + ")");
                    _sb.AppendLine("  Supports SSR      : " + s.supportSSR + "  (transparent=" + s.supportSSRTransparent + ")");
                    _sb.AppendLine("  Supports SSAO     : " + s.supportSSAO);
                    _sb.AppendLine("  Supports SSGI     : " + s.supportSSGI);
                    _sb.AppendLine("  Supports Volumetr.: " + s.supportVolumetrics + "  (clouds=" + s.supportVolumetricClouds + ")");
                    _sb.AppendLine("  Supports LightLay.: " + s.supportLightLayers);
                    _sb.AppendLine("  Supports Water    : " + s.supportWater);
                    _sb.AppendLine("  Supports Distortn.: " + s.supportDistortion);
                    _sb.AppendLine("  SupportedLitMode  : " + s.supportedLitShaderMode);

                    var dr = s.dynamicResolutionSettings;
                    _sb.AppendLine("  DynamicResolution enabled: " + dr.enabled);
                    _sb.AppendLine("  DynamicResolution range  : " + dr.minPercentage + "% - " + dr.maxPercentage + "%");

                    _sb.AppendLine("  ProbeVolumes supported  : " + hdr.supportProbeVolume);
                    _sb.AppendLine("  Virtual texturing        : " + hdr.virtualTexturingEnabled);
                    _sb.AppendLine("  Volume profile asset set : " + (hdr.volumeProfile != null));
                }
            }

            _sb.AppendLine("  QualityTier name : " + (QualitySettings.names.Length > 0 ? QualitySettings.names[QualitySettings.GetQualityLevel()] : "(none)"));
            _sb.AppendLine("  ColorSpace       : " + QualitySettings.activeColorSpace);
            _sb.AppendLine("  AntiAliasing     : " + QualitySettings.antiAliasing);
            _sb.AppendLine("  LODBias          : " + QualitySettings.lodBias.ToString("F2", CultureInfo.InvariantCulture));
            _sb.AppendLine("  ShadowDistance   : " + QualitySettings.shadowDistance.ToString("F1", CultureInfo.InvariantCulture));
            _sb.AppendLine("  ShadowCascades   : " + QualitySettings.shadowCascades);
            _sb.AppendLine("  Texture mip limit: " + QualitySettings.globalTextureMipmapLimit);
            _sb.AppendLine("  MaxQueuedFrames  : " + QualitySettings.maxQueuedFrames);
            _sb.AppendLine("  AmbientMode      : " + RenderSettings.ambientMode);
            _sb.AppendLine("  AmbientIntensity : " + RenderSettings.ambientIntensity.ToString("F3", CultureInfo.InvariantCulture));
            _sb.AppendLine("  ReflectionIntensity: " + RenderSettings.reflectionIntensity.ToString("F3", CultureInfo.InvariantCulture));
        }

        // ------------------------------------------------------------------ camera

        private void CheckCameras()
        {
            _sb.AppendLine();
            _sb.AppendLine("[CAMERAS]");

            var cams = FindObjectsByType<Camera>(FindObjectsSortMode.None);
            _sb.AppendLine("  camera count: " + cams.Length);

            var main = Camera.main;
            if (main == null)
            {
                _findings.Add("MISSING: no enabled Camera tagged MainCamera - nothing will render.");
            }
            else
            {
                _sb.AppendLine("  main: " + main.name);
            }

            for (int i = 0; i < cams.Length; i++)
            {
                var c = cams[i];
                if (!c.enabled) continue;

                _sb.AppendLine("  - " + c.name +
                              " near=" + c.nearClipPlane.ToString("F3", CultureInfo.InvariantCulture) +
                              " far=" + c.farClipPlane.ToString("F3", CultureInfo.InvariantCulture) +
                              " clear=" + c.clearFlags +
                              " cullingMask=" + c.cullingMask +
                              " hdr=" + c.allowHDR);

                if (c.nearClipPlane <= 0f)
                {
                    _findings.Add("CAMERA_CLIPPING: '" + c.name + "' nearClipPlane=" + c.nearClipPlane + " (must be > 0).");
                }
                if (c.nearClipPlane >= c.farClipPlane)
                {
                    _findings.Add("CAMERA_CLIPPING: '" + c.name + "' near (" + c.nearClipPlane + ") >= far (" + c.farClipPlane + "); nothing is visible.");
                }
                else if (c.farClipPlane < MinAcceptableFarPlane)
                {
                    _findings.Add("CAMERA_CLIPPING: '" + c.name + "' farClipPlane=" + c.farClipPlane +
                                  " is below " + MinAcceptableFarPlane + "m; large regions will be clipped away.");
                }

                // HDRP needs HDR enabled or tonemapping/exposure behave incorrectly.
                if (!c.allowHDR)
                {
                    _findings.Add("CAMERA_HDR_OFF: '" + c.name + "' has allowHDR=false; HDRP exposure/tonemapping will not behave as authored.");
                }

                if (c.clearFlags == CameraClearFlags.SolidColor || c.clearFlags == CameraClearFlags.Skybox)
                {
                    _sb.AppendLine("      background=" + c.backgroundColor);
                }
            }

            _sb.AppendLine("  Scene fog: enabled=" + RenderSettings.fog +
                          " mode=" + RenderSettings.fogMode +
                          " color=" + RenderSettings.fogColor +
                          " density=" + RenderSettings.fogDensity.ToString("F5", CultureInfo.InvariantCulture) +
                          " startDistance=" + RenderSettings.fogStartDistance.ToString("F1", CultureInfo.InvariantCulture) +
                          " endDistance=" + RenderSettings.fogEndDistance.ToString("F1", CultureInfo.InvariantCulture));
        }

        // ------------------------------------------------------------------ lights

        private void CheckLights()
        {
            _sb.AppendLine();
            _sb.AppendLine("[LIGHTS]");

            var lights = FindObjectsByType<Light>(FindObjectsSortMode.None);
            _sb.AppendLine("  light count: " + lights.Length);

            int directional = 0;
            for (int i = 0; i < lights.Length; i++)
            {
                var l = lights[i];

                if (l.type == LightType.Directional) directional++;

                string state = l.enabled && l.gameObject.activeInHierarchy ? "on" : "OFF";
                if (!l.enabled)
                {
                    _findings.Add("DISABLED_LIGHT: '" + HierarchyPath(l.transform) + "' (" + l.type + ", intensity " + l.intensity.ToString("F2", CultureInfo.InvariantCulture) + ") is disabled.");
                }
                else if (!l.gameObject.activeInHierarchy)
                {
                    _findings.Add("INACTIVE_LIGHT: '" + HierarchyPath(l.transform) + "' (" + l.type + ") is on an inactive GameObject.");
                }

                if (l.type != LightType.Directional && l.intensity <= 0f && l.enabled)
                {
                    _findings.Add("ZERO_INTENSITY_LIGHT: '" + HierarchyPath(l.transform) + "' (" + l.type + ") contributes no light.");
                }

                _sb.AppendLine("  - " + l.type + " '" + l.name + "' state=" + state +
                              " intensity=" + l.intensity.ToString("F2", CultureInfo.InvariantCulture) +
                              " color=" + l.color +
                              " shadows=" + l.shadows +
                              " bounce=" + l.bounceIntensity.ToString("F2", CultureInfo.InvariantCulture));
            }

            if (lights.Length > 0 && directional == 0)
            {
                _findings.Add("NO_DIRECTIONAL_LIGHT: no directional light in scene; HDRP exterior lighting will fall back to ambient only.");
            }

            _sb.AppendLine("  directional lights: " + directional);
        }

        // ------------------------------------------------------------------ volumes

        private void CheckVolumes()
        {
            _sb.AppendLine();
            _sb.AppendLine("[VOLUMES / SKY / POST]");

            var vols = FindObjectsByType<Volume>(FindObjectsSortMode.None);
            _sb.AppendLine("  volume count: " + vols.Length);

            bool foundProfiled = false;
            for (int i = 0; i < vols.Length; i++)
            {
                var v = vols[i];
                bool profiled = v.sharedProfile != null;
                if (profiled) foundProfiled = true;

                _sb.AppendLine("  - '" + v.name + "' isGlobal=" + v.isGlobal + " priority=" + v.priority +
                              " weight=" + v.weight.ToString("F2", CultureInfo.InvariantCulture) +
                              " profile=" + (profiled ? v.sharedProfile.name : "NULL") +
                              " active=" + v.gameObject.activeInHierarchy);

                if (v.isGlobal && !profiled)
                {
                    _findings.Add("MISSING_VOLUME_PROFILE: global Volume '" + v.name + "' has no sharedProfile; exposure/fog/sky overrides are ignored.");
                }
                if (!v.gameObject.activeInHierarchy)
                {
                    _findings.Add("INACTIVE_VOLUME: Volume '" + v.name + "' sits on a disabled GameObject.");
                }
            }

            if (vols.Length == 0)
            {
                _findings.Add("MISSING_VOLUME: no Volume component in scene; HDRP sky/exposure/fog defaults apply and may render near-black.");
            }
            else if (!foundProfiled)
            {
                _findings.Add("MISSING_VOLUME_PROFILE: " + vols.Length + " Volume(s) present but none has a sharedProfile assigned.");
            }

            _sb.AppendLine("  RenderSettings.skybox: " + (RenderSettings.skybox != null ? RenderSettings.skybox.name : "NULL"));
            if (RenderSettings.skybox == null)
            {
                _findings.Add("MISSING_SKYBOX: RenderSettings.skybox is null; sky will render flat.");
            }
        }

        // ---------------------------------------------------------------- materials

        /// <summary>
        /// Reads the resolved overrides on the highest-priority active global volume profile.
        ///
        /// Two failure modes matter and neither is visible from a screenshot:
        ///   - a tonemapper override sitting on "None", or missing entirely, which leaves HDRP on its
        ///     fallback and renders the authored look flat;
        ///   - an exposure override pinned to a fixed EV far from zero, or a sky override that is
        ///     present but has nothing bound behind it, which produces a genuinely broken frame.
        ///
        /// This walks <see cref="VolumeComponent"/> by type and field *name* through
        /// <see cref="VolumeParameter"/> rather than naming HDRP's concrete types. HDRP renames these
        /// components and enum members between minor versions (Exposure.fixedEV became
        /// fixedExposure, Sky was replaced by the SkySettings family), and a diagnostic tool that
        /// stops compiling when the renderer package updates is worse than no diagnostic at all.
        /// </summary>
        private void CheckPostProcessing()
        {
            _sb.AppendLine();
            _sb.AppendLine("[POST PROCESSING OVERRIDES]");

            var vols = FindObjectsByType<Volume>(FindObjectsSortMode.None);
            Volume best = null;
            for (int i = 0; i < vols.Length; i++)
            {
                var v = vols[i];
                if (!v.isGlobal || !v.gameObject.activeInHierarchy || v.weight <= 0f) continue;
                if (v.sharedProfile == null) continue;
                if (best == null || v.priority > best.priority) best = v;
            }

            if (best == null)
            {
                _sb.AppendLine("  no active global volume with a profile; nothing to inspect");
                return;
            }

            var profile = best.sharedProfile;
            _sb.AppendLine("  resolved profile: '" + profile.name + "' (Volume '" + best.name +
                          "', priority " + best.priority + ", weight " + best.weight.ToString("F2", CultureInfo.InvariantCulture) + ")");

            bool sawTonemapping = false;
            int skyComponents = 0;

            for (int i = 0; i < profile.components.Count; i++)
            {
                var component = profile.components[i];
                if (component == null) continue;
                string typeName = component.GetType().Name;

                // ------------------------------------------------------- tonemapping
                if (typeName.IndexOf("Tonemapping", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    typeName.IndexOf("Tonemap", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    sawTonemapping = true;
                    var mode = FindVolumeParameter(component, "mode");
                    _sb.AppendLine("  " + typeName + " : mode=" + Describe(mode));

                    if (mode == null)
                    {
                        continue;
                    }
                    if (!mode.overrideState)
                    {
                        _findings.Add("MISSING_TONEMAPPING: active global volume '" + best.name + "' has a " +
                                      typeName + " component but its mode is not overridden, so HDRP's " +
                                      "fallback tonemapper runs instead of the authored look.");
                    }
                    else if (string.Equals(Describe(mode), "None", StringComparison.OrdinalIgnoreCase))
                    {
                        _findings.Add("UNSAFE_EXPOSURE: Volume '" + best.name + "' overrides " + typeName +
                                      " mode to None; nothing tone maps the HDR frame and highlights clip harshly.");
                    }
                }

                // ---------------------------------------------------------- exposure
                if (typeName.IndexOf("Exposure", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    var mode = FindVolumeParameter(component, "mode");
                    var fixedExposure = FindVolumeParameter(component, "fixedExposure") ??
                                        FindVolumeParameter(component, "fixedEV");
                    _sb.AppendLine("  " + typeName + " : mode=" + Describe(mode) +
                                  " fixedExposure=" + Describe(fixedExposure));

                    if (mode != null && mode.overrideState &&
                        string.Equals(Describe(mode), "Fixed", StringComparison.OrdinalIgnoreCase))
                    {
                        float ev;
                        if (TryGetFloat(fixedExposure, out ev) && (ev <= -6f || ev >= 6f))
                        {
                            _findings.Add("UNSAFE_EXPOSURE: Volume '" + best.name + "' pins fixed exposure to " +
                                          ev.ToString("F2", CultureInfo.InvariantCulture) +
                                          " EV, which renders the frame essentially black or blown out.");
                        }
                    }
                }

                // --------------------------------------------------------------- sky
                if (typeName.IndexOf("Sky", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    skyComponents++;

                    // An HDRI/procedural sky with nothing bound behind it is the common case: the
                    // override is on, and the asset it points at was never assigned.
                    foreach (var field in component.GetType().GetFields(ReflectionBindingFlags))
                    {
                        if (!IsAssetBackedParameterType(field.FieldType)) continue;

                        var parameter = field.GetValue(component) as VolumeParameter;
                        if (parameter == null) continue;

                        _sb.AppendLine("  " + typeName + " : " + field.Name + "=" + Describe(parameter));
                        if (parameter.overrideState && !HasAssetBackedValue(parameter))
                        {
                            _findings.Add("INVALID_SKY: Volume '" + best.name + "' overrides " + typeName + "." +
                                          field.Name + " but the referenced asset is null; the sky renders " +
                                          "flat/black regardless of RenderSettings.skybox.");
                        }
                    }
                }
            }

            if (!sawTonemapping)
            {
                _findings.Add("MISSING_TONEMAPPING: active global volume profile '" + profile.name +
                              "' has no tonemapping component at all; HDRP falls back to its default " +
                              "tonemapper and the authored look is lost.");
            }

            _sb.AppendLine("  sky components in profile: " + skyComponents);
            if (skyComponents == 0 && RenderSettings.skybox != null)
            {
                _sb.AppendLine("  (no sky override; RenderSettings.skybox is used)");
            }
        }

        private const System.Reflection.BindingFlags ReflectionBindingFlags =
            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance;

        /// <summary>
        /// Returns the <see cref="VolumeParameter"/> backing the named public field, or null. Field
        /// names are matched case-insensitively because HDRP is not consistent about casing.
        /// </summary>
        private static VolumeParameter FindVolumeParameter(VolumeComponent component, string fieldName)
        {
            var fields = component.GetType().GetFields(ReflectionBindingFlags);
            for (int i = 0; i < fields.Length; i++)
            {
                if (!string.Equals(fields[i].Name, fieldName, StringComparison.OrdinalIgnoreCase)) continue;
                if (!typeof(VolumeParameter).IsAssignableFrom(fields[i].FieldType)) continue;
                return fields[i].GetValue(component) as VolumeParameter;
            }
            return null;
        }

        private static bool TryGetFloat(VolumeParameter parameter, out float value)
        {
            value = 0f;
            if (parameter == null) return false;
            try
            {
                value = parameter.GetValue<float>();
                return true;
            }
            catch (System.Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// True for the parameter types that hold an asset reference (<c>ObjectParameter&lt;T&gt;</c>,
        /// <c>CubemapParameter</c>). Matched by name because Unity's own <c>ObjectParameter</c> is
        /// generic over the asset type, so there is no single concrete type to compare against.
        /// </summary>
        private static bool IsAssetBackedParameterType(Type fieldType)
        {
            if (fieldType == typeof(CubemapParameter)) return true;
            if (!typeof(VolumeParameter).IsAssignableFrom(fieldType)) return false;
            if (!fieldType.IsGenericType) return false;

            var definition = fieldType.GetGenericTypeDefinition();
            return definition.Name.StartsWith("ObjectParameter", StringComparison.Ordinal);
        }

        /// <summary>
        /// False when the parameter is overridden but the asset it points at is null, which is how a
        /// sky override ends up with nothing behind it.
        /// </summary>
        private static bool HasAssetBackedValue(VolumeParameter parameter)
        {
            var valueProperty = parameter.GetType().GetProperty("value", ReflectionBindingFlags);
            if (valueProperty == null) return true;

            object value;
            try
            {
                value = valueProperty.GetValue(parameter, null);
            }
            catch (System.Exception)
            {
                return true;
            }

            return value != null;
        }

        /// <summary>Human-readable parameter value without knowing its generic argument type.</summary>
        private static string Describe(VolumeParameter parameter)
        {
            if (parameter == null) return "(absent)";
            string text;
            try
            {
                var parameters = parameter.GetType().GetProperty("value", ReflectionBindingFlags);
                if (parameters != null)
                {
                    text = parameters.GetValue(parameter, null) as string;
                }
                else
                {
                    text = null;
                }
            }
            catch (System.Exception)
            {
                text = null;
            }

            if (text != null) return text + (parameter.overrideState ? "" : " (not overridden)");

            float asFloat;
            if (TryGetFloat(parameter, out asFloat)) return asFloat.ToString("F2", CultureInfo.InvariantCulture);

            return parameter.GetType().Name + (parameter.overrideState ? " (overridden)" : " (not overridden)");
        }

        /// <summary>
        /// Catches "the object is shipped, enabled, has a valid material, and still never appears".
        /// A renderer whose world bounds fall outside every enabled camera's frustum produces no
        /// frame, which is exactly the class of bug that a screenshot review misses.
        /// </summary>
        private void CheckVisibleRenderers()
        {
            _sb.AppendLine();
            _sb.AppendLine("[CAMERA VISIBILITY]");

            var cams = FindObjectsByType<Camera>(FindObjectsSortMode.None);
            var active = new List<Camera>();
            for (int i = 0; i < cams.Length; i++)
            {
                if (cams[i].enabled && cams[i].gameObject.activeInHierarchy && cams[i].targetTexture == null)
                {
                    active.Add(cams[i]);
                }
            }

            if (active.Count == 0)
            {
                _findings.Add("NO_ACTIVE_CAMERA: no enabled, untargeted Camera; nothing can be rendered.");
                return;
            }

            var planes = new Plane[active.Count * 6];
            for (int c = 0; c < active.Count; c++)
            {
                var frustum = GeometryUtility.CalculateFrustumPlanes(active[c]);
                for (int p = 0; p < 6; p++) planes[c * 6 + p] = frustum[p];
            }

            var renderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
            int notVisible = 0;
            int total = 0;
            var examples = new List<string>();

            for (int i = 0; i < renderers.Length; i++)
            {
                var r = renderers[i];
                if (!r.enabled || !r.gameObject.activeInHierarchy) continue;
                if (r is ParticleSystemRenderer || r is TrailRenderer || r is LineRenderer) continue;

                total++;
                var bounds = r.bounds;
                if (bounds.size.sqrMagnitude <= 0f) continue;
                if (GeometryUtility.TestPlanesAABB(planes, bounds)) continue;

                notVisible++;
                if (examples.Count < 12) examples.Add(HierarchyPath(r.transform));
            }

            _sb.AppendLine("  active cameras : " + active.Count);
            _sb.AppendLine("  eligible renderers : " + total);
            _sb.AppendLine("  outside every frustum : " + notVisible);

            if (notVisible > 0)
            {
                _findings.Add("RENDERER_NOT_VISIBLE: " + notVisible + " of " + total +
                              " enabled renderer(s) sit outside every active camera frustum and never produce a frame; " +
                              "first few: " + string.Join(", ", examples.ToArray()));
            }
        }

        /// <summary>
        /// Invalid scene references: a MonoBehaviour whose script asset was deleted shows up as a
        /// null component, and a GameObject reference held by a live component can be null while the
        /// consuming code assumes it is not. Both are reported by name so they can be fixed rather
        /// than guessed at.
        /// </summary>
        private void CheckSceneIntegrity()
        {
            _sb.AppendLine();
            _sb.AppendLine("[SCENE INTEGRITY]");

            var behaviours = FindObjectsByType<MonoBehaviour>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            int missingScripts = 0;
            var missingScriptPaths = new List<string>();

            for (int i = 0; i < behaviours.Length; i++)
            {
                if (behaviours[i] != null) continue;
                missingScripts++;
                if (missingScriptPaths.Count < 12) missingScriptPaths.Add("<missing script component>");
            }

            _sb.AppendLine("  live scene components : " + behaviours.Length);
            _sb.AppendLine("  missing script components : " + missingScripts);

            if (missingScripts > 0)
            {
                _findings.Add("INVALID_SCENE_REFERENCE: " + missingScripts +
                              " component slot(s) in the active scene have no script assigned (" +
                              "the script asset was deleted or the component was never wired). These " +
                              "GameObjects are shipping with dead behaviour attached.");
            }

            var scene = SceneManager.GetActiveScene();
            bool sceneUsable = scene.IsValid() && scene.isLoaded && scene.rootCount > 0;
            _sb.AppendLine("  active scene : '" + scene.name + "' valid=" + scene.IsValid() +
                          " loaded=" + scene.isLoaded + " roots=" + scene.rootCount);
            if (!sceneUsable)
            {
                _findings.Add("INVALID_SCENE_REFERENCE: the active scene is not usable (valid=" + scene.IsValid() +
                              ", loaded=" + scene.isLoaded + ", rootCount=" + scene.rootCount +
                              "); regional loading probably unloaded the wrong scene.");
            }

            int brokenNavAgents = 0;
            var agents = FindObjectsByType<UnityEngine.AI.NavMeshAgent>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            for (int i = 0; i < agents.Length; i++)
            {
                if (agents[i] != null && !agents[i].gameObject.activeInHierarchy) brokenNavAgents++;
            }
            if (brokenNavAgents > 0)
            {
                _sb.AppendLine("  disabled NavMeshAgents : " + brokenNavAgents);
            }
        }

        private void CheckMaterials()
        {
            _sb.AppendLine();
            _sb.AppendLine("[MATERIALS / SHADERS]");

            var renderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
            int missingMatSlots = 0;
            int missingShader = 0;
            int pink = 0;
            int zeroScale = 0;
            var missingMatNames = new List<string>();
            var pinkNames = new List<string>();
            var missingShaderNames = new List<string>();

            for (int i = 0; i < renderers.Length; i++)
            {
                var r = renderers[i];

                if (r.transform.localScale == Vector3.zero || r.transform.lossyScale == Vector3.zero)
                {
                    zeroScale++;
                    _findings.Add("ZERO_SCALE: renderer '" + HierarchyPath(r.transform) + "' has zero scale and is invisible.");
                }

                var mats = r.sharedMaterials;
                if (mats == null) continue;

                for (int m = 0; m < mats.Length; m++)
                {
                    var mat = mats[m];
                    if (mat == null)
                    {
                        missingMatSlots++;
                        if (missingMatNames.Count < 12) missingMatNames.Add(HierarchyPath(r.transform) + " slot " + m);
                        continue;
                    }

                    var sh = mat.shader;
                    if (sh == null)
                    {
                        missingShader++;
                        if (missingShaderNames.Count < 12) missingShaderNames.Add(mat.name);
                        continue;
                    }

                    // Unity renders magenta when a shader failed to compile or the
                    // material's shader is a hidden error stub.
                    if (IsErrorShader(sh))
                    {
                        pink++;
                        if (pinkNames.Count < 12) pinkNames.Add(HierarchyPath(r.transform) + " -> " + mat.name + " (" + sh.name + ")");
                    }
                }
            }

            _sb.AppendLine("  renderers      : " + renderers.Length);
            _sb.AppendLine("  zero-scale     : " + zeroScale);
            _sb.AppendLine("  missing mat    : " + missingMatSlots);
            _sb.AppendLine("  missing shader : " + missingShader);
            _sb.AppendLine("  pink/error     : " + pink);

            if (missingMatNames.Count > 0)
            {
                _sb.AppendLine("    sample missing materials:");
                for (int i = 0; i < missingMatNames.Count; i++) _sb.AppendLine("      " + missingMatNames[i]);
            }
            if (missingShaderNames.Count > 0)
            {
                _sb.AppendLine("    sample missing shaders:");
                for (int i = 0; i < missingShaderNames.Count; i++) _sb.AppendLine("      " + missingShaderNames[i]);
            }
            if (pinkNames.Count > 0)
            {
                _sb.AppendLine("    sample pink materials:");
                for (int i = 0; i < pinkNames.Count; i++) _sb.AppendLine("      " + pinkNames[i]);
            }

            if (missingMatSlots > 0) _findings.Add("MISSING_MATERIAL: " + missingMatSlots + " renderer material slot(s) are null (renders magenta).");
            if (missingShader > 0) _findings.Add("MISSING_SHADER: " + missingShader + " material(s) have a null shader.");
            if (pink > 0) _findings.Add("PINK_MATERIAL: " + pink + " renderer(s) use an error/hidden shader (renders magenta).");
        }

        private static bool IsErrorShader(Shader sh)
        {
            if (sh == null) return false;
            string n = sh.name;
            if (string.IsNullOrEmpty(n)) return true;
            // Hidden/InternalErrorShader is what Unity substitutes for a failed compile.
            if (n.IndexOf("InternalError", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (n.IndexOf("Hidden/InternalError", StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (n == "Hidden/InternalErrorShader") return true;
            return false;
        }

        // ---------------------------------------------------------------- zero scale

        private void CheckZeroScale()
        {
            // Already folded into CheckMaterials (renderer-centric). Reported here so the
            // section name required by the brief is always present in the report.
            _sb.AppendLine();
            _sb.AppendLine("[ZERO SCALE]  (counted with renderers above)");
        }

        // -------------------------------------------------------------- world bounds

        /// <summary>
        /// Flags geometry outside the region's expected world box. A region that is
        /// authored around the origin should never contain stray geometry kilometres away;
        /// that is nearly always a misplaced prefab rather than intentional design.
        /// </summary>
        private static readonly Bounds ExpectedWorldBounds = new Bounds(Vector3.zero, new Vector3(4000f, 2000f, 4000f));

        private void CheckWorldBounds()
        {
            _sb.AppendLine();
            _sb.AppendLine("[WORLD BOUNDS]  expected centre=" + ExpectedWorldBounds.center +
                          " size=" + ExpectedWorldBounds.size);

            var renderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
            Bounds b = new Bounds();
            bool first = true;
            int outside = 0;
            var outsideNames = new List<string>();
            Vector3 maxAbs = Vector3.zero;

            for (int i = 0; i < renderers.Length; i++)
            {
                var r = renderers[i];
                if (r.transform.localScale == Vector3.zero) continue;

                b = first ? r.bounds : Encapsulate(b, r.bounds);
                first = false;

                Vector3 c = r.bounds.center;
                if (Mathf.Abs(c.x) > maxAbs.x) maxAbs.x = Mathf.Abs(c.x);
                if (Mathf.Abs(c.y) > maxAbs.y) maxAbs.y = Mathf.Abs(c.y);
                if (Mathf.Abs(c.z) > maxAbs.z) maxAbs.z = Mathf.Abs(c.z);

                if (!ExpectedWorldBounds.Contains(c))
                {
                    outside++;
                    if (outsideNames.Count < 12) outsideNames.Add(HierarchyPath(r.transform) + " @ " + c.ToString("F1"));
                }
            }

            if (first)
            {
                _sb.AppendLine("  no renderers in scene");
                _findings.Add("EMPTY_SCENE: no Renderer in the active scene; world cannot render.");
                return;
            }

            _sb.AppendLine("  renderer bounds : " + b.ToString());
            _sb.AppendLine("  max |coord|     : " + maxAbs.ToString("F1"));
            _sb.AppendLine("  outside expected bounds: " + outside);

            if (outsideNames.Count > 0)
            {
                for (int i = 0; i < outsideNames.Count; i++) _sb.AppendLine("      " + outsideNames[i]);
            }

            if (outside > 0)
            {
                _findings.Add("OUT_OF_BOUNDS: " + outside + " renderer(s) sit outside the expected world bounds " +
                              ExpectedWorldBounds.size + " centred on the origin.");
            }
        }

        private static Bounds Encapsulate(Bounds a, Bounds b)
        {
            a.Encapsulate(b);
            return a;
        }

        // ------------------------------------------------------------------- probes

        private void CheckProbes()
        {
            _sb.AppendLine();
            _sb.AppendLine("[PROBES]");

            var rp = FindObjectsByType<ReflectionProbe>(FindObjectsSortMode.None);
            var lpg = FindObjectsByType<LightProbeGroup>(FindObjectsSortMode.None);

            _sb.AppendLine("  ReflectionProbe count : " + rp.Length);
            _sb.AppendLine("  LightProbeGroup count : " + lpg.Length);

            int dirtyRefl = 0;
            for (int i = 0; i < rp.Length; i++)
            {
                _sb.AppendLine("  - reflProbe '" + rp[i].name + "' mode=" + rp[i].mode +
                              " intensity=" + rp[i].intensity.ToString("F2", CultureInfo.InvariantCulture) +
                              " size=" + rp[i].size +
                              " runtimeTrigger=" + rp[i].refreshMode);
                if (rp[i].intensity <= 0f && rp[i].enabled)
                {
                    dirtyRefl++;
                    _findings.Add("REFLECTION_PROBE_ZERO: ReflectionProbe '" + rp[i].name + "' has intensity 0 and reflects nothing.");
                }
            }

            if (dirtyRefl > 0) _sb.AppendLine("  zero-intensity reflection probes: " + dirtyRefl);

            if (rp.Length == 0)
            {
                _findings.Add("NO_REFLECTION_PROBE: no ReflectionProbe in scene; metals/glass rely on the default probe and will look flat.");
            }
            if (lpg.Length == 0)
            {
                _findings.Add("NO_LIGHT_PROBE_GROUP: no baked LightProbeGroup; indirect lighting will fall back to ambient only.");
            }
        }

        // -------------------------------------------------------------------- output

        private static string HierarchyPath(Transform t)
        {
            if (t == null) return "<null>";
            var sb = new StringBuilder(t.name);
            var p = t.parent;
            int guard = 0;
            while (p != null && guard++ < 12)
            {
                sb.Insert(0, p.name + "/");
                p = p.parent;
            }
            return sb.ToString();
        }

        private string ReportPath
        {
            get { return System.IO.Path.Combine(Application.persistentDataPath, "runtime_visual_diagnostics.txt"); }
        }

        private void Flush()
        {
            try
            {
                File.WriteAllText(ReportPath, _sb.ToString());
            }
            catch (Exception ex)
            {
                Debug.LogWarning("[RUNTIME_VISUAL_DIAG] could not write report: " + ex.Message);
            }
        }
    }
}
