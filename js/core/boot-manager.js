// ============================================================================
// THE WHISPERING WILDS - BOOT MANAGER
// Drives the APPLICATION START → SPLASH → MAIN MENU boot sequence.
// Validates WebGL, initialises all root systems in the correct order,
// then hands off to BootScreenUI and MainMenuUI.
// ============================================================================

(function () {
  'use strict';

  const VALID_REGIONS = [
    'george_town', 'cauvery_delta', 'pichavaram',
    'chettinad', 'thanjavur', 'mamallapuram',
    'nilgiris', 'final_sanctuary'
  ];

  class BootManager {
    constructor() {
      this._ready         = false;
      this._webGLOK       = false;
      this._bootErrors    = [];
      this._bootStartTime = Date.now();
    }

    // -------------------------------------------------------------------------
    // ENTRY POINT — called from DOMContentLoaded (before game systems init)
    // -------------------------------------------------------------------------
    async boot() {
      const lifecycle = window.GameLifecycle;
      if (!lifecycle) {
        console.error('[BootManager] GameLifecycle not found. Cannot boot.');
        return;
      }

      // BOOT → INITIALIZING
      lifecycle.transitionTo('INITIALIZING', { step: 'boot_start' });
      this._showBootOverlay();

      try {
        // Step 1: Validate environment
        this._webGLOK = this._validateWebGL();
        if (!this._webGLOK) {
          this._showWebGLError();
          return;
        }

        // Step 2: Apply Settings
        this._updateBootStatus('Applying settings…');
        await this._initSettings();

        // Step 3: Localization
        this._updateBootStatus('Loading language…');
        await this._initLocalization();

        // Step 4: Audio (deferred until user gesture, but initialise the system)
        this._updateBootStatus('Initialising audio…');
        this._initAudioSystem();

        // Step 5: Account / session
        this._updateBootStatus('Checking account…');
        await this._initAccountSession();

        // Step 6: Save system
        this._updateBootStatus('Loading save data…');
        this._initSaveSystem();

        // Step 7: Asset registry
        this._updateBootStatus('Preparing assets…');
        this._initAssetRegistry();

        // Step 8: Renderer — only lightweight test at boot, full 3D init deferred
        this._updateBootStatus('Checking renderer…');
        this._initRendererCheck();

        // Step 9: Input
        this._initInput();

        // Step 10: Crash recovery check
        await this._checkCrashRecovery();

        // Boot complete
        this._ready = true;
        const bootMs = Date.now() - this._bootStartTime;
        console.log(`[BootManager] Boot complete in ${bootMs}ms.`);
        this._hideBootOverlay();

        // Proceed to main menu
        lifecycle.transitionTo('MAIN_MENU', { bootMs });
        if (window.BootScreenUI) {
          window.BootScreenUI.showSplash(() => {
            if (window.MainMenuUI) window.MainMenuUI.show();
          });
        } else {
          if (window.MainMenuUI) window.MainMenuUI.show();
        }

      } catch (err) {
        console.error('[BootManager] Fatal boot error:', err);
        this._bootErrors.push({ code: 'BOOT_FATAL', message: err.message });
        lifecycle.forceTransition('RECOVERING', { error: err.message });
        if (window.RecoveryUI) {
          window.RecoveryUI.showFatalError('Boot failed. Please retry.', {
            canRetry: true,
            onRetry: () => location.reload()
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP IMPLEMENTATIONS
    // -------------------------------------------------------------------------

    _validateWebGL() {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return false;

        // Check required extension availability
        const ext = gl.getExtension('EXT_color_buffer_float') ||
                    gl.getExtension('WEBGL_color_buffer_float');
        const hasGLTF = typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined';
        const hasAudio = typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
        const hasStorage = this._checkStorage();

        if (!gl) return false;

        console.log(`[BootManager] WebGL: OK, GLTF: ${hasGLTF}, Audio: ${hasAudio}, Storage: ${hasStorage}`);
        return true;
      } catch (e) {
        console.warn('[BootManager] WebGL validation failed:', e);
        return false;
      }
    }

    _checkStorage() {
      try {
        localStorage.setItem('ww_storage_test', '1');
        localStorage.removeItem('ww_storage_test');
        return true;
      } catch (_) {
        return false;
      }
    }

    async _initSettings() {
      if (window.SettingsManager && typeof window.SettingsManager.load === 'function') {
        window.SettingsManager.load();
      }
      // Apply persisted graphics/audio settings to GameState
      const savedSettings = this._loadSettingsFromStorage();
      if (savedSettings && window.GameState) {
        if (savedSettings.graphics) Object.assign(window.GameState.settings.graphics, savedSettings.graphics);
        if (savedSettings.audio)    Object.assign(window.GameState.settings.audio, savedSettings.audio);
        if (savedSettings.controls) Object.assign(window.GameState.settings.controls, savedSettings.controls);
      }
    }

    async _initLocalization() {
      if (window.LocalizationManager && typeof window.LocalizationManager.init === 'function') {
        await window.LocalizationManager.init();
      }
      // Default language from settings
      const lang = window.GameState?.settings?.audio?.language || 'tamil';
      if (window.LocalizationManager && typeof window.LocalizationManager.setLanguage === 'function') {
        window.LocalizationManager.setLanguage(lang);
      }
    }

    _initAudioSystem() {
      // AudioManager instance is created inside main.js; here we just ensure
      // the global audio stub is ready (it initializes on first user gesture).
      if (window.gameAudio && typeof window.gameAudio.init !== 'function') {
        console.warn('[BootManager] gameAudio stub not ready yet — will init on first user gesture.');
      }
    }

    async _initAccountSession() {
      // Check existing auth token
      const token = localStorage.getItem('ww_auth_token');
      if (token && window.AuthManager) {
        try {
          await window.AuthManager.validateSession(token);
        } catch (_) {
          // Invalid token — continue as guest
          localStorage.removeItem('ww_auth_token');
        }
      }
    }

    _initSaveSystem() {
      // SaveManager is already instantiated in main.js; here we verify it exists
      if (!window.saveManager && !window.gameSaveManager) {
        console.warn('[BootManager] SaveManager not ready yet — will be created by main.js.');
      }
    }

    _initAssetRegistry() {
      if (window.ProductionAssetRegistry && typeof window.ProductionAssetRegistry.init === 'function') {
        window.ProductionAssetRegistry.init();
      }
    }

    _initRendererCheck() {
      // ThreeWorld is initialised lazily inside main.js. Boot just validates the canvas exists.
      const threeCanvas = document.getElementById('threeCanvas');
      if (!threeCanvas) {
        console.warn('[BootManager] threeCanvas element not found in DOM.');
      }
    }

    _initInput() {
      // InputManager / controls already registered in main.js.
      // We register the global ESCAPE handler here for reliable pause integration.
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
          this._handleEscapeKey();
        }
      }, { capture: true });

      // Browser visibility change → auto-pause
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.GameLifecycle?.isPlaying) {
          console.log('[BootManager] Tab hidden — auto-pausing.');
          if (window.PauseSystem) window.PauseSystem.pause('visibility_change');
        }
      });

      // Before unload — request quick save
      window.addEventListener('beforeunload', (e) => {
        this._handleBeforeUnload();
      });
    }

    async _checkCrashRecovery() {
      const session = window.SessionManager;
      if (session && session.hadIncompleteSession()) {
        // Show recovery offer after main menu appears
        this._pendingCrashRecovery = true;
      }
    }

    // -------------------------------------------------------------------------
    // NEW GAME / CONTINUE
    // -------------------------------------------------------------------------

    startNewGame(profileId = 'default') {
      const lifecycle = window.GameLifecycle;
      if (!lifecycle || lifecycle.state !== 'MAIN_MENU') return;

      // Reset GameState to clean defaults
      if (window.GameState && typeof window.GameState._initAuthoritativeState === 'function') {
        window.GameState._initAuthoritativeState();
        // HARD RESET customization limit to 0 for new game
        window.GameState.player.customizationChangesUsed = 0;
        window.GameState.player.maxCustomizationChanges = 5;
        window.GameState.player.customizationHistory = [];
      }

      if (window.SessionManager) {
        window.SessionManager.setProfile(profileId);
      }

      lifecycle.transitionTo('LOADING_GAME', { reason: 'new_game', profileId });
      if (window.LoadingManager) {
        window.LoadingManager.startLoad('george_town', { isNewGame: true });
      }
    }

    continueGame() {
      const lifecycle = window.GameLifecycle;
      if (!lifecycle || lifecycle.state !== 'MAIN_MENU') return;

      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) { console.warn('[BootManager] SaveManager not available.'); return; }

      // Find most recent valid save (try auto, then checkpoint, then backup)
      const save = sm.loadGame('auto') || sm.loadGame('checkpoint') || sm.loadGame('auto_backup');
      if (!save) {
        console.warn('[BootManager] No valid save found for CONTINUE.');
        if (window.RecoveryUI) {
          window.RecoveryUI.showNoSave();
        }
        return;
      }

      lifecycle.transitionTo('LOADING_GAME', { reason: 'continue', slot: 'auto' });
      if (window.LoadingManager) {
        window.LoadingManager.startLoad(save.world?.currentRegion || 'george_town', {
          isNewGame: false,
          saveData: save
        });
      }
    }

    returnToMainMenu(options = {}) {
      const lifecycle = window.GameLifecycle;
      if (!lifecycle) return;
      if (['PLAYING', 'PAUSED', 'SAVING'].includes(lifecycle.state)) {
        lifecycle.transitionTo('RETURNING_TO_MENU', options);
        // Stop simulation
        if (window.PauseSystem) window.PauseSystem.stopAll();
        // Cleanup region
        if (window.TransitionSystem) window.TransitionSystem.unloadCurrent();
        setTimeout(() => {
          lifecycle.transitionTo('MAIN_MENU');
          if (window.MainMenuUI) window.MainMenuUI.show();
        }, 400);
      }
    }

    safeExit() {
      const lifecycle = window.GameLifecycle;
      if (!lifecycle) return;

      const ss = window.SessionSaveSystem;
      if (ss) ss.flush();

      if (window.SessionManager) window.SessionManager._onExiting();
      if (window.multiplayerManager?.disconnect) window.multiplayerManager.disconnect();
      if (window.gameAudio?.stop) window.gameAudio.stop();

      lifecycle.transitionTo('EXITING');
      // In Electron this triggers app.quit(); in browser we just clean up
      if (window.electronAPI?.quit) {
        window.electronAPI.quit();
      }
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    _handleEscapeKey() {
      const state = window.GameLifecycle?.state;
      if (state === 'PLAYING') {
        if (window.PauseSystem) window.PauseSystem.pause('esc_key');
      } else if (state === 'PAUSED') {
        if (window.PauseSystem) window.PauseSystem.resume();
      }
    }

    _handleBeforeUnload() {
      // Mark session as not cleanly shut down — crash recovery will handle on next launch
      try {
        const last = JSON.parse(localStorage.getItem('ww_last_session') || '{}');
        last.cleanShutdown = false;
        localStorage.setItem('ww_last_session', JSON.stringify(last));
      } catch (_) {}

      // Best-effort quick save
      const sm = window.saveManager || window.gameSaveManager;
      const state = window.GameLifecycle?.state;
      if (sm && (state === 'PLAYING' || state === 'PAUSED')) {
        try { sm.saveGameImmediate('auto', 'beforeunload'); } catch (_) {}
      }
    }

    _loadSettingsFromStorage() {
      try {
        const raw = localStorage.getItem('ww_settings_v1');
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    }

    // -------------------------------------------------------------------------
    // BOOT OVERLAY (minimal pre-UI indicator)
    // -------------------------------------------------------------------------
    _showBootOverlay() {
      let overlay = document.getElementById('ww-boot-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ww-boot-overlay';
        overlay.style.cssText = [
          'position:fixed;inset:0;z-index:9999;',
          'background:#0a0e14;display:flex;flex-direction:column;',
          'align-items:center;justify-content:center;',
          'font-family:Inter,sans-serif;color:#e2c97e;'
        ].join('');

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1.6rem;font-weight:700;letter-spacing:.1em;margin-bottom:24px;';
        title.textContent = 'THE WHISPERING WILDS';
        overlay.appendChild(title);

        const status = document.createElement('div');
        status.id = 'ww-boot-status';
        status.style.cssText = 'font-size:.85rem;color:#8a9bb0;letter-spacing:.05em;';
        status.textContent = 'Starting…';
        overlay.appendChild(status);

        document.body.appendChild(overlay);
      }
    }

    _updateBootStatus(msg) {
      const el = document.getElementById('ww-boot-status');
      if (el) el.textContent = msg;
    }

    _hideBootOverlay() {
      const overlay = document.getElementById('ww-boot-overlay');
      if (overlay) {
        overlay.style.transition = 'opacity .5s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
      }
    }

    _showWebGLError() {
      this._hideBootOverlay();
      if (window.RecoveryUI) {
        window.RecoveryUI.showWebGLUnsupported();
        return;
      }
      // Fallback inline message
      document.body.innerHTML = `
        <div style="font-family:Inter,sans-serif;color:#e2c97e;background:#0a0e14;
          min-height:100vh;display:flex;align-items:center;justify-content:center;
          flex-direction:column;padding:40px;text-align:center;">
          <h1 style="font-size:1.5rem;margin-bottom:16px;">Graphics Not Supported</h1>
          <p style="color:#8a9bb0;max-width:480px;line-height:1.6;">
            Your browser or graphics environment does not support the required 3D features.
            Please try a modern Chromium-based browser (Chrome, Edge) or enable WebGL.
          </p>
          <button onclick="location.reload()" style="margin-top:24px;padding:10px 24px;
            background:#e2c97e;color:#0a0e14;border:none;border-radius:6px;
            cursor:pointer;font-weight:600;">Retry</button>
        </div>`;
    }

    // -------------------------------------------------------------------------
    // DIAGNOSTICS
    // -------------------------------------------------------------------------
    getDiagnostics() {
      return {
        ready:       this._ready,
        webGLOK:     this._webGLOK,
        bootMs:      Date.now() - this._bootStartTime,
        errors:      this._bootErrors,
        lifecycle:   window.GameLifecycle?.getDiagnostics?.()
      };
    }

    isValidRegion(regionId) {
      return VALID_REGIONS.includes(regionId);
    }
  }

  window.BootManager = new BootManager();
  window.VALID_REGIONS = VALID_REGIONS;

})();
