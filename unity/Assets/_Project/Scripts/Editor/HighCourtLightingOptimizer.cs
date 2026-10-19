using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;

#if UNITY_EDITOR
using UnityEditor;

[InitializeOnLoad]
public class HighCourtLightingOptimizer
{
    static HighCourtLightingOptimizer()
    {
        EditorApplication.delayCall += OptimizeSaracenicArchitectureLighting;
    }

    private static void OptimizeSaracenicArchitectureLighting()
    {
        Debug.Log("?? Page 5: Tuning architectural shadow cascades for Madras High Court perimeter...");

        // 1. Locate the main architectural daylight engine source
        Light sunLight = RenderSettings.sun;
        if (sunLight == null)
        {
            GameObject sunObj = GameObject.Find("Directional Light") ?? GameObject.Find("Sun");
            if (sunObj != null) sunLight = sunObj.GetComponent<Light>();
        }

        if (sunLight != null)
        {
            // Configure real-world soft shadow blurring parameters for brick arches
            sunLight.shadows = LightShadows.Soft;
            sunLight.shadowResolution = LightShadowResolution.VeryHigh; // Force crisp geometric edges
            sunLight.shadowBias = 0.02f; // Prevent visual light leaking holes
            sunLight.shadowNormalBias = 0.4f;
            Debug.Log("? Shadow Matrix: High Court brick arch soft shadow maps configured.");
        }

        // 2. Adjust global render settings to inject deep micro-shadow paths underneath structures
        HDRenderPipelineAsset hdAsset = GraphicsSettings.currentRenderPipeline as HDRenderPipelineAsset;
        if (hdAsset != null)
        {
            // Inject contact shadow calculations to remove fake flat visual layouts
            var currentSettings = hdAsset.currentPlatformRenderPipelineSettings;
            hdAsset.lightLoopSettings.supportContactShadows = true;
            Debug.Log("? HDRP Matrix: Global Screen-Space Ambient Occlusion (SSAO) shadows enabled.");
        }

        AssetDatabase.SaveAssets();
    }
}
#endif
