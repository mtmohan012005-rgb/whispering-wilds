// ============================================================================
// THE WHISPERING WILDS - PRODUCTION PAUSE MENU UI
// RESUME / SAVE / LOAD CHECKPOINT / SETTINGS / CONTROLS / PHOTO MODE /
// RETURN TO MAIN MENU
// Replaces the existing stub without duplicating settings logic.
// ============================================================================

(function () {
  'use strict';

  class PauseMenuUI {
    constructor() {
      this._container = null;
      this._visible   = false;
      this._reason    = null;
    }

    show(options = {}) {
      if (this._visible) return;
      this._visible = true;
      this._reason  = options.reason || 'manual';

      const panel = this._build();
      this._container = panel;
      document.body.appendChild(panel);
      requestAnimationFrame(() => { panel.style.opacity = '1'; });
    }

    hide() {
      if (!this._visible || !this._container) return;
      this._visible = false;
      this._container.style.opacity = '0';
      setTimeout(() => {
        this._container?.remove();
        this._container = null;
      }, 300);
    }

    isVisible() { return this._visible; }

    // -------------------------------------------------------------------------
    // PRIVATE: Build UI
    // -------------------------------------------------------------------------
    _build() {
      const overlay = document.createElement('div');
      overlay.id = 'ww-pause-menu';
      overlay.style.cssText = [
        'position:fixed;inset:0;z-index:7500;',
        'display:flex;align-items:center;justify-content:flex-end;',
        'background:rgba(5,8,14,.7);backdrop-filter:blur(8px);',
        'font-family:"Inter",sans-serif;',
        'opacity:0;transition:opacity .3s ease;'
      ].join('');

      const panel = document.createElement('div');
      panel.style.cssText = [
        'width:300px;height:100%;',
        'background:rgba(8,12,20,.98);',
        'border-left:1px solid rgba(226,201,126,.15);',
        'display:flex;flex-direction:column;',
        'justify-content:center;padding:48px 36px;',
        'box-shadow:-20px 0 60px rgba(0,0,0,.5);'
      ].join('');

      // PAUSED label
      const label = document.createElement('div');
      label.style.cssText = 'font-size:.65rem;letter-spacing:.3em;color:#4a6070;margin-bottom:8px;';
      label.textContent = 'PAUSED';
      panel.appendChild(label);

      // Region name
      const regionEl = document.createElement('div');
      regionEl.style.cssText = 'font-size:1rem;color:#e2c97e;font-weight:600;margin-bottom:32px;letter-spacing:.05em;';
      regionEl.textContent = this._getRegionDisplayName();
      panel.appendChild(regionEl);

      // Play time
      const playTime = document.createElement('div');
      playTime.style.cssText = 'font-size:.7rem;color:#3a5060;margin-bottom:32px;';
      playTime.textContent = `Play time: ${window.SessionManager?.getFormattedPlayTime() || '—'}`;
      panel.appendChild(playTime);

      const items = [
        { id: 'resume',    label: 'RESUME',               primary: true,  action: () => this._onResume() },
        { id: 'save',      label: 'SAVE GAME',             primary: false, action: () => this._onSave() },
        { id: 'checkpoint',label: 'LOAD CHECKPOINT',       primary: false, action: () => this._onLoadCheckpoint() },
        { id: 'settings',  label: 'SETTINGS',              primary: false, action: () => this._onSettings() },
        { id: 'controls',  label: 'CONTROLS',              primary: false, action: () => this._onControls() },
        { id: 'photo',     label: 'PHOTO MODE',            primary: false, action: () => this._onPhotoMode() },
        { id: 'menu',      label: 'RETURN TO MAIN MENU',   primary: false, action: () => this._onReturnToMenu(), danger: true }
      ];

      items.forEach(item => {
        const btn = document.createElement('button');
        btn.id = `ww-pause-${item.id}`;
        btn.style.cssText = [
          'display:block;width:100%;text-align:left;',
          'background:transparent;border:none;',
          `color:${item.danger ? '#c0392b' : item.primary ? '#e2c97e' : '#7a9aaa'};`,
          'font-family:Inter,sans-serif;font-size:.8rem;',
          'font-weight:500;letter-spacing:.08em;',
          'padding:12px 0 12px 0;border-left:2px solid transparent;',
          'cursor:pointer;transition:color .2s,border-color .2s,padding-left .2s;'
        ].join('');
        btn.textContent = item.label;
        btn.addEventListener('click', item.action);
        btn.addEventListener('mouseenter', () => {
          btn.style.borderLeftColor = item.danger ? '#c0392b' : '#e2c97e';
          btn.style.paddingLeft = '12px';
          btn.style.color = item.danger ? '#e74c3c' : '#e2c97e';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderLeftColor = 'transparent';
          btn.style.paddingLeft = '0';
          btn.style.color = item.danger ? '#c0392b' : item.primary ? '#e2c97e' : '#7a9aaa';
        });
        panel.appendChild(btn);
      });

      // Developer diagnostics (F3 — debug only)
      if (window.location.search.includes('dev=true')) {
        const devBtn = document.createElement('button');
        devBtn.style.cssText = 'margin-top:24px;font-size:.65rem;color:#2a3a48;background:none;border:none;cursor:pointer;text-align:left;';
        devBtn.textContent = '[F3] Lifecycle State';
        devBtn.addEventListener('click', () => {
          console.log('[DEV] Lifecycle:', window.GameLifecycle?.getDiagnostics());
          console.log('[DEV] Session:', window.SessionManager?.getDiagnostics());
          console.log('[DEV] Checkpoint:', window.CheckpointSystem?.getDiagnostics());
        });
        panel.appendChild(devBtn);
      }

      overlay.appendChild(panel);
      return overlay;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Actions
    // -------------------------------------------------------------------------
    _onResume() {
      window.PauseSystem?.resume();
    }

    _onSave() {
      const ok = window.SessionSaveSystem?.manualSave();
      if (ok) {
        // Brief visual feedback — keep menu open
        const btn = document.getElementById('ww-pause-save');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✓ SAVED';
          setTimeout(() => { if (btn) btn.textContent = orig; }, 2000);
        }
      }
    }

    _onLoadCheckpoint() {
      const sm = window.saveManager || window.gameSaveManager;
      const checkpoint = sm?.loadGame?.('checkpoint');
      if (!checkpoint) {
        const btn = document.getElementById('ww-pause-checkpoint');
        if (btn) { btn.textContent = 'NO CHECKPOINT'; setTimeout(() => { btn.textContent = 'LOAD CHECKPOINT'; }, 2000); }
        return;
      }
      window.ConfirmDialogUI?.show({
        title:        'Load Checkpoint?',
        message:      'Unsaved progress since the last checkpoint will be lost.',
        confirmLabel: 'LOAD CHECKPOINT',
        cancelLabel:  'CANCEL',
        onConfirm: () => {
          this.hide();
          const region = checkpoint.world?.currentRegion || 'george_town';
          window.GameLifecycle?.transitionTo('LOADING_GAME', { reason: 'load_checkpoint' });
          window.LoadingManager?.startLoad(region, { saveData: checkpoint });
        }
      });
    }

    _onSettings() {
      if (window.unifiedSettingsUI?.open) window.unifiedSettingsUI.open();
      else if (window.uiManager?.toggleModal) window.uiManager.toggleModal('SETTINGS');
    }

    _onControls() {
      if (window.uiManager?.toggleModal) window.uiManager.toggleModal('CONTROLS');
    }

    _onPhotoMode() {
      this.hide();
      window.PauseSystem?.resume();
      // Photo mode uses threeCanvas when 3D is active
      const photoUI = window.photoUI;
      if (photoUI?.open) photoUI.open();
      else if (window.uiManager?.toggleModal) window.uiManager.toggleModal('PHOTO');
    }

    _onReturnToMenu() {
      window.ConfirmDialogUI?.show({
        title:        'Return to Main Menu?',
        message:      'Any unsaved progress since the last checkpoint may be lost.',
        confirmLabel: 'RETURN TO MENU',
        cancelLabel:  'STAY',
        onConfirm: () => {
          this.hide();
          // Attempt save before exit
          const sm = window.saveManager || window.gameSaveManager;
          if (sm) { try { sm.saveGameImmediate('auto', 'return_to_menu'); } catch (_) {} }
          window.BootManager?.returnToMainMenu();
        }
      });
    }

    _getRegionDisplayName() {
      const region = window.GameState?.world?.currentRegion || 'george_town';
      const names = {
        george_town:    'George Town, Chennai',
        cauvery_delta:  'Cauvery Delta',
        pichavaram:     'Pichavaram Mangroves',
        chettinad:      'Chettinad',
        thanjavur:      'Thanjavur',
        mamallapuram:   'Mamallapuram',
        nilgiris:       'Nilgiri Mountains',
        final_sanctuary:'Pasumai Thadam'
      };
      return names[region] || region;
    }
  }

  window.PauseMenuUI = new PauseMenuUI();

})();
