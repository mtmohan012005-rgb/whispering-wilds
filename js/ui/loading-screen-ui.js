// ============================================================================
// THE WHISPERING WILDS - LOADING SCREEN UI
// Cinematic loading screen with region art, tip, and real progress bar.
// ============================================================================

(function () {
  'use strict';

  const REGION_DISPLAY = {
    george_town:    { name: 'GEORGE TOWN',    tamil: 'ஜார்ஜ் டவுன், சென்னை',      color: '#8b4513' },
    cauvery_delta:  { name: 'CAUVERY DELTA',  tamil: 'காவிரி டெல்டா',               color: '#2d6a3f' },
    pichavaram:     { name: 'PICHAVARAM',     tamil: 'பிச்சாவரம்',                  color: '#1a4a2e' },
    chettinad:      { name: 'CHETTINAD',      tamil: 'செட்டிநாடு',                  color: '#7a5c2e' },
    thanjavur:      { name: 'THANJAVUR',      tamil: 'தஞ்சாவூர்',                   color: '#6b3a1f' },
    mamallapuram:   { name: 'MAMALLAPURAM',   tamil: 'மாமல்லபுரம்',                color: '#2a5080' },
    nilgiris:       { name: 'NILGIRI MOUNTAINS', tamil: 'நீலகிரி மலைகள்',           color: '#1a3a28' },
    final_sanctuary:{ name: 'PASUMAI THADAM', tamil: 'பசுமை தடம்',                  color: '#0e2a1a' }
  };

  class LoadingScreenUI {
    constructor() {
      this._container = null;
      this._progressBar = null;
      this._stageLabel  = null;
      this._tipText     = null;
      this._tipIndex    = 0;
      this._tipInterval = null;
      this._visible     = false;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: show / hide / update
    // -------------------------------------------------------------------------
    show(regionId) {
      if (this._visible) return;
      this._visible = true;

      const info = REGION_DISPLAY[regionId] || { name: regionId.toUpperCase(), tamil: '', color: '#1a2a1a' };
      const tips = this._getTips();

      const screen = document.createElement('div');
      screen.id = 'ww-loading-screen';
      screen.style.cssText = [
        'position:fixed;inset:0;z-index:8800;',
        'display:flex;flex-direction:column;',
        'font-family:"Inter",sans-serif;overflow:hidden;',
        `background:linear-gradient(160deg,#050810 0%,${info.color}22 40%,#050810 100%);`,
        'opacity:0;transition:opacity .5s ease;'
      ].join('');

      // Background glow
      const glow = document.createElement('div');
      glow.style.cssText = [
        'position:absolute;inset:0;',
        `background:radial-gradient(ellipse at 50% 40%, ${info.color}33 0%, transparent 65%);`,
        'animation:ww-loading-pulse 3s ease-in-out infinite;'
      ].join('');
      screen.appendChild(glow);

      // Region name centred
      const nameArea = document.createElement('div');
      nameArea.style.cssText = [
        'flex:1;display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;position:relative;z-index:1;'
      ].join('');

      const tamilName = document.createElement('div');
      tamilName.style.cssText = 'font-size:1rem;letter-spacing:.3em;color:#4a6070;font-weight:300;margin-bottom:10px;';
      tamilName.textContent = info.tamil;
      nameArea.appendChild(tamilName);

      const regionName = document.createElement('h2');
      regionName.style.cssText = 'font-size:2.8rem;font-weight:700;letter-spacing:.15em;color:#e2c97e;margin:0;text-shadow:0 0 40px rgba(226,201,126,.3);';
      regionName.textContent = info.name;
      nameArea.appendChild(regionName);

      const divider = document.createElement('div');
      divider.style.cssText = 'width:60px;height:1px;background:#e2c97e44;margin:20px auto;';
      nameArea.appendChild(divider);

      // Tip
      this._tipText = document.createElement('div');
      this._tipText.style.cssText = 'font-size:.85rem;color:#6a7f90;max-width:480px;text-align:center;line-height:1.7;padding:0 20px;transition:opacity .4s;';
      this._tipText.textContent = `"${tips[0]}"`;
      nameArea.appendChild(this._tipText);

      screen.appendChild(nameArea);

      // Bottom loading area
      const bottom = document.createElement('div');
      bottom.style.cssText = 'position:relative;z-index:1;padding:0 60px 48px;';

      // Stage label
      this._stageLabel = document.createElement('div');
      this._stageLabel.style.cssText = 'font-size:.7rem;letter-spacing:.15em;color:#3a5060;margin-bottom:12px;text-align:right;';
      this._stageLabel.textContent = 'INITIALISING';
      bottom.appendChild(this._stageLabel);

      // Progress track
      const track = document.createElement('div');
      track.style.cssText = 'height:2px;background:rgba(226,201,126,.1);border-radius:1px;overflow:hidden;';

      this._progressBar = document.createElement('div');
      this._progressBar.style.cssText = [
        'height:100%;width:0%;',
        'background:linear-gradient(90deg,#c4903e,#e2c97e);',
        'transition:width .3s ease;border-radius:1px;',
        'box-shadow:0 0 8px rgba(226,201,126,.4);'
      ].join('');
      track.appendChild(this._progressBar);
      bottom.appendChild(track);

      // Pct label
      const pctLabel = document.createElement('div');
      pctLabel.id = 'ww-loading-pct';
      pctLabel.style.cssText = 'font-size:.7rem;color:#2a3a48;margin-top:8px;text-align:right;';
      pctLabel.textContent = '0%';
      bottom.appendChild(pctLabel);

      screen.appendChild(bottom);
      this._container = screen;

      document.body.appendChild(screen);
      requestAnimationFrame(() => { screen.style.opacity = '1'; });

      // Cycle tips
      let ti = 0;
      this._tipInterval = setInterval(() => {
        ti = (ti + 1) % tips.length;
        this._tipText.style.opacity = '0';
        setTimeout(() => {
          if (this._tipText) {
            this._tipText.textContent = `"${tips[ti]}"`;
            this._tipText.style.opacity = '1';
          }
        }, 400);
      }, 6000);

      this._injectStyles();
    }

    updateProgress(pct, stage) {
      if (!this._visible) return;
      if (this._progressBar) {
        this._progressBar.style.width = `${pct}%`;
      }
      const pctEl = document.getElementById('ww-loading-pct');
      if (pctEl) pctEl.textContent = `${pct}%`;

      if (this._stageLabel && stage) {
        this._stageLabel.textContent = stage.replace(/_/g, ' ');
      }
    }

    hide() {
      if (!this._visible || !this._container) return;
      this._visible = false;
      clearInterval(this._tipInterval);
      this._tipInterval = null;

      this._container.style.opacity = '0';
      setTimeout(() => {
        this._container?.remove();
        this._container   = null;
        this._progressBar = null;
        this._stageLabel  = null;
        this._tipText     = null;
      }, 600);
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Loading tips (authored)
    // -------------------------------------------------------------------------
    _getTips() {
      const lm = window.LocalizationManager;
      const tips = window.LOADING_DATA?.tips || [];
      if (tips.length > 0) {
        return tips.map(t => (lm?.t(t.key) || t.en));
      }
      // Fallback authored tips
      return [
        'Some discoveries are easier to notice after rain.',
        'Listen carefully near water channels.',
        'NPC routines change throughout the day.',
        'Rest at a campfire to recover energy overnight.',
        'Regional temperature affects how long you can explore.',
        'Complete side quests to unlock new regions.',
        'Check your journal for investigation clues.',
        'Photo Mode captures authentic Tamil Nadu wildlife.',
        'Kolam patterns appear fresh on festival mornings.',
        'Ask local traders before entering unknown territory.'
      ];
    }

    _injectStyles() {
      if (document.getElementById('ww-loading-styles')) return;
      const style = document.createElement('style');
      style.id = 'ww-loading-styles';
      style.textContent = `
        @keyframes ww-loading-pulse {
          0%,100% { opacity:.5; transform:scale(1); }
          50%      { opacity:.8; transform:scale(1.04); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.LoadingScreenUI = new LoadingScreenUI();

})();
