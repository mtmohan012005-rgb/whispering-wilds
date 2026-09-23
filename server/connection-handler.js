// ============================================================================
// THE WHISPERING WILDS - SOCKET CONNECTION & EVENT HANDLERS
// ============================================================================

const Validation = require('./validation');
const rateLimiter = require('./rate-limiter');
const Logger = require('./logger');

function registerSocketHandlers(io, socket, roomManager, playerManager) {
    const clientIp = socket.handshake.address || socket.id;

    // 1. Join or Host Room
    socket.on('joinRoom', (payload = {}) => {
        const { roomCode, playerName, maxPlayers } = payload;
        const code = Validation.sanitizeRoomCode(roomCode);
        const name = Validation.sanitizePlayerName(playerName);

        const room = roomManager.getOrCreateRoom(code, socket.id, maxPlayers);
        const joinRes = roomManager.addPlayer(code, socket.id);

        if (!joinRes.success) {
            socket.emit('roomFull', { message: joinRes.reason });
            return;
        }

        const isHost = (room.hostId === socket.id);
        const role = isHost ? 'HOST' : 'EXPLORER';
        const player = playerManager.createPlayer(socket.id, name, role, code);

        socket.join(code);
        socket.currentRoom = code;

        const snapshot = roomManager.getRoomSnapshot(code, playerManager);

        socket.emit('joinedSuccess', {
            roomCode: code,
            playerId: socket.id,
            isHost: isHost,
            role: role,
            currentPlayers: snapshot.players,
            maxPlayers: room.maxPlayers,
            worldState: snapshot.worldState
        });

        socket.to(code).emit('playerJoined', player);
        Logger.info(`[Room ${code}] Player joined: ${name} (${role}). Active: ${snapshot.playerCount}/${room.maxPlayers}`);
    });

    // 2. Real-Time Transform Sync (Position, Rotation, Animation)
    socket.on('playerMove', (data = {}) => {
        const code = data.roomCode || socket.currentRoom;
        if (!code) return;

        // Rate limit movement packets
        if (!rateLimiter.check(socket.id, 'movement', 40, 1000)) {
            return; // Drop excess packet
        }

        const update = playerManager.updateTransform(
            socket.id,
            data.position,
            data.rotationY,
            data.currentAnim,
            data.deltaTime
        );

        if (update && !update.error) {
            socket.to(code).emit('playerMoved', {
                id: socket.id,
                position: update.player.position,
                rotationY: update.player.rotationY,
                currentAnim: update.player.currentAnim
            });
        }
    });

    // 3. Player Customization Sync (Authoritative <= 5 Limit)
    socket.on('updateCustomization', (data = {}) => {
        const code = socket.currentRoom;
        if (!code) return;

        const res = playerManager.updateCustomization(socket.id, data.outfit, data.changeCount);
        if (!res.valid) {
            socket.emit('customizationRejected', { reason: res.reason });
            return;
        }

        socket.emit('customizationAccepted', {
            outfit: res.player.outfit,
            remainingChanges: res.remaining
        });

        socket.to(code).emit('playerCustomized', {
            id: socket.id,
            outfit: res.player.outfit
        });
    });

    // 4. Stateful Environmental / Puzzle Mechanism Interaction
    socket.on('interactMechanism', (data = {}) => {
        const code = socket.currentRoom;
        if (!code) return;

        const room = roomManager.getRoom(code);
        if (!room) return;

        const updated = room.worldState.updateMechanism(data.mechanismId, data.payload || {});
        io.to(code).emit('mechanismUpdated', {
            mechanismId: data.mechanismId,
            state: updated
        });
    });

    // 5. Rate-Limited Chat Broadcast
    socket.on('chatMessage', (data = {}) => {
        const code = socket.currentRoom;
        if (!code) return;

        if (!rateLimiter.check(socket.id, 'chat', 5, 10000)) {
            socket.emit('rateLimited', { message: 'Chat rate limit reached. Please wait.' });
            return;
        }

        const player = playerManager.getPlayer(socket.id);
        const name = player ? player.name : 'Explorer';
        const text = String(data.text || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 160);

        if (text.length > 0) {
            io.to(code).emit('chatMessage', {
                senderId: socket.id,
                senderName: name,
                text: text,
                timestamp: Date.now()
            });
        }
    });

    // 6. Telemetry Ping/Pong
    socket.on('pingCheck', (clientTime) => {
        socket.emit('pongCheck', {
            clientTime: clientTime,
            serverTime: Date.now()
        });
    });

    // 7. Disconnect & Host Reassignment
    const handleLeave = () => {
        const code = socket.currentRoom;
        if (!code) return;

        rateLimiter.reset(socket.id);
        const player = playerManager.removePlayer(socket.id);
        const leaveRes = roomManager.removePlayer(code, socket.id);

        if (leaveRes) {
            if (leaveRes.disbanded) {
                Logger.info(`[Room ${code}] Disbanded (0 players remaining).`);
            } else {
                if (leaveRes.newHostId) {
                    const newHost = playerManager.getPlayer(leaveRes.newHostId);
                    if (newHost) {
                        newHost.role = 'HOST';
                        io.to(code).emit('newHostAssigned', {
                            hostId: leaveRes.newHostId,
                            hostName: newHost.name
                        });
                        Logger.info(`[Room ${code}] Host reassigned to: ${newHost.name} (${leaveRes.newHostId})`);
                    }
                }
                io.to(code).emit('playerLeft', { id: socket.id });
                Logger.info(`[Room ${code}] Player left: ${player ? player.name : socket.id}. Remaining: ${leaveRes.remainingCount}`);
            }
        }
    };

    socket.on('disconnecting', handleLeave);
    socket.on('disconnect', () => {});
}

module.exports = { registerSocketHandlers };
