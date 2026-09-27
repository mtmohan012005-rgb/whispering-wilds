// ============================================================================
// THE WHISPERING WILDS - ROBUST CLIENT NETWORK ENGINE
// Socket.io with Offline Fallback, Telemetry Ping & Authoritative Sync
// ============================================================================

class NetworkClient {
    // Hard expedition cap, mirroring server config MAX_PLAYERS_PER_ROOM / DEFAULT_ROOM_CAP.
    static MAX_ROOM_CAP = 5;

    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentRoom = '';
        this.myId = '';
        this.isHost = false;
        this.role = 'EXPLORER';
        this.playerName = 'Explorer';
        this.maxPlayers = NetworkClient.MAX_ROOM_CAP;
        this.roomCap = NetworkClient.MAX_ROOM_CAP;
        this.pingMs = 0;
        this.isOffline = true;

        this.listeners = new Map();
        this.lastEmitTime = 0;
        this.emitIntervalSec = 0.05; // 20Hz default
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emitEvent(event, data) {
        const cbs = this.listeners.get(event);
        if (cbs) {
            for (const cb of cbs) {
                try { cb(data); } catch (e) { console.error(`[NetworkClient] Error in '${event}' listener:`, e); }
            }
        }
    }

    connect(serverUrl) {
        const config = window.NetworkConfig || {
            getServerUrl: () => 'http://localhost:3000',
            EMIT_INTERVAL_SEC: 0.05,
            RECONNECT_ATTEMPTS: 4,
            TIMEOUT_MS: 5000
        };

        const targetUrl = serverUrl || config.getServerUrl();
        this.emitIntervalSec = config.EMIT_INTERVAL_SEC || 0.05;

        if (typeof io === 'undefined') {
            console.warn('[NetworkClient] Socket.io client not detected. Running in offline mode.');
            this.isOffline = true;
            this.emitEvent('status', { message: 'Offline mode (Socket.io not found)', isError: false });
            return false;
        }

        try {
            console.log(`[NetworkClient] Connecting to ${targetUrl}...`);
            this.socket = io(targetUrl, {
                reconnectionAttempts: config.RECONNECT_ATTEMPTS || 4,
                timeout: config.TIMEOUT_MS || 5000,
                transports: ['websocket', 'polling']
            });

            this.bindSocketEvents();
            return true;
        } catch (err) {
            console.warn('[NetworkClient] Connection failed, continuing offline:', err.message);
            this.isOffline = true;
            this.emitEvent('status', { message: `Offline: ${err.message}`, isError: false });
            return false;
        }
    }

