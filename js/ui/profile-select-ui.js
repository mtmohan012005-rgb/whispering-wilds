// ============================================================================
// THE WHISPERING WILDS - PROFILE SELECT UI
// Displays save slot profiles with: name, region, play time, last played,
// story progress. Does NOT display hidden story spoilers.
// ============================================================================

(function () {
  'use strict';

  class ProfileSelectUI {
    constructor() {
      this._container = null;
      this._visible   = false;
      this._mode      = 'view'; // 'view' | 'load'
    }

    show(mode = 'view') {
      if (this._visible) return;
      this._visible = true;
      this._mode    = mode;

      const root = this._build();
      this._container = root;
      document.body.appendChild(root);
      requestAnimationFrame(() => { root.style.opacity = '1'; });
    }

    hide() {
      if (!this._visible || !this._container) return;
      this._visible = false;
      this._container.style.opacity = '0';
      setTimeout(() => { this._container?.remove(); this._container = null; }, 400);
    }

    _build() {
      const root = document.createElement('div');
      root.id = 'ww-profile-select';
      root.style.cssText = [
        'position:fixed;inset:0;z-index:8600;',
        'background:rgba(5,8,14,.97);display:flex;flex-direction:column;',
        'align-items:center;justify-content:center;',
        'font-family:Inter,sans-serif;',
        'opacity:0;transition:opacity .4s ease;'
      ].join('');

      const title = document.createElement('h2');
      title.style.cssText = 'color:#e2c97e;font-size:1.2rem;letter-spacing:.15em;margin-bottom:40px;font-weight:600;';
      title.textContent = this._mode === 'load' ? 'LOAD GAME' : 'PROFILE';
      root.appendChild(title);

      // Gather save slots
      const slots = this._gatherSaveSlots();
      const grid  = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:900px;width:90%;';

      if (slots.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#4a5a6a;font-size:.875rem;text-align:center;padding:40px;';
        empty.textContent = 'No save data found.';
        grid.appendChild(empty);
      } else {
        slots.forEach(slot => grid.appendChild(this._buildSlotCard(slot)));
      }

      root.appendChild(grid);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = [
        'margin-top:32px;padding:10px 32px;',
        'border:1px solid #2a3a4a;background:transparent;',
        'color:#4a6070;font-family:Inter,sans-serif;font-size:.8rem;',
        'border-radius:6px;cursor:pointer;letter-spacing:.08em;',
        'transition:all .2s;'
      ].join('');
      closeBtn.textContent = 'BACK';
      closeBtn.addEventListener('click', () => this.hide());
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.borderColor='#e2c97e'; closeBtn.style.color='#e2c97e'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.borderColor='#2a3a4a'; closeBtn.style.color='#4a6070'; });
      root.appendChild(closeBtn);

      return root;
    }

    _buildSlotCard(slot) {
      const card = document.createElement('div');
      card.style.cssText = [
        'background:rgba(10,18,28,.9);border:1px solid rgba(226,201,126,.12);',
        'border-radius:8px;padding:20px 24px;',
        'cursor:pointer;transition:border-color .2s,transform .2s;',
        'position:relative;'
      ].join('');
      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'rgba(226,201,126,.4)';
        card.style.transform   = 'translateY(-2px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(226,201,126,.12)';
        card.style.transform   = 'none';
      });

      // Slot badge
      const badge = document.createElement('div');
      badge.style.cssText = 'font-size:.65rem;letter-spacing:.2em;color:#3a5060;margin-bottom:8px;';
      badge.textContent = slot.slotLabel;
      card.appendChild(badge);

      // Player name
      const name = document.createElement('div');
      name.style.cssText = 'font-size:1rem;color:#e2c97e;font-weight:600;margin-bottom:4px;';
      name.textContent = slot.playerName;
      card.appendChild(name);

      // Region
      const region = document.createElement('div');
      region.style.cssText = 'font-size:.78rem;color:#6a8a9a;margin-bottom:12px;';
      region.textContent = slot.regionName;
      card.appendChild(region);

      // Stats grid
      const stats = document.createElement('div');
      stats.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.72rem;color:#4a6070;margin-bottom:16px;';
      stats.innerHTML = `
        <div><span style="color:#8a9bb0">Play time</span><br>${slot.playTime}</div>
        <div><span style="color:#8a9bb0">Last played</span><br>${slot.lastPlayed}</div>
        <div><span style="color:#8a9bb0">Chapter</span><br>${slot.chapter}</div>
        <div><span style="color:#8a9bb0">Complete</span><br>${slot.completion}%</div>
      `;
      card.appendChild(stats);

      // Customization used indicator
      const cusBar = document.createElement('div');
      cusBar.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:16px;';
      const cusLabel = document.createElement('span');
      cusLabel.style.cssText = 'font-size:.65rem;color:#3a5060;';
      cusLabel.textContent = 'Style changes:';
      const cusPips = document.createElement('span');
      cusPips.style.cssText = 'font-size:.7rem;letter-spacing:2px;';
      const used = slot.customizationUsed || 0;
      cusPips.textContent = '●'.repeat(used) + '○'.repeat(Math.max(0, 5 - used));
      cusPips.style.color = used >= 5 ? '#e74c3c' : '#e2c97e';
      cusBar.appendChild(cusLabel);
      cusBar.appendChild(cusPips);
      card.appendChild(cusBar);

      if (this._mode === 'load') {
        const loadBtn = document.createElement('button');
        loadBtn.style.cssText = [
          'width:100%;padding:8px 0;',
          'background:transparent;border:1px solid #e2c97e;',
          'color:#e2c97e;font-family:Inter,sans-serif;font-size:.75rem;',
          'border-radius:4px;cursor:pointer;letter-spacing:.1em;',
          'transition:background .2s,color .2s;'
        ].join('');
        loadBtn.textContent = 'LOAD';
        loadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.hide();
          const sm = window.saveManager || window.gameSaveManager;
          const save = sm?.loadGame?.(slot.slotKey);
          if (save) {
            window.GameLifecycle?.transitionTo('LOADING_GAME', { reason: 'load_slot', slot: slot.slotKey });
            window.LoadingManager?.startLoad(save.world?.currentRegion || 'george_town', { saveData: save });
          }
        });
        loadBtn.addEventListener('mouseenter', () => { loadBtn.style.background='#e2c97e'; loadBtn.style.color='#0a0e14'; });
        loadBtn.addEventListener('mouseleave', () => { loadBtn.style.background='transparent'; loadBtn.style.color='#e2c97e'; });
        card.appendChild(loadBtn);
      }

      return card;
    }

    _gatherSaveSlots() {
      const slots = [];
      const sm = window.saveManager || window.gameSaveManager;
      if (!sm) return slots;

      const slotKeys = ['auto', 'checkpoint', 'slot1', 'slot2'];
      const labels   = ['Auto Save', 'Last Checkpoint', 'Save Slot 1', 'Save Slot 2'];

      slotKeys.forEach((key, i) => {
        try {
          const save = sm.loadGame?.(key);
          if (!save) return;

          const region = save.world?.currentRegion || save.world?.region || 'george_town';
          const regionNames = {
            george_town: 'George Town, Chennai', cauvery_delta: 'Cauvery Delta',
            pichavaram: 'Pichavaram', chettinad: 'Chettinad',
            thanjavur: 'Thanjavur', mamallapuram: 'Mamallapuram',
            nilgiris: 'Nilgiri Mountains', final_sanctuary: 'Pasumai Thadam'
          };

          const playMs   = typeof save.sessionPlayTime === 'number' ? save.sessionPlayTime : 0;
          const playSecs = Math.floor(playMs / 1000);
          const playFmt  = `${Math.floor(playSecs/3600)}h ${Math.floor((playSecs%3600)/60)}m`;

          // Completion: count discovered locations / total
          const discovered = (save.world?.discoveredLocations || []).length;
          const completion = Math.min(100, Math.round((discovered / 20) * 100));

          slots.push({
            slotKey:           key,
            slotLabel:         labels[i],
            playerName:        save.player?.name || window.GameState?.player?.name || 'Tamizh Iniyan',
            regionName:        regionNames[region] || region,
            playTime:          playFmt,
            lastPlayed:        save.formattedTime || '—',
            chapter:           save.storyContent?.currentChapter || '1',
            completion,
            customizationUsed: Math.min(5, save.player?.customizationChangesUsed || 0)
          });
        } catch (_) {}
      });

      return slots;
    }
  }

  window.ProfileSelectUI = new ProfileSelectUI();

})();
