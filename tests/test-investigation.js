/**
 * Automated QA Test: Investigation System & Clue Board
 */

window.testInvestigationSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA INVESTIGATION] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const inv = window.investigationSystem || new window.InvestigationSystem();
    if (!inv) throw new Error('InvestigationSystem could not be instantiated');

    // 1. Evidence Registry Integrity
    const hasBlueprint = !!inv.getEvidence('clue_torn_blueprint');
    const hasEnfield = !!inv.getEvidence('clue_enfield_tread');
    const hasSeal = !!inv.getEvidence('clue_chola_seal');
    log('Evidence Registry Integrity', hasBlueprint && hasEnfield && hasSeal,
      `Blueprint: ${hasBlueprint}, Enfield: ${hasEnfield}, Seal: ${hasSeal}`);

    // 2. Discover Evidence & Journal Synchronization
    const initialDiscovered = inv.getEvidence('clue_enfield_tread').discovered;
    inv.addEvidence('clue_enfield_tread');
    const nowDiscovered = inv.getEvidence('clue_enfield_tread').discovered;
    log('Evidence Discovery Lifecycle', nowDiscovered === true,
      `Initial: ${initialDiscovered}, Discovered: ${nowDiscovered}`);

    // 3. Connect Valid Clues on Corkboard
    const connRes = inv.connectClues('clue_torn_blueprint', 'clue_enfield_tread');
    const isConnected = !!(connRes && (connRes.connected || connRes.alreadyConnected));
    log('Clue Connection Integrity', isConnected,
      `Connection status: ${JSON.stringify(connRes)}`);

    // 4. Inspect Evidence Metadata
    const inspected = inv.inspectEvidence('clue_torn_blueprint');
    const isInspected = inspected && inspected.inspected === true;
    log('Evidence Inspection & State Retention', isInspected,
      `Item: ${inspected?.name}, Inspected: ${isInspected}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Investigation Test Failure', false, err.message);
    return { passed: false, results };
  }
};
