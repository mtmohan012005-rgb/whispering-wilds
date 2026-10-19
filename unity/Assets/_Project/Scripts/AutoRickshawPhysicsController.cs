using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class AutoRickshawPhysicsController : MonoBehaviour
{
    private Rigidbody rb;
    
    [Header("Real-World Center of Mass Configuration")]
    public Vector3 centerOfMassOffset = new Vector3(0, -0.6f, 0);
    public float antiRollForce = 4000f;
    public float downforceConstant = 50f;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.centerOfMass = centerOfMassOffset;
    }

    void FixedUpdate()
    {
        #if UNITY_6000_0_OR_NEWER
        rb.AddForce(-transform.up * downforceConstant * rb.linearVelocity.magnitude);
        #else
        rb.AddForce(-transform.up * downforceConstant * rb.velocity.magnitude);
        #endif
        
        RaycastHit hit;
        if (Physics.Raycast(transform.position, -transform.up, out hit, 2.0f))
        {
            if (Mathf.Abs(transform.rotation.eulerAngles.z) > 12f)
            {
                rb.AddTorque(transform.forward * -transform.rotation.eulerAngles.z * antiRollForce * Time.fixedDeltaTime);
            }
        }
    }
}
