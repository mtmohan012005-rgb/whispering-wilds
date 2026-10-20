using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(NavMeshAgent))]
public class NilgiriTahrBehavior : MonoBehaviour
{
    [Header("Real-World Sensory Parameters")]
    public float alertRadius = 15f;
    public float fleeSpeed = 7f;
    public float calmWanderSpeed = 2f;
    public float wanderRadius = 30f;

    [Header("Physics & Gravity Settings")]
    public LayerMask mountainGroundLayer;
    private NavMeshAgent agent;
    private Transform playerTransform;
    private bool isAlerted = false;
    private float wanderTimer;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        agent.speed = calmWanderSpeed;
        wanderTimer = Random.Range(3f, 7f);

        // Safely map target tracking to the real-world active player entity
        GameObject playerObj = GameObject.Find("RealWorld_ActivePlayer_Entity") ?? GameObject.FindGameObjectWithTag("Player");
        if (playerObj != null) playerTransform = playerObj.transform;
    }

    void Update()
    {
        EvaluateSensoryBoundaries();
        
        if (isAlerted && playerTransform != null)
        {
            ExecuteFleeTrajectory();
        }
        else
        {
            ExecuteNaturalWanderRoutine();
        }

        ApplyStrictSlopeGrounding();
    }

    private void EvaluateSensoryBoundaries()
    {
        if (playerTransform == null) return;

        float spatialDistance = Vector3.Distance(transform.position, playerTransform.position);
        
        // Triggers immediate fright reactions if player sprints into their alert radius
        if (spatialDistance <= alertRadius)
        {
            if (!isAlerted)
            {
                isAlerted = true;
                agent.speed = fleeSpeed;
                Debug.Log("?? Wildlife AI: Nilgiri Tahr alerted by player footsteps. Executing retreat parameters.");
            }
        }
        else if (isAlerted && spatialDistance > alertRadius * 2f)
        {
            isAlerted = false;
            agent.speed = calmWanderSpeed;
            Debug.Log("?? Wildlife AI: Distance clear. Nilgiri Tahr returning to calm montane grazing state.");
        }
    }

    private void ExecuteFleeTrajectory()
    {
        // Calculate a perfect physical direction vector directly opposite to the player's presence
        Vector3 retreatDirection = transform.position - playerTransform.position;
        Vector3 targetFleePosition = transform.position + retreatDirection.normalized * 12f;

        if (NavMesh.SamplePosition(targetFleePosition, out NavMeshHit locationHit, 15f, NavMesh.AllAreas))
        {
            agent.SetDestination(locationHit.position);
        }
    }

    private void ExecuteNaturalWanderRoutine()
    {
        wanderTimer -= Time.deltaTime;
        if (wanderTimer <= 0f)
        {
            // Pick a completely random physical node point within the wander parameters range
            Vector3 randomDirection = Random.insideUnitSphere * wanderRadius;
            randomDirection += transform.position;

            if (NavMesh.SamplePosition(randomDirection, out NavMeshHit pathHit, wanderRadius, NavMesh.AllAreas))
            {
                agent.SetDestination(pathHit.position);
            }
            wanderTimer = Random.Range(5f, 12f);
        }
    }

    private void ApplyStrictSlopeGrounding()
    {
        // Force sample the high-altitude terrain profile beneath the animal asset mesh
        if (Physics.Raycast(transform.position + Vector3.up * 1.0f, Vector3.down, out RaycastHit hitInfo, 3.0f, mountainGroundLayer))
        {
            // Lock the animal mesh rotation matrix perfectly aligned to steep cliffs (no floating bugs)
            Quaternion targetSlopeOrientation = Quaternion.FromToRotation(Vector3.up, hitInfo.normal) * transform.rotation;
            transform.rotation = Quaternion.Slerp(transform.rotation, targetSlopeOrientation, Time.deltaTime * 6f);
        }
    }
}
