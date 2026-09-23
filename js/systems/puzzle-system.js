/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Reusable Puzzle Engine & Environmental Mechanism System (PuzzleSystem)
 * Data-driven puzzle lifecycle management, multiplayer server validation hooks,
 * discrete reset logic, quest progression triggering, and state persistence.
 */

class PuzzleSystem {
  constructor() {
    this.puzzles = new Map(); // id -> puzzle state and runtime definition
    this.activePuzzleId = null;

    // Load initial puzzle definitions from puzzle-data.js
    if (typeof window.PUZZLE_DEFINITIONS !== 'undefined') {
      for (const [id, def] of Object.entries(window.PUZZLE_DEFINITIONS)) {
        this.registerPuzzle(id, def);
      }
    }
  }

  registerPuzzle(id, definition) {
    if (!id || !definition) return;

    this.puzzles.set(id, {
      id: id,
      definition: definition,
      state: JSON.parse(JSON.stringify(definition.initialState || {})),
      solved: false,
      attempts: 0
    });
  }

  startPuzzle(id) {
    const p = this.puzzles.get(id);
    if (!p) {
      console.warn(`[PuzzleSystem] Puzzle "${id}" not found.`);
      return false;
    }

    this.activePuzzleId = id;

    if (window.explorationSystem) {
      window.explorationSystem.setExplorationState('PUZZLE');
    }

    if (window.puzzleUI && typeof window.puzzleUI.openPuzzle === 'function') {
      window.puzzleUI.openPuzzle(p);
    }

    return true;
  }

  closeActivePuzzle() {
    this.activePuzzleId = null;
    if (window.explorationSystem) {
      window.explorationSystem.setExplorationState('NORMAL');
    }
    if (window.puzzleUI && typeof window.puzzleUI.closePuzzle === 'function') {
      window.puzzleUI.closePuzzle();
    }
  }

  performAction(puzzleId, actionKey, params = {}) {
    const p = this.puzzles.get(puzzleId);
    if (!p) return { success: false, message: 'Puzzle not registered' };

    p.attempts++;

    // 1. If multiplayer co-op is connected, check server validation
    if (window.multiplayerManager && window.multiplayerManager.isConnected) {
      // In co-op, clients emit action requests to server authority
      window.multiplayerManager.emitPuzzleAction(puzzleId, actionKey, params);
    }

    // 2. Local execution
    const def = p.definition;
    if (def.actions && def.actions[actionKey] && typeof def.actions[actionKey].action === 'function') {
      p.state = def.actions[actionKey].action(p.state, params);
    } else if (typeof params.applyAction === 'function') {
      p.state = params.applyAction(p.state);
    }

    // 3. Evaluate state
    const solved = this.validateState(puzzleId);

    // Refresh UI if open
    if (window.puzzleUI && typeof window.puzzleUI.refreshUI === 'function') {
      window.puzzleUI.refreshUI(p);
    }

    return {
      success: true,
      puzzleId: puzzleId,
      state: p.state,
      solved: solved
    };
  }

  validateState(puzzleId) {
    const p = this.puzzles.get(puzzleId);
    if (!p) return false;

    if (p.solved) return true; // Already solved

    const def = p.definition;
    let isSolved = false;

    if (typeof def.evaluate === 'function') {
      isSolved = !!def.evaluate(p.state);
    } else if (def.solution) {
      // Key-by-key match
      isSolved = Object.keys(def.solution).every(k => p.state[k] === def.solution[k]);
    }

    if (isSolved && !p.solved) {
      this.completePuzzle(puzzleId);
    }

    return isSolved;
  }

  isSolved(puzzleId) {
    const p = this.puzzles.get(puzzleId);
    return !!(p && p.solved);
  }

  resetPuzzle(puzzleId) {
    const p = this.puzzles.get(puzzleId);
    if (!p) return false;

    // Reset only puzzle-specific state (Section 24)
    // Does NOT reset completed story objectives, inventory, or rewards
    p.state = JSON.parse(JSON.stringify(p.definition.initialState || {}));

    if (window.puzzleUI && typeof window.puzzleUI.refreshUI === 'function') {
      window.puzzleUI.refreshUI(p);
    }

    return true;
  }

  completePuzzle(puzzleId) {
    const p = this.puzzles.get(puzzleId);
    if (!p) return;

    p.solved = true;
    const onSolved = p.definition.onSolved || {};

    // 1. Environmental reveals without teleportation (Section 21 & 44)
    if (onSolved.revealEnvironmentId) {
      const ent = (window.threeWorld && window.threeWorld.entities)
        ? window.threeWorld.entities.find(e => e.id === onSolved.revealEnvironmentId)
        : null;
      if (ent && typeof ent.setStoryState === 'function') {
        ent.setStoryState('solved');
      }
    }

    // 2. Progress quest objectives
    if (onSolved.questId && onSolved.objectiveId && window.gameQuests) {
      window.gameQuests.completeObjective(onSolved.questId, onSolved.objectiveId);
    }

    // 3. Unlock journal discovery
    if (onSolved.journalEntry && window.gameJournal) {
      window.gameJournal.unlockEntry(onSolved.journalEntry);
    }

    // 4. Audio cue
    if (onSolved.soundEffect && window.audioManager && window.audioManager.spatial) {
      const pos = (window.threeWorld && window.threeWorld.player) ? window.threeWorld.player.getPosition() : null;
      window.audioManager.spatial.playSpatialClip(onSolved.soundEffect, pos, 1.0);
    }

    // 5. Diegetic Save
    if (window.gameSaveManager) {
      window.gameSaveManager.saveGame('auto', `puzzle_${puzzleId}_solved`);
    }
  }

  getState() {
    const serialized = {};
    for (const [id, p] of this.puzzles.entries()) {
      serialized[id] = {
        state: p.state,
        solved: p.solved,
        attempts: p.attempts
      };
    }
    return serialized;
  }

  applyState(saved) {
    if (!saved) return;
    for (const [id, sData] of Object.entries(saved)) {
      if (this.puzzles.has(id)) {
        const p = this.puzzles.get(id);
        p.state = { ...p.state, ...sData.state };
        p.solved = !!sData.solved;
        p.attempts = sData.attempts || 0;
      }
    }
  }
}

window.PuzzleSystem = PuzzleSystem;
