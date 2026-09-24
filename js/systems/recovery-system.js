// ============================================================================
// THE WHISPERING WILDS - RECOVERY SYSTEM
// Detects and recovers from: corrupted saves, missing assets, WebGL loss,
// renderer failure, network failure, cloud conflict, invalid world state.
// ============================================================================

(function () {
  'use strict';

  class RecoverySystem {
    constructor() {
      this._webGLLossHandled = false;

      // Listen for WebGL context loss
      this._watchWebGLContext();
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Attempt save recovery (primary → backup → checkpoint → new game)
    // -------------------------------------------------------------------------
    attemptSaveRecovery(slot = 'auto') {
      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) return { success: false, reason: 'SaveManager unavailable.' };

      // 1. Try primary slot
      const primary = sm.loadGame(slot);
      if (primary) {
        const validation = sm.validateSaveData(primary);
        if (validation.valid) {
          console.log('[RecoverySystem] Primary save valid. Using primary.');
          return { success: true, source: 'primary', data: validation.sanitized };
        }
        console.warn('[RecoverySystem] Primary save invalid:', validation.errors);
      }

      // 2. Try backup slot
      const backup = sm.loadGame(`${slot}_backup`);
      if (backup) {
        const validation = sm.validateSaveData(backup);
        if (validation.valid) {
          console.log('[RecoverySystem] Backup save valid. Restoring from backup.');
          // Promote backup to primary
          sm.saveGameImmediate(slot, 'backup_restore');
          return { success: true, source: 'backup', data: validation.sanitized };
        }
        console.warn('[RecoverySystem] Backup save invalid:', validation.errors);
      }

      // 3. Try checkpoint slot
      const checkpoint = sm.loadGame('checkpoint');
      if (checkpoint) {
        const validation = sm.validateSaveData(checkpoint);
        if (validation.valid) {
          console.log('[RecoverySystem] Checkpoint save valid. Restoring checkpoint.');
          return { success: true, source: 'checkpoint', data: validation.sanitized };
        }
      }

      // 4. Both invalid — offer new game
      return { success: false, reason: 'All saves corrupted. Start a new game.', allCorrupted: true };
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Validate world state (called after load)
    // -------------------------------------------------------------------------
    validateWorldState(saveData) {
      if (!saveData || !window.GameState) return { valid: false, errors: ['No save data or GameState.'] };

      const errors = [];
      const gs = window.GameState;

      // Validate region
      const region = saveData.world?.currentRegion || gs.world.currentRegion;
      if (window.VALID_REGIONS && !window.VALID_REGIONS.includes(region)) {
        errors.push(`Invalid region '${region}'. Resetting to george_town.`);
        gs.world.currentRegion = 'george_town';
      }

      // Validate customization limit
      const cusUsed = gs.player.customizationChangesUsed;
      if (cusUsed > 5 || cusUsed < 0) {
        errors.push(`customizationChangesUsed (${cusUsed}) out of bounds [0–5]. Clamping.`);
        gs.player.customizationChangesUsed = Math.max(0, Math.min(5, cusUsed));
      }

      // Validate currency
      if (gs.player.currency < 0) {
        errors.push(`Negative currency (${gs.player.currency}). Resetting to 0.`);
        gs.player.currency = 0;
      }

      // Validate inventory
      gs.player.inventory = gs.player.inventory.filter(item => {
        if (!item.id || typeof item.count !== 'number') return false;
        if (item.count < 0) return false;
        return true;
      });

      // Validate survival vitals
      const sv = gs.player.survival;
      if (sv) {
        sv.health    = Math.max(0, Math.min(sv.maxHealth    || 100, sv.health    || 100));
        sv.energy    = Math.max(0, Math.min(sv.maxEnergy    || 100, sv.energy    || 100));
        sv.hydration = Math.max(0, Math.min(sv.maxHydration || 100, sv.hydration || 100));
        sv.hunger    = Math.max(0, Math.min(sv.maxHunger    || 100, sv.hunger    || 100));
        sv.warmth    = Math.max(0, Math.min(sv.maxWarmth    || 100, sv.warmth    || 80));
        sv.wetness   = Math.max(0, Math.min(100, sv.wetness || 0));
      }

      // Validate quest flags (no future quest without prerequisite — simple check)
      if (gs.quests?.completed && gs.quests?.storyFlags) {
        // Ensure all required flags exist for completed quests
        // (Full story validation deferred to StoryContentSystem)
      }

      if (errors.length > 0) {
        console.warn('[RecoverySystem] World state issues detected and repaired:', errors);
      }

      return { valid: true, errors, repaired: errors.length > 0 };
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Handle cloud conflict
    // -------------------------------------------------------------------------
    resolveCloudConflict(localSave, cloudSave) {
      if (!localSave || !cloudSave) return localSave || cloudSave;

      const localTs  = localSave.timestamp  || 0;
      const cloudTs  = cloudSave.timestamp  || 0;

      // Show conflict UI — never silently overwrite
      if (window.RecoveryUI) {
        window.RecoveryUI.showCloudConflict({
          local: {
            timestamp:     localTs,
            region:        localSave.world?.currentRegion || 'unknown',
            storyProgress: localSave.storyContent?.currentChapter || '?',
            playTime:      localSave.sessionPlayTime || 0
          },
          cloud: {
            timestamp:     cloudTs,
            region:        cloudSave.world?.currentRegion || 'unknown',
            storyProgress: cloudSave.storyContent?.currentChapter || '?',
            playTime:      cloudSave.sessionPlayTime || 0
          },
          onSelectLocal: () => this._applyConflictResolution(localSave, 'local'),
          onSelectCloud: () => this._applyConflictResolution(cloudSave, 'cloud'),
          onMerge:       () => this._applyMerge(localSave, cloudSave)
        });
      }
    }

    _applyConflictResolution(save, source) {
      const sm = window.saveManager || window.gameSaveManager;
      if (sm?.restoreState) sm.restoreState(save);
      console.log(`[RecoverySystem] Cloud conflict resolved: using ${source}.`);
      if (window.LoadingManager) {
        window.LoadingManager.startLoad(save.world?.currentRegion || 'george_town', { saveData: save });
      }
    }

    _applyMerge(local, cloud) {
      // Safe union merge: achievements, codex, discoveries from cloud
      // Trusted resolution: inventory, currency from more recent save
      const base    = (local.timestamp >= cloud.timestamp) ? local : cloud;
      const other   = (base === local) ? cloud : local;

      // Merge progression sets
      const merged = JSON.parse(JSON.stringify(base));

      if (other.achievements?.unlocked && merged.achievements?.unlocked) {
        merged.achievements.unlocked = [...new Set([
          ...merged.achievements.unlocked,
          ...other.achievements.unlocked
        ])];
      }
      if (other.codex?.discovered && merged.codex?.discovered) {
        merged.codex.discovered = [...new Set([
          ...merged.codex.discovered,
          ...other.codex.discovered
        ])];
      }

      console.log('[RecoverySystem] Merged cloud + local save.');
      this._applyConflictResolution(merged, 'merged');
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Network failure handling
    // -------------------------------------------------------------------------
    handleNetworkFailure() {
      console.warn('[RecoverySystem] Network failure detected. Continuing in offline mode.');
      // Single-player gameplay continues — just show offline indicator
      if (window.GameHUD || window.gameHUD) {
        this._showOfflineIndicator();
      }
      // Don't freeze or pause gameplay
      if (window.CloudSyncEngine) {
        window.CloudSyncEngine.queueForLater = true;
      }
    }

    _showOfflineIndicator() {
      const existing = document.getElementById('ww-offline-badge');
      if (existing) return;
      const badge = document.createElement('div');
      badge.id = 'ww-offline-badge';
      badge.style.cssText = [
        'position:fixed;top:80px;right:20px;z-index:3000;',
        'background:rgba(0,0,0,.75);border:1px solid #e74c3c;',
        'color:#e74c3c;font-size:.75rem;padding:4px 10px;',
        'border-radius:4px;letter-spacing:.05em;font-family:Inter,sans-serif;',
        'pointer-events:none;'
      ].join('');
      badge.textContent = '● Offline';
      document.body.appendChild(badge);
    }

    // -------------------------------------------------------------------------
    // PRIVATE: WebGL context loss recovery
    // -------------------------------------------------------------------------
    _watchWebGLContext() {
      // We monitor all canvas elements for contextlost
      const observer = new MutationObserver(() => this._attachWebGLListeners());
      observer.observe(document.body, { childList: true, subtree: false });
      this._attachWebGLListeners();
    }

    _attachWebGLListeners() {
      ['threeCanvas', 'gameCanvas'].forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas || canvas._ww_ctx_watched) return;
        canvas._ww_ctx_watched = true;

        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          if (!this._webGLLossHandled) {
            this._webGLLossHandled = true;
            this._handleWebGLLoss();
          }
        }, false);

        canvas.addEventListener('webglcontextrestored', () => {
          this._webGLLossHandled = false;
          console.log('[RecoverySystem] WebGL context restored.');
        }, false);
      });
    }

    _handleWebGLLoss() {
      console.error('[RecoverySystem] WebGL context lost!');
      if (window.GameLifecycle) {
        window.GameLifecycle.forceTransition('RECOVERING', { reason: 'webgl_loss' });
      }
      // Best-effort checkpoint
      const sm = window.saveManager || window.gameSaveManager;
      if (sm) {
        try { sm.saveGameImmediate('checkpoint', 'webgl_loss_emergency'); } catch (_) {}
      }

      if (window.RecoveryUI) {
        window.RecoveryUI.showWebGLLoss({
          onRetry: () => {
            this._webGLLossHandled = false;
            if (window.threeWorld?.renderer) {
              // ThreeWorld will attempt to reinitialize
              window.threeWorld.setActive(false);
              setTimeout(() => window.threeWorld.setActive(true), 1000);
            }
          },
          onSafeMode: () => {
            // Apply low graphics preset
            if (window.GameState) {
              window.GameState.settings.graphics.preset = 'LOW';
              window.GameState.settings.graphics.shadowQuality = 'OFF';
              window.GameState.settings.graphics.resolutionScale = 0.5;
            }
            if (window.threeWorld) window.threeWorld.applyGraphicsPreset('LOW');
          }
        });
      }
    }

    getDiagnostics() {
      return {
        webGLLossHandled: this._webGLLossHandled
      };
    }
  }

  window.RecoverySystem = new RecoverySystem();

})();
