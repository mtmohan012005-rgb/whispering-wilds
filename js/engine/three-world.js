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

        // 4e. PC Performance, Streaming, Instance & Occlusion Managers
        this.instanceManager = (typeof InstanceManager !== 'undefined') ? new InstanceManager(this.scene, this.terrain) : null;
        window.instanceManager = this.instanceManager;

        this.occlusionManager = (typeof OcclusionManager !== 'undefined') ? new OcclusionManager(this.scene, this.cameraController.camera) : null;
        window.occlusionManager = this.occlusionManager;

        this.worldStreaming = (typeof WorldStreamingSystem !== 'undefined') ? new WorldStreamingSystem(this.scene, this.worldAssets) : null;
        window.worldStreaming = this.worldStreaming;

        this.performanceManager = (typeof PerformanceManager !== 'undefined') ? new PerformanceManager(window.graphicsSettings, this) : null;
        window.performanceManager = this.performanceManager;

        // 4f. World Collision & Traversal Physics
        this.collision = (typeof WorldCollision !== 'undefined') ? new WorldCollision() : null;
        window.worldCollision = this.collision;

        this.traversal = (typeof TraversalSystem !== 'undefined') ? new TraversalSystem(this.player, this.cameraController, this.collision) : null;
        window.traversalSystem = this.traversal;

        this.exploration = (typeof ExplorationSystem !== 'undefined') ? new ExplorationSystem(this.scene, this.collision) : null;
        window.explorationSystem = this.exploration;

        this.environmentInteraction = (typeof EnvironmentInteractionSystem !== 'undefined') ? new EnvironmentInteractionSystem(this.scene, this.cameraController) : null;
        window.environmentInteraction = this.environmentInteraction;

        this.puzzle = (typeof PuzzleSystem !== 'undefined') ? new PuzzleSystem() : null;
        window.puzzleSystem = this.puzzle;

        // 4g. Authentic Tamil Nadu Cultural Simulation Systems
        this.culturalLife = (typeof CulturalLifeSystem !== 'undefined') ? new CulturalLifeSystem() : null;
        window.culturalLifeSystem = this.culturalLife;

        this.dailyRoutine = (typeof DailyRoutineSystem !== 'undefined') ? new DailyRoutineSystem() : null;
        window.dailyRoutineSystem = this.dailyRoutine;

        this.festival = (typeof FestivalSystem !== 'undefined') ? new FestivalSystem(this.scene, this.collision) : null;
        window.festivalSystem = this.festival;

        this.marketLife = (typeof MarketLifeSystem !== 'undefined') ? new MarketLifeSystem(this.scene, this.collision) : null;
        window.marketLifeSystem = this.marketLife;

        this.kolam = (typeof KolamSystem !== 'undefined') ? new KolamSystem(this.scene) : null;
        window.kolamSystem = this.kolam;

        this.foodCulture = (typeof FoodCultureSystem !== 'undefined') ? new FoodCultureSystem() : null;
        window.foodCultureSystem = this.foodCulture;

        this.isTabHidden = false;

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

        // Visibility change handling to conserve battery & GPU when tab is inactive
        document.addEventListener('visibilitychange', () => {
            this.isTabHidden = document.hidden;
            if (document.hidden) {
                this.clearInputState();
                if (window.audioManager && typeof window.audioManager.setMasterVolume === 'function') {
                    window.audioManager.setMasterVolume(0.1);
                }
            } else {
                if (window.audioManager && typeof window.audioManager.setMasterVolume === 'function') {
                    window.audioManager.setMasterVolume(1.0);
                }
                this.lastTime = performance.now();
            }
        });

        // Clear keys on window blur to prevent stuck movement
        window.addEventListener('blur', () => {
            this.clearInputState();
        });

        // Key bindings for WASD / Arrows / Jump / Crouch / Sprint
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            if (window.uiManager && typeof window.uiManager.isInputLocked === 'function' && window.uiManager.isInputLocked()) {
                this.clearInputState();
                return;
            }
            if (e.repeat && ['Space', 'KeyC', 'ControlLeft', 'ControlRight'].includes(e.code)) return;

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

    clearInputState() {
        if (this.inputState) {
            this.inputState.up = false;
            this.inputState.down = false;
            this.inputState.left = false;
            this.inputState.right = false;
            this.inputState.sprint = false;
            this.inputState.jump = false;
            this.inputState.crouch = false;
        }
        if (this.inputKeys) {
            this.inputKeys = {};
        }
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

        // Skip heavy frame rendering if browser tab is hidden
        if (this.isTabHidden) {
            this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
            return;
        }

        if (this.performanceManager) {
            this.performanceManager.beginFrame();
        }

        const now = performance.now();
        let dt = (now - this.lastTime) / 1000.0;
        this.lastTime = now;
        if (dt > 0.1) dt = 0.1; // Cap large frame jumps

        // 1. Update Player Avatar
        this.player.update(this.inputState, dt, this.terrain);
        const playerPos = this.player.getPosition();

        // Synchronize with Authoritative GameState
        if (window.GameState && window.GameState.player) {
            window.GameState.player.position.x = playerPos.x;
            window.GameState.player.position.y = playerPos.y;
            window.GameState.player.position.z = playerPos.z;
            window.GameState.player.rotation.y = this.player.currentRotation;
        }

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

        // 4d. Update Traversal, Exploration & Environmental Interaction
        if (this.traversal) {
            this.traversal.update(this.inputState, dt, playerPos);
        }
        if (this.exploration) {
            this.exploration.update(playerPos, dt);
        }
        if (this.environmentInteraction) {
            this.environmentInteraction.update(playerPos, this.player.currentRotation, dt);
        }

        // 4e. Update Cultural Life & Markets
        if (this.dailyRoutine) {
            let worldHour = 9.0;
            if (window.testRef && window.testRef.lighting) {
                worldHour = window.testRef.lighting.timeOfDay;
            }
            const weather = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.type : 'clear';
            this.dailyRoutine.update(worldHour, weather);
        }
        if (this.marketLife) {
            this.marketLife.update(playerPos, dt);
        }

        // 4f. Update Production World Assets (Region Streaming, Distance LOD & Culling)
        if (this.worldAssets) {
            this.worldAssets.update(playerPos, dt);
        }

        // 4e. Update PC World Streaming & Occlusion Frustum
        if (this.worldStreaming) {
            this.worldStreaming.update(playerPos, dt);
        }
        if (this.occlusionManager) {
            this.occlusionManager.updateFrustum(this.cameraController.camera);
        }

        // 5. Render Scene
        this.renderer.render(this.scene, this.cameraController.camera);

        // 5b. End Performance Frame & Metrics
        if (this.performanceManager) {
            this.performanceManager.endFrame(this.renderer, this.scene);
        }

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
