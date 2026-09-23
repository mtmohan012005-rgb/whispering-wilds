// ============================================================================
// THE WHISPERING WILDS - BILINGUAL DIALOGUE UI
// ============================================================================

class DialogueUI {
    constructor() {
        this.container = null;
        this.initDOM();
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.id = 'pc-dialogue-container';
        this.container.className = 'pc-dialogue-box';
        this.container.style.display = 'none';

        this.container.innerHTML = `
            <div class="dialogue-speaker-name" id="dia-speaker-name">Speaker</div>
            <div class="dialogue-tamil-text" id="dia-tamil-text">...</div>
            <div class="dialogue-english-text" id="dia-english-text">...</div>
            <div class="dialogue-choices" id="dia-choices-list"></div>
        `;

        document.body.appendChild(this.container);
    }

    showDialogue(speaker, tamilText, englishText, choices = [], onSelect = null) {
        if (!this.container) return;

        document.getElementById('dia-speaker-name').textContent = speaker;
        document.getElementById('dia-tamil-text').textContent = tamilText;
        document.getElementById('dia-english-text').textContent = englishText;

        const choiceContainer = document.getElementById('dia-choices-list');
        choiceContainer.innerHTML = '';

        choices.forEach((choice, idx) => {
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice-btn';
            btn.innerHTML = `<span style="color:#ffd700; font-weight:700; margin-right:8px;">[${idx + 1}]</span> ${choice.text}`;
            btn.onclick = () => {
                if (onSelect) onSelect(choice, idx);
                if (choice.autoClose !== false) {
                    this.hide();
                }
            };
            choiceContainer.appendChild(btn);
        });

        this.container.style.display = 'flex';
        window.uiInputLocked = true;
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        window.uiInputLocked = false;
    }
}

window.DialogueUI = DialogueUI;
