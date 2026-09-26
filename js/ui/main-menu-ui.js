// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PC MAIN MENU UI
// Full-screen production PC main menu:
// CONTINUE / NEW GAME / LOAD GAME / SETTINGS / CREDITS / QUIT
// Rotating high-res regional backgrounds with Ken Burns crossfades,
// official game logo, full gamepad/keyboard navigation, audio feedback,
// player setup & character preview, prologue flow, and offline indicator.
// ============================================================================

(function () {
  'use strict';

  const MENU_ARTWORKS = [
    { id: 'chennai',      url: 'assets/ui/menu/menu-chennai.jpg',      label: 'George Town, Chennai',       tamil: 'ஜார்ஜ் டவுன் • சென்னை' },
    { id: 'pichavaram',   url: 'assets/ui/menu/menu-pichavaram.jpg',   label: 'Pichavaram Mangrove Canals',  tamil: 'பிச்சாவரம் அலையாத்தி காடுகள்' },
    { id: 'chettinad',    url: 'assets/ui/menu/menu-chettinad.jpg',    label: 'Chettinad Heritage Mansions', tamil: 'செட்டிநாடு பாரம்பரியம்' },
    { id: 'mamallapuram', url: 'assets/ui/menu/menu-mamallapuram.jpg', label: 'Mamallapuram Shore Temple',   tamil: 'மாமல்லபுரம் கடற்கரை கோவில்' },
    { id: 'nilgiris',     url: 'assets/ui/menu/menu-nilgiris.jpg',     label: 'Nilgiri Mountain Sholas',     tamil: 'நீலகிரி மலைக்காடுகள்' },
    { id: 'delta',        url: 'assets/ui/menu/menu-delta.jpg',        label: 'Cauvery River Delta',         tamil: 'காவிரி டெல்டா வயல்வெளி' }
  ];

  class MainMenuUI {
    constructor() {
      this._container = null;
      this._visible   = false;
      this._bgIndex   = 0;
      this._bgInterval = null;
      this._gamepadPollInterval = null;
      this._selectedIndex = 0;
      this._menuButtons = [];
      this._preloadedImages = new Map();
      this._preloadArtworks();
    }

    _preloadArtworks() {
      MENU_ARTWORKS.slice(0, 3).forEach(art => {
        const img = new Image();
        img.src = art.url;
        this._preloadedImages.set(art.id, img);
      });
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
        this._startBackgroundCarousel();
        this._startGamepadPolling();
        return;
      }
      this._visible = true;

      // Clean up any lingering prologue modal or title screen
      const titleScreen = document.getElementById('title-screen');
      if (titleScreen) {
        titleScreen.classList.add('hidden');
      }

      // Stop gameplay audio, start menu ambience
      if (window.gameAudio?.startMenuAmbience) {
        window.gameAudio.startMenuAmbience();
      } else if (window.audioManager?.dynamicMusic?.setMenuMode) {
        window.audioManager.dynamicMusic.setMenuMode(true);
      }

      this._container = this._buildMenu();
      document.body.appendChild(this._container);

      // Animate in
      requestAnimationFrame(() => {
        if (this._container) this._container.style.opacity = '1';
      });

      this._startBackgroundCarousel();
      this._startGamepadPolling();
      this._bindKeyboardNavigation();

      // Check crash recovery offer
      if (window.SessionManager?.hadIncompleteSession()) {
        setTimeout(() => this._showRecoveryOffer(), 800);
      }
    }

    hide() {
      this._visible = false;
      this._stopBackgroundCarousel();
      this._stopGamepadPolling();
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
    // PRIVATE: Build Menu DOM
    // -------------------------------------------------------------------------
    _buildMenu() {
      const root = document.createElement('div');
      root.id = 'ww-main-menu';
      root.setAttribute('role', 'main');
      root.style.cssText = [
        'position:fixed;inset:0;z-index:8500;',
        'display:flex;flex-direction:row;',
        'font-family:"Inter","Outfit",sans-serif;',
        'opacity:0;transition:opacity .6s ease;',
        'background:#070b12;overflow:hidden;'
      ].join('');

      // Background Crossfade Containers
      const bgLayer1 = document.createElement('div');
      bgLayer1.id = 'ww-menu-bg-1';
      bgLayer1.className = 'ww-menu-bg active';
      bgLayer1.style.backgroundImage = `url("${MENU_ARTWORKS[0].url}")`;

      const bgLayer2 = document.createElement('div');
      bgLayer2.id = 'ww-menu-bg-2';
      bgLayer2.className = 'ww-menu-bg';

      root.appendChild(bgLayer1);
      root.appendChild(bgLayer2);

      // Readability Vignette Overlay
      const vignette = document.createElement('div');
      vignette.id = 'ww-menu-vignette';
      root.appendChild(vignette);

      // Environmental Mist Layer
      const mist = document.createElement('div');
      mist.className = 'ww-menu-mist';
      root.appendChild(mist);

      // Left Branding & Atmospheric Area
      const leftArea = document.createElement('div');
      leftArea.className = 'ww-menu-left-area';

      // Logo + Typography
      const branding = document.createElement('div');
      branding.className = 'ww-menu-branding';

      branding.innerHTML = `
        <div class="ww-logo-container">
          <img src="assets/ui/logo/whispering-wilds-logo.png" 
               alt="The Whispering Wilds Logo" 
               class="ww-menu-logo-img" 
               onerror="this.style.display='none'; document.getElementById('ww-title-fallback').style.display='block';">
          <h1 id="ww-title-fallback" class="ww-menu-title-fallback" style="display:none;">THE WHISPERING WILDS</h1>
        </div>
        <div class="ww-menu-tamil-title">காட்டு வழி • தடம்</div>
        <div class="ww-menu-tagline">AN OPEN-WORLD NARRATIVE EXPLORATION OF TAMIL NADU</div>
      `;
      leftArea.appendChild(branding);

      // Regional Location Caption at Bottom Left
      const caption = document.createElement('div');
      caption.id = 'ww-menu-caption';
      caption.className = 'ww-menu-caption';
      caption.innerHTML = `📍 <span>${MENU_ARTWORKS[0].label}</span> <span class="tamil-label">• ${MENU_ARTWORKS[0].tamil}</span>`;
      leftArea.appendChild(caption);

      root.appendChild(leftArea);

      // Right Menu Panel
      const rightPanel = document.createElement('div');
      rightPanel.className = 'ww-menu-right-panel';

      const navHeader = document.createElement('div');
      navHeader.className = 'ww-menu-nav-header';
      navHeader.innerHTML = `
        <span class="nav-title">MAIN MENU</span>
        <span class="nav-tamil">முதன்மை பட்டியல்</span>
      `;
      rightPanel.appendChild(navHeader);

      // Menu Buttons List
      const btnList = document.createElement('div');
      btnList.className = 'ww-menu-btn-list';

      const hasSave = this._hasValidSave();
      const saveInfo = hasSave ? this._getLastSaveInfo() : 'No save found';

      const menuItems = [
        {
          id: 'continue',
          label: 'CONTINUE',
          tamil: 'தொடர்க',
          subtitle: hasSave ? saveInfo : 'No existing save file',
          enabled: hasSave,
          primary: true,
          action: () => this._onContinue()
        },
        {
          id: 'new_game',
          label: 'NEW GAME',
          tamil: 'புதிய பயணம்',
          subtitle: 'Start an authored expedition from George Town',
          enabled: true,
          primary: true,
          action: () => this._onNewGame()
        },
        {
          id: 'load_game',
          label: 'LOAD GAME',
          tamil: 'சேமிப்பை திறக்க',
          subtitle: 'Select from available save slots & profiles',
          enabled: hasSave,
          primary: false,
          action: () => this._onLoadGame()
        },
        {
          id: 'settings',
          label: 'SETTINGS',
          tamil: 'அமைப்புகள்',
          subtitle: 'Display, Audio, Controls & Replay Introduction',
          enabled: true,
          primary: false,
          action: () => this._onSettings()
        },
        {
          id: 'credits',
          label: 'CREDITS',
          tamil: 'பங்களிப்பாளர்கள்',
          subtitle: 'Cultural research, development & special thanks',
          enabled: true,
          primary: false,
          action: () => this._onCredits()
        },
        {
          id: 'quit',
          label: 'QUIT',
          tamil: 'வெளியேறு',
          subtitle: 'Safe exit with state confirmation',
          enabled: true,
          primary: false,
          action: () => this._onQuit()
        }
      ];

      this._menuButtons = [];
      menuItems.forEach((item, idx) => {
        const btn = this._buildMenuItem(item, idx);
        this._menuButtons.push(btn);
        btnList.appendChild(btn);
      });
      rightPanel.appendChild(btnList);

      // Extras / Secondary Options
      const extrasArea = document.createElement('div');
      extrasArea.className = 'ww-menu-extras';
      extrasArea.innerHTML = `
        <button id="ww-coop-btn" class="ww-extra-btn" title="Multiplayer Co-op Lobby">
          👥 Co-op Expedition (Max 5P)
        </button>
        <button id="ww-replay-intro-btn" class="ww-extra-btn" title="Replay the Madras High Court Inciting Incident">
          📜 Replay Prologue
        </button>
      `;
      rightPanel.appendChild(extrasArea);

      // Status Footer
      const footer = document.createElement('div');
      footer.className = 'ww-menu-footer';
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      footer.innerHTML = `
        <div class="status-indicator">
          <span class="status-dot ${isOnline ? 'online' : 'offline'}"></span>
          <span>Single-Player: Available (${isOnline ? 'Online' : 'Offline / Standalone'})</span>
        </div>
        <div class="version-label">v1.0.0 PC Release • 60 FPS Engine</div>
      `;
      rightPanel.appendChild(footer);

      root.appendChild(rightPanel);

      // Wire Extras Buttons
      setTimeout(() => {
        const coopBtn = root.querySelector('#ww-coop-btn');
        if (coopBtn) {
          coopBtn.addEventListener('click', () => this._onCoopClick());
        }
        const replayIntroBtn = root.querySelector('#ww-replay-intro-btn');
        if (replayIntroBtn) {
          replayIntroBtn.addEventListener('click', () => this._showPrologueModal({ isReplay: true }));
        }
      }, 0);

      this._injectMenuStyles();
      return root;
    }

    _buildMenuItem({ id, label, tamil, subtitle, enabled, primary, action }, idx) {
      const btn = document.createElement('button');
      btn.id = `ww-menu-${id.replace('_', '-')}`;
      btn.dataset.id = id;
      btn.className = `ww-menu-item${primary ? ' ww-menu-primary' : ''}${!enabled ? ' ww-menu-disabled' : ''}`;
      btn.disabled = !enabled;
      btn.setAttribute('tabindex', enabled ? '0' : '-1');
      btn.style.animationDelay = `${idx * 50}ms`;

      btn.innerHTML = `
        <div class="btn-main-row">
          <span class="btn-label">${label}</span>
          <span class="btn-tamil">${tamil}</span>
        </div>
        <div class="btn-subtext">${subtitle}</div>
      `;

      if (enabled) {
        btn.addEventListener('mouseenter', () => {
          this._playSound('hover');
          this._setSelection(idx);
        });
        btn.addEventListener('click', () => {
          this._playSound('select');
          action();
        });
      }

      return btn;
    }

    _setSelection(index) {
      this._selectedIndex = index;
      this._menuButtons.forEach((b, i) => {
        if (i === index) b.classList.add('ww-focused');
        else b.classList.remove('ww-focused');
      });
    }

    // -------------------------------------------------------------------------
    // BACKGROUND CAROUSEL (Ken Burns, Crossfade & Next Preload)
    // -------------------------------------------------------------------------
    _startBackgroundCarousel() {
      this._stopBackgroundCarousel();
      this._bgInterval = setInterval(() => {
        this._transitionBackground();
      }, 9500);
    }

    _stopBackgroundCarousel() {
      if (this._bgInterval) {
        clearInterval(this._bgInterval);
        this._bgInterval = null;
      }
    }

    _transitionBackground() {
      if (!this._visible || !this._container) return;
      const bg1 = document.getElementById('ww-menu-bg-1');
      const bg2 = document.getElementById('ww-menu-bg-2');
      if (!bg1 || !bg2) return;

      this._bgIndex = (this._bgIndex + 1) % MENU_ARTWORKS.length;
      const nextArt = MENU_ARTWORKS[this._bgIndex];

      // Preload image after next
      const lookahead = MENU_ARTWORKS[(this._bgIndex + 1) % MENU_ARTWORKS.length];
      if (!this._preloadedImages.has(lookahead.id)) {
        const img = new Image();
        img.src = lookahead.url;
        this._preloadedImages.set(lookahead.id, img);
      }

      const activeBg = bg1.classList.contains('active') ? bg1 : bg2;
      const nextBg   = activeBg === bg1 ? bg2 : bg1;

      nextBg.style.backgroundImage = `url("${nextArt.url}")`;
      nextBg.classList.add('active');
      activeBg.classList.remove('active');

      const caption = document.getElementById('ww-menu-caption');
      if (caption) {
        caption.innerHTML = `📍 <span>${nextArt.label}</span> <span class="tamil-label">• ${nextArt.tamil}</span>`;
      }
    }

    // -------------------------------------------------------------------------
    // INPUT: KEYBOARD & CONTROLLER NAVIGATION
    // -------------------------------------------------------------------------
    _bindKeyboardNavigation() {
      const handleKey = (e) => {
        if (!this._visible) return;
        // Don't intercept if modal overlay is open
        if (document.getElementById('ww-confirm-dialog') || 
            document.getElementById('ww-setup-modal') ||
            document.getElementById('ww-prologue-modal')) {
          return;
        }

        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          this._navigateMenu(1);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          this._navigateMenu(-1);
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          const btn = this._menuButtons[this._selectedIndex];
          if (btn && !btn.disabled) btn.click();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          this._onQuit();
        }
      };

      window.addEventListener('keydown', handleKey);
      this._keyHandler = handleKey;
    }

    _navigateMenu(delta) {
      const total = this._menuButtons.length;
      let next = this._selectedIndex;
      for (let i = 0; i < total; i++) {
        next = (next + delta + total) % total;
        if (!this._menuButtons[next].disabled) {
          this._setSelection(next);
          this._menuButtons[next].focus();
          this._playSound('hover');
          break;
        }
      }
    }

    _startGamepadPolling() {
      this._stopGamepadPolling();
      let lastDpad = { up: false, down: false, a: false, b: false };

      const poll = () => {
        if (!this._visible) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (gp) {
          const dpadUp = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
          const dpadDown = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
          const btnA = gp.buttons[0]?.pressed;
          const btnB = gp.buttons[1]?.pressed;

          if (dpadDown && !lastDpad.down) this._navigateMenu(1);
          if (dpadUp && !lastDpad.up) this._navigateMenu(-1);
          if (btnA && !lastDpad.a) {
            const btn = this._menuButtons[this._selectedIndex];
            if (btn && !btn.disabled) btn.click();
          }
          if (btnB && !lastDpad.b) this._onQuit();

          lastDpad = { up: dpadUp, down: dpadDown, a: btnA, b: btnB };
        }
      };

      this._gamepadPollInterval = setInterval(poll, 60);
    }

    _stopGamepadPolling() {
      if (this._gamepadPollInterval) {
        clearInterval(this._gamepadPollInterval);
        this._gamepadPollInterval = null;
      }
      if (this._keyHandler) {
        window.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
      }
    }

    // -------------------------------------------------------------------------
    // MENU ACTIONS
    // -------------------------------------------------------------------------
    _onContinue() {
      this._playSound('select');
      this.hide();
      if (window.BootManager) {
        window.BootManager.continueGame();
      }
    }

    _onNewGame() {
      this._playSound('select');
      const hasSave = this._hasValidSave();
      if (hasSave) {
        window.ConfirmDialogUI?.show({
          title: 'Start a New Journey?',
          message: 'Your current save will remain safely archived. Are you sure you want to begin a new journey?',
          confirmLabel: 'START NEW GAME',
          cancelLabel: 'CANCEL',
          onConfirm: () => {
            this._showPlayerSetupModal(() => {
              this._showPrologueModal({
                onStart: () => {
                  this.hide();
                  window.BootManager?.startNewGame();
                }
              });
            });
          }
        });
      } else {
        this._showPlayerSetupModal(() => {
          this._showPrologueModal({
            onStart: () => {
              this.hide();
              window.BootManager?.startNewGame();
            }
          });
        });
      }
    }

    _onLoadGame() {
      this._playSound('select');
      if (window.ProfileSelectUI) {
        window.ProfileSelectUI.show('load');
      }
    }

    _onSettings() {
      this._playSound('select');
      if (window.unifiedSettingsUI?.show) {
        window.unifiedSettingsUI.show();
      } else if (window.UnifiedSettingsUI) {
        const inst = new window.UnifiedSettingsUI();
        inst.show();
      }
    }

    _onCredits() {
      this._playSound('select');
      this._showCredits();
    }

    _onQuit() {
      this._playSound('select');
      window.ConfirmDialogUI?.show({
        title: 'Quit The Whispering Wilds?',
        message: 'Are you sure you want to exit the game?',
        confirmLabel: 'QUIT GAME',
        cancelLabel: 'RETURN',
        dangerous: true,
        onConfirm: () => window.BootManager?.safeExit()
      });
    }

    _onCoopClick() {
      this._playSound('select');
      window.ConfirmDialogUI?.show({
        title: '👥 Co-op Expedition (Max 5P)',
        message: 'Multiplayer room server is currently offline or unreachable. Single-player exploration remains fully functional and accessible without restrictions.',
        confirmLabel: 'PLAY SINGLE-PLAYER',
        cancelLabel: 'CLOSE',
        onConfirm: () => {
          this._onNewGame();
        }
      });
    }

    // -------------------------------------------------------------------------
    // NEW GAME: PLAYER SETUP & CHARACTER PREVIEW MODAL
    // -------------------------------------------------------------------------
    _showPlayerSetupModal(onProceed) {
      const modal = document.createElement('div');
      modal.id = 'ww-setup-modal';
      modal.className = 'ww-modal-backdrop';

      modal.innerHTML = `
        <div class="ww-setup-window">
          <div class="ww-setup-header">
            <div>
              <div class="modal-sub">PLAYER SETUP & OUTFIT SELECTION</div>
              <h2 class="modal-title">EXPEDITION ARCHETYPE PREVIEW</h2>
            </div>
            <button class="ww-setup-close" id="ww-setup-close">&times;</button>
          </div>

          <div class="ww-setup-body">
            <!-- Left: Interactive Character Preview -->
            <div class="ww-char-preview-pane">
              <div class="char-preview-viewport" id="ww-char-viewport">
                <img id="ww-char-img" src="assets/ui/characters/player_3d_screenshot.png" alt="Player Character 3D" class="char-3d-img">
                <div class="char-orbit-hint">Drag horizontally to rotate • Scroll to zoom</div>
              </div>
              <div class="char-meta-row">
                <span class="char-role">AUTHORITATIVE 3D SKELETAL RIG</span>
                <span class="char-gender">1.78m • Standard PC Skeleton</span>
              </div>
            </div>

            <!-- Right: Setup Options -->
            <div class="ww-char-options-pane">
              <div class="option-group">
                <label class="opt-label">Explorer Name / பெயர்</label>
                <input type="text" id="ww-player-name-input" class="ww-input" value="Explorer" maxlength="24">
              </div>

              <div class="option-group">
                <label class="opt-label">Starting Attire / ஆடை (Preview)</label>
                <div class="outfit-radio-list">
                  <label class="outfit-radio-item active" data-outfit="chennai_default">
                    <input type="radio" name="outfit" value="chennai_default" checked>
                    <div class="outfit-details">
                      <strong>Chennai Explorer (மதராஸ் பாணி)</strong>
                      <span>Durable cotton shirt, field trousers, sturdy trekking boots</span>
                    </div>
                  </label>
                  <label class="outfit-radio-item" data-outfit="village_dhoti">
                    <input type="radio" name="outfit" value="village_dhoti">
                    <div class="outfit-details">
                      <strong>Traditional Veshti & Shirt (வேஷ்டி சட்டை)</strong>
                      <span>Handloom organic cotton veshti, lightweight cultural comfort</span>
                    </div>
                  </label>
                  <label class="outfit-radio-item" data-outfit="cargo_utility">
                    <input type="radio" name="outfit" value="cargo_utility">
                    <div class="outfit-details">
                      <strong>Villupuram Delta Cargo (வேலை உடைகள்)</strong>
                      <span>Multi-pocket reinforced expedition utility gear</span>
                    </div>
                  </label>
                  <label class="outfit-radio-item" data-outfit="nilgiri_warmwear">
                    <input type="radio" name="outfit" value="nilgiri_warmwear">
                    <div class="outfit-details">
                      <strong>Nilgiri Mountain Woolen (கம்பளி சூட்)</strong>
                      <span>Insulated high-altitude wool, frost protection</span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="customization-guard-notice">
                <span class="shield-icon">🛡️</span>
                <span><strong>ABSOLUTE RULE:</strong> Maximum 5 permanent appearance changes across entire playthrough. Previewing outfits here does NOT consume any change credits.</span>
              </div>

              <div class="setup-actions">
                <button id="ww-setup-back" class="btn-cancel">BACK</button>
                <button id="ww-setup-proceed" class="btn-confirm">PROCEED TO INTRODUCTION ▶</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Interactive drag rotation & zoom on character preview
      const viewport = modal.querySelector('#ww-char-viewport');
      const charImg  = modal.querySelector('#ww-char-img');
      let isDragging = false;
      let startX = 0;
      let rotDeg = 0;
      let zoomLevel = 1.0;

      if (viewport && charImg) {
        viewport.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX;
        });
        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          startX = e.clientX;
          rotDeg = (rotDeg + dx * 0.8) % 360;
          charImg.style.transform = `scale(${zoomLevel}) rotateY(${rotDeg}deg)`;
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
        viewport.addEventListener('wheel', (e) => {
          e.preventDefault();
          zoomLevel = Math.max(0.85, Math.min(1.4, zoomLevel - e.deltaY * 0.001));
          charImg.style.transform = `scale(${zoomLevel}) rotateY(${rotDeg}deg)`;
        });
      }

      // Outfit selection change
      const radios = modal.querySelectorAll('.outfit-radio-item');
      radios.forEach(item => {
        item.addEventListener('click', () => {
          radios.forEach(r => r.classList.remove('active'));
          item.classList.add('active');
          const r = item.querySelector('input[type="radio"]');
          if (r) r.checked = true;
          this._playSound('hover');
        });
      });

      // Actions
      modal.querySelector('#ww-setup-close')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#ww-setup-back')?.addEventListener('click', () => modal.remove());
      modal.querySelector('#ww-setup-proceed')?.addEventListener('click', () => {
        this._playSound('select');
        const nameVal = modal.querySelector('#ww-player-name-input')?.value.trim() || 'Explorer';
        const outfitVal = modal.querySelector('input[name="outfit"]:checked')?.value || 'chennai_default';

        if (window.GameState) {
          window.GameState.player.name = nameVal;
          if (window.GameState.player.wardrobe) {
            window.GameState.player.wardrobe.activeOutfit = outfitVal;
          }
        }
        modal.remove();
        onProceed?.();
      });
    }

    // -------------------------------------------------------------------------
    // NEW GAME: PROLOGUE / STORY INTRODUCTION MODAL
    // -------------------------------------------------------------------------
    _showPrologueModal({ isReplay = false, onStart = null } = {}) {
      const modal = document.createElement('div');
      modal.id = 'ww-prologue-modal';
      modal.className = 'ww-modal-backdrop';

      modal.innerHTML = `
        <div class="ww-prologue-window">
          <div class="prologue-top-badge">
            <span class="tamil-top">காட்டு வழி • தடம்</span>
            <span class="region-top">GEORGE TOWN, CHENNAI • மதராஸ்</span>
          </div>

          <h2 class="prologue-title">The Inciting Incident at Madras High Court</h2>
          <div class="prologue-divider"></div>

          <div class="prologue-content">
            <p>As you review a century-old inherited blueprint outside the red-brick Indo-Saracenic gates of George Town during a sudden downpour, a mysterious rider on a vintage Royal Enfield speeds past, splashes through the red mud, and steals critical records.</p>
            <p>Follow deep tyre tracks across red-clay coastal plains, navigate Pichavaram mangrove waterways, decode ancient irrigation mechanisms across the Cauvery Delta, and uncover the lost subterranean eco-sanctuary high in the Western Ghats.</p>
          </div>

          <div class="prologue-actions">
            <button id="ww-prologue-begin" class="btn-primary-prologue">
              ▶ Begin Journey (George Town, Chennai)
            </button>
            <button id="ww-prologue-skip" class="btn-secondary-prologue">
              ⏩ Skip Intro
            </button>
            <button id="ww-prologue-cancel" class="btn-secondary-prologue">
              ↩ Return to Menu
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const triggerStart = () => {
        this._playSound('select');
        modal.remove();
        // Mark intro completed in GameState
        if (window.GameState) {
          window.GameState.story = window.GameState.story || {};
          window.GameState.story.introCompleted = true;
        }
        if (onStart) {
          onStart();
        } else {
          this.hide();
          window.BootManager?.startNewGame();
        }
      };

      modal.querySelector('#ww-prologue-begin')?.addEventListener('click', triggerStart);
      modal.querySelector('#ww-prologue-skip')?.addEventListener('click', triggerStart);
      modal.querySelector('#ww-prologue-cancel')?.addEventListener('click', () => {
        modal.remove();
      });
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------
    _hasValidSave() {
      try {
        const sm = window.saveManager || window.gameSaveManager;
        if (!sm) {
          const raw = localStorage.getItem('ww_save_auto') || localStorage.getItem('ww_save_checkpoint');
          return !!raw;
        }
        const save = sm.loadGame?.('auto') || sm.loadGame?.('checkpoint');
        return !!save;
      } catch (_) { return false; }
    }

    _getLastSaveInfo() {
      try {
        const sm = window.saveManager || window.gameSaveManager;
        const save = sm?.loadGame?.('auto') || sm?.loadGame?.('checkpoint');
        if (save) {
          const reg = (save.world?.currentRegion || 'George Town').replace(/_/g, ' ').toUpperCase();
          const time = save.formattedTime || 'Recent';
          return `${reg} • ${time}`;
        }
        return '';
      } catch (_) { return ''; }
    }

    _playSound(type) {
      try {
        if (!window.gameAudio) return;
        if (type === 'hover') {
          if (typeof window.gameAudio.playPinTap === 'function') window.gameAudio.playPinTap();
        } else if (type === 'select') {
          if (typeof window.gameAudio.playDiscoveryJingle === 'function') {
            window.gameAudio.playDiscoveryJingle();
          } else if (typeof window.gameAudio.playPinTap === 'function') {
            window.gameAudio.playPinTap();
          }
        }
      } catch (_) {}
    }

    _showRecoveryOffer() {
      window.ConfirmDialogUI?.show({
        title: 'Recover Previous Session?',
        message: 'The previous session did not close cleanly. Would you like to restore your last safe checkpoint?',
        confirmLabel: 'RECOVER CHECKPOINT',
        cancelLabel: 'START FRESH',
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
      modal.className = 'ww-modal-backdrop';
      modal.innerHTML = `
        <div class="ww-credits-window">
          <h2 class="credits-heading">THE WHISPERING WILDS — CREDITS</h2>
          <div class="credits-scrollable">
            <div class="credit-block">
              <h3>GAME DESIGN & ENGINE ARCHITECTURE</h3>
              <p>The Whispering Wilds Development Team</p>
            </div>
            <div class="credit-block">
              <h3>TAMIL NADU CULTURAL DOCUMENTATION & RESEARCH</h3>
              <p>Tamil Nadu Living Heritage & Botanical Initiative</p>
            </div>
            <div class="credit-block">
              <h3>VISUAL ARTS & PRODUCTION ASSETS</h3>
              <p>Authoritative 3D Chennai, Delta, Pichavaram, Chettinad, Mamallapuram & Nilgiris Models</p>
            </div>
            <div class="credit-block">
              <h3>AUDIO & SYNTHESIZER ENGINE</h3>
              <p>Acoustic Carnatic & Folk Pentatonic Web Audio Synthesizer Engine</p>
            </div>
            <div class="credit-block">
              <h3>3D RENDERING SYSTEM</h3>
              <p>Three.js WebGL Engine (MIT License)</p>
            </div>
            <div class="credit-block">
              <h3>SPECIAL THANKS</h3>
              <p>The People of Tamil Nadu and the Keepers of the Western Ghats Sanctuaries</p>
            </div>
            <div class="credit-notice">
              All regional landmarks and cultural depictions are created with authenticity and deep respect for Tamil culture and history.
            </div>
          </div>
          <button id="ww-credits-close" class="btn-cancel" style="margin-top:20px;width:140px;">CLOSE</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#ww-credits-close')?.addEventListener('click', () => modal.remove());
    }

    _injectMenuStyles() {
      if (document.getElementById('ww-main-menu-styles')) return;
      const style = document.createElement('style');
      style.id = 'ww-main-menu-styles';
      style.textContent = `
        .ww-menu-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          opacity: 0; transition: opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1.0);
          animation: wwKenBurns 18s ease-in-out infinite alternate;
          z-index: 1;
        }
        .ww-menu-bg.active {
          opacity: 1;
          z-index: 2;
        }
        @keyframes wwKenBurns {
          0%   { transform: scale(1.0) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1%, -1%); }
        }

        #ww-menu-vignette {
          position: absolute; inset: 0; z-index: 3;
          background: linear-gradient(to right, rgba(5,8,14,0.96) 0%, rgba(5,8,14,0.85) 35%, rgba(5,8,14,0.3) 70%, rgba(5,8,14,0.7) 100%),
                      radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,8,14,0.85) 100%);
          pointer-events: none;
        }

        .ww-menu-mist {
          position: absolute; inset: 0; z-index: 4;
          background: radial-gradient(ellipse at 30% 70%, rgba(20,50,40,.25) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(15,35,60,.2) 0%, transparent 50%);
          animation: wwMistDrift 10s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes wwMistDrift {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.04); opacity: 0.9; }
        }

        .ww-menu-left-area {
          flex: 1; z-index: 5;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 60px 70px;
          pointer-events: none;
        }

        .ww-logo-container {
          margin-bottom: 8px;
        }
        .ww-menu-logo-img {
          max-width: 380px; width: 100%; height: auto;
          filter: drop-shadow(0 0 25px rgba(226,201,126,0.25));
        }
        .ww-menu-title-fallback {
          font-family: 'Cinzel', serif;
          font-size: 2.8rem; font-weight: 900; letter-spacing: 0.12em;
          color: #e2c97e; margin: 0;
          text-shadow: 0 0 40px rgba(226,201,126,0.3);
        }
        .ww-menu-tamil-title {
          font-size: 1.15rem; letter-spacing: 0.35em; color: #d4af37;
          font-weight: 400; margin-top: 6px;
        }
        .ww-menu-tagline {
          font-size: 0.78rem; letter-spacing: 0.22em; color: #8a9bb0;
          font-weight: 400; margin-top: 8px;
        }

        .ww-menu-caption {
          font-size: 0.85rem; letter-spacing: 0.1em; color: #c4d0dc;
          background: rgba(10,14,20,0.65); padding: 8px 16px; border-radius: 6px;
          border-left: 2px solid #e2c97e; backdrop-filter: blur(8px);
          max-width: fit-content;
        }
        .ww-menu-caption .tamil-label { color: #d4af37; }

        .ww-menu-right-panel {
          width: 420px; z-index: 5;
          background: rgba(8,12,18,0.92);
          border-left: 1px solid rgba(226,201,126,0.18);
          backdrop-filter: blur(16px);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 50px 40px;
          box-shadow: -20px 0 60px rgba(0,0,0,0.7);
        }

        .ww-menu-nav-header {
          display: flex; justify-content: space-between; align-items: baseline;
          border-bottom: 1px solid rgba(226,201,126,0.15);
          padding-bottom: 16px; margin-bottom: 24px;
        }
        .nav-title { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.25em; color: #e2c97e; }
        .nav-tamil { font-size: 0.8rem; color: #8a9bb0; letter-spacing: 0.1em; }

        .ww-menu-btn-list {
          display: flex; flex-direction: column; gap: 10px;
          flex: 1; justify-content: center;
        }

        .ww-menu-item {
          display: block; width: 100%; text-align: left;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-left: 3px solid transparent;
          border-radius: 6px; padding: 12px 16px;
          color: #cbd5e1; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ww-menu-item:hover:not(.ww-menu-disabled),
        .ww-menu-item.ww-focused:not(.ww-menu-disabled) {
          background: rgba(226,201,126,0.08);
          border-color: rgba(226,201,126,0.3);
          border-left-color: #e2c97e;
          transform: translateX(4px);
          color: #ffffff;
        }
        .ww-menu-primary .btn-label { color: #e2c97e; font-weight: 700; }
        .ww-menu-disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-main-row { display: flex; justify-content: space-between; align-items: center; }
        .btn-label { font-size: 1.05rem; letter-spacing: 0.08em; }
        .btn-tamil { font-size: 0.82rem; color: #94a3b8; }
        .btn-subtext { font-size: 0.72rem; color: #64748b; margin-top: 4px; }

        .ww-menu-extras {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .ww-extra-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 8px 12px;
          color: #94a3b8; font-size: 0.78rem; text-align: left;
          cursor: pointer; transition: all 0.2s;
        }
        .ww-extra-btn:hover { border-color: #e2c97e; color: #e2c97e; }

        .ww-menu-footer {
          margin-top: 20px; font-size: 0.72rem; color: #64748b;
          display: flex; flex-direction: column; gap: 4px;
        }
        .status-indicator { display: flex; align-items: center; gap: 6px; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .status-dot.online { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
        .status-dot.offline { background: #f87171; box-shadow: 0 0 6px #f87171; }

        /* Modal styling */
        .ww-modal-backdrop {
          position: fixed; inset: 0; z-index: 9500;
          background: rgba(0,0,0,0.82); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter','Outfit',sans-serif;
          animation: wwFadeIn 0.3s ease;
        }
        @keyframes wwFadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Player Setup Modal Window */
        .ww-setup-window {
          background: #0a0e16; border: 1px solid rgba(226,201,126,0.3);
          border-radius: 12px; width: 880px; max-width: 95%; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 25px 80px rgba(0,0,0,0.8), 0 0 50px rgba(226,201,126,0.12);
        }
        .ww-setup-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 30px; border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .modal-sub { font-size: 0.72rem; letter-spacing: 0.2em; color: #d4af37; }
        .modal-title { font-size: 1.25rem; color: #ffffff; letter-spacing: 0.08em; margin: 4px 0 0; }
        .ww-setup-close { background: none; border: none; font-size: 1.8rem; color: #64748b; cursor: pointer; }
        .ww-setup-close:hover { color: #ffffff; }

        .ww-setup-body {
          display: flex; flex: 1; overflow: hidden; padding: 24px 30px; gap: 30px;
        }
        .ww-char-preview-pane {
          flex: 1; display: flex; flex-direction: column;
          background: #06090e; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; overflow: hidden;
        }
        .char-preview-viewport {
          flex: 1; position: relative; display: flex; align-items: center; justify-content: center;
          overflow: hidden; cursor: grab; background: radial-gradient(circle at 50% 50%, #151e2c 0%, #06090e 80%);
        }
        .char-preview-viewport:active { cursor: grabbing; }
        .char-3d-img {
          max-height: 340px; width: auto; object-fit: contain;
          transition: transform 0.05s ease-out;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.7));
        }
        .char-orbit-hint {
          position: absolute; bottom: 12px; font-size: 0.7rem; color: #64748b;
          background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 4px;
        }
        .char-meta-row {
          padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8;
        }
        .char-role { color: #d4af37; font-weight: 600; }

        .ww-char-options-pane {
          flex: 1.1; display: flex; flex-direction: column; gap: 16px;
        }
        .option-group { display: flex; flex-direction: column; gap: 6px; }
        .opt-label { font-size: 0.78rem; font-weight: 600; color: #cbd5e1; letter-spacing: 0.05em; }
        .ww-input {
          background: #111722; border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px; padding: 10px 14px; color: #ffffff; font-size: 0.9rem;
        }
        .ww-input:focus { border-color: #d4af37; outline: none; }

        .outfit-radio-list { display: flex; flex-direction: column; gap: 8px; }
        .outfit-radio-item {
          display: flex; align-items: flex-start; gap: 10px;
          background: #111722; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 10px 14px; cursor: pointer; transition: all 0.2s;
        }
        .outfit-radio-item.active { border-color: #d4af37; background: rgba(212,175,55,0.08); }
        .outfit-details strong { display: block; font-size: 0.85rem; color: #f1f5f9; }
        .outfit-details span { display: block; font-size: 0.72rem; color: #94a3b8; margin-top: 2px; }

        .customization-guard-notice {
          background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.2);
          border-radius: 6px; padding: 10px 14px; font-size: 0.74rem; color: #cbd5e1;
          display: flex; gap: 8px; align-items: center; line-height: 1.4;
        }
        .shield-icon { font-size: 1.1rem; }

        .setup-actions {
          display: flex; justify-content: flex-end; gap: 12px; margin-top: auto; padding-top: 10px;
        }
        .btn-cancel {
          background: transparent; border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px; padding: 10px 20px; color: #cbd5e1; cursor: pointer;
          font-weight: 600; font-size: 0.82rem;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.06); }
        .btn-confirm {
          background: #d4af37; border: none; border-radius: 6px; padding: 10px 24px;
          color: #070b12; cursor: pointer; font-weight: 700; font-size: 0.85rem;
          letter-spacing: 0.05em; transition: background 0.2s;
        }
        .btn-confirm:hover { background: #f0ce64; }

        /* Prologue Modal Window - Compact Cinematic Dialog */
        .ww-prologue-window {
          background: rgba(9, 13, 21, 0.94); border: 1px solid rgba(212,175,55,0.35);
          border-radius: 12px; width: 580px; max-width: 90vw; padding: 26px 30px;
          text-align: center; box-shadow: 0 25px 70px rgba(0,0,0,0.85), 0 0 35px rgba(212,175,55,0.12);
          backdrop-filter: blur(16px);
        }
        .prologue-top-badge {
          display: flex; justify-content: space-between; font-size: 0.72rem; letter-spacing: 0.14em;
          color: #d4af37; margin-bottom: 14px; border-bottom: 1px solid rgba(212,175,55,0.15);
          padding-bottom: 8px;
        }
        .prologue-title {
          font-family: 'Cinzel', serif; font-size: 1.4rem; color: #ffffff;
          letter-spacing: 0.05em; margin: 0 0 12px;
        }
        .prologue-divider {
          width: 50px; height: 2px; background: #d4af37; margin: 0 auto 16px;
        }
        .prologue-content {
          font-size: 0.88rem; line-height: 1.65; color: #cbd5e1; text-align: left;
          background: rgba(255,255,255,0.03); padding: 14px 18px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06); margin-bottom: 22px;
        }
        .prologue-content p { margin-bottom: 10px; }
        .prologue-content p:last-child { margin-bottom: 0; }
        .prologue-actions {
          display: flex; flex-direction: column; gap: 8px; align-items: center;
        }
        .btn-primary-prologue {
          background: #d4af37; color: #070b12; border: none; border-radius: 6px;
          padding: 12px 28px; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em;
          cursor: pointer; width: 100%; max-width: 400px; transition: all 0.2s;
        }
        .btn-primary-prologue:hover { background: #f0ce64; transform: translateY(-1px); }
        .btn-secondary-prologue {
          background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px; padding: 9px 20px; font-size: 0.82rem; font-weight: 500;
          cursor: pointer; width: 100%; max-width: 400px; transition: all 0.2s;
        }
        .btn-secondary-prologue:hover { border-color: #d4af37; color: #e2c97e; }

        /* Credits Window */
        .ww-credits-window {
          background: #090d15; border: 1px solid rgba(212,175,55,0.3);
          border-radius: 12px; width: 680px; max-width: 95%; max-height: 85vh;
          padding: 36px; display: flex; flex-direction: column; align-items: center;
        }
        .credits-heading {
          font-size: 1.3rem; letter-spacing: 0.15em; color: #d4af37; margin: 0 0 24px;
        }
        .credits-scrollable {
          overflow-y: auto; width: 100%; text-align: center; line-height: 1.8;
          display: flex; flex-direction: column; gap: 16px; padding-right: 8px;
        }
        .credit-block h3 { font-size: 0.82rem; letter-spacing: 0.1em; color: #d4af37; margin: 0 0 4px; }
        .credit-block p { font-size: 0.88rem; color: #94a3b8; margin: 0; }
        .credit-notice {
          font-size: 0.74rem; color: #64748b; margin-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.MainMenuUI = new MainMenuUI();

})();
