// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SIDE QUEST UI
// Regional side quest journal, step tracking, and reward summaries.
// ============================================================================

(function() {
    class SideQuestUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'side-quest-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 900px;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>Regional Side Stories</h2>
                            <span>Local Requests, Artisans & Countryside Tales (துணை கதைகள்)</span>
                        </div>
                        <button class="codex-close-btn" id="sq-close-btn" aria-label="Close Side Quests">&times;</button>
                    </div>
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <div style="width: 280px; border-right: 1px solid rgba(212,175,55,0.2); overflow-y: auto; padding: 12px;" id="sq-list">
                            <!-- Populated dynamically -->
                        </div>
                        <div style="flex: 1; overflow-y: auto; padding: 24px;" id="sq-detail">
                            <!-- Detail view -->
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#sq-close-btn').addEventListener('click', () => this.close());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }

        open() {
            this.init();
            this.renderQuests();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
        }

        close() {
            if (!this.modalElement) return;
            this.modalElement.style.display = 'none';
            this.isOpen = false;
        }

        renderQuests() {
            const listEl = this.modalElement.querySelector('#sq-list');
            listEl.innerHTML = '';

            const sys = window.SideQuestSystem;
            if (!sys) {
                listEl.innerHTML = '<p style="color:#94a3b8; padding:12px;">Quests unavailable.</p>';
                return;
            }

            const quests = sys.getAllQuests();
            quests.forEach((q, idx) => {
                const item = document.createElement('div');
                item.className = `codex-nav-btn ${sys.activeQuestId === q.id || idx === 0 ? 'active' : ''}`;
                item.style.marginBottom = '8px';
                item.style.cursor = 'pointer';

                const status = q.completed ? '<span style="color:#22c55e; font-size:11px; float:right;">DONE</span>' : '';

                item.innerHTML = `
                    <div style="font-weight:600; font-size:13px;">${q.title}</div>
                    <div style="font-size:11px; color:#94a3b8;">${q.region.replace('_', ' ').toUpperCase()} ${status}</div>
                `;

                item.addEventListener('click', () => {
                    listEl.querySelectorAll('.codex-nav-btn').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    this.renderDetail(q);
                });

                listEl.appendChild(item);
            });

            if (quests.length > 0) {
                this.renderDetail(quests[0]);
            }
        }

        renderDetail(quest) {
            const detailEl = this.modalElement.querySelector('#sq-detail');
            if (!quest) {
                detailEl.innerHTML = '<p style="color:#94a3b8;">Select a side story.</p>';
                return;
            }

            let stepsHtml = '';
            quest.steps.forEach(s => {
                stepsHtml += `
                    <li style="margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                        <span style="color:${s.done ? '#22c55e' : '#64748b'}; font-size:16px;">${s.done ? '&#10003;' : '&#9675;'}</span>
                        <span style="color:${s.done ? '#94a3b8' : '#f8fafc'}; text-decoration:${s.done ? 'line-through' : 'none'};">${s.description}</span>
                    </li>
                `;
            });

            const isActive = window.SideQuestSystem && window.SideQuestSystem.activeQuestId === quest.id;
            const trackBtn = quest.completed ? '' : `
                <button id="track-quest-btn" style="margin-top:16px; background:${isActive ? 'rgba(34,197,94,0.2)' : 'rgba(212,175,55,0.2)'}; border:1px solid ${isActive ? '#22c55e' : '#ffd700'}; color:${isActive ? '#22c55e' : '#ffd700'}; padding:8px 16px; border-radius:4px; cursor:pointer;">
                    ${isActive ? 'Currently Tracked' : 'Track This Story'}
                </button>
            `;

            detailEl.innerHTML = `
                <div style="border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 16px; margin-bottom: 16px;">
                    <div style="font-size:12px; color:#ffd700; text-transform:uppercase;">${quest.region.replace('_', ' ').toUpperCase()} &bull; ${quest.locationName}</div>
                    <h1 style="margin:4px 0 2px 0; font-size:22px; color:#f8fafc;">${quest.title}</h1>
                    <h3 style="margin:0 0 8px 0; font-size:14px; color:#38bdf8; font-weight:normal;">${quest.tamilTitle || ''}</h3>
                    <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">Given by: <strong style="color:#e2e8f0;">${quest.giver}</strong></div>
                    <p style="color:#cbd5e1; line-height:1.6; font-size:14px;">${quest.summary}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color:#ffd700; margin-bottom:10px; font-size:14px; text-transform:uppercase;">Story Steps</h4>
                    <ul style="list-style:none; padding-left:0; margin:0;">
                        ${stepsHtml}
                    </ul>
                </div>

                <div style="padding: 12px 16px; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid #22c55e;">
                    <strong style="color:#22c55e; font-size:12px; text-transform:uppercase;">Rewards:</strong>
                    <div style="color:#e2e8f0; font-size:13px; margin-top:4px;">
                        ${quest.rewards.currency} Copper Coins &bull; ${quest.rewards.xp} XP &bull; Lore Codex Entry
                    </div>
                </div>

                ${trackBtn}
            `;

            const btn = detailEl.querySelector('#track-quest-btn');
            if (btn && window.SideQuestSystem && !quest.completed) {
                btn.addEventListener('click', () => {
                    window.SideQuestSystem.setActiveQuest(quest.id);
                    this.renderQuests();
                });
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.SideQuestUI = new SideQuestUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SideQuestUI };
    }
})();
