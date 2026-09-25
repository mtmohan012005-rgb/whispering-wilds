// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DEVELOPER CONTENT PANEL
// Developer-only inspection and testing dashboard.
// STRICTLY disabled in production and production multiplayer builds.
// ============================================================================

(function () {
  'use strict';

  class DevContentPanel {
    constructor() {
      this.isDevMode = false;
      this.containerEl = null;
      this.isVisible = false;
      this.activeTab = 'quests';
      this._checkDevMode();
    }

    _checkDevMode() {
      // Determine if running in developer mode
      const isLocal = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:'
      );
      this.isDevMode = (window.DEV_MODE === true) || (isLocal && window.FORCE_PRODUCTION_BUILD !== true);
    }

    setDevMode(enabled) {
      if (window.FORCE_PRODUCTION_BUILD === true) {
        console.warn('[DevContentPanel] Cannot enable dev panel: FORCE_PRODUCTION_BUILD active.');
        this.isDevMode = false;
        return false;
      }
      this.isDevMode = !!enabled;
      if (!this.isDevMode && this.isVisible) {
        this.hide();
      }
      return this.isDevMode;
    }

    init() {
      if (!this.isDevMode) {
        console.log('[DevContentPanel] Production build active. DevContentPanel disabled.');
        return this;
      }

      this._createDOM();
      this._bindKeyboardShortcut();
      console.log('[DevContentPanel] Initialized developer content dashboard (Press `~` or Ctrl+Shift+D to toggle).');
      return this;
    }

    _bindKeyboardShortcut() {
      if (typeof window === 'undefined') return;
      window.addEventListener('keydown', (e) => {
        if (!this.isDevMode) return;
        if (e.key === '`' || (e.ctrlKey && e.shiftKey && e.key === 'D')) {
          this.toggle();
        }
      });
    }

    _createDOM() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dev-content-panel')) return;

      const panel = document.createElement('div');
      panel.id = 'dev-content-panel';
      panel.style.cssText = `
        display: none;
        position: fixed;
        top: 20px;
        right: 20px;
        width: 480px;
        max-height: 85vh;
        background: rgba(15, 23, 42, 0.95);
        color: #e2e8f0;
        border: 1px solid #38bdf8;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        z-index: 99999;
        font-family: monospace;
        font-size: 12px;
        flex-direction: column;
        overflow: hidden;
      `;

      panel.innerHTML = `
        <div style="background: #1e293b; padding: 10px 14px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 13px;">⚙ DEV CONTENT INSPECTOR</strong>
          <button id="dev-panel-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px;">✕</button>
        </div>
        <div style="display: flex; background: #0f172a; border-bottom: 1px solid #334155; overflow-x: auto;">
          <button class="dev-tab-btn" data-tab="quests" style="padding: 8px 12px; background: none; border: none; color: #38bdf8; cursor: pointer; border-bottom: 2px solid #38bdf8;">Quests</button>
          <button class="dev-tab-btn" data-tab="player" style="padding: 8px 12px; background: none; border: none; color: #94a3b8; cursor: pointer;">Player</button>
          <button class="dev-tab-btn" data-tab="world" style="padding: 8px 12px; background: none; border: none; color: #94a3b8; cursor: pointer;">World/Events</button>
          <button class="dev-tab-btn" data-tab="actions" style="padding: 8px 12px; background: none; border: none; color: #94a3b8; cursor: pointer;">Actions</button>
          <button class="dev-tab-btn" data-tab="validator" style="padding: 8px 12px; background: none; border: none; color: #94a3b8; cursor: pointer;">Validator</button>
        </div>
        <div id="dev-panel-content" style="padding: 14px; overflow-y: auto; flex: 1; max-height: calc(85vh - 100px);">
          <!-- Dynamic tab content injected here -->
        </div>
      `;

      document.body.appendChild(panel);
      this.containerEl = panel;

      // Bind close
      panel.querySelector('#dev-panel-close')?.addEventListener('click', () => this.hide());

      // Bind tabs
      panel.querySelectorAll('.dev-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          panel.querySelectorAll('.dev-tab-btn').forEach(b => {
            b.style.color = '#94a3b8';
            b.style.borderBottom = 'none';
          });
          btn.style.color = '#38bdf8';
          btn.style.borderBottom = '2px solid #38bdf8';
          this.activeTab = btn.getAttribute('data-tab');
          this.refresh();
        });
      });
    }

    toggle() {
      if (this.isVisible) this.hide();
      else this.show();
    }

    show() {
      if (!this.isDevMode) return;
      if (!this.containerEl) this._createDOM();
      if (this.containerEl) {
        this.containerEl.style.display = 'flex';
        this.isVisible = true;
        this.refresh();
      }
    }

    hide() {
      if (this.containerEl) {
        this.containerEl.style.display = 'none';
        this.isVisible = false;
      }
    }

    refresh() {
      if (!this.isVisible || !this.containerEl) return;
      const contentEl = this.containerEl.querySelector('#dev-panel-content');
      if (!contentEl) return;

      const state = window.GameState || {};
      const reg = window.ContentRegistry;

      if (this.activeTab === 'quests') {
        const activeQuests = window.QuestStateMachine ? window.QuestStateMachine.getActiveQuests() : [];
        contentEl.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #f8fafc;">Active Quests (${activeQuests.length})</h4>
          ${activeQuests.length === 0 ? '<p style="color:#64748b;">No active quests</p>' : ''}
          ${activeQuests.map(q => `
            <div style="background: #1e293b; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
              <strong style="color: #38bdf8;">${q.id}</strong> - Objective ${q.state.currentObjectiveIndex + 1}
              <div style="margin-top: 6px;">
                <button class="dev-action-btn" onclick="window.DevContentPanel.completeCurrentObjective('${q.id}')" style="background:#0284c7; color:#fff; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">Complete Objective</button>
                <button class="dev-action-btn" onclick="window.DevContentPanel.failQuest('${q.id}')" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; margin-left:6px;">Fail Quest</button>
              </div>
            </div>
          `).join('')}
        `;
      } else if (this.activeTab === 'player') {
        contentEl.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #f8fafc;">Player Telemetry</h4>
          <pre style="background:#1e293b; padding:8px; border-radius:4px; overflow-x:auto;">${JSON.stringify({
            money: state.player?.money || 0,
            experience: state.player?.experience || 0,
            customizationChangesUsed: state.player?.customizationChangesUsed || 0,
            region: state.player?.region || 'chennai',
            coordinates: { x: state.player?.x || 0, y: state.player?.y || 0 },
            inventoryCount: state.inventory?.items?.length || 0,
            reputation: state.reputation || {},
            relationships: state.social?.relationships || {}
          }, null, 2)}</pre>
        `;
      } else if (this.activeTab === 'world') {
        contentEl.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #f8fafc;">World & Environment</h4>
          <p>Region: <strong>${state.world?.currentRegion || 'chennai'}</strong></p>
          <p>Time of Day: <strong>${state.world?.timeOfDay || 'morning'}</strong></p>
          <p>Weather: <strong>${state.world?.weather || 'clear'}</strong></p>
          <p>Active Audio Region: <strong>${window.audioManager?.currentRegion || 'none'}</strong></p>
        `;
      } else if (this.activeTab === 'actions') {
        contentEl.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #f8fafc;">Developer Debug Actions</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button onclick="window.DevContentPanel.setTime('morning')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Set Morning</button>
            <button onclick="window.DevContentPanel.setTime('night')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Set Night</button>
            <button onclick="window.DevContentPanel.setWeather('rain')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Set Rain</button>
            <button onclick="window.DevContentPanel.setWeather('clear')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Set Clear</button>
            <button onclick="window.DevContentPanel.giveMoney(100)" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">+₹100 Coins</button>
            <button onclick="window.DevContentPanel.teleportTo('nilgiris')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Teleport Nilgiris</button>
            <button onclick="window.DevContentPanel.teleportTo('chettinad')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Teleport Chettinad</button>
            <button onclick="window.DevContentPanel.triggerEvent('sudden_rain_event')" style="padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; cursor:pointer;">Trigger Rain Event</button>
          </div>
        `;
      } else if (this.activeTab === 'validator') {
        const report = window.ContentValidator ? window.ContentValidator.formatReport() : 'Validator not loaded';
        contentEl.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #f8fafc;">Content Validation Report</h4>
          <pre style="background:#1e293b; padding:10px; border-radius:4px; color:#38bdf8;">${report}</pre>
          <button onclick="window.ContentValidator.validateAll(); window.DevContentPanel.refresh();" style="padding:6px 12px; background:#0284c7; color:#fff; border:none; border-radius:4px; cursor:pointer; margin-top:8px;">Run Validator</button>
        `;
      }
    }

    // Developer Actions (Disabled in production builds)
    completeCurrentObjective(questId) {
      if (!this.isDevMode) return;
      const qm = window.QuestStateMachine;
      if (!qm) return;
      const qState = qm.getQuestState(questId);
      const def = qm._getQuestDef(questId);
      const curObj = def?.objectives?.[qState.currentObjectiveIndex];
      if (curObj) {
        qm.progressObjective(questId, curObj.id, { devSkip: true });
        this.refresh();
      }
    }

    failQuest(questId) {
      if (!this.isDevMode) return;
      window.QuestStateMachine?.failQuest(questId, 'DEV_OVERRIDE');
      this.refresh();
    }

    setTime(time) {
      if (!this.isDevMode) return;
      if (window.GameState?.world) window.GameState.world.timeOfDay = time;
      if (window.audioManager) window.audioManager.setTimeOfDay(time);
      this.refresh();
    }

    setWeather(weather) {
      if (!this.isDevMode) return;
      if (window.GameState?.world) window.GameState.world.weather = weather;
      if (window.audioManager) window.audioManager.setWeather(weather);
      this.refresh();
    }

    giveMoney(amount) {
      if (!this.isDevMode) return;
      if (window.GameState?.player) {
        window.GameState.player.money = (window.GameState.player.money || 0) + amount;
      }
      this.refresh();
    }

    teleportTo(region) {
      if (!this.isDevMode) return;
      if (window.GameState?.world) window.GameState.world.currentRegion = region;
      if (window.audioManager) window.audioManager.setRegion(region);
      console.log(`[DevContentPanel] Teleported to ${region}`);
      this.refresh();
    }

    triggerEvent(eventId) {
      if (!this.isDevMode) return;
      window.ContentEvents?.emit('trigger_world_event', { eventId });
      console.log(`[DevContentPanel] Triggered event ${eventId}`);
      this.refresh();
    }
  }

  const instance = new DevContentPanel();

  if (typeof window !== 'undefined') {
    window.DevContentPanel = instance;
    window.devContentPanel = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
