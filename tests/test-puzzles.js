/**
 * Automated QA Test: Environmental Puzzles & Mechanism Systems
 */

window.testPuzzlesSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA PUZZLES] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const ps = window.puzzleSystem || (window.PuzzleSystem ? new window.PuzzleSystem() : null);
    if (!ps) throw new Error('PuzzleSystem is not defined');

    // Register a test puzzle if empty to ensure isolation
    const testPuzzleId = 'test_qa_hydro_gate';
    ps.registerPuzzle(testPuzzleId, {
      id: testPuzzleId,
      name: 'Chola Hydro Sluice Mechanism',
      initialState: { dial1: 0, dial2: 0 },
      solution: { dial1: 90, dial2: 180 },
      actions: {
        rotate_left: { action: (st) => ({ ...st, dial1: (st.dial1 + 90) % 360 }) },
        rotate_right: { action: (st) => ({ ...st, dial2: (st.dial2 + 90) % 360 }) }
      }
    });

    // 1. Puzzle Registration & Initial State
    const p = ps.puzzles.get(testPuzzleId);
    log('Puzzle Registration & State Isolation', !!p && p.state.dial1 === 0 && p.state.dial2 === 0,
      `State: ${JSON.stringify(p?.state)}`);

    // 2. Action Step Execution & Non-Instant Solving
    const step1 = ps.performAction(testPuzzleId, 'rotate_left');
    const step1Solved = ps.isSolved(testPuzzleId);
    log('Discrete Action Step Execution', step1.success && step1.state.dial1 === 90 && !step1Solved,
      `Dial1: ${step1.state.dial1}, Solved: ${step1Solved}`);

    // 3. Complete Solution Sequence
    ps.performAction(testPuzzleId, 'rotate_right');
    ps.performAction(testPuzzleId, 'rotate_right');
    const fullySolved = ps.isSolved(testPuzzleId);
    log('Solution State Validation', fullySolved,
      `Dial1: ${p.state.dial1}, Dial2: ${p.state.dial2}, Solved: ${fullySolved}`);

    // 4. Safe Reset (Reset mechanism state without corrupting global data)
    ps.resetPuzzle(testPuzzleId);
    const isReset = p.state.dial1 === 0 && p.state.dial2 === 0;
    log('Safe Puzzle State Reset', isReset,
      `State after reset: ${JSON.stringify(p.state)}`);

    // 5. State Serialization (getState / applyState)
    p.state.dial1 = 90;
    const serialized = ps.getState();
    p.state.dial1 = 0;
    ps.applyState(serialized);
    const restored = p.state.dial1 === 90;
    log('Puzzle State Serialization & Persistence', restored,
      `Restored dial1: ${p.state.dial1}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Puzzle Test Failure', false, err.message);
    return { passed: false, results };
  }
};
