// ============================================================================
// THE WHISPERING WILDS - PASSWORD SERVICE (SCRYPT / CRYPTOGRAPHIC HASHING)
// ============================================================================

const crypto = require('crypto');

const SCRYPT_PARAMS = {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024
};
const KEY_LEN = 64;

class PasswordService {
    /**
     * Hashes a password using scrypt with a random 16-byte salt.
     * Format: scrypt:salt_hex:derived_hex
     */
    static hashPassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('Invalid password input');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const derivedKey = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
        return `scrypt:${salt}:${derivedKey.toString('hex')}`;
    }

    /**
     * Verifies a password against a stored scrypt hash using timing-safe comparison.
     */
    static verifyPassword(password, storedHash) {
        if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
            return false;
        }
        try {
            const parts = storedHash.split(':');
            if (parts.length !== 3 || parts[0] !== 'scrypt') {
                return false;
            }
            const salt = parts[1];
            const storedKeyHex = parts[2];
            const storedKey = Buffer.from(storedKeyHex, 'hex');
            const derivedKey = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
            return crypto.timingSafeEqual(storedKey, derivedKey);
        } catch (err) {
            return false;
        }
    }
}

module.exports = PasswordService;
