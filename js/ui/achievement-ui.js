// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ACHIEVEMENT UI MODAL
// Minimalist achievement list with category tabs, cosmetic titles, and rewards.
// ============================================================================

(function() {
    class AchievementUI {
        constructor() {
            this.container = null;
            this.activeCategory = 'ALL';
            this.isOpen = false;

            this.initDOM();
        }

        initDOM() {
            if (document.getElementById('achievement-modal-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'achievement-modal-overlay';
            overlay.className = 'achievement-modal-overlay';
            overlay.style.display = 'none';

            overlay.innerHTML = `
                <div class="codex-window" style="max-width: 900px; height: 80vh;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>சாதனைகள் & களப் பட்டங்கள்</h2>
                            <span>The Whispering Wilds • Achievements & Cosmetic Titles</span>
                        </div>
                        <button id="ach-close-btn" class="close-btn" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>

                    <!-- Progress Header -->
                    <div style="padding: 16px 28px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1; max-width: 450px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #cbd5e1;">
                                <span>Total Milestones Completed</span>
                                <span id="ach-header-count">0 / 0</span>
                            </div>
                            <div class="progression-bar-container">
                                <div id="ach-header-fill" class="progression-bar-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase;">Active Title:</span>
                            <span id="ach-active-title" style="font-size: 13px; font-weight: 700; color: #ffd700; border: 1px solid rgba(212,175,55,0.4); padding: 4px 10px; border-radius: 4px;">Explorer</span>
                        </div>
                    </div>

                    <!-- Category Tab Bar -->
                    <div style="padding: 10px 24px; display: flex; gap: 8px; overflow-x: auto; background: rgba(12,18,34,0.6); border-bottom: 1px solid rgba(255,255,255,0.08);">
                        <button class="ach-cat-btn active" data-cat="ALL" style="padding: 6px 14px; border-radius: 4px; background: rgba(212,175,55,0.2); border: 1px solid #ffd700; color: #ffd700; font-size: 12px; cursor: pointer;">ALL</button>
                        <button class="ach-cat-btn" data-cat="STORY" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">STORY</button>
                        <button class="ach-cat-btn" data-cat="EXPLORATION" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">EXPLORATION</button>
                        <button class="ach-cat-btn" data-cat="WILDLIFE" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">WILDLIFE</button>
                        <button class="ach-cat-btn" data-cat="CULTURE" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">CULTURE</button>
                        <button class="ach-cat-btn" data-cat="PHOTOGRAPHY" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">PHOTOGRAPHY</button>
                        <button class="ach-cat-btn" data-cat="PUZZLES" style="padding: 6px 14px; border-radius: 4px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; font-size: 12px; cursor: pointer;">PUZZLES</button>
                    </div>

                    <!-- Achievement Cards Container -->
                    <div id="ach-cards-list" style="flex: 1; overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 12px;"></div>
                </div>
            `;

            document.body.appendChild(overlay);
            this.container = overlay;
            this.bindEvents();
        }

        bindEvents() {
            if (!this.container) return;

            document.getElementById('ach-close-btn')?.addEventListener('click', () => this.close());

            const catBtns = this.container.querySelectorAll('.ach-cat-btn');
            catBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    catBtns.forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.borderColor = 'rgba(255,255,255,0.2)';
                        b.style.color = '#cbd5e1';
                    });
                    btn.classList.add('active');
                    btn.style.background = 'rgba(212,175,55,0.2)';
                    btn.style.borderColor = '#ffd700';
                    btn.style.color = '#ffd700';

                    this.activeCategory = btn.dataset.cat;
                    this.renderList();
                });
            });
        }

        open() {
            if (!this.container) this.initDOM();
            this.isOpen = true;
            this.container.style.display = 'flex';
            this.renderList();
        }

        close() {
            if (!this.container) return;
            this.isOpen = false;
            this.container.style.display = 'none';
        }

        toggle() {
            if (this.isOpen) this.close();
            else this.open();
        }

        renderList() {
            const listEl = document.getElementById('ach-cards-list');
            if (!listEl || !window.achievementSystem) return;

            const progress = window.achievementSystem.getProgress();
            document.getElementById('ach-header-count').textContent = `${progress.unlocked} / ${progress.total} (${progress.percent}%)`;
            document.getElementById('ach-header-fill').style.width = `${progress.percent}%`;
            document.getElementById('ach-active-title').textContent = window.achievementSystem.activeTitle;

            const achievements = Array.from(window.achievementSystem.achievements.values());
            const filtered = achievements.filter(ach => {
                if (this.activeCategory === 'ALL') return true;
                return ach.category === this.activeCategory;
            });

            listEl.innerHTML = '';
            filtered.forEach(ach => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid ${ach.completed ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'};
                    border-radius: 8px;
                    padding: 14px 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                `;

                const isHidden = ach.hidden && !ach.completed;
                const title = isHidden ? 'Hidden Milestone' : ach.title;
                const tamil = isHidden ? 'மறைக்கப்பட்ட சாதனை' : (ach.tamilTitle || '');
                const desc = isHidden ? 'Explore the world of Tamil Nadu to reveal this achievement.' : ach.description;

                let rewardText = '';
                if (ach.reward) {
                    if (ach.reward.title) rewardText += `Title: "${ach.reward.title}" `;
                    if (ach.reward.currency) rewardText += `+₹${ach.reward.currency} `;
                    if (ach.reward.value && ach.reward.type === 'currency') rewardText += `+₹${ach.reward.value} `;
                }

                card.innerHTML = `
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-size: 15px; font-weight: 700; color: ${ach.completed ? '#ffd700' : '#f8fafc'};">
                                ${ach.completed ? '🏆 ' : '🔒 '}${title}
                            </span>
                            <span style="font-size: 12px; color: #94a3b8;">${tamil}</span>
                        </div>
                        <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">${desc}</div>
                        ${rewardText ? `<div style="font-size: 11px; color: #d4af37; margin-top: 6px;">Reward: ${rewardText}</div>` : ''}
                    </div>
                    <div style="margin-left: 20px; text-align: right;">
                        <span style="font-size: 12px; font-weight: 700; color: ${ach.completed ? '#22c55e' : '#64748b'};">
                            ${ach.completed ? 'COMPLETED' : 'LOCKED'}
                        </span>
                    </div>
                `;

                listEl.appendChild(card);
            });
        }
    }

    window.AchievementUI = AchievementUI;
})();
