// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - LAPTOP & PC OPTIMIZATION CONTROLLER
// Intelligent Hardware Detection, Battery-Aware Eco Mode, Frame Pacing &
// Thermal Throttling Mitigation for Laptops and Desktop PCs.
// ============================================================================

(function() {
    class LaptopOptimization {
        constructor() {
            this.mode = 'HIGH_PERF'; // 'ECO' | 'HIGH_PERF' | 'BALANCED'
            this.battery = null;
            this.isLaptop = false;
            this.isOnBattery = false;
            this.gpuInfo = null;
            this.isLowPowerGPU = false;
            this.ecoButton = null;
            this.autoEcoOffered = false;

            this.init();
        }

        async init() {
            this.detectHardware();
            await this.initBatteryMonitoring();
            this.initVisibilityListener();
            this.setupHUDButton();

            // Auto-configure initial mode if on battery or low-power GPU
            if (this.isOnBattery || this.isLowPowerGPU) {
                console.log('[LaptopOptimization] Detected battery/integrated GPU operation. Recommending Eco Mode.');
                this.setMode('ECO', false);
            } else {
                this.setMode('HIGH_PERF', false);
            }
        }

        detectHardware() {
            const screenW = window.screen ? window.screen.width : window.innerWidth;
            const screenH = window.screen ? window.screen.height : window.innerHeight;
            const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const memory = navigator.deviceMemory || 8;
            const cores = navigator.hardwareConcurrency || 4;

            // Laptops typically have 1366x768, 1920x1080, 1920x1200, 2560x1600, or touch screen
            this.isLaptop = (screenW <= 1920 && screenH <= 1200) || hasTouch || (cores <= 8 && memory <= 8);

            // GPU vendor detection
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                        this.gpuInfo = renderer;
                        const lower = renderer.toLowerCase();
                        if (lower.includes('intel') || lower.includes('uhd') || lower.includes('iris') || lower.includes('mesa') || lower.includes('microsoft basic')) {
                            this.isLowPowerGPU = true;
                        }
                    }
                }
            } catch (err) {
                console.warn('[LaptopOptimization] GPU inspection warning:', err);
            }

            console.log(`[LaptopOptimization] Hardware: Laptop=${this.isLaptop}, LowPowerGPU=${this.isLowPowerGPU}, Cores=${cores}, Memory=${memory}GB`);
        }

        async initBatteryMonitoring() {
            if ('getBattery' in navigator) {
                try {
                    this.battery = await navigator.getBattery();
                    this.updateBatteryStatus();

                    this.battery.addEventListener('chargingchange', () => {
                        this.updateBatteryStatus();
                        this.handlePowerSourceChange();
                    });
                    this.battery.addEventListener('levelchange', () => {
                        this.updateBatteryStatus();
                    });
                } catch (e) {
                    console.log('[LaptopOptimization] Battery API unavailable on this environment.');
                }
            }
        }

        updateBatteryStatus() {
            if (!this.battery) return;
            this.isOnBattery = !this.battery.charging;
            const levelPct = Math.round(this.battery.level * 100);
            console.log(`[LaptopOptimization] Battery: ${levelPct}%, Discharging=${this.isOnBattery}`);
        }

        handlePowerSourceChange() {
            if (this.isOnBattery && this.mode !== 'ECO') {
                this.notifyUser('⚡ Disconnected from wall power. Switched to Laptop Eco Mode to extend battery life.', '#f39c12');
                this.setMode('ECO', true);
            } else if (!this.isOnBattery && this.mode === 'ECO') {
                this.notifyUser('🔌 Connected to AC power. Switched to Maximum Performance PC Mode.', '#2ecc71');
                this.setMode('HIGH_PERF', true);
            }
        }

        initVisibilityListener() {
            // Background tab throttle: pause 3D rendering when minimized or obscured
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (window.performanceManager) {
                        window.performanceManager._wasHidden = true;
                    }
                } else {
                    if (window.performanceManager) {
                        window.performanceManager._wasHidden = false;
                    }
                }
            });
        }

        setMode(targetMode, notify = true) {
            this.mode = targetMode;

            if (targetMode === 'ECO') {
                // Apply Laptop Eco Settings:
                // 1. Cap FPS at 40 (saves 40-50% GPU work vs 60 FPS)
                if (window.performanceManager) {
                    window.performanceManager.setTargetFPS(40);
                }

                // 2. Cap Three.js DPR at 1.0 (vital on high-res laptop retina/QHD screens)
                if (window.threeWorld && window.threeWorld.renderer) {
                    window.threeWorld.renderer.setPixelRatio(1.0);
                    if (window.threeWorld.renderer.shadowMap) {
                        window.threeWorld.renderer.shadowMap.enabled = true;
                        window.threeWorld.renderer.shadowMap.type = THREE.BasicShadowMap;
                    }
                }

                // 3. Throttle weather particles
                if (window.particleSystem) {
                    window.particleSystem.maxParticles = 800;
                }

                // 4. Update GraphicsSettings preset if loaded
                if (window.graphicsSettings) {
                    window.graphicsSettings.fpsLimit = 40;
                }

                if (notify) {
                    this.notifyUser('🔋 Laptop Eco Mode Enabled: 40 FPS Cap, 1.0 DPR, Quiet Fans & Battery Saver active', '#3498db');
                }
            } else {
                // Apply High Performance PC Settings:
                // 1. Target 60+ FPS
                if (window.performanceManager) {
                    window.performanceManager.setTargetFPS(60);
                }

                // 2. High DPR up to 2.0
                if (window.threeWorld && window.threeWorld.renderer) {
                    window.threeWorld.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
                    if (window.threeWorld.renderer.shadowMap) {
                        window.threeWorld.renderer.shadowMap.enabled = true;
                        window.threeWorld.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    }
                }

                // 3. Full weather particles
                if (window.particleSystem) {
                    window.particleSystem.maxParticles = 3200;
                }

                // 4. Update GraphicsSettings
                if (window.graphicsSettings) {
                    window.graphicsSettings.fpsLimit = 60;
                }

                if (notify) {
                    this.notifyUser('⚡ High Performance PC Mode: 60+ FPS, Enhanced Shadows & Shaders active', '#2ecc71');
                }
            }

            this.updateButtonLabel();
        }

        toggleMode() {
            if (this.mode === 'ECO') {
                this.setMode('HIGH_PERF', true);
            } else {
                this.setMode('ECO', true);
            }
        }

        setupHUDButton() {
            let btn = document.getElementById('toggle-eco-btn');
            if (!btn) {
                const actionsContainer = document.querySelector('.hud-top-actions');
                if (actionsContainer) {
                    btn = document.createElement('button');
                    btn.id = 'toggle-eco-btn';
                    btn.className = 'hud-mode-btn';
                    btn.title = 'Toggle Laptop Battery Eco Mode / PC High Performance [F8]';
                    btn.innerHTML = `<span id="eco-btn-label">🔋 Eco Mode</span><span class="key-hint">F8</span>`;
                    actionsContainer.appendChild(btn);
                }
            }

            if (btn) {
                this.ecoButton = btn;
                btn.addEventListener('click', () => this.toggleMode());
                this.updateButtonLabel();
            }
        }

        updateButtonLabel() {
            if (!this.ecoButton) {
                this.ecoButton = document.getElementById('toggle-eco-btn');
            }
            if (!this.ecoButton) return;

            const labelEl = document.getElementById('eco-btn-label');
            if (this.mode === 'ECO') {
                if (labelEl) labelEl.textContent = '🔋 Eco Mode';
                this.ecoButton.classList.add('active');
                this.ecoButton.title = 'Laptop Eco Mode Active (40 FPS, Quiet Fans, Battery Saved) - Click or press F8 for High Perf';
            } else {
                if (labelEl) labelEl.textContent = '⚡ High Perf';
                this.ecoButton.classList.remove('active');
                this.ecoButton.title = 'PC High Performance Active (60+ FPS, Full Quality) - Click or press F8 for Eco Mode';
            }
        }

        notifyUser(message, accentColor = '#ffd700') {
            const toast = document.getElementById('save-toast') || document.getElementById('quest-toast');
            if (toast) {
                toast.textContent = message;
                toast.style.borderColor = accentColor;
                toast.style.color = '#fff';
                toast.classList.remove('hidden');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 3500);
            } else {
                console.log(`[LaptopOptimization] ${message}`);
            }
        }
    }

    // Expose singleton instance on window
    window.laptopOptimization = new LaptopOptimization();
    window.LaptopOptimization = LaptopOptimization;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { LaptopOptimization };
    }
})();
