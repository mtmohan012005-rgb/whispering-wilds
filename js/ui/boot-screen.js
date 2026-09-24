// ============================================================================
// THE WHISPERING WILDS - BOOT SCREEN UI
// Cinematic splash screen + WebGL validation error display.
// ============================================================================

(function () {
  'use strict';

  class BootScreenUI {
    constructor() {
      this._splashShown = false;
      this._container   = null;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Show cinematic splash, then call onComplete
    // -------------------------------------------------------------------------
    showSplash(onComplete) {
      if (this._splashShown) { onComplete?.(); return; }
      this._splashShown = true;

      const splash = document.createElement('div');
      splash.id = 'ww-splash-screen';
      splash.setAttribute('role', 'presentation');
      splash.style.cssText = [
        'position:fixed;inset:0;z-index:9000;',
        'background:#0a0e14;display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'font-family:"Inter",sans-serif;overflow:hidden;',
        'transition:opacity .8s ease;'
      ].join('');

      // Background mist effect
      const mist = document.createElement('div');
      mist.style.cssText = [
        'position:absolute;inset:0;',
        'background:radial-gradient(ellipse at 50% 60%, rgba(30,60,80,.4) 0%, transparent 70%);',
        'animation:ww-mist-pulse 6s ease-in-out infinite;'
      ].join('');
      splash.appendChild(mist);

      // Tamil script
      const tamilTitle = document.createElement('div');
      tamilTitle.style.cssText = [
        'position:relative;z-index:1;',
        'font-size:1.1rem;letter-spacing:.3em;color:#6b7f94;',
        'margin-bottom:12px;font-weight:300;',
        'animation:ww-fade-up .8s ease forwards;opacity:0;animation-delay:.3s;'
      ].join('');
      tamilTitle.textContent = 'காட்டு வழி • தடம்';
      splash.appendChild(tamilTitle);

      // Main title
      const mainTitle = document.createElement('h1');
      mainTitle.style.cssText = [
        'position:relative;z-index:1;',
        'font-size:3rem;font-weight:700;letter-spacing:.12em;',
        'color:#e2c97e;margin:0 0 8px;text-align:center;',
        'animation:ww-fade-up .8s ease forwards;opacity:0;animation-delay:.6s;',
        'text-shadow:0 0 40px rgba(226,201,126,.3);'
      ].join('');
      mainTitle.textContent = 'THE WHISPERING WILDS';
      splash.appendChild(mainTitle);

      // Subtitle
      const subtitle = document.createElement('div');
      subtitle.style.cssText = [
        'position:relative;z-index:1;',
        'font-size:.85rem;color:#5a7090;letter-spacing:.2em;',
        'font-weight:400;margin-top:4px;',
        'animation:ww-fade-up .8s ease forwards;opacity:0;animation-delay:.9s;'
      ].join('');
      subtitle.textContent = 'AN OPEN-WORLD EXPLORATION OF TAMIL NADU';
      splash.appendChild(subtitle);

      // Skip button
      const skipBtn = document.createElement('button');
      skipBtn.id = 'ww-splash-skip';
      skipBtn.style.cssText = [
        'position:absolute;bottom:32px;right:40px;',
        'background:transparent;border:1px solid #2a3a4a;',
        'color:#4a6070;font-family:Inter,sans-serif;font-size:.75rem;',
        'padding:6px 16px;border-radius:4px;cursor:pointer;',
        'letter-spacing:.08em;transition:all .2s;',
        'animation:ww-fade-up .5s ease forwards;opacity:0;animation-delay:1.2s;'
      ].join('');
      skipBtn.textContent = 'SKIP';
      skipBtn.setAttribute('aria-label', 'Skip splash screen');
      skipBtn.addEventListener('mouseenter', () => {
        skipBtn.style.borderColor = '#e2c97e';
        skipBtn.style.color = '#e2c97e';
      });
      skipBtn.addEventListener('mouseleave', () => {
        skipBtn.style.borderColor = '#2a3a4a';
        skipBtn.style.color = '#4a6070';
      });
      splash.appendChild(skipBtn);

      // Inject CSS animations
      this._injectSplashStyles();

      document.body.appendChild(splash);

      const dismiss = () => {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.remove();
          onComplete?.();
        }, 900);
      };

      skipBtn.addEventListener('click', dismiss);

      // Auto-dismiss after 3.5 seconds
      setTimeout(dismiss, 3500);
    }

    // -------------------------------------------------------------------------
    // PUBLIC: WebGL not supported
    // -------------------------------------------------------------------------
    showWebGLUnsupported() {
      this._showErrorScreen(
        'Graphics Not Supported',
        'Your browser or graphics environment does not support the required 3D features. ' +
        'Please use Chrome, Edge, or Firefox with WebGL enabled.',
        [
          { label: 'Retry',          action: () => location.reload() },
          { label: 'Graphics Help',  action: () => window.open('https://get.webgl.org/', '_blank') }
        ]
      );
    }

    // -------------------------------------------------------------------------
    // PUBLIC: WebGL context lost during gameplay
    // -------------------------------------------------------------------------
    showWebGLLoss(handlers) {
      this._showErrorScreen(
        'Graphics Connection Lost',
        'The 3D graphics connection was interrupted. Your progress has been saved.',
        [
          { label: 'Retry',          action: handlers?.onRetry },
          { label: 'Safe Mode',      action: handlers?.onSafeMode },
          { label: 'Return to Menu', action: () => window.BootManager?.returnToMainMenu() }
        ]
      );
    }

    // -------------------------------------------------------------------------
    // PRIVATE
    // -------------------------------------------------------------------------
    _showErrorScreen(title, message, buttons) {
      const screen = document.createElement('div');
      screen.id = 'ww-error-screen';
      screen.style.cssText = [
        'position:fixed;inset:0;z-index:9999;',
        'background:#0a0e14;display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'font-family:Inter,sans-serif;color:#e2c97e;padding:40px;text-align:center;'
      ].join('');

      const h1 = document.createElement('h1');
      h1.style.cssText = 'font-size:1.6rem;margin:0 0 16px;font-weight:600;';
      h1.textContent = title;
      screen.appendChild(h1);

      const p = document.createElement('p');
      p.style.cssText = 'color:#8a9bb0;max-width:520px;line-height:1.7;margin:0 0 32px;font-size:.95rem;';
      p.textContent = message;
      screen.appendChild(p);

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.style.cssText = [
          'padding:10px 28px;border:1px solid #e2c97e;',
          'background:transparent;color:#e2c97e;',
          'font-family:Inter,sans-serif;font-size:.875rem;',
          'border-radius:6px;cursor:pointer;letter-spacing:.06em;',
          'transition:background .2s,color .2s;'
        ].join('');
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
          screen.remove();
          b.action?.();
        });
        btn.addEventListener('mouseenter', () => { btn.style.background='#e2c97e'; btn.style.color='#0a0e14'; });
        btn.addEventListener('mouseleave', () => { btn.style.background='transparent'; btn.style.color='#e2c97e'; });
        btnRow.appendChild(btn);
      });
      screen.appendChild(btnRow);

      document.body.appendChild(screen);
    }

    _injectSplashStyles() {
      if (document.getElementById('ww-splash-styles')) return;
      const style = document.createElement('style');
      style.id = 'ww-splash-styles';
      style.textContent = `
        @keyframes ww-fade-up {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes ww-mist-pulse {
          0%,100% { opacity:.6; transform:scale(1); }
          50%      { opacity:1; transform:scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.BootScreenUI = new BootScreenUI();

})();
