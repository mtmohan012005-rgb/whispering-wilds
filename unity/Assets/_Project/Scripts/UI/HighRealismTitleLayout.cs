using UnityEngine;
using TMPro;

public class HighRealismTitleLayout : MonoBehaviour
{
    [Header("UI Text Adjustments")]
    public RectTransform newGameButton;
    public RectTransform loadGameButton;
    public RectTransform titleText;
    
    [Header("Natural Atmosphere Anchors")]
    private Light ambientSunLight;
    private Camera mainViewportCamera;

    void Awake()
    {
        ApplyCleanTextSpacing();
        InjectNaturalAtmosphere();
    }

    private void ApplyCleanTextSpacing()
    {
        // Fix overlapping bugs by explicitly pushing text apart on the Y axis
        if (newGameButton != null)
        {
            newGameButton.anchoredPosition = new Vector2(0, -60f);
            newGameButton.sizeDelta = new Vector2(300f, 60f);
        }
        if (loadGameButton != null)
        {
            loadGameButton.anchoredPosition = new Vector2(0, -140f);
            loadGameButton.sizeDelta = new Vector2(300f, 60f);
        }
        if (titleText != null)
        {
            titleText.anchoredPosition = new Vector2(0, 180f);
        }
        Debug.Log("?? Page 1: Text positioning separated successfully.");
    }

    private void InjectNaturalAtmosphere()
    {
        // Kill the flat, ugly brown solid color sweep look
        mainViewportCamera = Camera.main;
        if (mainViewportCamera != null)
        {
            mainViewportCamera.clearFlags = CameraClearFlags.Skybox; // Switch to dynamic natural skybox
            mainViewportCamera.backgroundColor = new Color(0.15f, 0.25f, 0.35f); // Natural dawn fallback blue
            mainViewportCamera.allowHDR = true; // High Dynamic Range for sunlight bloom
        }

        // Generate dynamic dawn sunlight to simulate real-world morning hours
        GameObject sunObj = GameObject.Find("Directional Light") ?? new GameObject("Natural_Sun");
        ambientSunLight = sunObj.GetComponent<Light>() ?? sunObj.AddComponent<Light>();
        ambientSunLight.type = LightType.Directional;
        ambientSunLight.intensity = 120000f; // High lux value matching real-world outdoor environment sunlight
        ambientSunLight.color = new Color(1.0f, 0.88f, 0.72f); // Warm natural golden hour tint
        ambientSunLight.shadows = LightShadows.Soft; // Enable blurry realistic branch/object shadows
        
        sunObj.transform.rotation = Quaternion.Euler(15f, 45f, 0f); // Low angle morning sun rays
        Debug.Log("?? Page 1: Warm dawn atmospheric sun layers activated.");
    }
}
