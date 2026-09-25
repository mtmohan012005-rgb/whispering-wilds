/**
 * Update Staging, Checksum & Rollback Unit Tests
 */

const updateManager = require('../electron/update-manager');

async function runUpdateTests() {
  const results = { name: 'UpdateTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Initial status idle
  const status = updateManager.getUpdateStatus();
  assert(status.status === 'IDLE', 'Initial update status is IDLE');

  // 2. Reject malformed update manifest
  try {
    await updateManager.stageUpdate({});
    assert(false, 'Should reject empty manifest');
  } catch (e) {
    assert(true, 'Rejected empty manifest');
  }

  // 3. Stage valid update
  const manifest = {
    version: '1.1.0',
    checksum: 'mock-sha256-hash',
    mockValid: true,
    releaseNotes: 'Performance improvements and bug fixes.'
  };

  const staged = await updateManager.stageUpdate(manifest);
  assert(staged.status === 'STAGED', 'Update staged successfully');

  // 4. Defer update during active gameplay
  const deferred = await updateManager.applyStagedUpdate(true);
  assert(deferred.status === 'DEFERRED', 'Update deferred during active gameplay');

  // 5. Apply update when gameplay inactive
  const applied = await updateManager.applyStagedUpdate(false);
  assert(applied.status === 'SUCCESS' && applied.version === '1.1.0', 'Update applied cleanly');

  // 6. Rollback
  const rolledBack = await updateManager.rollbackUpdate();
  assert(rolledBack.status.includes('ROLLED_BACK'), 'Rollback executed safely');

  return results;
}

if (require.main === module) {
  runUpdateTests().then(r => {
    console.log(`[UpdateTest] Passed: ${r.passed}, Failed: ${r.failed}`);
    if (r.failed > 0) {
      r.errors.forEach(e => console.error(' *', e));
      process.exit(1);
    }
  });
}

module.exports = { runUpdateTests };
