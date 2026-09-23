/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Reusable Puzzle Interface Controller (PuzzleUI)
 * Handles physical dial rotations, sluice gate levers, sequence slotting,
 * reset buttons, and diegetic solving feedback.
 */

class PuzzleUI {
  constructor() {
    this.modal = document.getElementById('puzzle-modal');
    this.currentPuzzle = null;
    this.initDOM();
  }

  initDOM() {
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.id = 'puzzle-modal';
      this.modal.className = 'hidden';
      document.body.appendChild(this.modal);
    }

    // Attach global close button listener
    const closeBtn = document.getElementById('close-puzzle-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (window.puzzleSystem) {
          window.puzzleSystem.closeActivePuzzle();
        } else {
          this.closePuzzle();
        }
      };
    }
  }

  openPuzzle(puzzleInstance) {
    if (!puzzleInstance) return;
    this.currentPuzzle = puzzleInstance;

    if (window.uiManager) {
      window.uiManager.openModal('PUZZLE');
    }

    this.render();
    if (this.modal) {
      this.modal.classList.remove('hidden');
    }
  }

  closePuzzle() {
    this.currentPuzzle = null;
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
    if (window.uiManager && window.uiManager.currentMode === 'PUZZLE') {
      window.uiManager.closeModal('PUZZLE');
    }
  }

  refreshUI(puzzleInstance) {
    if (puzzleInstance) this.currentPuzzle = puzzleInstance;
    this.render();
  }

  render() {
    if (!this.modal || !this.currentPuzzle) return;
    const p = this.currentPuzzle;
    const def = p.definition;
    const state = p.state;

    let actionsHTML = '';
    if (def.actions) {
      for (const [actionKey, act] of Object.entries(def.actions)) {
        actionsHTML += `<button class="btn-primary puzzle-action-btn" data-action="${actionKey}" style="margin: 6px; padding: 10px 16px;">${act.label}</button>`;
      }
    }

    // Status message
    let statusText = p.solved
      ? '✓ MECHANISM ALIGNED: Sluice gates open! Sunken route revealed!'
      : 'Rotate granite gears and configure sluices to direct water into the sunken canal.';

    this.modal.innerHTML = `
      <div class="puzzle-card" style="background: linear-gradient(145deg, #1b2432, #0e141e); border: 2px solid #d4af37; border-radius: 12px; padding: 24px; max-width: 600px; color: #fff; text-align: center; margin: 50px auto; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
        <div class="puzzle-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 12px;">
          <h3 style="margin: 0; color: #f39c12; font-size: 20px;">${def.title || 'Environmental Mechanism'}</h3>
          <button id="close-puzzle-btn" style="background: transparent; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <p class="puzzle-desc" style="color: #cbd5e1; font-size: 14px; margin: 16px 0; line-height: 1.5;">${def.description || ''}</p>

        <div class="puzzle-telemetry" style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-family: monospace; font-size: 13px;">
          <div>Wheel: <strong>${state.wheelRotation !== undefined ? state.wheelRotation + '°' : 'N/A'}</strong> | Water Level: <strong>${state.waterLevel !== undefined ? state.waterLevel + '%' : 'N/A'}</strong></div>
          <div>Sluice A: <strong>${state.sluiceAState || 'N/A'}</strong> | Sluice B: <strong>${state.sluiceBState || 'N/A'}</strong> | Sluice C: <strong>${state.sluiceCState || 'N/A'}</strong></div>
        </div>

        <div class="puzzle-actions-group" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
          ${actionsHTML}
          <button id="puzzle-reset-btn" class="btn-secondary" style="margin: 6px; padding: 10px 16px; background: #c0392b; color: #fff; border: none; border-radius: 6px; cursor: pointer;">↺ Reset Mechanism</button>
        </div>

        <div id="puzzle-status" style="margin-top: 18px; font-size: 14px; color: ${p.solved ? '#2ecc71' : '#f1c40f'}; font-weight: bold;">
          ${statusText}
        </div>
      </div>
    `;

    // Bind event listeners
    const closeBtn = this.modal.querySelector('#close-puzzle-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (window.puzzleSystem) window.puzzleSystem.closeActivePuzzle();
        else this.closePuzzle();
      };
    }

    const resetBtn = this.modal.querySelector('#puzzle-reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (window.puzzleSystem) window.puzzleSystem.resetPuzzle(p.id);
      };
    }

    const actionBtns = this.modal.querySelectorAll('.puzzle-action-btn');
    actionBtns.forEach(btn => {
      btn.onclick = () => {
        const actKey = btn.dataset.action;
        if (window.puzzleSystem) {
          window.puzzleSystem.performAction(p.id, actKey);
        }
      };
    });
  }
}

window.PuzzleUI = PuzzleUI;
