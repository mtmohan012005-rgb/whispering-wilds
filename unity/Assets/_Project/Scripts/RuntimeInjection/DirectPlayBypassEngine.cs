using UnityEngine;
using UnityEngine.SceneManagement;

public class DirectPlayBypassEngine : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeOnLoadMethodTime.BeforeSceneLoad)]
    static void ForceBypassBrokenMenu()
    {
        Debug.Log("?? AI PowerShell Bridge: Bypassing broken 2D title menu assets...");
        
        // Count total scenes registered in your Unity deployment array manifest
        int sceneCount = SceneManager.sceneCountInBuildSettings;
        
        if (sceneCount > 1)
        {
            // Index 0 is the broken menu, Index 1 is your actual 3D real-world gameplay environment map
            Debug.Log("?? Loading Real-World 3D Gameplay Map (Scene 1)...");
            SceneManager.LoadScene(1);
        }
        else
        {
            Debug.LogWarning("?? Only 1 scene registered in build matrix. Creating dynamic physical playground context instead...");
            GameObject runtimeBootstrapper = new GameObject("RealWorld_Physics_Bootstrap");
            runtimeBootstrapper.AddComponent<DynamicPlaygroundBuilder>();
            DontDestroyOnLoad(runtimeBootstrapper);
        }
    }
}

public class DynamicPlaygroundBuilder : MonoBehaviour
{
    void Start()
    {
        // Force spawn standard physical geometry so your assets aren't floating in a void
        GameObject landscapePlane = GameObject.CreatePrimitive(PrimitiveType.Plane);
        landscapePlane.transform.position = Vector3.zero;
        landscapePlane.transform.localScale = new Vector3(20f, 1f, 20f);
        landscapePlane.name = "RealWorld_Ground_Plane";

        // Instantly force-configure natural global lighting assets
        GameObject daylightObj = new GameObject("Natural_Sun_Source");
        Light sunlight = daylightObj.AddComponent<Light>();
        sunlight.type = LightType.Directional;
        sunlight.intensity = 130000f; // Authentic lux value for real-world ambient environment lighting
        sunlight.color = new Color(1.0f, 0.93f, 0.85f);
        sunlight.shadows = LightShadows.Soft;
        daylightObj.transform.rotation = Quaternion.Euler(35f, 45f, 0f);

        // Attempt runtime binding of your physical player character model
        GameObject characterPrefab = Resources.Load<GameObject>("Assets/_Project/Art/Models/Characters/Player/player") 
                                  ?? Resources.Load<GameObject>("player");
        if (characterPrefab != null)
        {
            GameObject livePlayer = Instantiate(characterPrefab, new Vector3(0f, 0.5f, 0f), Quaternion.identity);
            livePlayer.name = "RealWorld_ActivePlayer_Entity";
            
            // Instantly drop camera rigging to follow character boundaries
            Camera.main.transform.position = new Vector3(0f, 2.5f, -6f);
            Camera.main.transform.rotation = Quaternion.Euler(15f, 0f, 0f);
            Camera.main.clearFlags = CameraClearFlags.Skybox;
        }
    }
}
