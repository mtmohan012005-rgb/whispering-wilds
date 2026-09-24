// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLAYER PROFILE UI
// Cinematic player identity, cosmetic title selector, exploration stats,
// and permanent customization limit indicator.
// ============================================================================

(function() {
    class ProfileUI {
        constructor() {
            this.modalElement = null;
            this.isOpen = false;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'player-profile-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 720px; height: auto;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2>Player Identity & Records</h2>
                            <span>Explorer Dossier & Tamil Nadu Journey Profile (சுயவிவரம்)</span>
                        </div>
                        <button class="codex-close-btn" id="prof-close-btn" aria-label="Close Profile">&times;</button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto;">
                        <!-- Header Banner -->
                        <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid rgba(212,175,55,0.25); padding-bottom: 20px; margin-bottom: 20px;">
                            <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #ffd700; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #ffd700; font-family: 'Cinzel', serif;" id="prof-avatar-letter">
                                E
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <h2 style="margin: 0; font-size: 22px; color: #f8fafc;" id="prof-display-name">Explorer</h2>
                                    <span style="font-size: 11px; background: rgba(34,197,94,0.2); border: 1px solid #22c55e; color: #22c55e; padding: 2px 8px; border-radius: 10px;">VERIFIED</span>
                                </div>
                                <div style="margin-top: 6px;">
                                    <label style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Active Cosmetic Title:</label>
                                    <select id="prof-title-select" style="margin-left: 8px; background: rgba(15,23,42,0.9); border: 1px solid rgba(212,175,55,0.4); color: #ffd700; padding: 4px 10px; border-radius: 4px; font-family: inherit; font-size: 13px; cursor: pointer;">
                                        <option value="Wanderer of Tamil Nadu">Wanderer of Tamil Nadu</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Stats Grid -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 24px;">
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Total Playtime</span>
                                <div style="font-size: 20px; font-weight: bold; color: #f8fafc; margin-top: 4px;" id="prof-stat-playtime">0h 0m</div>
                            </div>
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Achievements Unlocked</span>
                                <div style="font-size: 20px; font-weight: bold; color: #ffd700; margin-top: 4px;" id="prof-stat-achievements">0 / 24</div>
                            </div>
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Codex Entries Documented</span>
                                <div style="font-size: 20px; font-weight: bold; color: #38bdf8; margin-top: 4px;" id="prof-stat-codex">0 / 30</div>
                            </div>
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px;">
                                <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Discoveries & Secrets</span>
                                <div style="font-size: 20px; font-weight: bold; color: #a855f7; margin-top: 4px;" id="prof-stat-discoveries">0</div>
                            </div>
                        </div>

                        <!-- Permanent Customization Guard Card -->
                        <div style="background: rgba(15,23,42,0.9); border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="color: #ffd700; font-size: 13px; text-transform: uppercase;">Appearance Redesigns</strong>
                                <span id="prof-cust-remaining" style="color: #38bdf8; font-size: 13px; font-weight: bold;">5 / 5 Remaining</span>
                            </div>
                            <div class="codex-progress-bar-bg" style="height: 6px; margin-bottom: 8px;">
                                <div id="prof-cust-bar" class="codex-progress-bar-fill" style="width: 100%;"></div>
                            </div>
                            <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
                                Permanent Game Rule: Players are granted a maximum of 5 lifelong appearance modifications. This permanent limit is strictly enforced across all saves and cloud syncs.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#prof-close-btn').addEventListener('click', () => this.close());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });

            // Title selection handler
            const selectEl = modal.querySelector('#prof-title-select');
            selectEl.addEventListener('change', (e) => {
                const title = e.target.value;
                if (window.AchievementSystem) {
                    window.AchievementSystem.setActiveTitle(title);
                }
                if (window.CloudProfile) {
                    window.CloudProfile.updateProfile({ active_title: title });
                }
            });
        }

        open() {
            this.init();
            this.renderProfile();
            this.modalElement.style.display = 'flex';
            this.isOpen = true;
        }

        close() {
            if (!this.modalElement) return;
            this.modalElement.style.display = 'none';
            this.isOpen = false;
        }

        renderProfile() {
            const nameEl = this.modalElement.querySelector('#prof-display-name');
            const avatarEl = this.modalElement.querySelector('#prof-avatar-letter');
            const selectEl = this.modalElement.querySelector('#prof-title-select');
            const playtimeEl = this.modalElement.querySelector('#prof-stat-playtime');
            const achEl = this.modalElement.querySelector('#prof-stat-achievements');
            const codexEl = this.modalElement.querySelector('#prof-stat-codex');
            const discEl = this.modalElement.querySelector('#prof-stat-discoveries');
            const custRemEl = this.modalElement.querySelector('#prof-cust-remaining');
            const custBar = this.modalElement.querySelector('#prof-cust-bar');

            // Name & Avatar
            let displayName = 'Explorer';
            if (window.AuthService && window.AuthService.getCurrentUser()) {
                displayName = window.AuthService.getCurrentUser().displayName || window.AuthService.getCurrentUser().email.split('@')[0];
            } else if (window.GameState && window.GameState.characterCustomization && window.GameState.characterCustomization.name) {
                displayName = window.GameState.characterCustomization.name;
            }
            nameEl.textContent = displayName;
            avatarEl.textContent = displayName.charAt(0).toUpperCase();

            // Titles
            selectEl.innerHTML = '';
            const titles = (window.AchievementSystem && window.AchievementSystem.getAvailableTitles) 
                ? window.AchievementSystem.getAvailableTitles()
                : ['Wanderer of Tamil Nadu'];

            const activeTitle = window.AchievementSystem ? window.AchievementSystem.getActiveTitle() : 'Wanderer of Tamil Nadu';

            titles.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                if (t === activeTitle) opt.selected = true;
                selectEl.appendChild(opt);
            });

            // Playtime
            const totalSec = (window.GameState && window.GameState.playTime) ? window.GameState.playTime : 0;
            const hours = Math.floor(totalSec / 3600);
            const minutes = Math.floor((totalSec % 3600) / 60);
            playtimeEl.textContent = `${hours}h ${minutes}m`;

            // Achievements
            const achUnlocked = window.AchievementSystem ? window.AchievementSystem.getUnlockedCount() : 0;
            achEl.textContent = `${achUnlocked} / 24`;

            // Codex
            const codexUnlocked = window.CodexSystem ? window.CodexSystem.getUnlockedCount() : 0;
            codexEl.textContent = `${codexUnlocked} Entries`;

            // Discoveries
            const discCount = (window.DiscoveryProgression ? window.DiscoveryProgression.getTotalDiscoveredPoints() : 0) +
                (window.SecretDiscoverySystem ? window.SecretDiscoverySystem.discoveredCount : 0);
            discEl.textContent = `${discCount} Locations`;

            // Customization Guard
            const custUsed = Math.min((window.GameState && window.GameState.customizationChangesUsed) ? window.GameState.customizationChangesUsed : 0, 5);
            const remaining = Math.max(0, 5 - custUsed);
            custRemEl.textContent = `${remaining} / 5 Remaining`;
            custBar.style.width = `${(remaining / 5) * 100}%`;
        }
    }

    if (typeof window !== 'undefined') {
        window.ProfileUI = new ProfileUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ProfileUI };
    }
})();
