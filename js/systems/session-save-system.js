// ============================================================================
// THE WHISPERING WILDS - SESSION SAVE SYSTEM
// Atomic write-validate-commit wrapper over SaveManager.
// Merges simultaneous save requests. Shows save status toast.
// Provides manual save with guard conditions.
// ============================================================================

(function () {
  'use strict';

  const MIN_SAVE_INTERVAL_MS = 8000;   // 8 seconds minimum between actual writes
  const SAVE_DEBOUNCE_MS     = 600;    // merge burst save requests

  class SessionSaveSystem {
    constructor() {
      this._pendingSlot    = null;
      this._pendingReason  = null;
      this._debounceTimer  = null;
      this._lastSaveTime   = 0;
      this._isSaving       = false;
      this._toastTimeout   = null;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Request a save (debounced + merged)
    // -------------------------------------------------------------------------
    requestSave(slot = 'auto', reason = 'autosave') {
      // If multiple systems call this simultaneously, merge into one save
      if (!this._pendingSlot || slot !== 'auto') {
        this._pendingSlot   = slot;
      }
      this._pendingReason = reason;

      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => this._executeSave(), SAVE_DEBOUNCE_MS);
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Manual save from pause menu (with guard conditions)
    // -------------------------------------------------------------------------
    manualSave() {
      const reason = this._canManualSave();
      if (reason !== true) {
        this._showSaveBlockedReason(reason);
        return false;
      }

      this.showSavingIndicator();
      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) return false;

      sm.saveGameImmediate('auto', 'manual_save');
      if (window.SessionManager) window.SessionManager.recordSave('auto');
      if (window.CheckpointSystem) window.CheckpointSystem.requestCheckpoint('manual_save');
      this._lastSaveTime = Date.now();

      setTimeout(() => this.showSavedIndicator(), 300);
      return true;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Flush all pending saves immediately (called on safe exit)
    // -------------------------------------------------------------------------
    flush() {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = null;
        this._executeSave(true);
      }
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Save status UI
    // -------------------------------------------------------------------------
    showSavingIndicator() {
      this._updateSaveToast('saving');
    }

    showSavedIndicator() {
      this._updateSaveToast('saved');
      if (this._toastTimeout) clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => this._hideSaveToast(), 2500);
    }

    // -------------------------------------------------------------------------
    // PRIVATE
    // -------------------------------------------------------------------------
    _executeSave(force = false) {
      if (this._isSaving) return;

      const slot   = this._pendingSlot   || 'auto';
      const reason = this._pendingReason || 'autosave';
      this._pendingSlot   = null;
      this._pendingReason = null;

      const now = Date.now();
      if (!force && (now - this._lastSaveTime < MIN_SAVE_INTERVAL_MS)) {
        // Too soon — re-queue silently
        this._debounceTimer = setTimeout(() => this._executeSave(), MIN_SAVE_INTERVAL_MS - (now - this._lastSaveTime));
        return;
      }

      // Guard: don't save during unsafe lifecycle states
      const lc = window.GameLifecycle;
      if (lc && !['PLAYING', 'PAUSED', 'SAVING'].includes(lc.state) && !force) {
        return;
      }

      this._isSaving = true;
      this.showSavingIndicator();

      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) { this._isSaving = false; return; }

      try {
        sm.saveGameImmediate(slot, reason);
        this._lastSaveTime = Date.now();
        if (window.SessionManager) window.SessionManager.recordSave(slot);
        this.showSavedIndicator();
      } catch (err) {
        console.error('[SessionSaveSystem] Save failed:', err);
        this._hideSaveToast();
      } finally {
        this._isSaving = false;
      }
    }

    _canManualSave() {
      const lc = window.GameLifecycle;
      if (!lc) return 'Game not ready.';
      if (lc.isTransitioning) return 'Cannot save during region transition.';
      if (lc.isLoading)       return 'Cannot save during loading.';
      if (!['PLAYING', 'PAUSED'].includes(lc.state)) return `Cannot save in state: ${lc.state}.`;
      if (window.cinematicSystem?.isActive) return 'Cannot save during cinematic.';
      if (window.dialogueController?.isActive) return 'Cannot save during dialogue.';
      return true;
    }

    _showSaveBlockedReason(reason) {
      const toast = document.getElementById('save-toast');
      if (toast) {
        toast.textContent = `⚠ ${reason}`;
        toast.className = 'save-toast-blocked';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
      }
    }

    _updateSaveToast(state) {
      const toast = document.getElementById('save-toast');
      if (!toast) return;
      toast.classList.remove('hidden');
      if (state === 'saving') {
        toast.textContent = '💾 Saving…';
        toast.className = 'save-toast-saving';
        toast.classList.remove('hidden');
      } else {
        toast.textContent = '✓ Saved';
        toast.className = 'save-toast-saved';
        toast.classList.remove('hidden');
      }
    }

    _hideSaveToast() {
      const toast = document.getElementById('save-toast');
      if (toast) toast.classList.add('hidden');
    }
  }

  window.SessionSaveSystem = new SessionSaveSystem();

})();
