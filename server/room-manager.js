// ============================================================================
// THE WHISPERING WILDS - SERVER ROOM MANAGER (8-16 PLAYERS & DYNAMIC HOST REASSIGNMENT)
// ============================================================================

const RoomWorldState = require('./world-state');
const config = require('./config');

class RoomManager {
    constructor() {
        // Map of roomCode -> RoomData
        this.rooms = new Map();
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode) || null;
    }

    getOrCreateRoom(roomCode, hostSocketId, maxPlayers = config.DEFAULT_ROOM_CAP) {
        const code = (roomCode || 'CHENNAI_EXP').trim().toUpperCase();
        if (!this.rooms.has(code)) {
            const cap = Math.min(config.MAX_PLAYERS_PER_ROOM, Math.max(config.MIN_PLAYERS_PER_ROOM, maxPlayers));
            const room = {
                code: code,
                hostId: hostSocketId,
                createdAt: Date.now(),
                maxPlayers: cap,
                players: new Set(),
                worldState: new RoomWorldState(code)
            };
            this.rooms.set(code, room);
        }
        return this.rooms.get(code);
    }

    addPlayer(roomCode, socketId) {
        const room = this.rooms.get(roomCode);
        if (!room) return { success: false, reason: 'Room does not exist' };

        if (room.players.size >= room.maxPlayers && !room.players.has(socketId)) {
            return {
                success: false,
                reason: `Expedition lobby is full (Max ${room.maxPlayers} players reached).`
            };
        }

        room.players.add(socketId);
        return { success: true, room };
    }

    removePlayer(roomCode, socketId) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;

        room.players.delete(socketId);

        // If no players remain, clean up room
        if (room.players.size === 0) {
            this.rooms.delete(roomCode);
            return { disbanded: true, roomCode };
        }

        // If the host left, reassign to next available explorer
        let newHostId = null;
        if (room.hostId === socketId) {
            const nextHost = Array.from(room.players)[0];
            room.hostId = nextHost;
            newHostId = nextHost;
        }

        return {
            disbanded: false,
            newHostId: newHostId,
            remainingCount: room.players.size,
            room
        };
    }

    getRoomSnapshot(roomCode, playerManager) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;

        const playersObj = {};
        for (const sId of room.players) {
            const p = playerManager.getPlayer(sId);
            if (p) {
                playersObj[sId] = p;
            }
        }

        return {
            roomCode: room.code,
            hostId: room.hostId,
            maxPlayers: room.maxPlayers,
            playerCount: room.players.size,
            players: playersObj,
            worldState: room.worldState.getSnapshot()
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomManager;
}
