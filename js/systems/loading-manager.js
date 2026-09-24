// ============================================================================
// THE WHISPERING WILDS - LOADING MANAGER
// Tracks staged, real asset loading progress. Never fakes 0→100% with a timer.
// Stages: SETUP → SAVE_PARSE → WORLD_DATA → REGION → TERRAIN → ASSETS →
//         CHARACTER → NPCS → WILDLIFE → WEATHER → AUDIO → LIGHTING → FINALIZE
// ============================================================================

(function () {
  'use strict';

  const LOAD_STAGES = [
    'SETUP', 'SAVE_PARSE', 'WORLD_DATA', 'REGION', 'TERRAIN',
    'ASSETS', 'CHARACTER', 'NPCS', 'WILDLIFE', 'WEATHER',
    'AUDIO', 'LIGHTING', 'FINALIZE'
  ];

  const STAGE_WEIGHTS = {
    SETUP:       2,  SAVE_PARSE:  5, WORLD_DATA: 8,
    REGION:     15,  TERRAIN:    10, ASSETS:    20,
    CHARACTER:  10,  NPCS:        8, WILDLIFE:   7,
    WEATHER:     3,  AUDIO:       5, LIGHTING:   4,
    FINALIZE:    3
  };

  const TOTAL_WEIGHT = Object.values(STAGE_WEIGHTS).reduce((a, b) => a + b, 0);

  class LoadingManager {
    constructor() {
      this._currentStage    = null;
      this._completedWeight = 0;
      this._stageProgress   = {};
      this._isLoading       = false;
      this._pendingSaveData = null;
      this._targetRegion    = null;
      this._isNewGame       = false;
      this._failedAssets    = [];
      this._onProgressCbs   = [];
      this._onCompleteCbs   = [];
      this._onFailCbs       = [];
      this._loadStartTime   = null;

      // Telemetry (dev-only)
      this._telemetry = {};

      LOAD_STAGES.forEach(s => { this._stageProgress[s] = 0; });
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Begin loading sequence
    // -------------------------------------------------------------------------
    startLoad(regionId, options = {}) {
      if (this._isLoading) {
        console.warn('[LoadingManager] Load already in progress.');
        return;
      }

      this._isLoading       = true;
      this._targetRegion    = regionId;
      this._isNewGame       = options.isNewGame || false;
      this._pendingSaveData = options.saveData || null;
      this._failedAssets    = [];
      this._completedWeight = 0;
      this._loadStartTime   = Date.now();
      LOAD_STAGES.forEach(s => { this._stageProgress[s] = 0; });

      if (window.LoadingScreenUI) {
        window.LoadingScreenUI.show(regionId);
      }

      this._run().catch(err => {
        console.error('[LoadingManager] Load pipeline failed:', err);
        this._onFail(err.message || 'Unknown load error');
      });
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Progress reporting
    // -------------------------------------------------------------------------
    getProgress() {
      let done = 0;
      LOAD_STAGES.forEach(s => {
        done += (this._stageProgress[s] / 100) * STAGE_WEIGHTS[s];
      });
      return Math.min(100, Math.round((done / TOTAL_WEIGHT) * 100));
    }

    getCurrentStage() { return this._currentStage; }
    isLoading()       { return this._isLoading; }

    onProgress(cb)  { this._onProgressCbs.push(cb);  }
    onComplete(cb)  { this._onCompleteCbs.push(cb);  }
    onFail(cb)      { this._onFailCbs.push(cb);       }

    // -------------------------------------------------------------------------
    // PRIVATE: The staged load pipeline
    // -------------------------------------------------------------------------
    async _run() {
      // SETUP
      await this._runStage('SETUP', async () => {
        this._setStageProgress('SETUP', 30);
        await this._tick();
        // Validate region ID
        if (window.VALID_REGIONS && !window.VALID_REGIONS.includes(this._targetRegion)) {
          throw new Error(`Invalid region ID: '${this._targetRegion}'.`);
        }
        this._setStageProgress('SETUP', 100);
      });

      // SAVE_PARSE
      await this._runStage('SAVE_PARSE', async () => {
        this._setStageProgress('SAVE_PARSE', 20);
        await this._tick();
        if (this._pendingSaveData) {
          const sm = window.saveManager || window.gameSaveManager;
          if (sm && typeof sm.validateSaveData === 'function') {
            const result = sm.validateSaveData(this._pendingSaveData);
            if (!result.valid) {
              throw new Error(`Save data invalid: ${result.errors.join('; ')}`);
            }
          }
        }
        this._setStageProgress('SAVE_PARSE', 100);
      });

      // WORLD_DATA
      await this._runStage('WORLD_DATA', async () => {
        this._setStageProgress('WORLD_DATA', 50);
        await this._tick();
        if (!window.WORLD_DATA) throw new Error('WORLD_DATA not loaded.');
        this._setStageProgress('WORLD_DATA', 100);
      });

      // REGION
      await this._runStage('REGION', async () => {
        this._setStageProgress('REGION', 10);
        await this._tick();
        const ws = window.worldStreamingSystem || window.threeWorld?.worldStreaming;
        if (ws && typeof ws.preloadRegion === 'function') {
          await ws.preloadRegion(this._targetRegion);
          this._setStageProgress('REGION', 80);
          await this._tick();
        } else {
          this._setStageProgress('REGION', 60);
          await this._tick(100);
        }
        // Update GameState region
        if (window.GameState) {
          window.GameState.world.currentRegion = this._targetRegion;
        }
        this._setStageProgress('REGION', 100);
      });

      // TERRAIN
      await this._runStage('TERRAIN', async () => {
        this._setStageProgress('TERRAIN', 30);
        await this._tick();
        if (window.threeWorld?.terrain) {
          window.threeWorld.terrain.setRegion(this._targetRegion);
        }
        this._setStageProgress('TERRAIN', 100);
      });

      // ASSETS
      await this._runStage('ASSETS', async () => {
        this._setStageProgress('ASSETS', 10);
        await this._tick();
        if (window.ProductionAssetRegistry) {
          const assets = window.ProductionAssetRegistry.getRegionAssets(this._targetRegion) || [];
          let loaded = 0;
          for (const asset of assets) {
            try {
              if (asset.loader && typeof asset.loader === 'function') {
                await asset.loader();
              }
            } catch (err) {
              console.warn(`[LoadingManager] Asset load failed: ${asset.id}`, err);
              this._failedAssets.push({ id: asset.id, error: err.message, region: this._targetRegion });
            }
            loaded++;
            this._setStageProgress('ASSETS', Math.round(10 + (loaded / Math.max(assets.length, 1)) * 85));
            if (loaded % 3 === 0) await this._tick();
          }
        } else {
          await this._tick(200);
        }
        this._setStageProgress('ASSETS', 100);
      });

      // CHARACTER
      await this._runStage('CHARACTER', async () => {
        this._setStageProgress('CHARACTER', 30);
        await this._tick();
        if (window.threeWorld?.player) {
          // Player already exists — restore position
          const gs = window.GameState;
          if (gs && this._pendingSaveData?.player) {
            const p = this._pendingSaveData.player;
            window.threeWorld.player.setPosition(p.x3d || gs.player.position.x,
                                                  p.y3d || gs.player.position.y,
                                                  p.z3d || gs.player.position.z);
          }
        }
        this._setStageProgress('CHARACTER', 100);
      });

      // NPCS
      await this._runStage('NPCS', async () => {
        this._setStageProgress('NPCS', 20);
        await this._tick();
        const lw = window.threeWorld?.livingWorld || window.livingWorldSystem;
        if (lw && typeof lw.setRegion === 'function') {
          lw.setRegion(this._targetRegion);
        }
        this._setStageProgress('NPCS', 100);
      });

      // WILDLIFE
      await this._runStage('WILDLIFE', async () => {
        this._setStageProgress('WILDLIFE', 50);
        await this._tick();
        // Wildlife sim rebuilds from habitat data — no per-animal transform restore
        this._setStageProgress('WILDLIFE', 100);
      });

      // WEATHER
      await this._runStage('WEATHER', async () => {
        this._setStageProgress('WEATHER', 40);
        await this._tick();
        if (this._pendingSaveData?.world?.weatherType && window.gameWeather) {
          window.gameWeather.setWeather(this._pendingSaveData.world.weatherType);
        }
        this._setStageProgress('WEATHER', 100);
      });

      // AUDIO
      await this._runStage('AUDIO', async () => {
        this._setStageProgress('AUDIO', 30);
        await this._tick();
        if (window.audioManager?.ambient) {
          window.audioManager.ambient.setRegion(this._targetRegion);
        }
        this._setStageProgress('AUDIO', 100);
      });

      // LIGHTING
      await this._runStage('LIGHTING', async () => {
        this._setStageProgress('LIGHTING', 50);
        await this._tick();
        if (this._pendingSaveData?.world?.timeOfDay !== undefined) {
          const tod = this._pendingSaveData.world.timeOfDay;
          if (window.testRef?.lighting) window.testRef.lighting.timeOfDay = tod;
          if (window.GameState)         window.GameState.world.time = tod;
        }
        this._setStageProgress('LIGHTING', 100);
      });

      // FINALIZE
      await this._runStage('FINALIZE', async () => {
        this._setStageProgress('FINALIZE', 30);
        await this._tick();

        // Restore full save state if continuing
        if (this._pendingSaveData) {
          const sm = window.saveManager || window.gameSaveManager;
          if (sm && typeof sm.restoreState === 'function') {
            sm.restoreState(this._pendingSaveData);
          }
        }

        // Bind legacy adapters
        if (window.GameState?.bindLegacyAdapters) {
          window.GameState.bindLegacyAdapters();
        }

        // Session tracking
        if (window.SessionManager) {
          window.SessionManager.setRegion(this._targetRegion);
        }

        this._setStageProgress('FINALIZE', 100);
        this._isLoading = false;

        this._telemetry.loadDuration = Date.now() - this._loadStartTime;
        this._telemetry.failedAssets = this._failedAssets.length;
        console.log(`[LoadingManager] Load complete: ${this._targetRegion} in ${this._telemetry.loadDuration}ms. Failed: ${this._failedAssets.length}`);
      });

      // Transition to PLAYING
      if (window.GameLifecycle) {
        window.GameLifecycle.transitionTo('PLAYING', {
          region: this._targetRegion,
          loadMs: this._telemetry.loadDuration
        });
      }

      if (window.LoadingScreenUI) {
        window.LoadingScreenUI.hide();
      }

      this._onCompleteCbs.forEach(cb => { try { cb({ region: this._targetRegion, telemetry: this._telemetry }); } catch (_) {} });
    }

    async _runStage(name, fn) {
      this._currentStage = name;
      const stageStart = Date.now();
      this._emit();
      try {
        await fn();
      } catch (err) {
        this._telemetry[`${name}_error`] = err.message;
        throw err;
      }
      this._telemetry[`${name}_ms`] = Date.now() - stageStart;
    }

    _setStageProgress(stage, pct) {
      this._stageProgress[stage] = Math.min(100, Math.max(0, pct));
      this._emit();
    }

    _emit() {
      const progress = this.getProgress();
      const stage    = this._currentStage;
      if (window.LoadingScreenUI) {
        window.LoadingScreenUI.updateProgress(progress, stage);
      }
      this._onProgressCbs.forEach(cb => {
        try { cb({ progress, stage }); } catch (_) {}
      });
    }

    _tick(ms = 16) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    _onFail(msg) {
      this._isLoading = false;
      if (window.GameLifecycle) {
        window.GameLifecycle.forceTransition('RECOVERING', { error: msg });
      }
      if (window.LoadingScreenUI) window.LoadingScreenUI.hide();
      if (window.RecoveryUI) {
        window.RecoveryUI.showLoadFailure(msg, {
          onRetry: () => this.startLoad(this._targetRegion, {
            isNewGame: this._isNewGame,
            saveData: this._pendingSaveData
          }),
          onCheckpoint: () => {
            const slot = window.SessionManager?.getPreviousSessionSafeSlot() || 'checkpoint';
            const sm   = window.saveManager || window.gameSaveManager;
            const save = sm?.loadGame(slot);
            if (save) this.startLoad(save.world?.currentRegion || 'george_town', { saveData: save });
          },
          onMenu: () => window.BootManager?.returnToMainMenu()
        });
      }
      this._onFailCbs.forEach(cb => { try { cb(msg); } catch (_) {} });
    }

    getTelemetry() { return { ...this._telemetry }; }
    getFailedAssets() { return [...this._failedAssets]; }
    getStages() { return [...LOAD_STAGES]; }
  }

  window.LoadingManager = new LoadingManager();
  window.LOAD_STAGES    = LOAD_STAGES;

})();
