// ============================================================================
// THE WHISPERING WILDS - PROFESSIONAL PC HUD CONTROLLER
// Compass Ribbon, Survival Gauges, Contextual [E] Prompt & Objective Tracker
// ============================================================================

class GameHUD {
    constructor() {
        this.container = document.getElementById('hud-container');
        this.compassTape = null;
        this.compassDeg = null;
        this.healthFill = null;
        this.energyFill = null;
        this.hydrationFill = null;
        this.rupeeAmount = null;
        this.promptEl = null;
        this.promptText = null;
        this.trackerTitle = null;
        this.trackerStep = null;
        this.trackerChapter = null;

        this.initDOM();
    }

    initDOM() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'hud-container';
            document.body.appendChild(this.container);
        }

        let proLayer = document.getElementById('pc-pro-hud-layer');
        if (!proLayer) {
            proLayer = document.createElement('div');
            proLayer.id = 'pc-pro-hud-layer';
            this.container.appendChild(proLayer);
        }

        proLayer.innerHTML = `
            <!-- COMPASS RIBBON -->
            <div class="pc-compass-container">
                <div class="pc-compass-ticker"></div>
                <div class="pc-compass-tape" id="pc-compass-tape">
                    <span>N</span> <span>NE</span> <span>E</span> <span>SE</span> <span>S</span> <span>SW</span> <span>W</span> <span>NW</span>
                </div>
                <div class="pc-compass-degrees" id="pc-compass-deg">000° NORTH</div>
            </div>

            <!-- SURVIVAL GAUGES -->
            <div class="pc-survival-cluster">
                <div class="survival-bar-group">
                    <span class="survival-icon">❤️</span>
                    <div class="survival-bar-track">
                        <div class="survival-bar-fill fill-health" id="pc-fill-health" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="survival-bar-group">
                    <span class="survival-icon">⚡</span>
                    <div class="survival-bar-track">
                        <div class="survival-bar-fill fill-energy" id="pc-fill-energy" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="survival-bar-group">
                    <span class="survival-icon">💧</span>
                    <div class="survival-bar-track">
                        <div class="survival-bar-fill fill-hydration" id="pc-fill-hydration" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="survival-bar-group">
                    <span class="survival-icon">🍚</span>
                    <div class="survival-bar-track">
                        <div class="survival-bar-fill fill-hunger" id="pc-fill-hunger" style="width: 100%; background: linear-gradient(90deg, #dd6b20, #f6ad55);"></div>
                    </div>
                </div>
                <div class="survival-bar-group">
                    <span class="survival-icon">🔥</span>
                    <div class="survival-bar-track">
                        <div class="survival-bar-fill fill-warmth" id="pc-fill-warmth" style="width: 80%; background: linear-gradient(90deg, #d69e2e, #f6e05e);"></div>
                    </div>
                </div>
                <div class="survival-meta-row">
                    <span class="rupee-badge">₹ <span id="pc-rupee-val">75</span></span>
                    <span id="pc-time-val" style="color: #94a3b8; font-size: 11px;">09:00 AM</span>
                </div>
            </div>

            <!-- INTERACTION PROMPT -->
            <div class="pc-interaction-prompt" id="pc-interaction-prompt">
                <span class="key-badge">E</span>
                <span id="pc-prompt-label">Interact</span>
            </div>

            <!-- OBJECTIVE TRACKER -->
            <div class="pc-objective-tracker">
                <div class="tracker-chapter" id="pc-tracker-chapter">CHAPTER I • MADRAS HEIST</div>
                <div class="tracker-title" id="pc-tracker-title">In Search of Clues</div>
                <div class="tracker-step" id="pc-tracker-step">Inquire with Murugan Annan at the roadside tea kadai.</div>
            </div>

            <!-- HOTKEY PILLS -->
            <div class="pc-hotkey-bar">
                <div class="hotkey-pill" onclick="window.uiManager && window.uiManager.toggleModal('INVENTORY')"><kbd>I</kbd> Satchel</div>
                <div class="hotkey-pill" onclick="window.SurvivalUI && window.SurvivalUI.toggle()"><kbd>V</kbd> Vitals</div>
                <div class="hotkey-pill" onclick="window.uiManager && window.uiManager.toggleModal('MAP')"><kbd>M</kbd> Map</div>
                <div class="hotkey-pill" onclick="window.uiManager && window.uiManager.toggleModal('JOURNAL')"><kbd>J</kbd> Journal</div>
                <div class="hotkey-pill" onclick="window.uiManager && window.uiManager.toggleModal('PHOTO')"><kbd>F</kbd> Camera</div>
                <div class="hotkey-pill" onclick="window.uiManager && window.uiManager.toggleModal('PAUSED')"><kbd>Esc</kbd> Menu</div>
            </div>
        `;

        this.compassTape = document.getElementById('pc-compass-tape');
        this.compassDeg = document.getElementById('pc-compass-deg');
        this.healthFill = document.getElementById('pc-fill-health');
        this.energyFill = document.getElementById('pc-fill-energy');
        this.hydrationFill = document.getElementById('pc-fill-hydration');
        this.hungerFill = document.getElementById('pc-fill-hunger');
        this.warmthFill = document.getElementById('pc-fill-warmth');
        this.rupeeAmount = document.getElementById('pc-rupee-val');
        this.timeVal = document.getElementById('pc-time-val');
        this.promptEl = document.getElementById('pc-interaction-prompt');
        this.promptText = document.getElementById('pc-prompt-label');
        this.trackerChapter = document.getElementById('pc-tracker-chapter');
        this.trackerTitle = document.getElementById('pc-tracker-title');
        this.trackerStep = document.getElementById('pc-tracker-step');
    }

    update(headingRad = 0, survival = null, nearbyInteractable = null) {
        // 1. Compass Heading
        const deg = Math.round(((headingRad * (180 / Math.PI)) % 360 + 360) % 360);
        let cardinal = 'NORTH';
        if (deg >= 23 && deg < 68) cardinal = 'NORTH-EAST';
        else if (deg >= 68 && deg < 113) cardinal = 'EAST';
        else if (deg >= 113 && deg < 158) cardinal = 'SOUTH-EAST';
        else if (deg >= 158 && deg < 203) cardinal = 'SOUTH';
        else if (deg >= 203 && deg < 248) cardinal = 'SOUTH-WEST';
        else if (deg >= 248 && deg < 293) cardinal = 'WEST';
        else if (deg >= 293 && deg < 338) cardinal = 'NORTH-WEST';

        if (this.compassDeg) {
            this.compassDeg.textContent = `${String(deg).padStart(3, '0')}° ${cardinal}`;
        }

        // 2. Survival Metrics
        const surv = survival || (window.GameState && window.GameState.player && window.GameState.player.survival) || (window.testRef && window.testRef.survival);
        if (surv) {
            if (this.healthFill) this.healthFill.style.width = `${Math.max(0, Math.min(100, surv.health || 100))}%`;
            if (this.energyFill) this.energyFill.style.width = `${Math.max(0, Math.min(100, surv.energy || 100))}%`;
            if (this.hydrationFill) this.hydrationFill.style.width = `${Math.max(0, Math.min(100, surv.hydration !== undefined ? surv.hydration : (surv.thirst || 100)))}%`;
            if (this.hungerFill) this.hungerFill.style.width = `${Math.max(0, Math.min(100, surv.hunger || 100))}%`;
            if (this.warmthFill) this.warmthFill.style.width = `${Math.max(0, Math.min(100, surv.warmth !== undefined ? surv.warmth : 80))}%`;
            if (this.rupeeAmount) {
                const cur = (survival && survival.currency !== undefined) ? survival.currency : ((window.GameState && window.GameState.player) ? window.GameState.player.currency : (surv.currency || 0));
                this.rupeeAmount.textContent = String(cur);
            }
            if (this.timeVal && window.GameState && window.GameState.world) {
                const hourDec = window.GameState.world.time || 9.0;
                const h = Math.floor(hourDec % 24);
                const m = Math.floor((hourDec % 1) * 60);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 === 0 ? 12 : (h % 12);
                this.timeVal.textContent = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
            }
        }

        // 3. Interaction Prompt
        const player = window.player || (window.testRef && window.testRef.player);
        const interactable = nearbyInteractable || (player ? player.nearbyInteractable : null);
        if (interactable && this.promptEl) {
            this.promptEl.classList.add('visible');
            let label = interactable.interactionPrompt || interactable.prompt;
            if (!label) {
                const name = interactable.name || interactable.id || 'Interact';
                const lower = name.toLowerCase();
                if (interactable.isNPC || interactable.type === 'npc' || lower.includes('annan') || lower.includes('selvam') || lower.includes('driver') || lower.includes('artisan') || lower.includes('sembian')) {
                    label = `Talk to ${name}`;
                } else if (lower.includes('gate') || lower.includes('door') || lower.includes('court') || lower.includes('wheel') || lower.includes('portal') || lower.includes('clue') || lower.includes('mechanism')) {
                    label = `Examine ${name}`;
                } else if (lower.includes('kadai') || lower.includes('stall') || lower.includes('shop')) {
                    label = `Inquire at ${name}`;
                } else if (lower.includes('item') || lower.includes('chest') || lower.includes('satchel')) {
                    label = `Open ${name}`;
                } else {
                    label = `Inspect ${name}`;
                }
            }
            if (this.promptText) this.promptText.textContent = label;
        } else if (this.promptEl) {
            this.promptEl.classList.remove('visible');
        }
    }

    setObjective(chapter, title, step) {
        if (this.trackerChapter && chapter) this.trackerChapter.textContent = chapter;
        if (this.trackerTitle && title) this.trackerTitle.textContent = title;
        if (this.trackerStep && step) this.trackerStep.textContent = step;
    }
}

window.GameHUD = GameHUD;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameHUD;
}
