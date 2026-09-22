/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Camera Controller
 * Supports smooth third-person isometric tracking and macro-map bird's-eye regional view
 */

class ThreeCamera {
    constructor(aspect, container) {
        this.fov = 60; // 60 degree FOV matching Three.js setup boilerplate
        this.camera = new THREE.PerspectiveCamera(this.fov, aspect, 0.5, 1000);
        this.container = container;

        // Modes: 'gameplay' | 'macro'
        this.mode = 'gameplay';

        // Camera offset relative to player in gameplay mode
        this.gameplayOffset = new THREE.Vector3(-22, 19, 22);
        this.gameplayTargetOffset = new THREE.Vector3(0, 2.0, 0);

        // Macro-map view surveying all Tamil Nadu (from Chennai to Nilgiris)
        this.macroPosition = new THREE.Vector3(0, 220, 160);
        this.macroTarget = new THREE.Vector3(0, 15, 0);

        // Current actual position and look target
        this.currentPos = new THREE.Vector3(-250 + this.gameplayOffset.x, 20, this.gameplayOffset.z);
        this.currentTarget = new THREE.Vector3(-250, 2, 0);

        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentTarget);

        // Smooth transition animation state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0.85; // seconds
        this.startPos = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();
        this.startLook = new THREE.Vector3();
        this.targetLook = new THREE.Vector3();

        // Mouse pan / orbit controls
        this.isMouseDown = false;
        this.mousePrevX = 0;
        this.mousePrevY = 0;
        this.orbitAngleH = 0;
        this.orbitAngleV = 0;

        if (this.container) {
            this.container.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.isMouseDown = true;
                    this.mousePrevX = e.clientX;
                    this.mousePrevY = e.clientY;
                }
            });

            window.addEventListener('mouseup', () => { this.isMouseDown = false; });
            window.addEventListener('mousemove', (e) => {
                if (!this.isMouseDown) return;
                const dx = e.clientX - this.mousePrevX;
                const dy = e.clientY - this.mousePrevY;
                this.mousePrevX = e.clientX;
                this.mousePrevY = e.clientY;

                this.orbitAngleH -= dx * 0.006;
                this.orbitAngleV = Math.max(-0.4, Math.min(0.6, this.orbitAngleV + dy * 0.005));
            });
        }
    }

    setMode(newMode) {
        if (newMode === this.mode && !this.isTransitioning) return;

        this.startPos.copy(this.camera.position);
        this.startLook.copy(this.currentTarget);
        this.mode = newMode;
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }

    toggleMacroView() {
        this.setMode(this.mode === 'gameplay' ? 'macro' : 'gameplay');
        return this.mode;
    }

    isMacro() {
        return this.mode === 'macro';
    }

    update(playerPos, deltaTime) {
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            const t = Math.min(1.0, this.transitionProgress);
            // Sinusoidal ease in/out
            const ease = 0.5 * (1.0 - Math.cos(Math.PI * t));

            let destPos, destLook;
            if (this.mode === 'macro') {
                destPos = this.macroPosition;
                destLook = this.macroTarget;
            } else {
                destPos = new THREE.Vector3(
                    playerPos.x + this.gameplayOffset.x,
                    playerPos.y + this.gameplayOffset.y,
                    playerPos.z + this.gameplayOffset.z
                );
                destLook = new THREE.Vector3(
                    playerPos.x + this.gameplayTargetOffset.x,
                    playerPos.y + this.gameplayTargetOffset.y,
                    playerPos.z + this.gameplayTargetOffset.z
                );
            }

            this.currentPos.lerpVectors(this.startPos, destPos, ease);
            this.currentTarget.lerpVectors(this.startLook, destLook, ease);

            this.camera.position.copy(this.currentPos);
            this.camera.lookAt(this.currentTarget);

            if (t >= 1.0) {
                this.isTransitioning = false;
            }
        } else {
            // Normal active mode tracking
            if (this.mode === 'gameplay') {
                // Orbit-adjusted follow position
                const rotatedOffset = this.gameplayOffset.clone();
                rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitAngleH);
                rotatedOffset.y += this.orbitAngleV * 14.0;

                const desiredPos = new THREE.Vector3(
                    playerPos.x + rotatedOffset.x,
                    playerPos.y + rotatedOffset.y,
                    playerPos.z + rotatedOffset.z
                );
                const desiredTarget = new THREE.Vector3(
                    playerPos.x + this.gameplayTargetOffset.x,
                    playerPos.y + this.gameplayTargetOffset.y,
                    playerPos.z + this.gameplayTargetOffset.z
                );

                // Smooth dampening
                const lerpFactor = Math.min(1.0, deltaTime * 5.5);
                this.currentPos.lerp(desiredPos, lerpFactor);
                this.currentTarget.lerp(desiredTarget, lerpFactor);

                this.camera.position.copy(this.currentPos);
                this.camera.lookAt(this.currentTarget);
            } else {
                // Macro view subtle idle drift
                this.currentPos.lerp(this.macroPosition, deltaTime * 3.0);
                this.currentTarget.lerp(this.macroTarget, deltaTime * 3.0);

                this.camera.position.copy(this.currentPos);
                this.camera.lookAt(this.currentTarget);
            }
        }
    }

    handleResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}

window.ThreeCamera = ThreeCamera;
