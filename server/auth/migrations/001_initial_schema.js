// ============================================================================
// MIGRATION 001 - INITIAL AUTH SCHEMA
// ============================================================================

const db = require('../db');

function run() {
    if (!db.data.users) db.data.users = {};
    if (!db.data.sessions) db.data.sessions = {};
    if (!db.data.password_reset_tokens) db.data.password_reset_tokens = {};
    if (!db.data.email_verification_tokens) db.data.email_verification_tokens = {};
    if (!db.data.cloud_saves) db.data.cloud_saves = {};
    db.data.version = 1;
    db.save();
    return true;
}

module.exports = { run };
