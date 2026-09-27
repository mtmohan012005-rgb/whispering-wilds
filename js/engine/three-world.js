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
        this.frameCount = 0;

        // 0. GPU Capability Detection & Auto Graphics Profile Selection
        // Must happen before renderer creation to set correct pixel ratio.
        if (window.GPUCapability && !window.GPUCapability.detected) {
            window.GPUCapability.detect();
        }
        if (window.GraphicsProfileManager && typeof window.GraphicsProfileManager.autoSelect === 'function') {
            window.GraphicsProfileManager.autoSelect();
        }
        const _gpm = window.GraphicsProfileManager;
        const _targetDPR = _gpm ? _gpm.profile.renderPixelRatio : Math.min(window.devicePixelRatio, 1.5);

        // 1. WebGL Renderer — pixel ratio comes from auto-selected profile
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: _gpm ? _gpm.profile.antialiasEnabled : true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(_targetDPR);
        this.renderer.shadowMap.enabled = _gpm ? _gpm.profile.shadowsEnabled : true;
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
        this.player = new ThreePlayer(this.scene, -244, 2);
        this.weather = new ThreeWeather(this.scene);

        // 3b. Advanced PBR Lighting Shaders & Dynamic Foliage Systems
        this.lightingShaders = (typeof window.LightingShaders !== 'undefined')
            ? (window.lightingShaders || new window.LightingShaders())
            : null;
        window.lightingShaders = this.lightingShaders;

        this.dynamicFoliage = (typeof window.DynamicFoliageSystem !== 'undefined')
            ? new window.DynamicFoliageSystem(this.scene)
            : null;
        window.dynamicFoliageSystem = this.dynamicFoliage;

        // Apply advanced PBR shader to terrain if available
        if (this.terrain && this.terrain.mesh && this.terrain.mesh.material && this.lightingShaders) {
            this.lightingShaders.applyPBRShader(this.terrain.mesh.material, { receiveWetness: true });
        }

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

        if (window.worldStreamingSystem) {
            this.worldStreaming = window.worldStreamingSystem;
            this.worldStreaming.scene = this.scene;
            this.worldStreaming.worldAssets = this.worldAssets;
            if (this.worldStreaming.renderer) {
                this.worldStreaming.renderer.scene = this.scene;
            }
        } else if (typeof WorldStreamingSystem !== 'undefined') {
            this.worldStreaming = new WorldStreamingSystem(this.scene, this.worldAssets);
            window.worldStreamingSystem = this.worldStreaming;
        } else {
            this.worldStreaming = null;
        }
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

        // WebGL Context Loss Recovery (Section 125)
        if (this.canvas) {
            this.canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('[ThreeWorld][WebGL] Context lost! Pausing renderLoop and world streaming.');
                if (this.worldStreaming) this.worldStreaming.pause();
            }, false);

            this.canvas.addEventListener('webglcontextrestored', () => {
                console.log('[ThreeWorld][WebGL] Context restored! Rebuilding world streaming state.');
                if (this.worldStreaming) {
                    this.worldStreaming.resume();
                    const pPos = this.player.getPosition();
                    this.worldStreaming.evaluateStreaming(pPos);
                }
            }, false);
        }

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
            if (window.InputManager) window.InputManager.clearAll();
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
            this.cameraController.setMode('gameplay');
            this.lastTime = performance.now();
            // NOTE: No longer starts its own requestAnimationFrame here.
            // The single authoritative game loop in main.js calls this.step(dt) every frame.
            console.log('[ThreeWorld] Activated as primary renderer. Driven by main game loop.');
        } else {
            this.container.classList.add('hidden');
            // Cancel any stale RAF id if somehow left over
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    /**
     * step(dt, simActive) — called ONCE per frame by the single authoritative
     * game loop in main.js. NEVER starts its own requestAnimationFrame.
     * @param {number} dt - delta time in seconds (clamped upstream)
     * @param {boolean} simActive - false while paused/loading
     */
    step(dt, simActive = true) {
        if (!this.isActive) return;

        // Skip heavy work when tab is hidden (battery/GPU conservation)
        if (this.isTabHidden) return;

        if (this.performanceManager) {
            this.performanceManager.beginFrame();
        }

        this.frameCount++;

        // ── INPUT ───────────────────────────────────────────────────────────
        const lc = window.GameLifecycle;
        const inputLocked = (lc && lc.isInputLocked()) ||
            (window.uiManager && typeof window.uiManager.isInputLocked === 'function' && window.uiManager.isInputLocked());

        if (window.InputManager) {
            window.InputManager.update();
            if (inputLocked) {
                this.clearInputState();
            } else {
                this.inputState.up     = window.InputManager.isDown('MOVE_FORWARD') || !!window.InputManager.keyboard?.isDown('KeyW') || !!window.InputManager.keyboard?.isDown('ArrowUp');
                this.inputState.down   = window.InputManager.isDown('MOVE_BACK') || !!window.InputManager.keyboard?.isDown('KeyS') || !!window.InputManager.keyboard?.isDown('ArrowDown');
                this.inputState.left   = window.InputManager.isDown('MOVE_LEFT') || !!window.InputManager.keyboard?.isDown('KeyA') || !!window.InputManager.keyboard?.isDown('ArrowLeft');
                this.inputState.right  = window.InputManager.isDown('MOVE_RIGHT') || !!window.InputManager.keyboard?.isDown('KeyD') || !!window.InputManager.keyboard?.isDown('ArrowRight');
                this.inputState.sprint = window.InputManager.isDown('SPRINT') || !!window.InputManager.keyboard?.isDown('ShiftLeft') || !!window.InputManager.keyboard?.isDown('ShiftRight');
                this.inputState.jump   = window.InputManager.wasPressed('JUMP') || window.InputManager.isDown('JUMP') || !!window.InputManager.keyboard?.isDown('Space');
                this.inputState.crouch = window.InputManager.isDown('CROUCH') || !!window.InputManager.keyboard?.isDown('ControlLeft') || !!window.InputManager.keyboard?.isDown('KeyC');
            }
        }

        // ── SIMULATION ──────────────────────────────────────────────────────
        if (simActive) {
            // 1. Player avatar (camera-relative locomotion & inertia)
            this.player.update(this.inputState, dt, this.terrain, this.cameraController);
        }
        const playerPos = this.player.getPosition();

        // Sync with authoritative GameState
        if (window.GameState && window.GameState.player) {
            window.GameState.player.position.x = playerPos.x;
            window.GameState.player.position.y = playerPos.y;
            window.GameState.player.position.z = playerPos.z;
            window.GameState.player.rotation.y = this.player.currentRotation;
        }

        // 2. Camera
        this.cameraController.update(playerPos, dt, this.terrain, this.collision);

        // 3. Weather
        this.weather.update(this.cameraController.camera.position, dt);

        // 4. Lighting
        this.lighting.update(playerPos, dt);

        // 4a. Advanced PBR Lighting Shaders & Dynamic Foliage
        if (this.lightingShaders) {
            this.lightingShaders.update(dt, this.weather, this.lighting);
        }
        if (this.dynamicFoliage) {
            this.dynamicFoliage.update(dt, this.weather);
        }

        // 4b. Multiplayer remote players & transform broadcast (rate-limited in NetworkClient)
        if (window.multiplayerManager) {
            window.multiplayerManager.updateRemotePlayers(dt);
            const anim = this.player.isMoving ? (this.inputState.sprint ? 'sprint' : 'walk') : 'idle';
            window.multiplayerManager.emitMyTransform(playerPos, this.player.currentRotation, anim);
        }

        if (simActive) {
            // 4c. Living World (NPCs & wildlife) — skipped while paused
            if (this.livingWorld) {
                let worldClockMinutes = 540;
                if (window.testRef && window.testRef.lighting) {
                    worldClockMinutes = (window.testRef.lighting.timeOfDay * 60) % 1440;
                }
                this.livingWorld.update(dt, worldClockMinutes, playerPos);
            }

            // 4d. Traversal, Exploration & Environment
            if (this.traversal)            this.traversal.update(this.inputState, dt, playerPos);
            if (this.exploration)          this.exploration.update(playerPos, dt);
            if (this.environmentInteraction) this.environmentInteraction.update(playerPos, this.player.currentRotation, dt);

            // 4e. Cultural life & markets
            if (this.dailyRoutine) {
                let worldHour = 9.0;
                if (window.testRef && window.testRef.lighting) worldHour = window.testRef.lighting.timeOfDay;
                const weatherType = (window.testRef && window.testRef.weather) ? window.testRef.weather.current.type : 'clear';
                this.dailyRoutine.update(worldHour, weatherType);
            }
            if (this.marketLife) this.marketLife.update(playerPos, dt);

            // 4f. World assets (LOD, streaming, distance culling)
            if (this.worldAssets) this.worldAssets.update(playerPos, dt);

            // 4g. World streaming & occlusion
            if (this.worldStreaming) {
                const movementMode = this.inputState.sprint ? 'SPRINT' : (this.player.isMoving ? 'WALK' : 'STATIONARY');
                this.worldStreaming.update(playerPos, dt, this.cameraController?.camera, movementMode);
            }
            if (this.occlusionManager) {
                this.occlusionManager.updateFrustum(this.cameraController.camera);
            }
        }

        // ── RENDER ──────────────────────────────────────────────────────────
        this.renderer.render(this.scene, this.cameraController.camera);

        // Dynamic resolution update
        if (window.GraphicsProfileManager && this.performanceManager) {
            window.GraphicsProfileManager.updateDynamicResolution(
                this.performanceManager.frameTimeMs || (dt * 1000),
                this.renderer
            );
        }

        // End frame metrics
        if (this.performanceManager) {
            this.performanceManager.endFrame(this.renderer, this.scene);
        }

        // Telemetry callback for HUD updates
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
        // NO requestAnimationFrame here — driven by main.js game loop
    }

    /**
     * @deprecated Use step(dt) instead. Kept as no-op for backward compat.
     */
    renderLoop() {
        console.warn('[ThreeWorld] renderLoop() called directly — this is deprecated. ThreeWorld is now driven by the main game loop.');
    }
}

window.ThreeWorld = ThreeWorld;
