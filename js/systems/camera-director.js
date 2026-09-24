/**
 * The Whispering Wilds (Kaattu Vazhi) - Camera Director
 * Controls cinematic framing, shot transitions, and camera movement during cutscenes.
 * Seamlessly integrates with ThreeCamera and restores previous gameplay camera state upon completion.
 */

class CameraDirector {
  constructor(threeCamera, threeWorld) {
    if (threeCamera && typeof threeCamera === 'function') {
      threeCamera = (window.threeWorld && window.threeWorld.cameraController) || null;
    }
    this.threeCamera = threeCamera;
    this.threeWorld = threeWorld;
    this.isActive = false;

    // Saved gameplay state for restoration
    this.savedState = {
      mode: 'gameplay',
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fov: 60
    };

    // Current cinematic camera tracking
    this.currentPos = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
    this.startPos = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    this.destPos = new THREE.Vector3();
    this.destTarget = new THREE.Vector3();

    this.transitionTime = 0;
    this.transitionDuration = 1.0;
    this.isInterpolating = false;

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDecay = 2.5;

    this.activeShotType = 'MEDIUM';
    this.currentTargetEntity = null;
  }

  startCinematic(initialShot = 'MEDIUM', targetEntity = null) {
    this.isActive = true;

    // Resolve live camera if not bound at construction
    if (!this.threeCamera || !this.threeCamera.camera) {
      if (window.threeWorld && window.threeWorld.cameraController) {
        this.threeCamera = window.threeWorld.cameraController;
      }
    }

    if (this.threeCamera && this.threeCamera.camera) {
      // Cache previous gameplay camera state
      this.savedState.mode = this.threeCamera.mode;
      this.savedState.pos.copy(this.threeCamera.camera.position);
      this.savedState.target.copy(this.threeCamera.currentTarget || new THREE.Vector3());
      this.savedState.fov = this.threeCamera.camera.fov;

      this.currentPos.copy(this.savedState.pos);
      this.currentTarget.copy(this.savedState.target);
    } else {
      this.currentPos.set(0, 10, 20);
      this.currentTarget.set(0, 1.5, 0);
    }

    this.setShot(initialShot, targetEntity, 0.8);
    console.log(`[CameraDirector] Cinematic camera engaged: ${initialShot}`);
  }

  stopCinematic(duration = 1.0) {
    if (!this.isActive) return;

    if (!this.threeCamera || !this.threeCamera.camera) {
      this.isActive = false;
      return;
    }

    // Interpolate back to gameplay camera position
    this.moveTo(this.savedState.pos, this.savedState.target, duration, () => {
      this.isActive = false;
      if (this.threeCamera && this.threeCamera.camera) {
        this.threeCamera.mode = this.savedState.mode;
        this.threeCamera.camera.fov = this.savedState.fov;
        this.threeCamera.camera.updateProjectionMatrix();
      }
      console.log('[CameraDirector] Gameplay camera restored.');
    });
  }

  setShot(shotType, targetRef = 'player', duration = 1.0) {
    const shotPresets = (window.CINEMATIC_DATA && window.CINEMATIC_DATA.shotTypes) || {};
    const preset = shotPresets[shotType] || shotPresets.MEDIUM || { distance: 10, height: 4, pitch: -0.2, fov: 55 };

    this.activeShotType = shotType;
    const targetPos = this._resolveTargetPosition(targetRef);

    // Compute camera position relative to target
    const angle = 0.5; // Slightly offset angle for dramatic framing
    const camX = targetPos.x + Math.sin(angle) * preset.distance;
    const camZ = targetPos.z + Math.cos(angle) * preset.distance;
    const camY = targetPos.y + preset.height;

    const destCameraPos = new THREE.Vector3(camX, camY, camZ);
    const destTargetPos = new THREE.Vector3(targetPos.x, targetPos.y + 1.2, targetPos.z);

    if (preset.fov && this.threeCamera && this.threeCamera.camera) {
      this.threeCamera.camera.fov = preset.fov;
      this.threeCamera.camera.updateProjectionMatrix();
    }

    this.moveTo(destCameraPos, destTargetPos, duration);
  }

  moveTo(pos, target, duration = 1.0, onComplete = null) {
    this.startPos.copy(this.currentPos);
    this.startTarget.copy(this.currentTarget);
    this.destPos.copy(pos);
    this.destTarget.copy(target);

    this.transitionTime = 0;
    this.transitionDuration = Math.max(0.1, duration);
    this.isInterpolating = true;
    this.onCompleteCallback = onComplete;
  }

  shake(intensity = 0.5, duration = 0.8) {
    this.shakeIntensity = intensity;
    this.shakeDecay = intensity / Math.max(0.1, duration);
  }

  update(deltaTime) {
    if (!this.isActive) return;

    if (this.isInterpolating) {
      this.transitionTime += deltaTime;
      const t = Math.min(1.0, this.transitionTime / this.transitionDuration);
      // Smooth sinusoidal cubic easing
      const ease = 0.5 * (1.0 - Math.cos(Math.PI * t));

      this.currentPos.lerpVectors(this.startPos, this.destPos, ease);
      this.currentTarget.lerpVectors(this.startTarget, this.destTarget, ease);

      if (t >= 1.0) {
        this.isInterpolating = false;
        if (this.onCompleteCallback) {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb();
        }
      }
    }

    // Apply shake if active
    let shakeOffset = new THREE.Vector3();
    if (this.shakeIntensity > 0) {
      shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * deltaTime);
    }

    // Apply directly to Three.js camera
    if (this.threeCamera && this.threeCamera.camera) {
      this.threeCamera.camera.position.copy(this.currentPos).add(shakeOffset);
      this.threeCamera.camera.lookAt(this.currentTarget);
    }
  }

  _resolveTargetPosition(ref) {
    if (ref && typeof ref === 'object') {
      if (ref.position) return ref.position;
      if (typeof ref.x === 'number') return ref;
    }

    // If 'player', query GameState or ThreePlayer
    if (ref === 'player' || !ref) {
      if (window.ThreePlayer && window.ThreePlayer.position) {
        return window.ThreePlayer.position;
      }
      if (window.GameState && window.GameState.player) {
        return { x: window.GameState.player.x, y: 1.5, z: window.GameState.player.z };
      }
      return new THREE.Vector3(0, 1.5, 0);
    }

    // Named entities (e.g. 'murugan', 'waterwheel')
    if (typeof ref === 'string' && window.ThreeWorld && window.ThreeWorld.namedLocations) {
      const loc = window.ThreeWorld.namedLocations[ref];
      if (loc) return loc;
    }

    return new THREE.Vector3(0, 1.5, 0);
  }
}

window.CameraDirector = CameraDirector;
