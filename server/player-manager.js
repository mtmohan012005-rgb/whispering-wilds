// ============================================================================
// THE WHISPERING WILDS - SERVER PLAYER MANAGER
// ============================================================================

const Validation = require('./validation');

class PlayerManager {
    constructor() {
        // Map of socketId -> PlayerData
        this.players = new Map();
    }

    createPlayer(socketId, name, role = 'EXPLORER', roomCode = 'CHENNAI_EXP') {
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

        const val = Validation.validateMovement(player.position, position, deltaTime);
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

        player.customizationChangesCount = newChangeCount;
        if (outfit && typeof outfit === 'object') {
            player.outfit = Object.assign({}, player.outfit, outfit);
        }

        return { valid: true, player, remaining: check.remaining };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerManager;
}
