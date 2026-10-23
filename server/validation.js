// ============================================================================
// THE WHISPERING WILDS - INPUT VALIDATION & ANTI-CHEAT ENGINE
// ============================================================================

const config = require('./config');

const roomCode = require('./room-code');

const Validation = {
    /**
     * Sanitize and validate player display name.
     */
    sanitizePlayerName(rawName) {
        if (!rawName || typeof rawName !== 'string') return 'Explorer';
        // Strip HTML tags & non-printable characters
        const clean = rawName.replace(/<[^>]*>?/gm, '').replace(/[^\w\s\u0B80-\u0BFF\-_]/gi, '').trim();
        if (clean.length < 2) return 'Explorer';
        return clean.slice(0, 24);
    },

    /**
     * Normalize and validate a room code.
     * Returns the canonical six-character code, or null when invalid.
     * There is deliberately no fallback room: invalid input must fail closed.
     */
    sanitizeRoomCode(rawCode) {
        return roomCode.normalizeRoomCode(rawCode);
    },

    isValidRoomCode(rawCode) {
        return roomCode.isValidRoomCode(rawCode);
    },

    /**
     * Clamp a requested room capacity to the configured allowed range.
     */
    clampRoomCapacity(requested) {
        const parsed = Number(requested);
        const fallback = config.DEFAULT_ROOM_CAP;
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(
            config.MAX_PLAYERS_PER_ROOM,
            Math.max(config.MIN_PLAYERS_PER_ROOM, Math.floor(parsed))
        );
    },

    /**
     * Sanitize a chat message: strip markup, collapse whitespace, trim, cap length.
     */
    sanitizeChatText(rawText, maxLength = 160) {
        if (typeof rawText !== 'string') return '';
        return rawText
            .replace(/<[^>]*>?/gm, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLength);
    },

    /**
     * Validate 3D coordinate vector.
     */
    isValidVector3(vec) {
        if (!vec || typeof vec !== 'object') return false;
        const { x, y, z } = vec;
        return typeof x === 'number' && Number.isFinite(x) &&
               typeof y === 'number' && Number.isFinite(y) &&
               typeof z === 'number' && Number.isFinite(z);
    },

    /**
     * Validate player movement intent and velocity delta.
     * Prevents speed hacking and impossible teleportation.
     */
    validateMovement(prevPos, newPos, deltaTime) {
        if (!this.isValidVector3(newPos)) return { valid: false, reason: 'Invalid coordinates' };
        if (!prevPos || !this.isValidVector3(prevPos)) return { valid: true }; // First position

        const dx = newPos.x - prevPos.x;
        const dy = newPos.y - prevPos.y;
        const dz = newPos.z - prevPos.z;
        const dist = Math.hypot(dx, dz); // Horizontal distance

        if (dist > config.SPEED_LIMITS.MAX_TELEPORT_DIST) {
            return { valid: false, reason: 'Teleportation threshold exceeded', dist };
        }

        const dt = Math.max(0.01, deltaTime || config.TICK_INTERVAL_MS / 1000);
        const speed = dist / dt;

        if (speed > config.SPEED_LIMITS.MAX_MOVE_SPEED) {
            return { valid: false, reason: 'Speed limit exceeded', speed };
        }

        return { valid: true, speed, dist };
    },

    /**
     * Authoritative check: Player customization limit must NEVER exceed 5.
     */
    validateCustomizationChange(currentChangeCount, newChangeCount) {
        if (typeof newChangeCount !== 'number' || newChangeCount < 0) {
            return { valid: false, reason: 'Invalid change counter' };
        }
        if (newChangeCount > config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES) {
            return {
                valid: false,
                reason: `Customization limit of ${config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES} strictly exceeded.`
            };
        }
        return { valid: true, remaining: config.CUSTOMIZATION_RULES.MAX_PLAYER_CHANGES - newChangeCount };
    },

    /**
     * Validate economy transfer / transaction.
     */
    validateTransaction(amount, currentBalance) {
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return { valid: false, reason: 'Invalid transaction amount' };
        }
        if (typeof currentBalance !== 'number' || currentBalance < amount) {
            return { valid: false, reason: 'Insufficient funds' };
        }
        return { valid: true };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}
