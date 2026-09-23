// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ROOT SERVER ENTRY POINT
// Delegates to modular server architecture in server/server.js
// ============================================================================

const serverApp = require('./server/server');

if (require.main === module) {
    serverApp.start();
}

module.exports = serverApp;
