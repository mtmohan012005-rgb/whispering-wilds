// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLIENT MULTIPLAYER SYSTEM
// Real-Time Co-op Synchronization with Socket.io, Interpolation & Three.js
// ============================================================================

class MultiplayerManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentRoom = '';
        this.myId = '';
        this.isHost = false;
        this.role = 'EXPLORER';
        this.playerName = 'Explorer';
        this.maxPlayers = 5; // Default 5 players (satisfies Step 16 contract)

        // Remote players map: { [socketId]: { data, mesh, targetPos, targetRotY, currentAnim, nameSprite } }
        this.remotePlayers = {};

        // Throttling for network emission (20Hz = 50ms)
        this.lastEmitTime = 0;
        this.emitInterval = 0.05; // 50ms

        // Subsystems
        this.client = (typeof NetworkClient !== 'undefined') ? new NetworkClient() : null;
        this.syncManager = null;

        // UI status callbacks
        this.onStatusChange = null;
        this.onPlayerCountChange = null;
        this.onRoleChange = null;

        if (this.client) {
            this.bindClientEvents();
        }
    }

    bindClientEvents() {
        if (!this.client) return;

        this.client.on('status', (data) => {
            if (this.onStatusChange) this.onStatusChange(data.message, data.isError);
        });

        this.client.on('joinedSuccess', (data) => {
            this.currentRoom = data.roomCode;
            this.myId = data.playerId;
            this.isHost = data.isHost;
            this.role = data.role;
            this.maxPlayers = data.maxPlayers || this.maxPlayers;
            this.isConnected = true;

            const threeScene = this.getThreeScene();
            if (threeScene) {
                this.clearAllRemotePlayers(threeScene);
                for (const id in data.currentPlayers) {
                    if (id !== this.myId) {
                        this.spawnRemotePlayer(data.currentPlayers[id], threeScene);
                    }
                }
            }

            const count = Object.keys(data.currentPlayers).length;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (this.onRoleChange) this.onRoleChange(this.role, this.isHost);
            if (this.onStatusChange) this.onStatusChange(`In Room: ${this.currentRoom} (${count}/${this.maxPlayers} Players)`);
        });

        this.client.on('playerJoined', (playerData) => {
            const threeScene = this.getThreeScene();
            if (threeScene) {
                this.spawnRemotePlayer(playerData, threeScene);
            }
            const count = Object.keys(this.remotePlayers).length + 1;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                window.quests.showQuestNotification(`👥 ${playerData.name} joined the expedition!`);
            }
        });

        this.client.on('playerMoved', (data) => {
            const remote = this.remotePlayers[data.id];
            if (remote) {
                remote.targetPos.set(data.position.x, data.position.y, data.position.z);
                remote.targetRotY = data.rotationY;
                remote.currentAnim = data.currentAnim || 'walk';
            }
        });

        this.client.on('playerLeft', (data) => {
            const threeScene = this.getThreeScene();
            const remote = this.remotePlayers[data.id];
            const name = remote ? remote.data.name : 'An explorer';
            this.removeRemotePlayer(data.id, threeScene);

            const count = Object.keys(this.remotePlayers).length + 1;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                window.quests.showQuestNotification(`🚪 ${name} left the expedition.`);
            }
        });

        this.client.on('newHostAssigned', (data) => {
            if (data.hostId === this.myId) {
                this.isHost = true;
                this.role = 'HOST';
                if (this.onRoleChange) this.onRoleChange('HOST', true);
                if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                    window.quests.showQuestNotification('👑 You are now the Expedition Leader / HOST!');
                }
            } else if (this.remotePlayers[data.hostId]) {
                this.remotePlayers[data.hostId].data.role = 'HOST';
                this.updateRemotePlayerVisuals(this.remotePlayers[data.hostId], 'HOST');
            }
        });
    }

    // Connect to Socket.io Server (auto-detects or accepts custom URL)
    connect(serverUrl) {
        if (typeof io === 'undefined') {
            console.warn('[Multiplayer] Socket.io client library not loaded.');
            if (this.onStatusChange) this.onStatusChange('Socket.io library not loaded', true);
            return false;
        }

        let url = serverUrl;
        if (!url) {
            if (window.location.protocol.startsWith('http') && (window.location.port === '3000' || window.location.port === '10000')) {
                url = window.location.origin;
            } else {
                url = 'http://localhost:3000';
            }
        }

        try {
            console.log(`[Multiplayer] Connecting to ${url}...`);
            this.socket = io(url, {
                reconnectionAttempts: 4,
                timeout: 6000,
                transports: ['websocket', 'polling']
            });

            this.bindSocketEvents();
            return true;
        } catch (err) {
            console.error('[Multiplayer] Connection failed:', err);
            if (this.onStatusChange) this.onStatusChange(`Connection error: ${err.message}`, true);
            return false;
        }
    }

    bindSocketEvents() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.myId = this.socket.id;
            console.log(`[Multiplayer] Connected with ID: ${this.myId}`);
            if (this.onStatusChange) this.onStatusChange(`Connected to server. Ready to join room.`);
        });

        this.socket.on('connect_error', (err) => {
            console.warn('[Multiplayer] Server connection error:', err.message);
            if (this.onStatusChange) {
                this.onStatusChange(`Cannot reach multiplayer server at ${this.socket.io ? this.socket.io.uri : 'server'}. Ensure 'node server.js' is running.`, true);
            }
        });

        this.socket.on('roomFull', (data) => {
            console.warn('[Multiplayer] Room full:', data.message);
            if (this.onStatusChange) this.onStatusChange(data.message, true);
        });

        this.socket.on('joinedSuccess', (data) => {
            this.currentRoom = data.roomCode;
            this.myId = data.playerId;
            this.isHost = data.isHost;
            this.role = data.role;
            this.maxPlayers = data.maxPlayers || this.maxPlayers;

            console.log(`[Multiplayer] Joined room ${this.currentRoom} as ${this.role}`);

            const threeScene = this.getThreeScene();
            if (threeScene) {
                this.clearAllRemotePlayers(threeScene);
                for (const id in data.currentPlayers) {
                    if (id !== this.myId) {
                        this.spawnRemotePlayer(data.currentPlayers[id], threeScene);
                    }
                }
            }

            const count = Object.keys(data.currentPlayers).length;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (this.onRoleChange) this.onRoleChange(this.role, this.isHost);
            if (this.onStatusChange) this.onStatusChange(`In Room: ${this.currentRoom} (${count}/${this.maxPlayers} Players)`);
        });

        this.socket.on('playerJoined', (playerData) => {
            console.log(`[Multiplayer] Explorer joined: ${playerData.name} (${playerData.role})`);
            const threeScene = this.getThreeScene();
            if (threeScene) {
                this.spawnRemotePlayer(playerData, threeScene);
            }

            const count = Object.keys(this.remotePlayers).length + 1;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                window.quests.showQuestNotification(`👥 ${playerData.name} joined the expedition!`);
            }
        });

        this.socket.on('playerMoved', (data) => {
            const remote = this.remotePlayers[data.id];
            if (remote) {
                remote.targetPos.set(data.position.x, data.position.y, data.position.z);
                remote.targetRotY = data.rotationY;
                remote.currentAnim = data.currentAnim || 'walk';
            }
        });

        this.socket.on('playerLeft', (data) => {
            const threeScene = this.getThreeScene();
            const remote = this.remotePlayers[data.id];
            const name = remote ? remote.data.name : 'An explorer';

            this.removeRemotePlayer(data.id, threeScene);

            const count = Object.keys(this.remotePlayers).length + 1;
            if (this.onPlayerCountChange) this.onPlayerCountChange(count, this.maxPlayers);
            if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                window.quests.showQuestNotification(`🚪 ${name} left the expedition.`);
            }
        });

        this.socket.on('newHostAssigned', (data) => {
            if (data.hostId === this.myId) {
                this.isHost = true;
                this.role = 'HOST';
                if (this.onRoleChange) this.onRoleChange('HOST', true);
                if (window.quests && typeof window.quests.showQuestNotification === 'function') {
                    window.quests.showQuestNotification('👑 You are now the Expedition Leader / HOST!');
                }
            } else if (this.remotePlayers[data.hostId]) {
                this.remotePlayers[data.hostId].data.role = 'HOST';
                this.updateRemotePlayerVisuals(this.remotePlayers[data.hostId], 'HOST');
            }
        });
    }

    joinRoom(roomCode, playerName, serverUrl) {
        this.playerName = playerName || 'Explorer';
        this.currentRoom = (roomCode || 'CHENNAI_EXP').trim().toUpperCase();

        if (!this.socket || !this.isConnected) {
            this.connect(serverUrl);
            setTimeout(() => {
                if (this.socket && this.isConnected) {
                    this.socket.emit('joinRoom', {
                        roomCode: this.currentRoom,
                        playerName: this.playerName,
                        maxPlayers: this.maxPlayers
                    });
                }
            }, 300);
            return;
        }

        this.socket.emit('joinRoom', {
            roomCode: this.currentRoom,
            playerName: this.playerName,
            maxPlayers: this.maxPlayers
        });
    }

    leaveRoom() {
        if (this.socket && this.currentRoom) {
            this.socket.disconnect();
            this.isConnected = false;
        }

        const threeScene = this.getThreeScene();
        if (threeScene) {
            this.clearAllRemotePlayers(threeScene);
        }

        this.currentRoom = '';
        this.isHost = false;
        this.role = 'EXPLORER';
    }

    // Broadcast current player 3D transform (throttled to 20Hz)
    emitMyTransform(position, rotationY, currentAnim = 'walk') {
        if (!this.socket || !this.isConnected || !this.currentRoom) return;

        const now = performance.now() / 1000;
        if (now - this.lastEmitTime < this.emitInterval) return;
        this.lastEmitTime = now;

        this.socket.emit('playerMove', {
            roomCode: this.currentRoom,
            position: { x: position.x, y: position.y, z: position.z },
            rotationY: rotationY,
            currentAnim: currentAnim,
            deltaTime: this.emitInterval
        });
    }

    // Spawn 3D avatar in Three.js scene for remote players
    spawnRemotePlayer(playerData, scene) {
        if (!scene || this.remotePlayers[playerData.id]) return;

        const isHost = playerData.role === 'HOST';

        const group = new THREE.Group();
        group.position.set(playerData.position.x || 0, playerData.position.y || 0, playerData.position.z || 0);

        const coatColor = isHost ? 0xd4af37 : 0x2980b9;
        const dhotiColor = isHost ? 0xfff2a3 : 0xecdcb9;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: coatColor,
            roughness: 0.7,
            metalness: isHost ? 0.35 : 0.1
        });
        const dhotiMat = new THREE.MeshStandardMaterial({
            color: dhotiColor,
            roughness: 0.8
        });
        const skinMat = new THREE.MeshLambertMaterial({ color: 0x8d5b4c });

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.25, 8), bodyMat);
        torso.position.y = 1.4;
        torso.castShadow = true;
        group.add(torso);

        // Lower Dhoti / Veshti
        const dhoti = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 1.0, 8), dhotiMat);
        dhoti.position.y = 0.65;
        dhoti.castShadow = true;
        group.add(dhoti);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
        head.position.y = 2.25;
        head.castShadow = true;
        group.add(head);

        // Host Crown or Explorer Turban
        if (isHost) {
            const crownGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.25, 6);
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
            const crown = new THREE.Mesh(crownGeo, goldMat);
            crown.position.y = 2.5;
            group.add(crown);
        }

        // Lantern light
        const lanternLight = new THREE.PointLight(isHost ? 0xffbb33 : 0x66ccff, 1.6, 15, 2.0);
        lanternLight.position.set(0.6, 1.4, 0.3);
        group.add(lanternLight);

        // Name tag billboard
        const nameSprite = this.createNameSprite(playerData.name, isHost ? '👑 [HOST]' : '🧭');
        nameSprite.position.y = 2.9;
        group.add(nameSprite);

        scene.add(group);

        this.remotePlayers[playerData.id] = {
            data: playerData,
            mesh: group,
            bodyMesh: torso,
            targetPos: new THREE.Vector3(playerData.position.x || 0, playerData.position.y || 0, playerData.position.z || 0),
            targetRotY: playerData.rotationY || 0,
            currentAnim: playerData.currentAnim || 'idle',
            nameSprite: nameSprite
        };
    }

    createNameSprite(name, rolePrefix) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(15, 20, 30, 0.75)';
        if (ctx.roundRect) {
            ctx.roundRect(8, 8, 240, 48, [12]);
        } else {
            ctx.rect(8, 8, 240, 48);
        }
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${rolePrefix} ${name}`, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3.0, 0.75, 1.0);
        return sprite;
    }

    updateRemotePlayerVisuals(remotePlayer, newRole) {
        if (!remotePlayer || !remotePlayer.mesh) return;
        const isHost = newRole === 'HOST';
        if (remotePlayer.bodyMesh) {
            remotePlayer.bodyMesh.material.color.setHex(isHost ? 0xd4af37 : 0x2980b9);
        }
        if (remotePlayer.nameSprite) {
            remotePlayer.mesh.remove(remotePlayer.nameSprite);
            const newSprite = this.createNameSprite(remotePlayer.data.name, isHost ? '👑 [HOST]' : '🧭');
            newSprite.position.y = 2.9;
            remotePlayer.mesh.add(newSprite);
            remotePlayer.nameSprite = newSprite;
        }
    }

    removeRemotePlayer(id, scene) {
        const remote = this.remotePlayers[id];
        if (remote && scene) {
            scene.remove(remote.mesh);
            delete this.remotePlayers[id];
        }
    }

    clearAllRemotePlayers(scene) {
        for (const id in this.remotePlayers) {
            this.removeRemotePlayer(id, scene);
        }
    }

    // Called on every 3D animation frame to smoothly interpolate remote players
    updateRemotePlayers(deltaTime) {
        const lerpFactor = Math.min(1.0, deltaTime * 12.0);

        for (const id in this.remotePlayers) {
            const p = this.remotePlayers[id];
            if (!p || !p.mesh) continue;

            p.mesh.position.lerp(p.targetPos, lerpFactor);

            let diff = p.targetRotY - p.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            p.mesh.rotation.y += diff * lerpFactor;
        }
    }

    getThreeScene() {
        if (window.threeWorld && window.threeWorld.scene) {
            return window.threeWorld.scene;
        }
        return null;
    }

    setPlayerPaused(isPaused) {
        if (!this.isConnected || !this.client) return;
        if (typeof this.client.emit === 'function') {
            this.client.emit('playerPaused', { paused: isPaused, playerId: this.myId });
        }
        console.log(`[Multiplayer] Player pause broadcast: ${isPaused}`);
    }

    disconnectSafely() {
        if (this.isConnected) {
            try {
                if (this.client && typeof this.client.emit === 'function') {
                    this.client.emit('playerExiting', { playerId: this.myId });
                }
                this.disconnect();
            } catch (_) {}
        }
    }
}

window.MultiplayerManager = MultiplayerManager;
