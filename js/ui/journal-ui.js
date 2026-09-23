// ============================================================================
// THE WHISPERING WILDS - FIELD JOURNAL & CASE FILE UI
// ============================================================================

class JournalUI {
    constructor() {
        this.backdrop = null;
        this.currentTab = 'cases'; // cases | flora_fauna | lore | clue_board
        this.initDOM();
    }

    initDOM() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'pc-journal-backdrop';
        this.backdrop.className = 'pc-modal-backdrop';

        this.backdrop.innerHTML = `
            <div class="pc-modal-window pc-journal-layout">
                <!-- SIDEBAR -->
                <div class="journal-sidebar">
                    <div style="font-family: 'Cinzel', serif; font-size: 16px; color: #ffd700; margin-bottom: 12px; font-weight: 700;">
                        📓 FIELD JOURNAL
                    </div>
                    <button class="journal-tab-btn active" data-tab="cases">📋 Active Cases</button>
                    <button class="journal-tab-btn" data-tab="clue_board">📌 Clue Board</button>
                    <button class="journal-tab-btn" data-tab="flora_fauna">🌿 Wildlife & Flora</button>
                    <button class="journal-tab-btn" data-tab="lore">🏛️ Tamil Nadu Lore</button>
                    <div style="flex: 1;"></div>
                    <button class="pc-menu-btn" id="pc-journal-close-btn" style="padding: 8px 12px; font-size: 13px;">
                        <span>Close</span> <kbd>Esc</kbd>
                    </button>
                </div>

                <!-- CONTENT PANE -->
                <div class="journal-content-pane" id="journal-content-pane">
                    <!-- Populated dynamically -->
                </div>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        this.bindEvents();
    }

    bindEvents() {
        const tabs = this.backdrop.querySelectorAll('.journal-tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.getAttribute('data-tab');
                this.renderContent();
            };
        });

        document.getElementById('pc-journal-close-btn').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('JOURNAL');
        };
    }

    show() {
        if (this.backdrop) {
            this.backdrop.classList.add('active');
            this.renderContent();
        }
    }

    hide() {
        if (this.backdrop) this.backdrop.classList.remove('active');
    }

    renderContent() {
        const pane = document.getElementById('journal-content-pane');
        if (!pane) return;

        if (this.currentTab === 'cases') {
            pane.innerHTML = `
                <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">CHAPTER I • THE MADRAS RECONNAISSANCE</h2>
                <p style="color:#94a3b8; font-size:14px; line-height:1.6;">
                    An antique Chola bronze idol was spirited away from the Government Museum in Egmore under torrential monsoon rain.
                    The trail leads through old Madras auto routes toward the coastal backwaters.
                </p>
                <div style="background:rgba(255,255,255,0.04); border-left:3px solid #d4af37; padding:14px 18px; border-radius:6px; margin:16px 0;">
                    <div style="font-weight:700; color:#f8fafc; margin-bottom:6px;">Current Objectives:</div>
                    <div style="color:#cbd5e1; font-size:13px; margin-bottom:4px;">✔ Interrogate Auto Driver Velu on Mount Road</div>
                    <div style="color:#cbd5e1; font-size:13px; margin-bottom:4px;">✔ Sip ginger cutting chai at Murugan Annan's tea kadai</div>
                    <div style="color:#ffd700; font-size:13px; font-weight:600;">➔ Investigate the old Chola waterwheel mechanism in the Delta</div>
                </div>
            `;
        } else if (this.currentTab === 'clue_board') {
            pane.innerHTML = `
                <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">INVESTIGATION CASE CORKBOARD</h2>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:16px;">
                    <div style="background:#1e293b; border:1px solid #d4af37; border-radius:8px; padding:14px;">
                        <span style="font-size:11px; background:#d4af37; color:#0b0f19; font-weight:700; padding:2px 6px; border-radius:4px;">EVIDENCE #1</span>
                        <h4 style="margin:8px 0 4px 0; color:#f8fafc;">Tire Treads in Red Laterite Mud</h4>
                        <p style="font-size:12px; color:#94a3b8; line-height:1.4;">Narrow single-track knobby tire marks consistent with a Royal Enfield Bullet 350 heading south on ECR.</p>
                    </div>
                    <div style="background:#1e293b; border:1px solid #d4af37; border-radius:8px; padding:14px;">
                        <span style="font-size:11px; background:#d4af37; color:#0b0f19; font-weight:700; padding:2px 6px; border-radius:4px;">EVIDENCE #2</span>
                        <h4 style="margin:8px 0 4px 0; color:#f8fafc;">Brass Sluice Alignment Dial</h4>
                        <p style="font-size:12px; color:#94a3b8; line-height:1.4;">Chola hydro-engineering puzzle dial. Ratios: 3 turns counter-clockwise, 2 turns clockwise.</p>
                    </div>
                </div>
            `;
        } else if (this.currentTab === 'flora_fauna') {
            pane.innerHTML = `
                <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">WILDLIFE & FLORA FIELD LOGS</h2>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:12px 16px; border-radius:8px;">
                        <strong style="color:#38bdf8;">Nilgiri Tahr (Nilgiritragus hylocrius)</strong>
                        <p style="font-size:13px; color:#94a3b8; margin:4px 0 0 0;">Endangered ungulate endemic to the high montane shola-grasslands. Highly alert at 18m; flees at 10m.</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:12px 16px; border-radius:8px;">
                        <strong style="color:#22c55e;">Neelakurinji (Strobilanthes kunthiana)</strong>
                        <p style="font-size:13px; color:#94a3b8; margin:4px 0 0 0;">Fabled purple shrub blooming once every 12 years across the slopes of the Nilgiris (Blue Mountains).</p>
                    </div>
                </div>
            `;
        } else if (this.currentTab === 'lore') {
            pane.innerHTML = `
                <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">ARCHIVES OF TAMIL AKAM & PURAM</h2>
                <div style="font-size:13px; color:#cbd5e1; line-height:1.6;">
                    <p>
                        The land is traditionally classified into Five Thinai (ecosystems):
                        <strong>Kurinji</strong> (Montane highlands), <strong>Mullai</strong> (Forest pasture),
                        <strong>Marutham</strong> (Agricultural wetlands), <strong>Neythal</strong> (Coastal littoral),
                        and <strong>Paalai</strong> (Arid waste).
                    </p>
                    <p>
                        Each region discovered opens new ecological paths, seasonal winds, and acoustic resonance signatures.
                    </p>
                </div>
            `;
        }
    }
}

window.JournalUI = JournalUI;
