using UnityEngine;

public class MonsoonalWaterSystem : MonoBehaviour
{
    [Header("Page 4: Catamaran Buoyancy & Wave Parameters")]
    public float fluidDensity = 1.2f;
    public float waterDrag = 2.5f;
    public float waveAmplitude = 0.2f;
    public float waveSpeed = 1.5f;

    [Header("Page 4: George Town Rain Puddle Settings")]
    public bool enableDynamicPuddles = true;
    [Range(0, 1)] public float rainIntensity = 0.85f;

    private Rigidbody catamaranRigidbody;
    private float baseWaterLine = 0.0f;

    void Start()
    {
        Debug.Log("?? Page 4 Engine Initialized: Mapping fluid friction constants to catamaran chassis.");
        
        // Find the catamaran entity in the current scene workspace
        GameObject boat = GameObject.Find("RealWorld_Catamaran_Mesh") ?? GameObject.Find("catamaran");
        if (boat != null)
        {
            catamaranRigidbody = boat.GetComponent<Rigidbody>() ?? boat.AddComponent<Rigidbody>();
#if UNITY_6000_0_OR_NEWER
            catamaranRigidbody.linearDamping = waterDrag;
            catamaranRigidbody.angularDamping = 3.0f;
#else
            catamaranRigidbody.drag = waterDrag;
            catamaranRigidbody.angularDrag = 3.0f;
#endif
        }
    }

    void FixedUpdate()
    {
        if (catamaranRigidbody == null) return;

        // Calculate dynamic monsoonal water ripples over time using a fluid sine calculation
        float complexWaveHeight = baseWaterLine + (Mathf.Sin(Time.time * waveSpeed + catamaranRigidbody.transform.position.x) * waveAmplitude);

        // Calculate buoyancy displacement vectors matching Archimedes real-world physics
        if (catamaranRigidbody.transform.position.y < complexWaveHeight)
        {
            float displacementDepth = complexWaveHeight - catamaranRigidbody.transform.position.y;
            Vector3 buoyancyForce = Vector3.up * displacementDepth * 15f * fluidDensity;
            catamaranRigidbody.AddForce(buoyancyForce, ForceMode.Acceleration);
            
            // Force the boat mesh to tilt naturally along wave patterns
            float dynamicRocking = Mathf.Cos(Time.time * waveSpeed) * 1.5f;
            catamaranRigidbody.AddTorque(new Vector3(dynamicRocking, 0, 0), ForceMode.Acceleration);
        }
    }

    void Update()
    {
        if (enableDynamicPuddles)
        {
            // Dynamic render calculation simulating rain puddles spreading across asphalt surfaces
            Shader.SetGlobalFloat("_RainIntensity", rainIntensity);
            Shader.SetGlobalFloat("_PuddleWetness", Mathf.PingPong(Time.time * 0.05f, rainIntensity));
        }
    }
}
