using UnityEngine;

public class CharacterAttirePhysicsManager : MonoBehaviour
{
    [Header("Cultural Garment Controls")]
    public Cloth targetVeshtiCloth;
    public float windTurbulenceMultiplier = 0.35f;

    private WindZone globalWindZone;

    void Start()
    {
        // Automatically isolate external weather parameters
        globalWindZone = FindFirstObjectByType<WindZone>();
        if (globalWindZone == null)
        {
            GameObject windObj = new GameObject("Dynamic_Monsoon_Wind");
            globalWindZone = windObj.AddComponent<WindZone>();
            globalWindZone.mode = WindZoneMode.Directional;
        }

        if (targetVeshtiCloth != null)
        {
            ConfigureDynamicClothConstraints();
        }
    }

    private void ConfigureDynamicClothConstraints()
    {
        // Enforce physical soft-body material weights matching real-world woven cotton fabric
        targetVeshtiCloth.clothSolverFrequency = 120f;
        targetVeshtiCloth.stretchingStiffness = 0.85f;
        targetVeshtiCloth.bendingStiffness = 0.7f;
        targetVeshtiCloth.useGravity = true;
        
        Debug.Log("?? Cloth Engine: Woven cotton physical structural constants successfully bound to character rig.");
    }

    void Update()
    {
        if (globalWindZone != null && targetVeshtiCloth != null)
        {
            // Simulate natural, chaotic gusts blowing across the garment mesh over time
            float dynamicGust = globalWindZone.windMain + Mathf.PingPong(Time.time * 1.5f, globalWindZone.windTurbulence);
            targetVeshtiCloth.externalAcceleration = globalWindZone.transform.forward * dynamicGust * windTurbulenceMultiplier;
        }
    }
}
