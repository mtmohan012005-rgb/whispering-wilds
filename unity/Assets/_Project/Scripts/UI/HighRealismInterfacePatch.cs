using UnityEngine;
using TMPro;

public class HighRealismInterfacePatch : MonoBehaviour
{
    [Header("Target Canvas Mappings")]
    public GameObject newGameButtonObj;
    public GameObject loadGameButtonObj;
    public GameObject titleTextObj;

    void Awake()
    {
        ExecuteStructuralLayoutFix();
        Force3DWorldInstantiation();
    }

    private void ExecuteStructuralLayoutFix()
    {
        // Programmatically search for targets if references are unassigned in metadata
        if (!newGameButtonObj) newGameButtonObj = GameObject.Find("New Game") ?? GameObject.Find("NewGameButton");
        if (!loadGameButtonObj) loadGameButtonObj = GameObject.Find("Load Game") ?? GameObject.Find("LoadGameButton");
        if (!titleTextObj) titleTextObj = GameObject.Find("Title") ?? GameObject.Find("TitleText");

        // Force slice apart overlapping elements on the Y-axis layout matrix
        if (newGameButtonObj && newGameButtonObj.TryGetComponent<RectTransform>(out var newRT))
        {
            newRT.anchoredPosition = new Vector2(0, -60f);
            newRT.sizeDelta = new Vector2(300f, 60f);
        }
        if (loadGameButtonObj && loadGameButtonObj.TryGetComponent<RectTransform>(out var loadRT))
        {
            loadRT.anchoredPosition = new Vector2(0, -140f);
            loadRT.sizeDelta = new Vector2(300f, 60f);
        }
        if (titleTextObj && titleTextObj.TryGetComponent<RectTransform>(out var titleRT))
        {
            titleRT.anchoredPosition = new Vector2(0, 180f);
        }
    }

    private void Force3DWorldInstantiation()
    {
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.clearFlags = CameraClearFlags.Skybox; // Instantly destroy the solid flat olive-brown void
            mainCam.allowHDR = true;
            mainCam.transform.position = new Vector3(0, 1.2f, -4f);
            mainCam.transform.rotation = Quaternion.Euler(8f, 0, 0);
        }

        // Initialize production daylight sun array with real-world lux constants
        GameObject dynamicSun = GameObject.Find("Directional Light") ?? new GameObject("Realistic_Sun_Source");
        Light sunLight = dynamicSun.GetComponent<Light>() ?? dynamicSun.AddComponent<Light>();
        sunLight.type = LightType.Directional;
        sunLight.intensity = 130000f; // Exact outdoor environment standard daylight intensity
        sunLight.color = new Color(1.0f, 0.92f, 0.83f); // Warm natural daylight color temperature
        sunLight.shadows = LightShadows.Soft;
        dynamicSun.transform.rotation = Quaternion.Euler(25f, 45f, 0f);

        Debug.Log("?? Reality Engine: Flat colors dropped. 3D environmental lighting matrix initialized.");
    }
}
