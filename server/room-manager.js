// ============================================================================
// THE WHISPERING WILDS - SERVER ROOM MANAGER (MAX 5 PLAYERS & DYNAMIC HOST REASSIGNMENT)
// ============================================================================

const RoomWorldState = require('./world-state');
const config = require('./config');
const { generateRoomCode, normalizeRoomCode } = require('./room-code');

class RoomManager {
    constructor() {
        // Map of roomCode -> RoomData
        this.rooms = new Map();
    }

    getRoom(roomCode) {
        const code = normalizeRoomCode(roomCode);
        return (code && this.rooms.get(code)) || null;
    }

    /**
     * Create a room with a server-generated, collision-checked invite code.
     * The requesting socket becomes the host and is registered immediately.
     * Fails closed when a unique code cannot be allocated within the bounded
     * attempt count; a code is never silently reused.
     */
    createRoom(hostSocketId, maxPlayers = config.DEFAULT_ROOM_CAP) {
        const cap = Math.min(
            config.MAX_PLAYERS_PER_ROOM,
            Math.max(config.MIN_PLAYERS_PER_ROOM, Number.isFinite(Number(maxPlayers))
                ? Math.floor(Number(maxPlayers))
                : config.DEFAULT_ROOM_CAP)
        );

        const attempts = Math.max(1, config.ROOM_CODE.MAX_ALLOCATION_ATTEMPTS || 25);
        let code = null;
        for (let i = 0; i < attempts; i++) {
            const candidate = generateRoomCode();
            if (!this.rooms.has(candidate)) {
                code = candidate;
                break;
            }
        }

        if (!code) {
            return { success: false, reason: 'Unable to allocate a unique room code. Try again.' };
        }

        const room = {
            code: code,
            hostId: hostSocketId,
            createdAt: Date.now(),
            maxPlayers: cap,
            players: new Set([hostSocketId]),
            worldState: new RoomWorldState(code)
        };
        this.rooms.set(code, room);

        return { success: true, room, code };
    }

    /**
     * Join an existing room. Never creates a room.
     * The capacity check and insertion are performed synchronously so two
     * concurrent joins cannot both slip past the cap.
     */
    joinRoom(roomCode, socketId) {
        const code = normalizeRoomCode(roomCode);
        if (!code) {
            return { success: false, code: 'INVALID_ROOM_CODE', reason: 'That invite code is not valid.' };
        }

        const room = this.rooms.get(code);
        if (!room) {
            return { success: false, code: 'ROOM_NOT_FOUND', reason: 'No expedition found with that invite code.' };
        }

        if (!room.players.has(socketId) && room.players.size >= room.maxPlayers) {
            return {
                success: false,
                code: 'ROOM_FULL',
                reason: `Expedition lobby is full (max ${room.maxPlayers} players).`
            };
        }

        room.players.add(socketId);
        return { success: true, room, code };
    }

    addPlayer(roomCode, socketId) {
        return this.joinRoom(roomCode, socketId);
    }

    removePlayer(roomCode, socketId) {
        const code = normalizeRoomCode(roomCode);
        const room = code ? this.rooms.get(code) : null;
        if (!room) return null;

        room.players.delete(socketId);

        // If no players remain, clean up room
        if (room.players.size === 0) {
            this.rooms.delete(code);
            return { disbanded: true, roomCode: code };
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
        const code = normalizeRoomCode(roomCode);
        const room = code ? this.rooms.get(code) : null;
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
