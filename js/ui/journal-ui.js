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
                    <button class="journal-tab-btn" data-tab="crafting">🔥 Crafting Workbench</button>
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

    /**
     * Switch tabs programmatically. ui-manager.js routes the CRAFTING panel
     * here (journalUI.switchTab && journalUI.switchTab('crafting')), so this
     * must exist or that route is a silent no-op.
     */
    switchTab(tab) {
        this.currentTab = tab;
        const tabs = this.backdrop ? this.backdrop.querySelectorAll('.journal-tab-btn') : [];
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tab));
        this.renderContent();
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
        } else if (this.currentTab === 'crafting') {
            this.renderCrafting();
        }
    }

    /** Crafting Workbench: live recipe list backed by CraftingSystem. */
    renderCrafting() {
        const pane = document.getElementById('journal-content-pane');
        if (!pane) return;

        const CS = window.CraftingSystem;
        if (!CS) {
            pane.innerHTML = `
                <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">CRAFTING WORKBENCH</h2>
                <p style="color:#94a3b8; font-size:14px;">Crafting data unavailable.</p>
            `;
            return;
        }

        const recipes = CS.getRecipes();
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        const cards = recipes.map((r) => {
            const def = CS.getItem(r.result.itemId) || {};
            const check = CS.canCraft(r.id);
            const ok = check.ok;

            const ings = (r.ingredients || []).map((ing) => {
                const held = CS.countItem(ing.itemId);
                const enough = held >= ing.quantity;
                const name = (CS.getItem(ing.itemId) || {}).name || ing.itemId;
                const color = enough ? '#22c55e' : '#f87171';
                return `<li style="color:${color}; font-size:12px; margin:2px 0;">
                    ${enough ? '✔' : '✖'} ${esc(name)}
                    <span style="color:#64748b;">(${held}/${ing.quantity})</span>
                </li>`;
            }).join('');

            const reason = !ok && check.reason === 'SATCHEL_FULL'
                ? '<span style="color:#f59e0b; font-size:11px;">Satchel full</span>'
                : (!ok && check.missing && check.missing.length
                    ? `<span style="color:#f87171; font-size:11px;">Missing ingredients</span>`
                    : '');

            return `
            <div style="background:rgba(255,255,255,0.03); border:1px solid ${ok ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}; border-radius:8px; padding:14px 16px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div style="flex:1;">
                        <strong style="color:#ffd700; font-size:14px;">${def.icon || '🛠️'} ${esc(r.name)}</strong>
                        <div style="color:#64748b; font-size:11px; margin-top:2px;">${esc(r.tamilName || '')}</div>
                    </div>
                    <span style="font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:2px 6px;">${esc(r.category)}</span>
                </div>
                <p style="color:#94a3b8; font-size:12px; line-height:1.5; margin:8px 0;">${esc(r.description)}</p>
                <ul style="list-style:none; padding:0; margin:8px 0;">${ings}</ul>
                <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                    <button class="craft-btn" data-recipe="${esc(r.id)}" ${ok ? '' : 'disabled'}
                        style="background:${ok ? '#d4af37' : '#334155'}; color:${ok ? '#0b0f19' : '#64748b'};
                               border:none; border-radius:6px; padding:7px 16px; font-weight:700;
                               font-size:12px; cursor:${ok ? 'pointer' : 'not-allowed'};">
                        Craft ×${r.result.quantity}
                    </button>
                    ${reason}
                </div>
            </div>`;
        }).join('');

        pane.innerHTML = `
            <h2 style="font-family:'Cinzel', serif; color:#ffd700; margin-top:0;">CRAFTING WORKBENCH</h2>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:14px;">
                Combine materials gathered across Tamil Nadu. Crafted tools work while carried in your satchel.
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">${cards}</div>
        `;

        pane.querySelectorAll('.craft-btn').forEach((btn) => {
            btn.onclick = () => {
                const res = CS.craft(btn.getAttribute('data-recipe'));
                this.renderContent();
                if (res && res.ok) this.flashCraftMessage('✔ Crafted ' + (res.itemName || ''));
                else this.flashCraftMessage('✖ Craft failed: ' + (res ? res.reason : 'unknown'));
            };
        });
    }

    flashCraftMessage(text) {
        let el = document.getElementById('pc-craft-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'pc-craft-toast';
            el.style.cssText = 'position:fixed;bottom:96px;left:50%;transform:translateX(-50%);' +
                'background:rgba(15,23,42,0.95);color:#f8fafc;border:1px solid #d4af37;' +
                'border-radius:6px;padding:9px 18px;font-size:13px;z-index:10000;';
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.style.opacity = '1';
        clearTimeout(this._craftToastTimer);
        this._craftToastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);
    }
}

window.JournalUI = JournalUI;
