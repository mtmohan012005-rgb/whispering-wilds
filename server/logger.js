// ============================================================================
// THE WHISPERING WILDS - SAFE STRUCTURED SERVER LOGGER
// ============================================================================

const SENSITIVE_KEYS = ['token', 'password', 'secret', 'auth', 'cookie', 'key'];

function sanitize(data) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(sanitize);

    const safe = {};
    for (const [k, v] of Object.entries(data)) {
        if (SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s))) {
            safe[k] = '[REDACTED]';
        } else if (typeof v === 'object' && v !== null) {
            safe[k] = sanitize(v);
        } else {
            safe[k] = v;
        }
    }
    return safe;
}

const Logger = {
    info(msg, meta) {
        const ts = new Date().toISOString();
        if (meta) {
            console.log(`[${ts}] [INFO] ${msg}`, JSON.stringify(sanitize(meta)));
        } else {
            console.log(`[${ts}] [INFO] ${msg}`);
        }
    },
    warn(msg, meta) {
        const ts = new Date().toISOString();
        if (meta) {
            console.warn(`[${ts}] [WARN] ${msg}`, JSON.stringify(sanitize(meta)));
        } else {
            console.warn(`[${ts}] [WARN] ${msg}`);
        }
    },
    error(msg, meta) {
        const ts = new Date().toISOString();
        if (meta) {
            console.error(`[${ts}] [ERROR] ${msg}`, JSON.stringify(sanitize(meta)));
        } else {
            console.error(`[${ts}] [ERROR] ${msg}`);
        }
    },
    debug(msg, meta) {
        if (process.env.DEBUG) {
            const ts = new Date().toISOString();
            console.log(`[${ts}] [DEBUG] ${msg}`, meta ? JSON.stringify(sanitize(meta)) : '');
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
