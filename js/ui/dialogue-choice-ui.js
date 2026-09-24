/**
 * The Whispering Wilds (Kaattu Vazhi) - Dialogue Choice UI
 * Interactive branching selection supporting mouse clicks and numeric keys (1, 2, 3, 4).
 */

class DialogueChoiceUI {
  constructor() {
    this.container = null;
    this.callback = null;
    this.choices = [];
    this.initDOM();
  }

  initDOM() {
    let existing = document.getElementById('pc-dialogue-choice-modal');
    if (existing) {
      this.container = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'pc-dialogue-choice-modal';
    modal.className = 'dialogue-choice-overlay hidden';
    modal.innerHTML = `
      <div class="dialogue-choice-list" id="cin-choice-buttons"></div>
    `;

    document.body.appendChild(modal);
    this.container = modal;

    window.addEventListener('keydown', (e) => {
      if (this.container.classList.contains('hidden')) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= this.choices.length) {
        this.selectChoice(num - 1);
      }
    });
  }

  show(choices = [], onSelect = null) {
    this.choices = choices;
    this.callback = onSelect;

    const listEl = document.getElementById('cin-choice-buttons');
    if (!listEl) return;
    listEl.innerHTML = '';

    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'cin-choice-btn';
      btn.innerHTML = `
        <span class="choice-num">[${idx + 1}]</span>
        <span class="choice-en">${choice.text}</span>
        ${choice.tamilText ? `<span class="choice-ta">${choice.tamilText}</span>` : ''}
      `;
      btn.addEventListener('click', () => {
        this.selectChoice(idx);
      });
      listEl.appendChild(btn);
    });

    this.container.classList.remove('hidden');
  }

  selectChoice(index) {
    if (index >= 0 && index < this.choices.length) {
      this.hide();
      if (this.callback) {
        const cb = this.callback;
        this.callback = null;
        cb(index);
      }
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }
}

window.DialogueChoiceUI = DialogueChoiceUI;
