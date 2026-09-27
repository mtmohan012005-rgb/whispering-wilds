// ============================================================================
// THE WHISPERING WILDS - AUTH DATABASE ENGINE (FILE-BACKED TRANSACTIONAL DB)
// ============================================================================

const fs = require('fs');
const path = require('path');

let pg = null;
try {
    pg = require('pg');
} catch (e) {
    // pg optional in light environments
}

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
            cloud_saves: {},
            profiles: {}
        };
        this.pgPool = null;
        this.pgReady = false;
        this.init();
        this.initPg();
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

    async initPg() {
        if (!process.env.DATABASE_URL || !pg) {
            console.log('[AuthDB] Running in local transactional file mode (DATABASE_URL not set). Single-player and local dev ready.');
            return;
        }
        try {
            const poolConfig = {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000
            };
            this.pgPool = new pg.Pool(poolConfig);

            // Verify connection and bootstrap schema
            const client = await this.pgPool.connect();
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS ww_users (
                        id VARCHAR(128) PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        normalized_email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        display_name VARCHAR(128),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        email_verified BOOLEAN DEFAULT FALSE,
                        last_login_at TIMESTAMP WITH TIME ZONE,
                        status VARCHAR(32) DEFAULT 'ACTIVE'
                    );
                    CREATE TABLE IF NOT EXISTS ww_sessions (
                        id VARCHAR(128) PRIMARY KEY,
                        user_id VARCHAR(128) REFERENCES ww_users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        remember BOOLEAN DEFAULT FALSE
                    );
                    CREATE TABLE IF NOT EXISTS ww_cloud_saves (
                        user_id VARCHAR(128) PRIMARY KEY,
                        revision INT DEFAULT 1,
                        checksum VARCHAR(128),
                        client_timestamp TIMESTAMP WITH TIME ZONE,
                        server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        device_id VARCHAR(128),
                        data JSONB NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS ww_profiles (
                        user_id VARCHAR(128) PRIMARY KEY,
                        data JSONB NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                this.pgReady = true;
                console.log('[AuthDB] Connected to Neon PostgreSQL database and bootstrapped tables.');
            } finally {
                client.release();
            }
        } catch (err) {
            console.warn('[AuthDB] Neon PostgreSQL initialization warning (falling back to local JSON file):', err.message);
            this.pgReady = false;
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

        if (this.pgReady && this.pgPool) {
            this.pgPool.query(
                `INSERT INTO ww_users (id, email, normalized_email, password_hash, display_name, created_at, updated_at, email_verified, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    normalized_email = EXCLUDED.normalized_email,
                    password_hash = EXCLUDED.password_hash,
                    display_name = EXCLUDED.display_name,
                    updated_at = EXCLUDED.updated_at,
                    email_verified = EXCLUDED.email_verified,
                    status = EXCLUDED.status`,
                [record.id, record.email, record.normalized_email, record.password_hash, record.display_name, record.created_at, record.updated_at, record.email_verified, record.status]
            ).catch(err => console.error('[AuthDB-PG] Async user create error:', err.message));
        }

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

        if (this.pgReady && this.pgPool) {
            const u = this.data.users[id];
            this.pgPool.query(
                `UPDATE ww_users SET
                    email = $2,
                    normalized_email = $3,
                    password_hash = $4,
                    display_name = $5,
                    updated_at = $6,
                    email_verified = $7,
                    last_login_at = $8,
                    status = $9
                 WHERE id = $1`,
                [id, u.email, u.normalized_email, u.password_hash, u.display_name, u.updated_at, u.email_verified, u.last_login_at, u.status]
            ).catch(err => console.error('[AuthDB-PG] Async user update error:', err.message));
        }

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

        if (this.pgReady && this.pgPool) {
            this.pgPool.query(
                `INSERT INTO ww_sessions (id, user_id, created_at, expires_at, remember)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET
                    expires_at = EXCLUDED.expires_at,
                    remember = EXCLUDED.remember`,
                [sessionId, userId, this.data.sessions[sessionId].created_at, expiresAt, remember]
            ).catch(err => console.error('[AuthDB-PG] Async session create error:', err.message));
        }

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

            if (this.pgReady && this.pgPool) {
                this.pgPool.query(`DELETE FROM ww_sessions WHERE id = $1`, [sessionId])
                    .catch(err => console.error('[AuthDB-PG] Async session delete error:', err.message));
            }
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
    saveCloudSave(userId, saveData, revision = 1, checksum = '', clientTimestamp = null, deviceId = null) {
        this.data.cloud_saves[userId] = {
            user_id: userId,
            revision: revision,
            checksum: checksum,
            client_timestamp: clientTimestamp || new Date().toISOString(),
            server_timestamp: new Date().toISOString(),
            device_id: deviceId,
            data: saveData,
            updated_at: new Date().toISOString()
        };
        this.save();

        if (this.pgReady && this.pgPool) {
            this.pgPool.query(
                `INSERT INTO ww_cloud_saves (user_id, revision, checksum, client_timestamp, server_timestamp, device_id, data, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (user_id) DO UPDATE SET
                    revision = EXCLUDED.revision,
                    checksum = EXCLUDED.checksum,
                    client_timestamp = EXCLUDED.client_timestamp,
                    server_timestamp = EXCLUDED.server_timestamp,
                    device_id = EXCLUDED.device_id,
                    data = EXCLUDED.data,
                    updated_at = EXCLUDED.updated_at`,
                [userId, revision, checksum, clientTimestamp || new Date().toISOString(), new Date().toISOString(), deviceId, JSON.stringify(saveData), new Date().toISOString()]
            ).catch(err => console.error('[AuthDB-PG] Async cloud save error:', err.message));
        }

        return { ...this.data.cloud_saves[userId] };
    }

    getCloudSave(userId) {
        return this.data.cloud_saves[userId] ? { ...this.data.cloud_saves[userId] } : null;
    }

    // --- Profiles ---
    getProfile(userId) {
        if (!this.data.profiles) this.data.profiles = {};
        return this.data.profiles[userId] ? { ...this.data.profiles[userId] } : null;
    }

    upsertProfile(userId, profileData) {
        if (!this.data.profiles) this.data.profiles = {};
        const existing = this.data.profiles[userId] || {};
        this.data.profiles[userId] = {
            user_id: userId,
            ...existing,
            ...profileData,
            updated_at: new Date().toISOString()
        };
        this.save();

        if (this.pgReady && this.pgPool) {
            this.pgPool.query(
                `INSERT INTO ww_profiles (user_id, data, updated_at)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET
                    data = EXCLUDED.data,
                    updated_at = EXCLUDED.updated_at`,
                [userId, JSON.stringify(this.data.profiles[userId]), new Date().toISOString()]
            ).catch(err => console.error('[AuthDB-PG] Async profile upsert error:', err.message));
        }

        return { ...this.data.profiles[userId] };
    }

    // --- Scheduled Token Cleanup ---
    cleanupExpiredTokens() {
        const now = new Date();
        let changed = false;

        // Clean verification tokens expired or used > 48h
        for (const h in this.data.email_verification_tokens) {
            const t = this.data.email_verification_tokens[h];
            if (t.used || new Date(t.expires_at) < now) {
                delete this.data.email_verification_tokens[h];
                changed = true;
            }
        }

        // Clean password reset tokens
        for (const h in this.data.password_reset_tokens) {
            const t = this.data.password_reset_tokens[h];
            if (t.used || new Date(t.expires_at) < now) {
                delete this.data.password_reset_tokens[h];
                changed = true;
            }
        }

        // Clean OTP codes
        if (this.data.otp_codes) {
            for (const id in this.data.otp_codes) {
                const o = this.data.otp_codes[id];
                if (o.used_at || new Date(o.expires_at) < now) {
                    delete this.data.otp_codes[id];
                    changed = true;
                }
            }
        }

        if (changed) this.save();
        return changed;
    }
}

const dbInstance = new Database();
module.exports = dbInstance;
