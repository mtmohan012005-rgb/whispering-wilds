// ============================================================================
// THE WHISPERING WILDS - CHECKPOINT SYSTEM
// Authored checkpoint triggers — never checkpoints every frame.
// Validates safe player position before saving.
// Wraps SaveManager — does NOT duplicate it.
// ============================================================================

(function () {
  'use strict';

  // Minimum real seconds between checkpoints (prevent burst saving)
  const MIN_CHECKPOINT_INTERVAL_MS = 30 * 1000; // 30 seconds

  // Checkpoint triggers (authored — not automatic)
  const CHECKPOINT_TRIGGERS = new Set([
    'quest_major_complete',
    'region_discover',
    'investigation_milestone',
    'puzzle_complete',
    'transport_discover',
    'safe_camp_rest',
    'manual_save',
    'region_transition'
  ]);

  // Restricted positions where we must NOT checkpoint
  const RESTRICTED_ZONES = [
    // Example: { minX, maxX, minZ, maxZ, reason }
  ];

  class CheckpointSystem {
    constructor() {
      this._lastCheckpointTime = 0;
      this._pendingCheckpoint  = false;
      this._lastCheckpointData = null;
      this._isSaving           = false;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Request a checkpoint
    // -------------------------------------------------------------------------
    requestCheckpoint(trigger, meta = {}) {
      if (!CHECKPOINT_TRIGGERS.has(trigger)) {
        console.warn(`[CheckpointSystem] Unknown trigger: '${trigger}'. Ignored.`);
        return false;
      }

      const lc = window.GameLifecycle;
      if (!lc) return false;

      // Only checkpoint while playing or paused
      if (!['PLAYING', 'PAUSED', 'SAVING'].includes(lc.state)) {
        return false;
      }

      // Don't checkpoint during cinematic / dialogue / unsafe states
      if (this._isUnsafeState()) {
        console.log('[CheckpointSystem] Checkpoint deferred — unsafe state.');
        this._pendingCheckpoint = true;
        return false;
      }

      // Debounce
      const now = Date.now();
      if (now - this._lastCheckpointTime < MIN_CHECKPOINT_INTERVAL_MS && trigger !== 'manual_save') {
        console.log('[CheckpointSystem] Checkpoint throttled — too soon.');
        return false;
      }

      return this._performCheckpoint(trigger, meta);
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Flush any pending checkpoint (call from pause resume / region exit)
    // -------------------------------------------------------------------------
    flushPending() {
      if (this._pendingCheckpoint) {
        this._pendingCheckpoint = false;
        return this.requestCheckpoint('safe_camp_rest', { reason: 'deferred_flush' });
      }
      return false;
    }

    getLastCheckpointData() { return this._lastCheckpointData; }

    // -------------------------------------------------------------------------
    // PRIVATE
    // -------------------------------------------------------------------------
    _performCheckpoint(trigger, meta) {
      if (this._isSaving) return false;
      this._isSaving = true;

      const safePosition = this._getSafePlayerPosition();
      if (!safePosition) {
        console.warn('[CheckpointSystem] Could not find safe checkpoint position.');
        this._isSaving = false;
        return false;
      }

      // Transition lifecycle to SAVING briefly
      const lc = window.GameLifecycle;
      const prevState = lc?.state;
      if (lc && prevState === 'PLAYING') {
        lc.transitionTo('SAVING', { reason: trigger });
      }

      // Show save UI feedback
      if (window.SessionSaveSystem) {
        window.SessionSaveSystem.showSavingIndicator();
      }

      setTimeout(() => {
        try {
          const sm = window.saveManager || window.gameSaveManager;
          if (!sm) {
            this._isSaving = false;
            return;
          }

          // Use atomic save to 'checkpoint' slot
          sm.saveGameImmediate('checkpoint', `checkpoint_${trigger}`);

          this._lastCheckpointTime = Date.now();
          this._lastCheckpointData = {
            trigger, meta, position: safePosition,
            timestamp: this._lastCheckpointTime,
            region: window.GameState?.world?.currentRegion
          };

          // Record in session manager
          if (window.SessionManager) {
            window.SessionManager.recordCheckpoint('checkpoint');
          }

          console.log(`[CheckpointSystem] ✓ Checkpoint saved (${trigger})`);

          if (window.SessionSaveSystem) {
            window.SessionSaveSystem.showSavedIndicator();
          }

          // Return to previous state
          if (lc && prevState === 'PLAYING') {
            lc.transitionTo('PLAYING', { resumedFrom: 'SAVING' });
          }
        } catch (err) {
          console.error('[CheckpointSystem] Checkpoint failed:', err);
        } finally {
          this._isSaving = false;
        }
      }, 50);

      return true;
    }

    _isUnsafeState() {
      // Don't checkpoint during cinematic or active dialogue choice
      if (window.cinematicSystem?.isActive) return true;
      if (window.dialogueController?.isActive) return true;
      if (window.GameLifecycle?.isTransitioning) return true;
      return false;
    }

    _getSafePlayerPosition() {
      // Prefer 3D player position
      const p3d = window.threeWorld?.player;
      if (p3d) {
        const pos = p3d.getPosition?.() || { x: p3d.mesh?.position?.x, y: p3d.mesh?.position?.y, z: p3d.mesh?.position?.z };
        if (this._isValidPosition3D(pos)) return pos;
        // Find nearest safe
        return this._findNearestSafePosition3D(pos);
      }

      // Fall back to 2D player
      const p2d = window.gamePlayer;
      if (p2d) {
        return { x: p2d.x || 220, y: 0, z: p2d.y || 630 };
      }

      // Default safe spawn
      return { x: 0, y: 0, z: 0 };
    }

    _isValidPosition3D(pos) {
      if (!pos) return false;
      if (!isFinite(pos.x) || !isFinite(pos.z)) return false;
      // Check restricted zones
      for (const zone of RESTRICTED_ZONES) {
        if (pos.x >= zone.minX && pos.x <= zone.maxX &&
            pos.z >= zone.minZ && pos.z <= zone.maxZ) {
          return false;
        }
      }
      // Check not underground (y should be >= terrain height)
      if (pos.y < -5) return false;
      return true;
    }

    _findNearestSafePosition3D(invalidPos) {
      // Use region safe spawn point from WORLD_DATA
      const region = window.GameState?.world?.currentRegion || 'george_town';
      const regionData = window.WORLD_DATA?.regions?.[region];
      if (regionData?.safeSpawn) return { ...regionData.safeSpawn };

      // Use emergency system's last safe position
      if (window.emergencySystem?.lastSafePosition) {
        return { ...window.emergencySystem.lastSafePosition };
      }

      // Absolute fallback — George Town origin
      return { x: 0, y: 0, z: 0 };
    }

    getDiagnostics() {
      return {
        lastCheckpointTime: this._lastCheckpointTime,
        lastCheckpointData: this._lastCheckpointData,
        isSaving:           this._isSaving,
        pendingCheckpoint:  this._pendingCheckpoint
      };
    }
  }

  window.CheckpointSystem = new CheckpointSystem();

})();
