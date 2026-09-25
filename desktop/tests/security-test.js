/**
 * Security, CSP & Isolation Unit Tests
 */

const securityManager = require('../electron/security-manager');
const protocolHandler = require('../electron/protocol-handler');

function runSecurityTests() {
  const results = { name: 'SecurityTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Production CSP contains strict policies
  const prodCsp = securityManager.getCSPHeader(false);
  assert(prodCsp.includes("default-src 'self'"), 'CSP enforces default-src self');
  assert(prodCsp.includes("object-src 'none'"), 'CSP enforces object-src none');
  assert(!prodCsp.includes("http://localhost"), 'Production CSP contains zero localhost references');

  // 2. WebPreferences enforce context isolation and disable Node integration
  const prefs = securityManager.getSecureWebPreferences('test/preload.js');
  assert(prefs.contextIsolation === true, 'contextIsolation must be true');
  assert(prefs.nodeIntegration === false, 'nodeIntegration must be false');
  assert(prefs.enableRemoteModule === false, 'remote module must be disabled');

  // 3. ProtocolHandler prevents directory traversal
  const safeAsset = protocolHandler.resolveSafePath('game://assets/icons/app-icon.svg');
  assert(safeAsset !== null, 'Valid local asset resolves');

  const dangerousAsset = protocolHandler.resolveSafePath('game://../../../../Windows/System32/cmd.exe');
  assert(dangerousAsset === null, 'Directory traversal attack correctly blocked');

  return results;
}

if (require.main === module) {
  const r = runSecurityTests();
  console.log(`[SecurityTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runSecurityTests };
