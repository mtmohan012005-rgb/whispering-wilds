// ============================================================================
// THE WHISPERING WILDS - SERVER-GENERATED NUMERIC INVITE CODES
// ============================================================================
//
// Host-generated room codes are exactly six numeric digits (000000-999999).
// Join input accepts 4 to 6 numeric digits. Letters, symbols, empty codes,
// and codes longer than 6 digits are strictly rejected.
// Generation uses crypto.randomInt for cryptographically secure randomness.
// Codes identify rooms only; they are never authentication credentials.
// ============================================================================

const crypto = require('crypto');

const ROOM_CODE_ALPHABET = '0123456789';
const ROOM_CODE_LENGTH = 6;
const HOST_ROOM_CODE_PATTERN = /^\d{6}$/;
const JOIN_ROOM_CODE_PATTERN = /^\d{4,6}$/;
const ROOM_CODE_PATTERN = JOIN_ROOM_CODE_PATTERN;

/**
 * Generate a cryptographically secure six-digit numeric room code.
 */
function generateRoomCode() {
    return crypto.randomInt(0, 1000000).toString().padStart(ROOM_CODE_LENGTH, '0');
}

/**
 * Trim surrounding whitespace and validate numeric invite code.
 * Accepts 4 to 6 digits for join input.
 * Rejects letters, symbols, whitespace-only, empty codes, and codes longer than 6 digits.
 * Returns canonical digit string or null when invalid.
 * Never substitutes a default room.
 */
function normalizeRoomCode(raw) {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
        raw = raw.toString();
    }
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim();
    return JOIN_ROOM_CODE_PATTERN.test(normalized) ? normalized : null;
}

/**
 * Check if the input is a valid join room code (4 to 6 digits).
 */
function isValidRoomCode(raw) {
    return normalizeRoomCode(raw) !== null;
}

/**
 * Check if the input is a valid host-generated room code (strictly 6 digits).
 */
function isValidGeneratedRoomCode(raw) {
    if (typeof raw !== 'string') return false;
    return HOST_ROOM_CODE_PATTERN.test(raw.trim());
}

module.exports = {
    ROOM_CODE_ALPHABET,
    ROOM_CODE_LENGTH,
    HOST_ROOM_CODE_PATTERN,
    JOIN_ROOM_CODE_PATTERN,
    ROOM_CODE_PATTERN,
    generateRoomCode,
    normalizeRoomCode,
    isValidRoomCode,
    isValidGeneratedRoomCode
};
