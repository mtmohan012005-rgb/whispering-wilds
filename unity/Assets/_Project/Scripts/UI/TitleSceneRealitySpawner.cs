using UnityEngine;

public class TitleSceneRealitySpawner : MonoBehaviour
{
    [Header("Real World 3D Models")]
    private GameObject playerInstance;
    private GameObject environmentInstance;
    private GameObject vehicleInstance;

    void Start()
    {
        Debug.Log("??? System step: Force injecting real world physical entities into menu scene view...");

        // 1. Force load the authentic 3D player mesh (cotton veshti rigged asset)
        GameObject playerAsset = Resources.Load<GameObject>("Assets/_Project/Art/Models/Characters/Player/player");
        if (playerAsset != null)
        {
            playerInstance = Instantiate(playerAsset, new Vector3(0, 0, 2f), Quaternion.Euler(0, 180f, 0));
            playerInstance.name = "RealWorld_Player_Mesh";
        }

        // 2. Force load the signature yellow-and-black Chennai Auto rickshaw asset right into the camera background
        GameObject autoAsset = Resources.Load<GameObject>("Assets/_Project/Art/Models/Vehicles/auto_rickshaw/chennai_auto");
        if (autoAsset != null)
        {
            vehicleInstance = Instantiate(autoAsset, new Vector3(3.5f, -0.5f, 4.5f), Quaternion.Euler(0, -45f, 0));
            vehicleInstance.name = "RealWorld_ChennaiAuto_Mesh";
        }

        // 3. Force load Murugan's authentic wooden Tea Kadai Stall asset to fill the scene with real world context
        GameObject stallAsset = Resources.Load<GameObject>("Assets/_Project/Art/Models/Architecture/chennai/tea_kadai_stall");
        if (stallAsset != null)
        {
            environmentInstance = Instantiate(stallAsset, new Vector3(-4f, -0.5f, 5f), Quaternion.Euler(0, 35f, 0));
            environmentInstance.name = "RealWorld_TeaKadai_Mesh";
        }

        // 4. Force position the camera so it doesn't look at empty void space
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.transform.position = new Vector3(0, 1.2f, 0);
            mainCam.transform.rotation = Quaternion.Euler(5f, 0, 0);
            mainCam.clearFlags = CameraClearFlags.Skybox; // Clear out the ugly solid brown canvas block
        }
    }
}
