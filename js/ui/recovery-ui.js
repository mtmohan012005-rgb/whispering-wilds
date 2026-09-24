// ============================================================================
// THE WHISPERING WILDS - RECOVERY UI
// Displays: fatal boot errors, no-save messages, load failures,
// corrupted-save recovery, cloud conflict resolution, WebGL loss.
// ============================================================================

(function () {
  'use strict';

  class RecoveryUI {
    // -------------------------------------------------------------------------
    // PUBLIC: Error types
    // -------------------------------------------------------------------------
    showFatalError(message, options = {}) {
      this._showScreen({
        icon:    '⚠',
        title:   'Something went wrong',
        message: message || 'An unexpected error occurred during startup.',
        buttons: [
          options.canRetry ? { label:'RETRY', action: options.onRetry || (() => location.reload()), primary: true } : null,
          { label:'OK', action: () => {} }
        ].filter(Boolean)
      });
    }

    showNoSave() {
      this._showToast('No save data found. Start a new game to begin your journey.', 5000);
    }

    showLoadFailure(message, options = {}) {
      this._showScreen({
        icon:    '💾',
        title:   'Could not load save',
        message: message || 'An error occurred while loading your save data.',
        buttons: [
          { label:'RETRY',           action: options.onRetry,      primary: true },
          { label:'LOAD CHECKPOINT', action: options.onCheckpoint },
          { label:'MAIN MENU',       action: options.onMenu }
        ].filter(b => b.action)
      });
    }

    showWebGLUnsupported() {
      if (window.BootScreenUI) {
        window.BootScreenUI.showWebGLUnsupported();
        return;
      }
      this._showScreen({
        icon:    '🖥',
        title:   'Graphics Not Supported',
        message: 'Your browser does not support WebGL 3D graphics. Please use Chrome, Edge, or Firefox.',
        buttons: [
          { label:'RETRY', action: () => location.reload(), primary: true },
          { label:'HELP',  action: () => window.open('https://get.webgl.org/', '_blank') }
        ]
      });
    }

    showWebGLLoss(handlers) {
      this._showScreen({
        icon:    '⚡',
        title:   'Graphics Connection Lost',
        message: 'The 3D graphics renderer encountered an error. Your progress has been saved.',
        buttons: [
          { label:'RETRY',          action: handlers?.onRetry,    primary: true },
          { label:'SAFE MODE',      action: handlers?.onSafeMode },
          { label:'RETURN TO MENU', action: () => window.BootManager?.returnToMainMenu() }
        ].filter(b => b.action)
      });
    }

    showCloudConflict({ local, cloud, onSelectLocal, onSelectCloud, onMerge }) {
      const root = document.createElement('div');
      root.id = 'ww-cloud-conflict';
      root.style.cssText = [
        'position:fixed;inset:0;z-index:9300;',
        'background:rgba(5,8,14,.97);display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'font-family:Inter,sans-serif;padding:40px;'
      ].join('');

      root.innerHTML = `
        <h2 style="color:#e2c97e;font-size:1.2rem;margin-bottom:8px;">Save Conflict Detected</h2>
        <p style="color:#7a9aaa;font-size:.875rem;max-width:520px;text-align:center;margin-bottom:32px;line-height:1.7;">
          Your local save and cloud save are different. Choose which one to keep.
        </p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
          ${this._conflictCard('Local Save', local, 'ww-conflict-local')}
          ${this._conflictCard('Cloud Save', cloud, 'ww-conflict-cloud')}
        </div>
        <button id="ww-conflict-merge" style="margin-top:24px;padding:8px 24px;border:1px solid #3a5060;background:transparent;color:#6a8a9a;font-family:Inter,sans-serif;font-size:.75rem;border-radius:6px;cursor:pointer;">MERGE BOTH (recommended)</button>
      `;

      document.body.appendChild(root);

      document.getElementById('ww-conflict-local')?.addEventListener('click', () => { root.remove(); onSelectLocal?.(); });
      document.getElementById('ww-conflict-cloud')?.addEventListener('click', () => { root.remove(); onSelectCloud?.(); });
      document.getElementById('ww-conflict-merge')?.addEventListener('click', () => { root.remove(); onMerge?.(); });
    }

    // -------------------------------------------------------------------------
    // PRIVATE
    // -------------------------------------------------------------------------
    _conflictCard(label, info, btnId) {
      const ts  = info.timestamp ? new Date(info.timestamp).toLocaleString('en-IN') : '—';
      return `
        <div style="background:rgba(10,18,28,.9);border:1px solid rgba(226,201,126,.15);border-radius:8px;padding:20px 24px;min-width:220px;text-align:left;">
          <div style="color:#4a6070;font-size:.65rem;letter-spacing:.2em;margin-bottom:10px;">${label.toUpperCase()}</div>
          <div style="color:#c8d0d8;font-size:.85rem;margin-bottom:4px;">${info.region}</div>
          <div style="color:#6a8090;font-size:.75rem;margin-bottom:4px;">${ts}</div>
          <div style="color:#4a6070;font-size:.72rem;">${info.playTime ? Math.round(info.playTime / 60000) + ' min play time' : ''}</div>
          <button id="${btnId}" style="margin-top:16px;width:100%;padding:8px 0;border:1px solid #e2c97e;background:transparent;color:#e2c97e;font-family:Inter,sans-serif;font-size:.75rem;border-radius:4px;cursor:pointer;">USE THIS</button>
        </div>
      `;
    }

    _showScreen({ icon, title, message, buttons }) {
      // Remove any existing recovery screen
      document.getElementById('ww-recovery-screen')?.remove();

      const screen = document.createElement('div');
      screen.id = 'ww-recovery-screen';
      screen.style.cssText = [
        'position:fixed;inset:0;z-index:9250;',
        'background:rgba(5,8,14,.98);display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'font-family:Inter,sans-serif;color:#e2c97e;text-align:center;padding:40px;'
      ].join('');

      screen.innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:16px;">${icon}</div>
        <h2 style="font-size:1.3rem;font-weight:600;margin:0 0 12px;letter-spacing:.06em;">${title}</h2>
        <p style="color:#7a9aaa;max-width:480px;line-height:1.7;font-size:.9rem;margin:0 0 32px;">${message}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;" id="ww-recovery-btns"></div>
      `;

      document.body.appendChild(screen);

      const btnContainer = screen.querySelector('#ww-recovery-btns');
      buttons.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.style.cssText = [
          'padding:10px 28px;',
          `border:1px solid ${b.primary ? '#e2c97e' : '#2a3a48'};`,
          'background:transparent;',
          `color:${b.primary ? '#e2c97e' : '#4a6070'};`,
          'font-family:Inter,sans-serif;font-size:.8rem;',
          'border-radius:6px;cursor:pointer;letter-spacing:.08em;',
          'transition:all .2s;'
        ].join('');
        btn.textContent = b.label;
        btn.addEventListener('click', () => { screen.remove(); b.action?.(); });
        btn.addEventListener('mouseenter', () => { btn.style.background=b.primary?'#e2c97e':'#2a3a48'; btn.style.color='#0a0e14'; });
        btn.addEventListener('mouseleave', () => { btn.style.background='transparent'; btn.style.color=b.primary?'#e2c97e':'#4a6070'; });
        btnContainer.appendChild(btn);
      });
    }

    _showToast(msg, ms = 4000) {
      const t = document.createElement('div');
      t.style.cssText = [
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);',
        'background:rgba(10,18,28,.95);border:1px solid rgba(226,201,126,.2);',
        'color:#c8d0d8;font-family:Inter,sans-serif;font-size:.85rem;',
        'padding:12px 24px;border-radius:6px;z-index:9000;',
        'animation:ww-toast-in .3s ease;'
      ].join('');
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), ms);
    }
  }

  window.RecoveryUI = new RecoveryUI();

})();
