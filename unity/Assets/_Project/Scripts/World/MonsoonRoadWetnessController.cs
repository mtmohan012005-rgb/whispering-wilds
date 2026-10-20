using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Dynamically simulates physical moisture, specular puddles, and friction loss
    /// across Chennai George Town asphalt roads based on active monsoonal weather.
    /// Emulates real-world optics: wet surfaces darken in albedo, increase specular gloss,
    /// and drop physical friction coefficients.
    /// </summary>
    [DisallowMultipleComponent]
    public class MonsoonRoadWetnessController : MonoBehaviour
    {
        [Header("Target Materials")]
        [SerializeField] private Renderer[] asphaltRoadRenderers;
        [SerializeField] private Collider[] roadColliders;

        [Header("Dry vs Wet Optical Parameters")]
        [Range(0f, 1f)] [SerializeField] private float drySmoothness = 0.18f;
        [Range(0f, 1f)] [SerializeField] private float wetSmoothness = 0.88f;
        [Range(0f, 1f)] [SerializeField] private float dryAlbedoMultiplier = 1.0f;
        [Range(0f, 1f)] [SerializeField] private float wetAlbedoMultiplier = 0.78f; // Water absorption darkening

        [Header("Physical Materials")]
        [SerializeField] private PhysicsMaterial dryAsphaltPhysics;
        [SerializeField] private PhysicsMaterial wetAsphaltPhysics;

        [Header("Wetness State")]
        [SerializeField] [Range(0f, 1f)] private float currentWetness = 0f;
        [SerializeField] private float wetnessAccumulationRate = 0.08f;
        [SerializeField] private float dryDryingRate = 0.03f;

        private MaterialPropertyBlock propBlock;
        private static readonly int SmoothnessProp = Shader.PropertyToID("_Smoothness");
        private static readonly int ColorProp = Shader.PropertyToID("_BaseColor");

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBootstrapChennaiRoads()
        {
            var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
            if (activeScene.name.Contains("Chennai") || activeScene.name.Contains("02_"))
            {
                if (FindFirstObjectByType<MonsoonRoadWetnessController>() == null)
                {
                    GameObject bootObj = new GameObject("Monsoon_RoadWetness_Engine");
                    bootObj.AddComponent<MonsoonRoadWetnessController>();
                }
            }
        }

        void Awake()
        {
            propBlock = new MaterialPropertyBlock();

            if (asphaltRoadRenderers == null || asphaltRoadRenderers.Length == 0)
            {
                asphaltRoadRenderers = GetComponentsInChildren<MeshRenderer>();
                if (asphaltRoadRenderers.Length == 0)
                {
                    var allRenderers = FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None);
                    var roadList = new System.Collections.Generic.List<Renderer>();
                    foreach (var r in allRenderers)
                    {
                        string n = r.name.ToLower();
                        if (n.Contains("road") || n.Contains("asphalt") || n.Contains("street") || n.Contains("ground"))
                            roadList.Add(r);
                    }
                    asphaltRoadRenderers = roadList.ToArray();
                }
            }
            if (roadColliders == null || roadColliders.Length == 0)
            {
                roadColliders = GetComponentsInChildren<Collider>();
            }
        }

        void Update()
        {
            float targetWetness = 0f;
            if (WeatherSystem.Instance != null)
            {
                WeatherType current = WeatherSystem.Instance.CurrentWeather;
                if (current == WeatherType.HeavyRain || current == WeatherType.Thunderstorm)
                    targetWetness = 1.0f;
                else if (current == WeatherType.LightRain)
                    targetWetness = 0.55f;
            }

            // Smooth accumulation and evaporation curves
            float rate = (targetWetness > currentWetness) ? wetnessAccumulationRate : dryDryingRate;
            currentWetness = Mathf.MoveTowards(currentWetness, targetWetness, rate * Time.deltaTime);

            ApplyWetnessToShaders();
            ApplyWetnessToColliders();
        }

        private void ApplyWetnessToShaders()
        {
            if (asphaltRoadRenderers == null) return;

            float currentSmooth = Mathf.Lerp(drySmoothness, wetSmoothness, currentWetness);
            Color albedoTint = Color.Lerp(Color.white * dryAlbedoMultiplier, Color.white * wetAlbedoMultiplier, currentWetness);
            albedoTint.a = 1.0f;

            foreach (Renderer rend in asphaltRoadRenderers)
            {
                if (rend == null) continue;
                rend.GetPropertyBlock(propBlock);
                propBlock.SetFloat(SmoothnessProp, currentSmooth);
                propBlock.SetColor(ColorProp, albedoTint);
                rend.SetPropertyBlock(propBlock);
            }
        }

        private void ApplyWetnessToColliders()
        {
            if (roadColliders == null) return;

            PhysicsMaterial activeMaterial = (currentWetness > 0.4f) ? wetAsphaltPhysics : dryAsphaltPhysics;
            if (activeMaterial == null) return;

            foreach (Collider col in roadColliders)
            {
                if (col != null && col.material != activeMaterial)
                {
                    col.material = activeMaterial;
                }
            }
        }
    }
}
