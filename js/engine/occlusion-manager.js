/**
 * The Whispering Wilds (Kaattu Vazhi) - Occlusion Manager
 * Coarse zone and bounding volume occlusion culling with frustum verification.
 * Avoids CPU-heavy per-mesh raycasts while culling objects hidden behind major landmarks.
 */

class OcclusionManager {
  constructor(sceneOrCamera, camera) {
    if (sceneOrCamera && (sceneOrCamera.isCamera || sceneOrCamera instanceof THREE.Camera)) {
      this.camera = sceneOrCamera;
      this.scene = camera || null;
    } else {
      this.scene = sceneOrCamera;
      this.camera = camera;
    }

    // Major occluder volumes (buildings, terrain ridges, monoliths)
    this.occluderBoxes = [
      // Madras High Court red brick complex
      { id: 'high_court_main', box: new THREE.Box3(new THREE.Vector3(-270, 0, -25), new THREE.Vector3(-220, 28, 25)) },
      // Chettinad heritage mansion
      { id: 'chettinad_mansion', box: new THREE.Box3(new THREE.Vector3(130, 0, -30), new THREE.Vector3(180, 22, 30)) },
      // Thanjavur granary & stone walls
      { id: 'thanjavur_granary', box: new THREE.Box3(new THREE.Vector3(140, 0, -35), new THREE.Vector3(190, 24, 35)) },
      // Mamallapuram monolithic coastal caves
      { id: 'mamallapuram_cave', box: new THREE.Box3(new THREE.Vector3(160, 0, -20), new THREE.Vector3(205, 30, 20)) },
      // Western Ghats mountain ridge
      { id: 'nilgiris_ridge', box: new THREE.Box3(new THREE.Vector3(210, 10, -50), new THREE.Vector3(265, 60, 50)) }
    ];

    // Frustum helper
    this.frustum = new THREE.Frustum();
    this.cameraViewProjectionMatrix = new THREE.Matrix4();

    // Throttling
    this.lastCheckTime = 0;
    this.checkInterval = 0.1; // 10 Hz
  }

  /**
   * Updates camera frustum and ensures proper frustumCulled flag on renderables
   */
  updateFrustum(camera = this.camera) {
    if (!camera) return;
    camera.updateMatrixWorld();
    this.cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);
  }

  /**
   * Verifies if an object's bounding sphere is within camera frustum
   */
  isInFrustum(boundingSphere) {
    if (!boundingSphere) return true;
    return this.frustum.intersectsSphere(boundingSphere);
  }

  isSphereVisible(center, radius = 1) {
    if (!this.camera) return true;
    this.updateFrustum(this.camera);
    const sphere = (center instanceof THREE.Sphere)
      ? center
      : new THREE.Sphere(center, radius);
    return this.frustum.intersectsSphere(sphere);
  }

  isBoxVisible(box) {
    if (!this.camera) return true;
    this.updateFrustum(this.camera);
    return this.frustum.intersectsBox(box);
  }

  /**
   * Checks if a target position is coarsely occluded behind an occluder box
   * relative to the camera position
   */
  isCoarselyOccluded(targetPos, cameraPos) {
    if (!targetPos || !cameraPos) return false;

    const camToTargetDist = cameraPos.distanceTo(targetPos);
    if (camToTargetDist < 15.0) return false; // Never occlude nearby objects

    // Ray segment from camera to target
    const ray = new THREE.Ray(cameraPos, new THREE.Vector3().subVectors(targetPos, cameraPos).normalize());

    for (let i = 0; i < this.occluderBoxes.length; i++) {
      const occluder = this.occluderBoxes[i];
      const intersectionPoint = ray.intersectBox(occluder.box, new THREE.Vector3());

      if (intersectionPoint) {
        const distToOccluder = cameraPos.distanceTo(intersectionPoint);
        // If occluder is between camera and target with a safety margin
        if (distToOccluder < camToTargetDist - 5.0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Enforces frustumCulled = true on all meshes in a hierarchy
   */
  enforceFrustumCulling(root) {
    if (!root) return;
    root.traverse(child => {
      if (child.isMesh) {
        child.frustumCulled = true;
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.OcclusionManager = OcclusionManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OcclusionManager };
}
