// ============================================================================
// THE WHISPERING WILDS - SERVER-GENERATED INVITE CODES
// ============================================================================
//
// Codes are exactly six characters drawn from an ambiguity-reduced alphabet
// (no I, O, 0 or 1). Generation uses crypto.randomInt so codes are not
// predictable from Math.random(). Codes identify rooms only; they are never
// authentication credentials.
// ============================================================================

const crypto = require('crypto');

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

function generateRoomCode() {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_ALPHABET[crypto.randomInt(0, ROOM_CODE_ALPHABET.length)];
    }
    return code;
}

/**
 * Trim surrounding whitespace, uppercase, and return the canonical code.
 * Returns null when the input is not a syntactically valid room code.
 * Never substitutes a default room.
 */
function normalizeRoomCode(raw) {
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim().toUpperCase();
    return ROOM_CODE_PATTERN.test(normalized) ? normalized : null;
}

function isValidRoomCode(raw) {
    return normalizeRoomCode(raw) !== null;
}

module.exports = {
    ROOM_CODE_ALPHABET,
    ROOM_CODE_LENGTH,
    ROOM_CODE_PATTERN,
    generateRoomCode,
    normalizeRoomCode,
    isValidRoomCode
};
