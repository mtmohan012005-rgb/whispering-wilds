// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENCOUNTER UI
// Interactive modal for emergent non-combat choices during world exploration.
// ============================================================================

(function() {
    class EncounterUI {
        constructor() {
            this.modalElement = null;
            this.currentEncounter = null;
        }

        init() {
            if (this.modalElement) return;

            const modal = document.createElement('div');
            modal.id = 'encounter-prompt-modal';
            modal.className = 'progression-modal-overlay';
            modal.style.display = 'none';

            modal.innerHTML = `
                <div class="codex-window" style="max-width: 620px; height: auto;">
                    <div class="codex-header">
                        <div class="codex-title-group">
                            <h2 id="enc-title" style="color: #ffd700;">Local Encounter</h2>
                            <span>Emergent Event on the Road</span>
                        </div>
                        <button class="codex-close-btn" id="enc-close-btn" aria-label="Close Encounter">&times;</button>
                    </div>
                    <div style="padding: 24px; overflow-y: auto;">
                        <p id="enc-summary" style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-top: 0;">
                            <!-- Populated dynamically -->
                        </p>
                        <div id="enc-choices" style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.modalElement = modal;

            modal.querySelector('#enc-close-btn').addEventListener('click', () => this.close());
        }

        prompt(encounter) {
            this.init();
            this.currentEncounter = encounter;

            this.modalElement.querySelector('#enc-title').textContent = encounter.title;
            this.modalElement.querySelector('#enc-summary').textContent = encounter.summary;

            const choicesEl = this.modalElement.querySelector('#enc-choices');
            choicesEl.innerHTML = '';

            encounter.choices.forEach(c => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    background: rgba(15,23,42,0.85);
                    border: 1px solid rgba(212,175,55,0.4);
                    color: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    font-size: 13px;
                    font-family: inherit;
                    transition: all 0.2s ease;
                `;
                btn.onmouseenter = () => btn.style.borderColor = '#ffd700';
                btn.onmouseleave = () => btn.style.borderColor = 'rgba(212,175,55,0.4)';

                btn.textContent = `\u25b8 ${c.text}`;
                btn.addEventListener('click', () => {
                    this.resolveChoice(c.id);
                });

                choicesEl.appendChild(btn);
            });

            this.modalElement.style.display = 'flex';
        }

        resolveChoice(choiceId) {
            if (this.currentEncounter && window.EncounterSystem) {
                window.EncounterSystem.resolveEncounter(this.currentEncounter.id, choiceId);
            }
            this.close();
        }

        close() {
            if (this.modalElement) {
                this.modalElement.style.display = 'none';
            }
        }
    }

    if (typeof window !== 'undefined') {
        window.EncounterUI = new EncounterUI();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EncounterUI };
    }
})();
