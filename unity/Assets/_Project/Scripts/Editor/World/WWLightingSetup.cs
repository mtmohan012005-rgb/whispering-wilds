using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Authors the HDRP 17 exterior lighting for the George Town street corridor.
    ///
    /// Two root causes are addressed here rather than papered over with a brighter ambient:
    ///   1. The project is HDRP in Linear space, but the sky/fog volume profile carried no
    ///      Tonemapping override, so HDR values reached the backbuffer untonemapped.
    ///   2. The sun was authored at intensity 1.25 with a 45-degree pitch, which under HDRP plus a
    ///      physical sky reads dim and throws long shadows across the carriageway.
    ///
    /// RenderSettings.ambient* is intentionally still written as a fallback for built-in-render-path
    /// code, but HDRP derives its ambient probe from the sky through VisualEnvironment, so those
    /// values are not what lights this scene.
    /// </summary>
    public static class WWLightingSetup
    {
        public const string RootName = "--- CHENNAI_LIGHTING ---";
        private const string ProfilePath = "Assets/Settings/SkyandFogSettingsProfile.asset";

        // Chennai late-morning: sun high enough to read the carriageway surface, aligned close to
        // the street axis so the corridor recedes into light instead of being lit flat from the side.
        private static readonly Color SunColor = new Color(1.0f, 0.96f, 0.90f);
        private const float SunIntensity = 3.0f;
        private static readonly Vector3 SunEuler = new Vector3(40f, 168f, 0f);

        [MenuItem("Tools/Whispering Wilds/World/Setup Chennai HDRP Lighting")]
        public static void Build()
        {
            var sun = ConfigureSun();
            ConfigureProfileVolume();
            ConfigureRenderSettingsFallback(sun);

            EditorUtility.SetDirty(sun.gameObject);
            AssetDatabase.SaveAssets();

            Debug.Log("[WhisperingWilds] HDRP lighting authored: sun " + SunIntensity +
                      ", ACES tonemapping, automatic exposure, sky-coloured fog.");
        }

        /// <summary>
        /// Reuses the single sun the scene assembler already created instead of adding a second
        /// directional light, which would double the shadow cost for no visual gain.
        /// </summary>
        private static Light ConfigureSun()
        {
            var root = GameObject.Find(RootName);
            if (root == null) root = new GameObject(RootName);

            Light sun = null;
            foreach (var l in UnityEngine.Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
            {
                if (l.type != LightType.Directional) continue;
                if (sun == null) { sun = l; continue; }

                // Collapse any accidental extra suns into the one we keep.
                UnityEngine.Object.DestroyImmediate(l.gameObject);
            }

            if (sun == null)
            {
                var sunObj = new GameObject("Directional Light");
                sunObj.transform.SetParent(root.transform, false);
                sun = sunObj.AddComponent<Light>();
                sun.type = LightType.Directional;
            }
            else if (sun.transform.parent != root.transform)
            {
                sun.transform.SetParent(root.transform, true);
            }

            sun.name = "Chennai_Sun";
            sun.color = SunColor;
            sun.intensity = SunIntensity;
            sun.shadows = LightShadows.Soft;
            sun.shadowStrength = 0.85f;
            sun.shadowBias = 0.02f;
            sun.shadowNormalBias = 0.35f;
            sun.lightmapBakeType = LightmapBakeType.Realtime;
            sun.transform.rotation = Quaternion.Euler(SunEuler);

            return sun;
        }

        /// <summary>
            /// Returns the profile's existing component of type T, adding it only when absent.
            /// VolumeProfile.Add throws if the component is already present, so every lookup has to
            /// be guarded or the builder is not idempotent across repeated runs.
            /// </summary>
        private static T Ensure<T>(VolumeProfile profile, bool setOverrides = true) where T : VolumeComponent
        {
            if (profile.TryGet(out T existing) && existing != null)
            {
                existing.active = true;
                return existing;
            }

            return profile.Add<T>(setOverrides);
        }

        /// <summary>
        /// Ensures the scene volume uses the project profile and that the profile actually carries
        /// the post-process overrides HDRP needs. Adds components rather than overwriting the
        /// existing PhysicallyBasedSky / VisualEnvironment / Fog authoring.
        /// </summary>
        private static void ConfigureProfileVolume()
        {
            var profile = AssetDatabase.LoadAssetAtPath<VolumeProfile>(ProfilePath);
            if (profile == null)
            {
                Debug.LogError("[WhisperingWilds] Missing HDRP volume profile at " + ProfilePath +
                               ". Lighting post-process overrides were skipped.");
                return;
            }

            // Tonemapping: the profile had none, so HDR output was never tone mapped.
            var tonemapping = Ensure<Tonemapping>(profile);
            tonemapping.active = true;
            tonemapping.mode.overrideState = true;
            tonemapping.mode.value = TonemappingMode.ACES;
            tonemapping.useFullACES.overrideState = true;
            tonemapping.useFullACES.value = true;

            // Exposure: automatic with a small positive compensation lifts the whole corridor
            // without touching a single material albedo.
            var exposure = Ensure<Exposure>(profile);
            exposure.active = true;
            exposure.mode.overrideState = true;
            exposure.mode.value = ExposureMode.Automatic;
            exposure.meteringMode.overrideState = true;
            exposure.meteringMode.value = MeteringMode.CenterWeighted;
            exposure.luminanceSource.overrideState = true;
            exposure.luminanceSource.value = LuminanceSource.ColorBuffer;
            exposure.compensation.overrideState = true;
            exposure.compensation.value = 0.55f;

            // Coastal haze. Distance fog only; volumetric fog stays off for the Step 9 perf budget.
            var fog = Ensure<UnityEngine.Rendering.HighDefinition.Fog>(profile);
            fog.active = true;
            fog.enabled.overrideState = true;
            fog.enabled.value = true;
            fog.colorMode.overrideState = true;
            fog.colorMode.value = FogColorMode.SkyColor;
            fog.meanFreePath.overrideState = true;
            fog.meanFreePath.value = 220f;
            fog.baseHeight.overrideState = true;
            fog.baseHeight.value = 0f;
            fog.maximumHeight.overrideState = true;
            fog.maximumHeight.value = 45f;
            fog.enableVolumetricFog.overrideState = true;
            fog.enableVolumetricFog.value = false;

            EditorUtility.SetDirty(profile);

            var volume = FindOrCreateVolume();
            volume.isGlobal = true;
            volume.priority = 0f;
            volume.weight = 1f;
            volume.sharedProfile = profile;

            Debug.Log("[WhisperingWilds] HDRP volume bound to " + volume.name +
                      " using " + ProfilePath + ".");
        }

        private static Volume FindOrCreateVolume()
        {
            foreach (var v in UnityEngine.Object.FindObjectsByType<Volume>(FindObjectsSortMode.None))
            {
                if (v.isGlobal) return v;
            }

            var root = GameObject.Find(RootName);
            if (root == null) root = new GameObject(RootName);

            var go = new GameObject("Chennai_SkyAndFog_Volume");
            go.transform.SetParent(root.transform, false);
            var volume = go.AddComponent<Volume>();
            volume.isGlobal = true;
            return volume;
        }

        /// <summary>
        /// Built-in-pipeline fallback only. Under HDRP the ambient probe comes from the sky via
        /// VisualEnvironment, so these values are kept sane but are not the scene's light source.
        /// </summary>
        private static void ConfigureRenderSettingsFallback(Light sun)
        {
            RenderSettings.sun = sun;

            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.55f, 0.68f, 0.85f);
            RenderSettings.ambientEquatorColor = new Color(0.62f, 0.60f, 0.52f);
            RenderSettings.ambientGroundColor = new Color(0.28f, 0.24f, 0.20f);

            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = new Color(0.72f, 0.76f, 0.80f);
            RenderSettings.fogDensity = 0.006f;
        }
    }
}