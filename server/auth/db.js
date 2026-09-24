// ============================================================================
// THE WHISPERING WILDS - AUTH DATABASE ENGINE (FILE-BACKED TRANSACTIONAL DB)
// ============================================================================

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'auth_database.json');
const BACKUP_FILE = path.join(DB_DIR, 'auth_database.json.bak');

class Database {
    constructor() {
        this.data = {
            version: 1,
            users: {},
            sessions: {},
            password_reset_tokens: {},
            email_verification_tokens: {},
            cloud_saves: {}
        };
        this.init();
    }

    init() {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
        }
        if (fs.existsSync(DB_FILE)) {
            try {
                const raw = fs.readFileSync(DB_FILE, 'utf8');
                this.data = JSON.parse(raw);
            } catch (err) {
                console.error('[AuthDB] Primary DB corrupt, checking backup:', err.message);
                if (fs.existsSync(BACKUP_FILE)) {
                    try {
                        const bak = fs.readFileSync(BACKUP_FILE, 'utf8');
                        this.data = JSON.parse(bak);
                    } catch (bakErr) {
                        console.error('[AuthDB] Backup DB corrupt, resetting store:', bakErr.message);
                    }
                }
            }
        } else {
            this.save();
        }
    }

    save() {
        try {
            const serialized = JSON.stringify(this.data, null, 2);
            // Write backup first if main exists
            if (fs.existsSync(DB_FILE)) {
                fs.copyFileSync(DB_FILE, BACKUP_FILE);
            }
            // Atomic write via temp file
            const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
            fs.writeFileSync(tempFile, serialized, 'utf8');
            fs.renameSync(tempFile, DB_FILE);
        } catch (err) {
            console.error('[AuthDB] Failed to save auth database:', err.message);
        }
    }

    // --- Users ---
    findUserByEmail(email) {
        if (!email) return null;
        const normalized = email.trim().toLowerCase();
        for (const id in this.data.users) {
            if (this.data.users[id].normalized_email === normalized) {
                return { ...this.data.users[id] };
            }
        }
        return null;
    }

    findUserById(id) {
        return this.data.users[id] ? { ...this.data.users[id] } : null;
    }

    createUser(user) {
        const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const record = {
            id,
            email: user.email.trim(),
            normalized_email: user.email.trim().toLowerCase(),
            password_hash: user.password_hash,
            display_name: user.display_name.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: !!user.email_verified,
            last_login_at: null,
            status: user.status || 'ACTIVE'
        };
        this.data.users[id] = record;
        this.save();
        return { ...record };
    }

    updateUser(id, updates) {
        if (!this.data.users[id]) return null;
        this.data.users[id] = {
            ...this.data.users[id],
            ...updates,
            updated_at: new Date().toISOString()
        };
        this.save();
        return { ...this.data.users[id] };
    }

    // --- Sessions ---
    createSession(sessionId, userId, expiresAt, remember = false) {
        this.data.sessions[sessionId] = {
            id: sessionId,
            user_id: userId,
            created_at: new Date().toISOString(),
            expires_at: expiresAt,
            remember
        };
        this.save();
        return { ...this.data.sessions[sessionId] };
    }

    getSession(sessionId) {
        const session = this.data.sessions[sessionId];
        if (!session) return null;
        if (new Date(session.expires_at) < new Date()) {
            this.deleteSession(sessionId);
            return null;
        }
        return { ...session };
    }

    deleteSession(sessionId) {
        if (this.data.sessions[sessionId]) {
            delete this.data.sessions[sessionId];
            this.save();
        }
    }

    deleteUserSessions(userId) {
        let changed = false;
        for (const sid in this.data.sessions) {
            if (this.data.sessions[sid].user_id === userId) {
                delete this.data.sessions[sid];
                changed = true;
            }
        }
        if (changed) this.save();
    }

    // --- Password Reset Tokens ---
    createPasswordResetToken(tokenHash, userId, expiresAt) {
        this.data.password_reset_tokens[tokenHash] = {
            token_hash: tokenHash,
            user_id: userId,
            expires_at: expiresAt,
            used: false,
            created_at: new Date().toISOString()
        };
        this.save();
    }

    getPasswordResetToken(tokenHash) {
        const record = this.data.password_reset_tokens[tokenHash];
        if (!record) return null;
        if (record.used || new Date(record.expires_at) < new Date()) {
            return null;
        }
        return { ...record };
    }

    consumePasswordResetToken(tokenHash) {
        if (this.data.password_reset_tokens[tokenHash]) {
            this.data.password_reset_tokens[tokenHash].used = true;
            this.save();
        }
    }

    // --- Email Verification Tokens ---
    createEmailVerificationToken(tokenHash, userId, expiresAt) {
        this.data.email_verification_tokens[tokenHash] = {
            token_hash: tokenHash,
            user_id: userId,
            expires_at: expiresAt,
            used: false,
            created_at: new Date().toISOString()
        };
        this.save();
    }

    getEmailVerificationToken(tokenHash) {
        const record = this.data.email_verification_tokens[tokenHash];
        if (!record) return null;
        if (record.used || new Date(record.expires_at) < new Date()) {
            return null;
        }
        return { ...record };
    }

    consumeEmailVerificationToken(tokenHash) {
        if (this.data.email_verification_tokens[tokenHash]) {
            this.data.email_verification_tokens[tokenHash].used = true;
            this.save();
        }
    }

    // --- Cloud Saves ---
    saveCloudSave(userId, saveData) {
        this.data.cloud_saves[userId] = {
            user_id: userId,
            data: saveData,
            updated_at: new Date().toISOString()
        };
        this.save();
        return { ...this.data.cloud_saves[userId] };
    }

    getCloudSave(userId) {
        return this.data.cloud_saves[userId] ? { ...this.data.cloud_saves[userId] } : null;
    }
}

const dbInstance = new Database();
module.exports = dbInstance;
