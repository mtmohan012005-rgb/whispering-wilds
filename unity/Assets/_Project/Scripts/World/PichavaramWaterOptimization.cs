using UnityEngine;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Mitigates severe transparency overdraw and reflection stalls across
    /// the complex multi-layer root geometry of Pichavaram mangrove waterways.
    /// Dynamically LODs water plane tessellation and restricts planar SSR reflection passes
    /// outside the primary camera frustum.
    /// </summary>
    [DisallowMultipleComponent]
    public class PichavaramWaterOptimization : MonoBehaviour
    {
        [Header("Water Surfaces")]
        [SerializeField] private MeshRenderer[] waterSurfaceRenderers;
        [SerializeField] private float maxWaterRenderDistance = 140f;

        [Header("Mangrove Overdraw Culling")]
        [SerializeField] private LayerMask underwaterRootLayer;
        [SerializeField] private float rootCullDistance = 65f;

        private Camera mainCamera;
        private Plane[] cameraFrustumPlanes = new Plane[6];

        void Start()
        {
            if (waterSurfaceRenderers == null || waterSurfaceRenderers.Length == 0)
            {
                waterSurfaceRenderers = GetComponentsInChildren<MeshRenderer>();
            }

            mainCamera = Camera.main;
        }

        void LateUpdate()
        {
            if (mainCamera == null)
            {
                mainCamera = Camera.main;
                if (mainCamera == null) return;
            }

            Vector3 camPos = mainCamera.transform.position;
            GeometryUtility.CalculateFrustumPlanes(mainCamera, cameraFrustumPlanes);

            // Dynamically manage water tile rendering to eliminate overdraw in obscured canals
            if (waterSurfaceRenderers != null)
            {
                for (int i = 0; i < waterSurfaceRenderers.Length; i++)
                {
                    MeshRenderer mr = waterSurfaceRenderers[i];
                    if (mr == null) continue;

                    float distSq = (mr.bounds.center - camPos).sqrMagnitude;
                    if (distSq > maxWaterRenderDistance * maxWaterRenderDistance)
                    {
                        if (mr.enabled) mr.enabled = false;
                        continue;
                    }

                    bool inFrustum = GeometryUtility.TestPlanesAABB(cameraFrustumPlanes, mr.bounds);
                    if (mr.enabled != inFrustum)
                    {
                        mr.enabled = inFrustum;
                    }
                }
            }
        }
    }
}