    bindSocketEvents() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.isOffline = false;
            this.myId = this.socket.id;
            console.log(`[NetworkClient] Connected to server! Socket ID: ${this.myId}`);
            this.emitEvent('connected', { id: this.myId });
            this.emitEvent('status', { message: 'Connected to multiplayer server', isError: false });
            this.startPingLoop();
        });

        this.socket.on('connect_error', (err) => {
            this.isConnected = false;
            this.isOffline = true;
            console.warn('[NetworkClient] Server unreachable, running offline:', err.message);
            this.emitEvent('status', { message: 'Multiplayer server offline. Single-player active.', isError: false });
        });

        this.socket.on('joinedSuccess', (data) => {
            this.currentRoom = data.roomCode;
            this.myId = data.playerId;
            this.isHost = data.isHost;
            this.role = data.role;
            this.maxPlayers = data.maxPlayers || 5;
            this.emitEvent('joinedSuccess', data);
        });

        this.socket.on('roomFull', (data) => {
            this.emitEvent('roomFull', data);
            this.emitEvent('status', { message: data.message, isError: true });
        });

        this.socket.on('playerJoined', (data) => {
            this.emitEvent('playerJoined', data);
        });

        this.socket.on('playerMoved', (data) => {
            this.emitEvent('playerMoved', data);
        });

        this.socket.on('playerLeft', (data) => {
            this.emitEvent('playerLeft', data);
        });

        this.socket.on('newHostAssigned', (data) => {
            if (data.hostId === this.myId) {
                this.isHost = true;
                this.role = 'HOST';
            }
            this.emitEvent('newHostAssigned', data);
        });

        this.socket.on('mechanismUpdated', (data) => {
            this.emitEvent('mechanismUpdated', data);
        });

        this.socket.on('customizationAccepted', (data) => {
            this.emitEvent('customizationAccepted', data);
        });

        this.socket.on('customizationRejected', (data) => {
            this.emitEvent('customizationRejected', data);
        });

        this.socket.on('playerCustomized', (data) => {
            this.emitEvent('playerCustomized', data);
        });

        this.socket.on('chatMessage', (data) => {
            this.emitEvent('chatMessage', data);
        });

        this.socket.on('rateLimited', (data) => {
            this.emitEvent('rateLimited', data);
        });

        this.socket.on('pongCheck', (data) => {
            this.pingMs = Math.max(0, Date.now() - data.clientTime);
            this.emitEvent('ping', { pingMs: this.pingMs });
        });
    }

    startPingLoop() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.socket && this.isConnected) {
                this.socket.emit('pingCheck', Date.now());
            }
        }, 10000);
    }

    joinRoom(roomCode, playerName, maxPlayers = NetworkClient.MAX_ROOM_CAP) {
        this.playerName = playerName || 'Explorer';
        this.currentRoom = (roomCode || 'CHENNAI_EXP').trim().toUpperCase();

        // The 5-player expedition cap is a hard contract (server config
        // MAX_PLAYERS_PER_ROOM = 5). This method previously defaulted to 8, so a
        // caller that passed nothing asked the server for a room larger than the
        // contract allows. The server clamps it in room-manager.getOrCreateRoom,
        // so this was never a way to overrun the cap, but the lobby UI is fed the
        // client-side value and would advertise slots that can never fill.
        // Clamp locally so the client and server always agree.
        const cap = Math.min(NetworkClient.MAX_ROOM_CAP, Math.max(1, Number(maxPlayers) || NetworkClient.MAX_ROOM_CAP));
        if (cap !== maxPlayers) {
            console.warn(`[NetworkClient] Requested room size ${maxPlayers} clamped to ${cap} (expedition cap is ${NetworkClient.MAX_ROOM_CAP}).`);
        }
        this.roomCap = cap;

        if (!this.socket || !this.isConnected) {
            this.connect();
            setTimeout(() => {
                if (this.socket && this.isConnected) {
                    this.socket.emit('joinRoom', {
                        roomCode: this.currentRoom,
                        playerName: this.playerName,
                        maxPlayers: cap
                    });
                }
            }, 300);
            return;
        }

        this.socket.emit('joinRoom', {
            roomCode: this.currentRoom,
            playerName: this.playerName,
            maxPlayers: cap
        });
    }

    leaveRoom() {
        if (this.socket && this.isConnected) {
            this.socket.disconnect();
        }
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.isConnected = false;
        this.currentRoom = '';
        this.isHost = false;
        this.role = 'EXPLORER';
        this.emitEvent('leftRoom', {});
    }

    sendTransform(position, rotationY, currentAnim = 'walk', dt = 0.05) {
        if (!this.socket || !this.isConnected || !this.currentRoom) return;

        const now = (performance ? performance.now() : Date.now()) / 1000;
        if (now - this.lastEmitTime < this.emitIntervalSec) return;
        this.lastEmitTime = now;

        this.socket.emit('playerMove', {
            roomCode: this.currentRoom,
            position: { x: position.x, y: position.y, z: position.z },
            rotationY: rotationY,
            currentAnim: currentAnim,
            deltaTime: dt
        });
    }

    sendCustomization(outfit, changeCount) {
        if (!this.socket || !this.isConnected || !this.currentRoom) return;
        this.socket.emit('updateCustomization', { outfit, changeCount });
    }

    sendMechanismInteraction(mechanismId, payload) {
        if (!this.socket || !this.isConnected || !this.currentRoom) return;
        this.socket.emit('interactMechanism', { mechanismId, payload });
    }

    sendChat(text) {
        if (!this.socket || !this.isConnected || !this.currentRoom) return;
        this.socket.emit('chatMessage', { text });
    }
}

if (typeof window !== 'undefined') {
    window.NetworkClient = NetworkClient;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkClient;
}
