/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Three.js 3D Open-World Orchestrator
 * Integrates procedural terrain, player controller, dynamic camera, weather, and shadow-casting lighting
 */

class ThreeWorld {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = canvas.parentElement;
        this.isActive = false;
        this.lastTime = performance.now();
        this.animationFrameId = null;

        // Input state
        this.inputState = { up: false, down: false, left: false, right: false };
        this.onTelemetryUpdate = null;

        // 1. WebGL Renderer
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        // 2. Scene (Night atmospheric tone from boilerplate)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0f19);

        // 3. Components
        this.terrain = new ThreeTerrain(this.scene);
        this.lighting = new ThreeLighting(this.scene);
        this.cameraController = new ThreeCamera(width / height, this.container);
        this.player = new ThreePlayer(this.scene, -250, 0);
        this.weather = new ThreeWeather(this.scene);

        // 4. Production Living World System (NPCs & Wildlife)
        if (typeof LivingWorldSystem !== 'undefined') {
            this.livingWorld = new LivingWorldSystem(this.scene, this.terrain);
            window.livingWorld = this.livingWorld;
        } else {
            this.livingWorld = null;
        }

        // 4d. Production World Assets (Local Rights-Cleared Assets, LOD & Region Streaming)
        if (typeof ProductionWorldAssets !== 'undefined') {
            this.worldAssets = new ProductionWorldAssets(this.scene, this.terrain);
            window.productionWorldAssets = this.worldAssets;
            if (typeof productionAssetsAdapter !== 'undefined') {
                productionAssetsAdapter.init(this.worldAssets);
            }
            this.worldAssets.initInstancedVegetation();
            this.worldAssets.preloadRegion('chennai');
        } else {
            this.worldAssets = null;
        }

        // Set initial player height on terrain
        this.player.setPosition(-250, 0, this.terrain);

        // Event Listeners
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            if (!this.isActive) return;
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.renderer.setSize(w, h);
            this.cameraController.handleResize(w, h);
        });

        // Key bindings for WASD / Arrows / Jump / Crouch / Sprint
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (['KeyW', 'ArrowUp'].includes(e.code)) this.inputState.up = true;
            if (['KeyS', 'ArrowDown'].includes(e.code)) this.inputState.down = true;
            if (['KeyA', 'ArrowLeft'].includes(e.code)) this.inputState.left = true;
            if (['KeyD', 'ArrowRight'].includes(e.code)) this.inputState.right = true;
            if (['ShiftLeft', 'ShiftRight'].includes(e.code)) this.inputState.sprint = true;
            if (['Space'].includes(e.code)) {
                this.inputState.jump = true;
                e.preventDefault();
            }
            if (['ControlLeft', 'ControlRight', 'KeyC'].includes(e.code)) this.inputState.crouch = true;
        });

        window.addEventListener('keyup', (e) => {
            if (!this.isActive) return;
            if (['KeyW', 'ArrowUp'].includes(e.code)) this.inputState.up = false;
            if (['KeyS', 'ArrowDown'].includes(e.code)) this.inputState.down = false;
            if (['KeyA', 'ArrowLeft'].includes(e.code)) this.inputState.left = false;
            if (['KeyD', 'ArrowRight'].includes(e.code)) this.inputState.right = false;
            if (['ShiftLeft', 'ShiftRight'].includes(e.code)) this.inputState.sprint = false;
            if (['Space'].includes(e.code)) this.inputState.jump = false;
            if (['ControlLeft', 'ControlRight', 'KeyC'].includes(e.code)) this.inputState.crouch = false;
        });
    }

    world2DTo3D(x2D, y2D) {
        // 2D: X in [0, 6000] -> 3D: X in [-300, 300]
        // 2D: Y in [0, 1200] -> 3D: Z in [-100, 100]
        const x3D = (x2D / 10.0) - 300.0;
        const z3D = (y2D - 600.0) / 5.0;
        return { x: x3D, z: z3D };
    }

    world3DTo2D(x3D, z3D) {
        const x2D = (x3D + 300.0) * 10.0;
        const y2D = (z3D * 5.0) + 600.0;
        return { x: x2D, y: y2D };
    }

    syncPlayerFrom2D(player2D) {
        if (!player2D) return;
        const pos3D = this.world2DTo3D(player2D.x, player2D.y);
        this.player.setPosition(pos3D.x, pos3D.z, this.terrain);
    }

    syncPlayerTo2D(player2D) {
        if (!player2D) return;
        const p3D = this.player.getPosition();
        const p2D = this.world3DTo2D(p3D.x, p3D.z);
        player2D.x = p2D.x;
        player2D.y = p2D.y;
    }

    toggleMacroView() {
        const newMode = this.cameraController.toggleMacroView();
        return newMode;
    }

    isMacroView() {
        return this.cameraController.isMacro();
    }

    triggerLightning(intensity = 1.0) {
        this.lighting.triggerLightning(intensity);
        this.weather.triggerLightning(intensity);
    }

    setActive(active) {
        this.isActive = active;
        if (active) {
            this.container.classList.remove('hidden');
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.renderer.setSize(w, h);
            this.cameraController.handleResize(w, h);
            this.lastTime = performance.now();
            this.renderLoop();
        } else {
            this.container.classList.add('hidden');
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    renderLoop() {
        if (!this.isActive) return;

        const now = performance.now();
        let dt = (now - this.lastTime) / 1000.0;
        this.lastTime = now;
        if (dt > 0.1) dt = 0.1; // Cap large frame jumps

        // 1. Update Player Avatar
        this.player.update(this.inputState, dt, this.terrain);
        const playerPos = this.player.getPosition();

        // 2. Update Camera
        this.cameraController.update(playerPos, dt);

        // 3. Update Weather (Rain particles & fog follow camera view)
        this.weather.update(this.cameraController.camera.position, dt);

        // 4. Update Lighting (Directional shadow camera tracks player)
        this.lighting.update(playerPos, dt);

        // 4b. Update Multiplayer Remote Players & Broadcast 3D Transform (20Hz)
        if (window.multiplayerManager) {
            window.multiplayerManager.updateRemotePlayers(dt);
            const anim = this.player.isMoving ? (this.inputState.shift ? 'sprint' : 'walk') : 'idle';
            window.multiplayerManager.emitMyTransform(playerPos, this.player.currentRotation, anim);
        }

        // 4c. Update Production Living World System (NPC Schedules & Wildlife)
        if (this.livingWorld) {
            let worldClockMinutes = 540;
            if (window.testRef && window.testRef.lighting) {
                worldClockMinutes = (window.testRef.lighting.timeOfDay * 60) % 1440;
            }
            this.livingWorld.update(dt, worldClockMinutes, playerPos);
        }

        // 4d. Update Production World Assets (Region Streaming, Distance LOD & Culling)
        if (this.worldAssets) {
            this.worldAssets.update(playerPos, dt);
        }

        // 5. Render Scene
        this.renderer.render(this.scene, this.cameraController.camera);

        // 6. Telemetry Callback for HUD updates
        if (this.onTelemetryUpdate) {
            const p2D = this.world3DTo2D(playerPos.x, playerPos.z);
            this.onTelemetryUpdate({
                x3D: playerPos.x,
                y3D: playerPos.y,
                z3D: playerPos.z,
                x2D: p2D.x,
                y2D: p2D.y,
                isMoving: this.player.isMoving,
                isMacro: this.isMacroView()
            });
        }

        this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
    }
}

window.ThreeWorld = ThreeWorld;
