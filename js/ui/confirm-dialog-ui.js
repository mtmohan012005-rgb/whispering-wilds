// ============================================================================
// THE WHISPERING WILDS - CONFIRM DIALOG UI
// Reusable confirmation modal. Used for New Game, Return to Menu, Quit, etc.
// ============================================================================

(function () {
  'use strict';

  class ConfirmDialogUI {
    constructor() {
      this._active = null;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: show({ title, message, confirmLabel, cancelLabel, dangerous, onConfirm, onCancel })
    // -------------------------------------------------------------------------
    show(options = {}) {
      // Only one at a time
      if (this._active) this._dismiss();

      const {
        title        = 'Are you sure?',
        message      = '',
        confirmLabel = 'CONFIRM',
        cancelLabel  = 'CANCEL',
        dangerous    = false,
        onConfirm,
        onCancel
      } = options;

      const overlay = document.createElement('div');
      overlay.id = 'ww-confirm-dialog';
      overlay.style.cssText = [
        'position:fixed;inset:0;z-index:9200;',
        'display:flex;align-items:center;justify-content:center;',
        'background:rgba(0,0,0,.7);backdrop-filter:blur(6px);',
        'font-family:Inter,sans-serif;',
        'animation:ww-dialog-in .2s ease forwards;'
      ].join('');

      const box = document.createElement('div');
      box.style.cssText = [
        'background:#0c1420;border:1px solid rgba(226,201,126,.2);',
        'border-radius:10px;padding:36px 40px;max-width:480px;width:90%;',
        'box-shadow:0 20px 80px rgba(0,0,0,.7);text-align:center;'
      ].join('');

      const titleEl = document.createElement('h3');
      titleEl.style.cssText = 'font-size:1.1rem;font-weight:600;color:#e2c97e;margin:0 0 12px;letter-spacing:.05em;';
      titleEl.textContent = title;
      box.appendChild(titleEl);

      if (message) {
        const msgEl = document.createElement('p');
        msgEl.style.cssText = 'font-size:.875rem;color:#7a9aaa;line-height:1.7;margin:0 0 28px;';
        msgEl.textContent = message;
        box.appendChild(msgEl);
      }

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'ww-confirm-cancel';
      cancelBtn.style.cssText = [
        'padding:10px 24px;border:1px solid #2a3a4a;background:transparent;',
        'color:#5a7080;font-family:Inter,sans-serif;font-size:.8rem;',
        'border-radius:6px;cursor:pointer;letter-spacing:.08em;',
        'transition:all .2s;'
      ].join('');
      cancelBtn.textContent = cancelLabel;
      cancelBtn.addEventListener('click', () => {
        this._dismiss();
        onCancel?.();
      });
      cancelBtn.addEventListener('mouseenter', () => { cancelBtn.style.borderColor='#5a7080'; cancelBtn.style.color='#8a9aaa'; });
      cancelBtn.addEventListener('mouseleave', () => { cancelBtn.style.borderColor='#2a3a4a'; cancelBtn.style.color='#5a7080'; });
      btnRow.appendChild(cancelBtn);

      const confirmBtn = document.createElement('button');
      confirmBtn.id = 'ww-confirm-ok';
      confirmBtn.style.cssText = [
        'padding:10px 24px;',
        `border:1px solid ${dangerous ? '#c0392b' : '#e2c97e'};`,
        'background:transparent;',
        `color:${dangerous ? '#c0392b' : '#e2c97e'};`,
        'font-family:Inter,sans-serif;font-size:.8rem;',
        'border-radius:6px;cursor:pointer;letter-spacing:.08em;',
        'transition:all .2s;'
      ].join('');
      confirmBtn.textContent = confirmLabel;
      confirmBtn.addEventListener('click', () => {
        this._dismiss();
        onConfirm?.();
      });
      const hoverBg = dangerous ? '#c0392b' : '#e2c97e';
      confirmBtn.addEventListener('mouseenter', () => { confirmBtn.style.background=hoverBg; confirmBtn.style.color='#0a0e14'; });
      confirmBtn.addEventListener('mouseleave', () => { confirmBtn.style.background='transparent'; confirmBtn.style.color=hoverBg; });
      btnRow.appendChild(confirmBtn);

      box.appendChild(btnRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      this._active = overlay;

      // Keyboard: Enter = confirm, Escape = cancel
      const keyHandler = (e) => {
        if (e.code === 'Enter')  { e.preventDefault(); this._dismiss(); onConfirm?.(); document.removeEventListener('keydown', keyHandler); }
        if (e.code === 'Escape') { e.preventDefault(); this._dismiss(); onCancel?.();  document.removeEventListener('keydown', keyHandler); }
      };
      document.addEventListener('keydown', keyHandler);

      // Focus confirm button
      setTimeout(() => confirmBtn.focus(), 100);

      this._injectStyles();
    }

    _dismiss() {
      this._active?.remove();
      this._active = null;
    }

    _injectStyles() {
      if (document.getElementById('ww-dialog-styles')) return;
      const style = document.createElement('style');
      style.id = 'ww-dialog-styles';
      style.textContent = `
        @keyframes ww-dialog-in {
          from { opacity:0; transform:scale(.95); }
          to   { opacity:1; transform:scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.ConfirmDialogUI = new ConfirmDialogUI();

})();
