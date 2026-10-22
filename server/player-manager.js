// ============================================================================
// THE WHISPERING WILDS - SERVER PLAYER MANAGER
// ============================================================================

const Validation = require('./validation');
const config = require('./config');

const OUTFIT_SLOTS = ['upper', 'lower', 'head', 'accessory'];

class PlayerManager {
    constructor() {
        // Map of socketId -> PlayerData
        this.players = new Map();
    }

    createPlayer(socketId, name, role = 'EXPLORER', roomCode = null) {
        const sanitizedName = Validation.sanitizePlayerName(name);
        const player = {
            id: socketId,
            name: sanitizedName,
            role: role,
            roomCode: roomCode,
            position: { x: -250, y: 0, z: 0 },
            rotationY: 0,
            currentAnim: 'idle',
            lastUpdated: Date.now(),
            customizationChangesCount: 0,
            outfit: {
                upper: 'khadi_shirt',
                lower: 'veshti',
                head: 'none',
                accessory: 'field_satchel'
            },
            ping: 0
        };

        this.players.set(socketId, player);
        return player;
    }

    getPlayer(socketId) {
        return this.players.get(socketId) || null;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        this.players.delete(socketId);
        return player || null;
    }

    updateTransform(socketId, position, rotationY, currentAnim, deltaTime) {
        const player = this.players.get(socketId);
        if (!player) return null;

        // Elapsed time is measured server-side. The client-supplied deltaTime
        // describes a render frame, not the network interval, so trusting it
        // would reject legitimate movement and let a cheater inflate it.
        const now = Date.now();
        const elapsedSec = Math.min(1, Math.max(
            config.TICK_INTERVAL_MS / 1000,
            (now - player.lastUpdated) / 1000
        ));

        const val = Validation.validateMovement(player.position, position, elapsedSec);
        if (!val.valid) {
            return { error: val.reason, player };
        }

        player.position = {
            x: Number(position.x) || 0,
            y: Number(position.y) || 0,
            z: Number(position.z) || 0
        };
        if (typeof rotationY === 'number') {
            player.rotationY = rotationY;
        }
        if (currentAnim) {
            player.currentAnim = currentAnim;
        }
        player.lastUpdated = Date.now();

        return { player };
    }

    updateCustomization(socketId, outfit, newChangeCount) {
        const player = this.players.get(socketId);
        if (!player) return { valid: false, reason: 'Player not found' };

        const check = Validation.validateCustomizationChange(player.customizationChangesCount, newChangeCount);
        if (!check.valid) {
            return check;
        }

        const sanitizedOutfit = {};
        if (outfit !== undefined) {
            if (!outfit || typeof outfit !== 'object' || Array.isArray(outfit)) {
                return { valid: false, reason: 'Invalid outfit payload' };
            }
            for (const slot of OUTFIT_SLOTS) {
                if (outfit[slot] === undefined) continue;
                const value = outfit[slot];
                if (typeof value !== 'string' || value.length === 0 || value.length > 40) {
                    return { valid: false, reason: `Invalid outfit value for ${slot}` };
                }
                sanitizedOutfit[slot] = value;
            }
            if (Object.keys(outfit).some((key) => !OUTFIT_SLOTS.includes(key))) {
                return { valid: false, reason: 'Unknown outfit slot' };
            }
        }

        player.customizationChangesCount = newChangeCount;
        if (Object.keys(sanitizedOutfit).length > 0) {
            player.outfit = Object.assign({}, player.outfit, sanitizedOutfit);
        }

        return { valid: true, player, remaining: check.remaining };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerManager;
}
