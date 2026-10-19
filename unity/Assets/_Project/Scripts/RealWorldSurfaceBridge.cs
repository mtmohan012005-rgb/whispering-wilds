using UnityEngine;

public class RealWorldSurfaceBridge : MonoBehaviour
{
    public PhysicsMaterial wetAsphaltMaterial;
    public PhysicsMaterial mountainRockMaterial;
    private CapsuleCollider playerCollider;

    void Start()
    {
        playerCollider = GetComponent<CapsuleCollider>();
    }

    public void AlterPhysicalState(string regionName)
    {
        if (playerCollider == null) return;

        switch (regionName.ToLower())
        {
            case "chennai":
                playerCollider.material = wetAsphaltMaterial;
                Debug.Log("Real-world physics switched: Low-friction monsoonal wet asphalt applied.");
                break;
            case "nilgiris":
                playerCollider.material = mountainRockMaterial;
                Debug.Log("Real-world physics switched: High-grip montane rock applied.");
                break;
            default:
                playerCollider.material = null;
                break;
        }
    }
}
