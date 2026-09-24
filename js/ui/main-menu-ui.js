// ============================================================================
// THE WHISPERING WILDS - MAIN MENU UI
// Production-grade main menu: CONTINUE / NEW GAME / LOAD GAME /
// PROFILE / SETTINGS / CREDITS / QUIT
// Uses LocalizationManager. CONTINUE shown only when valid save exists.
// ============================================================================

(function () {
  'use strict';

  class MainMenuUI {
    constructor() {
      this._container = null;
      this._visible   = false;
      this._scene     = null;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: show / hide
    // -------------------------------------------------------------------------
    show() {
      const existing = document.getElementById('ww-main-menu');
      if (existing) {
        this._container = existing;
        this._visible = true;
        existing.style.opacity = '1';
        return;
      }
      this._visible = true;

      // Stop gameplay audio, start menu ambience
      if (window.gameAudio?.startMenuAmbience) window.gameAudio.startMenuAmbience();
      else if (window.audioManager?.dynamicMusic?.setMenuMode) {
        window.audioManager.dynamicMusic.setMenuMode(true);
      }

      this._container = this._buildMenu();
      document.body.appendChild(this._container);

      // Animate in
      requestAnimationFrame(() => {
        if (this._container) this._container.style.opacity = '1';
      });

      // Check crash recovery offer
      if (window.SessionManager?.hadIncompleteSession()) {
        setTimeout(() => this._showRecoveryOffer(), 800);
      }
    }

    hide() {
      this._visible = false;
      const el = this._container || document.getElementById('ww-main-menu');
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => {
          el.remove();
          if (this._container === el) this._container = null;
        }, 300);
      }
    }

    isVisible() { return this._visible; }

    // -------------------------------------------------------------------------
    // PRIVATE: Build menu DOM
    // -------------------------------------------------------------------------
    _buildMenu() {
      const root = document.createElement('div');
      root.id = 'ww-main-menu';
      root.setAttribute('role', 'main');
      root.style.cssText = [
        'position:fixed;inset:0;z-index:8500;',
        'display:flex;flex-direction:row;',
        'font-family:"Inter",sans-serif;',
        'opacity:0;transition:opacity .6s ease;'
      ].join('');

      // Left panel — atmospheric background
      const leftPanel = document.createElement('div');
      leftPanel.style.cssText = [
        'flex:1;position:relative;overflow:hidden;',
        'background:linear-gradient(135deg,#050810 0%,#0d1f2d 40%,#0f1e18 100%);'
      ].join('');

      // Environmental mist layer
      const mist = document.createElement('div');
      mist.style.cssText = [
        'position:absolute;inset:0;',
        'background:radial-gradient(ellipse at 30% 70%, rgba(20,60,40,.5) 0%, transparent 60%),',
        'radial-gradient(ellipse at 80% 20%, rgba(15,40,60,.4) 0%, transparent 50%);',
        'animation:ww-mm-mist 8s ease-in-out infinite;'
      ].join('');
      leftPanel.appendChild(mist);

      // Village silhouette
      const silhouette = document.createElement('div');
      silhouette.style.cssText = [
        'position:absolute;bottom:0;left:0;right:0;height:200px;',
        'background:linear-gradient(to top, rgba(5,8,16,.95) 0%, transparent 100%);',
        'display:flex;align-items:flex-end;justify-content:center;padding-bottom:20px;',
        'font-size:4rem;letter-spacing:.5rem;color:rgba(40,60,50,.6);',
        'font-weight:100;'
      ].join('');
      silhouette.innerHTML = '𝌆 𝌆 𝌆';
      leftPanel.appendChild(silhouette);

      // Game branding in left panel
      const branding = document.createElement('div');
      branding.style.cssText = [
        'position:absolute;top:50%;left:50%;transform:translate(-50%,-55%);',
        'text-align:center;'
      ].join('');
      branding.innerHTML = `
        <div style="font-size:.9rem;letter-spacing:.4em;color:#4a6878;font-weight:300;margin-bottom:12px;">காட்டு வழி • தடம்</div>
        <h1 style="font-size:2.6rem;font-weight:700;letter-spacing:.1em;color:#e2c97e;margin:0;text-shadow:0 0 60px rgba(226,201,126,.25);">THE WHISPERING WILDS</h1>
        <div style="font-size:.75rem;letter-spacing:.2em;color:#3a5060;margin-top:8px;">AN OPEN-WORLD EXPLORATION OF TAMIL NADU</div>
      `;
      leftPanel.appendChild(branding);

      root.appendChild(leftPanel);

      // Right panel — menu items
      const rightPanel = document.createElement('div');
      rightPanel.style.cssText = [
        'width:340px;background:rgba(5,8,14,.96);',
        'border-left:1px solid rgba(226,201,126,.12);',
        'display:flex;flex-direction:column;',
        'justify-content:center;padding:48px 40px;gap:0;',
        'box-shadow:-20px 0 60px rgba(0,0,0,.6);'
      ].join('');

      // Menu title
      const menuTitle = document.createElement('div');
      menuTitle.style.cssText = 'font-size:.7rem;letter-spacing:.3em;color:#4a6070;margin-bottom:32px;font-weight:500;';
      menuTitle.textContent = 'MAIN MENU';
      rightPanel.appendChild(menuTitle);

      // Determine if valid save exists
      const hasSave = this._hasValidSave();

      const menuItems = [
        { id: 'continue',  label: this._t('menu.continue', 'CONTINUE'),           enabled: hasSave,   primary: true,  action: () => this._onContinue() },
        { id: 'new_game',  label: this._t('menu.new_game', 'NEW GAME'),            enabled: true,      primary: true,  action: () => this._onNewGame() },
        { id: 'load_game', label: this._t('menu.load_game', 'LOAD GAME'),          enabled: hasSave,   primary: false, action: () => this._onLoadGame() },
        { id: 'profile',   label: this._t('menu.profile', 'PROFILE'),              enabled: true,      primary: false, action: () => this._onProfile() },
        { id: 'settings',  label: this._t('menu.settings', 'SETTINGS'),            enabled: true,      primary: false, action: () => this._onSettings() },
        { id: 'credits',   label: this._t('menu.credits', 'CREDITS'),              enabled: true,      primary: false, action: () => this._onCredits() },
        { id: 'quit',      label: this._t('menu.quit', 'QUIT'),                    enabled: true,      primary: false, action: () => this._onQuit() }
      ];

      menuItems.forEach((item, idx) => {
        const btn = this._buildMenuItem(item, idx);
        rightPanel.appendChild(btn);
      });

      // Version / save indicator
      const footer = document.createElement('div');
      footer.style.cssText = 'margin-top:32px;font-size:.65rem;color:#2a3a48;letter-spacing:.06em;';
      const saveInfo = hasSave ? this._getLastSaveInfo() : 'No save found';
      footer.textContent = saveInfo;
      rightPanel.appendChild(footer);

      root.appendChild(rightPanel);

      // Inject styles
      this._injectMenuStyles();

      return root;
    }

    _buildMenuItem({ id, label, enabled, primary, action }, idx) {
      const btn = document.createElement('button');
      btn.id = `ww-menu-${id.replace('_', '-')}`;
      btn.dataset.id = id;
      btn.className = `ww-menu-item${primary ? ' ww-menu-primary' : ''}${!enabled ? ' ww-menu-disabled' : ''}`;
      btn.textContent = label;
      btn.disabled = !enabled;
      btn.setAttribute('tabindex', enabled ? '0' : '-1');
      btn.style.animationDelay = `${idx * 60}ms`;

      if (enabled) {
        btn.addEventListener('click', action);
        btn.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); action(); }
        });
      }

      return btn;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Menu Actions
    // -------------------------------------------------------------------------
    _onContinue() {
      this.hide();
      window.BootManager?.continueGame();
    }

    _onNewGame() {
      window.ConfirmDialogUI?.show({
        title:   this._t('menu.new_game_confirm_title', 'Start a New Journey?'),
        message: this._t('menu.new_game_confirm_msg', 'Your current save will remain available. Are you sure you want to begin from the beginning?'),
        confirmLabel: this._t('menu.start_new', 'START NEW GAME'),
        cancelLabel:  this._t('menu.cancel',    'CANCEL'),
        onConfirm: () => {
          this.hide();
          window.BootManager?.startNewGame();
        }
      });
    }

    _onLoadGame() {
      if (window.ProfileSelectUI) {
        window.ProfileSelectUI.show('load');
      }
    }

    _onProfile() {
      if (window.ProfileSelectUI) {
        window.ProfileSelectUI.show('view');
      }
    }

    _onSettings() {
      if (window.unifiedSettingsUI?.open) window.unifiedSettingsUI.open();
      else if (window.uiManager?.toggleModal) window.uiManager.toggleModal('PAUSED');
    }

    _onCredits() {
      this._showCredits();
    }

    _onQuit() {
      window.ConfirmDialogUI?.show({
        title:        this._t('menu.quit_title', 'Quit the Game?'),
        message:      this._t('menu.quit_msg', 'Any unsaved progress will be lost.'),
        confirmLabel: this._t('menu.quit_confirm', 'QUIT'),
        cancelLabel:  this._t('menu.cancel', 'CANCEL'),
        dangerous:    true,
        onConfirm: () => window.BootManager?.safeExit()
      });
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Helpers
    // -------------------------------------------------------------------------
    _hasValidSave() {
      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) return false;
      const save = sm.loadGame?.('auto') || sm.loadGame?.('checkpoint');
      if (!save) return false;
      if (sm.validateSaveData) {
        const v = sm.validateSaveData(save);
        return v.valid;
      }
      return true;
    }

    _getLastSaveInfo() {
      try {
        const sm = window.saveManager || window.gameSaveManager;
        const save = sm?.loadGame?.('auto');
        if (save?.formattedTime) return `Last saved: ${save.formattedTime}`;
        return '';
      } catch (_) { return ''; }
    }

    _t(key, fallback) {
      if (window.LocalizationManager?.t) return window.LocalizationManager.t(key) || fallback;
      return fallback;
    }

    _showRecoveryOffer() {
      window.ConfirmDialogUI?.show({
        title:   'Recover Previous Session?',
        message: 'The previous session did not close cleanly. Would you like to restore your last safe checkpoint?',
        confirmLabel: 'RECOVER',
        cancelLabel:  'START FRESH',
        onConfirm: () => {
          if (window.SessionManager) window.SessionManager.clearIncompleteSessionFlag();
          this._onContinue();
        },
        onCancel: () => {
          if (window.SessionManager) window.SessionManager.clearIncompleteSessionFlag();
        }
      });
    }

    _showCredits() {
      const modal = document.createElement('div');
      modal.id = 'ww-credits-modal';
      modal.style.cssText = [
        'position:fixed;inset:0;z-index:9100;',
        'background:rgba(5,8,14,.97);display:flex;flex-direction:column;',
        'align-items:center;padding:48px 40px;overflow-y:auto;',
        'font-family:Inter,sans-serif;color:#c8d0d8;'
      ].join('');
      modal.innerHTML = `
        <h2 style="color:#e2c97e;font-size:1.4rem;letter-spacing:.1em;margin-bottom:32px;">CREDITS</h2>
        <div style="max-width:600px;width:100%;line-height:1.8;font-size:.85rem;text-align:center;">
          <div style="color:#e2c97e;margin-bottom:8px;font-weight:600;">GAME DESIGN & DEVELOPMENT</div>
          <div style="color:#8a9bb0;margin-bottom:24px;">The Whispering Wilds Development Team</div>
          <div style="color:#e2c97e;margin-bottom:8px;font-weight:600;">CULTURAL RESEARCH</div>
          <div style="color:#8a9bb0;margin-bottom:24px;">Tamil Nadu Heritage Documentation Initiative</div>
          <div style="color:#e2c97e;margin-bottom:8px;font-weight:600;">3D ENGINE</div>
          <div style="color:#8a9bb0;margin-bottom:24px;">Three.js (MIT License)</div>
          <div style="color:#e2c97e;margin-bottom:8px;font-weight:600;">MULTIPLAYER</div>
          <div style="color:#8a9bb0;margin-bottom:24px;">Socket.io (MIT License)</div>
          <div style="color:#e2c97e;margin-bottom:8px;font-weight:600;">TYPOGRAPHY</div>
          <div style="color:#8a9bb0;margin-bottom:24px;">Noto Sans Tamil (Google Fonts, OFL License)</div>
          <div style="color:#4a5060;font-size:.75rem;margin-top:32px;">
            All Tamil Nadu cultural content is presented with respect for living traditions.<br>
            Fictional story elements are clearly distinguished from historical facts.
          </div>
        </div>
        <button id="ww-credits-close" style="margin-top:32px;padding:10px 32px;border:1px solid #e2c97e;background:transparent;color:#e2c97e;font-family:Inter,sans-serif;font-size:.875rem;border-radius:6px;cursor:pointer;letter-spacing:.06em;">CLOSE</button>
      `;
      document.body.appendChild(modal);
      document.getElementById('ww-credits-close').addEventListener('click', () => modal.remove());
    }

    _injectMenuStyles() {
      if (document.getElementById('ww-menu-styles')) return;
      const style = document.createElement('style');
      style.id = 'ww-menu-styles';
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .ww-menu-item {
          display:block; width:100%; text-align:left;
          background:transparent; border:none; border-left:2px solid transparent;
          color:#8a9bb0; font-family:Inter,sans-serif;
          font-size:.875rem; font-weight:500; letter-spacing:.08em;
          padding:14px 0 14px 16px; cursor:pointer;
          transition:color .2s,border-color .2s,padding-left .2s;
          animation:ww-menu-in .4s ease forwards; opacity:0;
        }
        .ww-menu-item:hover:not(.ww-menu-disabled) {
          color:#e2c97e; border-left-color:#e2c97e; padding-left:24px;
        }
        .ww-menu-primary { color:#c4a85e; }
        .ww-menu-primary:hover:not(.ww-menu-disabled) { color:#f0d070; }
        .ww-menu-disabled { color:#2a3a48; cursor:default; opacity:.5; }
        .ww-menu-item:focus-visible { outline:1px solid #e2c97e; outline-offset:2px; }

        @keyframes ww-menu-in {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes ww-mm-mist {
          0%,100% { transform:scale(1); opacity:.7; }
          50%      { transform:scale(1.03); opacity:1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.MainMenuUI = new MainMenuUI();

})();
