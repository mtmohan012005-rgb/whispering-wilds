#!/usr/bin/env node
/**
 * Real Socket.IO room lifecycle regression suite.
 *
 * Covers server-generated six-character codes, strict create/join separation,
 * capacity, room isolation, host reassignment, cleanup, puzzle allowlists and
 * chat sanitisation. Requires the backend to be running on PORT (default 3000).
 */

const assert = require('assert');
const io = require('socket.io-client');
const roomCode = require('../server/room-code');
const config = require('../server/config');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
const clients = [];

function check(condition, message) {
    if (condition) {
        passed++;
        console.log(`  PASS ${message}`);
    } else {
        failed++;
        console.log(`  FAIL ${message}`);
    }
}

function connectClient() {
    return new Promise((resolve, reject) => {
        const socket = io(BASE_URL, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false,
            timeout: 5000
        });
        clients.push(socket);
        const timer = setTimeout(() => reject(new Error('connect timeout')), 5000);
        socket.on('connect', () => {
            clearTimeout(timer);
            resolve(socket);
        });
        socket.on('connect_error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

function once(socket, event, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, handler);
            reject(new Error(`Timed out waiting for "${event}"`));
        }, timeoutMs);
        const handler = (payload) => {
            clearTimeout(timer);
            socket.off(event, handler);
            resolve(payload);
        };
        socket.on(event, handler);
    });
}

function onceMatching(socket, event, predicate, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, handler);
            reject(new Error(`Timed out waiting for matching "${event}"`));
        }, timeoutMs);
        const handler = (payload) => {
            if (!predicate(payload)) return;
            clearTimeout(timer);
            socket.off(event, handler);
            resolve(payload);
        };
        socket.on(event, handler);
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createRoom(socket, playerName, maxPlayers) {
    const joined = once(socket, 'joinedSuccess');
    socket.emit('createRoom', { playerName, maxPlayers });
    return joined;
}

async function joinRoom(socket, code, playerName) {
    const joined = once(socket, 'joinedSuccess');
    socket.emit('joinRoom', { roomCode: code, playerName });
    return joined;
}

async function testCodeFormat() {
    console.log('\n[Test] Server-generated invite code format');
    const codes = new Set();
    for (let i = 0; i < 500; i++) {
        const code = roomCode.generateRoomCode();
        assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/, `unexpected code ${code}`);
        assert.strictEqual(code.length, 6);
        assert.ok(!/[IO01]/.test(code), `ambiguous character in ${code}`);
        codes.add(code);
    }
    check(codes.size > 480, `generated ${codes.size}/500 distinct codes`);
    check(roomCode.normalizeRoomCode('  ab3d9z ') === 'AB3D9Z', 'normalises trim + case');
    check(roomCode.normalizeRoomCode('AB3D9I') === null, 'rejects ambiguous I');
    check(roomCode.normalizeRoomCode('AB3D9') === null, 'rejects five characters');
    check(roomCode.normalizeRoomCode('AB3D9Z0') === null, 'rejects seven characters');
    check(roomCode.normalizeRoomCode('CHENNAI_EXP') === null, 'rejects legacy default room');
    check(roomCode.normalizeRoomCode(null) === null, 'rejects non-string input');
}

async function testCreateAndJoin() {
    console.log('\n[Test] Create and join lifecycle');
    const host = await connectClient();
    const hostJoined = await createRoom(host, 'HostPlayer', 5);

    check(hostJoined.roomCode === hostJoined.roomCode.toUpperCase(), 'code is uppercase');
    check(/^[A-HJ-NP-Z2-9]{6}$/.test(hostJoined.roomCode), `six-character code (${hostJoined.roomCode})`);
    check(hostJoined.isHost === true, 'creator is host');
    check(hostJoined.role === 'HOST', 'creator role is HOST');
    check(hostJoined.maxPlayers === 5, 'default cap is five');

    const guest = await connectClient();
    const rosterPromise = once(host, 'roomRoster');
    const guestJoined = await joinRoom(guest, `  ${hostJoined.roomCode.toLowerCase()}  `, 'GuestPlayer');
    const roster = await rosterPromise;

    check(guestJoined.roomCode === hostJoined.roomCode, 'guest joined the created room');
    check(guestJoined.isHost === false, 'guest is not host');
    check(guestJoined.role === 'EXPLORER', 'guest role is EXPLORER');
    check(Object.keys(guestJoined.currentPlayers).length === 2, 'guest sees two players');
    check(roster.playerCount === 2 && roster.hostId === host.id, 'host receives updated roster');

    return { host, guest, code: hostJoined.roomCode };
}

async function testInvalidAndMissingRooms() {
    console.log('\n[Test] Invalid and missing room codes');
    const socket = await connectClient();

    const invalid = once(socket, 'joinRejected');
    socket.emit('joinRoom', { roomCode: 'abc', playerName: 'Nope' });
    const invalidPayload = await invalid;
    check(invalidPayload.code === 'INVALID_ROOM_CODE', 'short code rejected');

    const missing = once(socket, 'joinRejected');
    socket.emit('joinRoom', { roomCode: 'ZZZZZZ', playerName: 'Nope' });
    const missingPayload = await missing;
    check(missingPayload.code === 'ROOM_NOT_FOUND', 'unknown but valid code rejected');

    // Rejected joins must never create a room.
    const retry = await connectClient();
    const stillMissing = once(retry, 'roomNotFound', 1200)
        .then(() => true)
        .catch(() => false);
    retry.emit('joinRoom', { roomCode: 'ZZZZZZ', playerName: 'Nope' });
    check((await stillMissing) === true, 'join never auto-creates a room');

    const legacySocket = await connectClient();
    const legacy = once(legacySocket, 'joinRejected');
    legacySocket.emit('joinRoom', { roomCode: 'CHENNAI_EXP', playerName: 'Nope' });
    check((await legacy).code === 'INVALID_ROOM_CODE', 'legacy fallback code rejected');
}

async function testFailedJoinPreservesMembership() {
    console.log('\n[Test] Failed joins preserve existing room membership');
    const a1 = await connectClient();
    const a2 = await connectClient();
    const roomA = await createRoom(a1, 'KeepA1', 5);
    // Consume the roster update caused by the successful join so later
    // assertions only observe churn from the rejected switch attempts.
    const initialRoster = onceMatching(a1, 'roomRoster', (payload) => payload.playerCount === 2);
    await joinRoom(a2, roomA.roomCode, 'KeepA2');
    await initialRoster;

    // A rejected switch must not evict the player or notify the old room.
    let oldRoomLeaveEvents = 0;
    let oldRoomRosterEvents = 0;
    const onOldRoomLeave = () => { oldRoomLeaveEvents++; };
    const onOldRoomRoster = () => { oldRoomRosterEvents++; };
    a1.on('playerLeft', onOldRoomLeave);
    a1.on('roomRoster', onOldRoomRoster);

    const notFound = once(a2, 'joinRejected');
    a2.emit('joinRoom', { roomCode: 'ZZZZZZ', playerName: 'KeepA2' });
    check((await notFound).code === 'ROOM_NOT_FOUND', 'missing code rejected');

    const peerMove = once(a1, 'playerMoved');
    a2.emit('playerMove', {
        position: { x: -249.5, y: 0, z: 0.5 },
        rotationY: 45,
        currentAnim: 'walk'
    });
    check((await peerMove).id === a2.id, 'ROOM_NOT_FOUND keeps player in original room');

    const bHost = await connectClient();
    const roomB = await createRoom(bHost, 'FullB1', 5);
    for (let i = 2; i <= 5; i++) {
        const member = await connectClient();
        await joinRoom(member, roomB.roomCode, `FullB${i}`);
    }

    let leaked = false;
    bHost.on('playerMoved', (payload) => {
        if (payload && payload.id === a2.id) leaked = true;
    });

    const fullRejected = once(a2, 'joinRejected');
    a2.emit('joinRoom', { roomCode: roomB.roomCode, playerName: 'KeepA2' });
    check((await fullRejected).code === 'ROOM_FULL', 'full room rejected');

    const peerMoveAgain = once(a1, 'playerMoved');
    a2.emit('playerMove', {
        position: { x: -249, y: 0, z: 0.5 },
        rotationY: 60,
        currentAnim: 'walk'
    });
    check((await peerMoveAgain).id === a2.id, 'ROOM_FULL keeps player in original room');

    await delay(250);
    check(leaked === false, 'rejected player never leaks movement into the full room');
    check(oldRoomLeaveEvents === 0, 'failed joins emit no playerLeft in the original room');
    check(oldRoomRosterEvents === 0, 'failed joins emit no roster churn in the original room');
    check(a2.connected === true, 'player stays connected after both failed joins');

    a1.off('playerLeft', onOldRoomLeave);
    a1.off('roomRoster', onOldRoomRoster);
}

async function testCapacity() {
    console.log('\n[Test] Five-player capacity');
    const host = await connectClient();
    const room = await createRoom(host, 'CapHost', 5);
    const members = [host];
    for (let i = 1; i < 5; i++) {
        const member = await connectClient();
        await joinRoom(member, room.roomCode, `Member${i}`);
        members.push(member);
    }
    check(members.length === config.MAX_PLAYERS_PER_ROOM, 'room accepts exactly five players');

    const sixth = await connectClient();
    const rejected = once(sixth, 'joinRejected');
    sixth.emit('joinRoom', { roomCode: room.roomCode, playerName: 'Sixth' });
    const payload = await rejected;
    check(payload.code === 'ROOM_FULL', 'sixth player is rejected as ROOM_FULL');

    const oversized = await connectClient();
    const oversizedRoom = await createRoom(oversized, 'Oversized', 99);
    check(oversizedRoom.maxPlayers === config.MAX_PLAYERS_PER_ROOM, 'capacity is clamped to five');
}

async function testRoomIsolation() {
    console.log('\n[Test] Room isolation for movement');
    const a1 = await connectClient();
    const a2 = await connectClient();
    const b1 = await connectClient();
    const roomA = await createRoom(a1, 'A1', 5);
    await joinRoom(a2, roomA.roomCode, 'A2');
    const roomB = await createRoom(b1, 'B1', 5);

    await delay(200);
    let leaked = false;
    b1.on('playerMoved', () => { leaked = true; });
    const received = once(a2, 'playerMoved');
    // The default spawn is x=-250; stay within the anti-teleport threshold so
    // this test exercises room routing rather than movement validation.
    a1.emit('playerMove', {
        roomCode: roomB.roomCode,
        position: { x: -249.5, y: 0, z: 0.5 },
        rotationY: 90,
        currentAnim: 'walk'
    });
    const movement = await received;
    check(movement.id === a1.id, 'move delivered inside the authoritative room');
    await delay(250);
    check(leaked === false, 'supplied foreign roomCode is ignored');
}

async function testHostReassignmentAndCleanup() {
    console.log('\n[Test] Host reassignment and empty-room cleanup');
    const host = await connectClient();
    const guest = await connectClient();
    const room = await createRoom(host, 'ReassignHost', 5);
    await joinRoom(guest, room.roomCode, 'ReassignGuest');

    const newHost = once(guest, 'newHostAssigned');
    const left = once(guest, 'playerLeft');
    host.disconnect();
    const hostPayload = await newHost;
    await left;
    check(hostPayload.hostId === guest.id, 'host role reassigned to remaining player');

    const joinedAgain = once(guest, 'joinedSuccess');
    guest.emit('joinRoom', { roomCode: room.roomCode, playerName: 'ReassignGuest' });
    check((await joinedAgain).isHost === true, 'reassigned host is recognised on rejoin');

    guest.disconnect();
    await delay(300);

    const outsider = await connectClient();
    const gone = once(outsider, 'joinRejected');
    outsider.emit('joinRoom', { roomCode: room.roomCode, playerName: 'Late' });
    check((await gone).code === 'ROOM_NOT_FOUND', 'empty room is removed');

    const leaveHost = await connectClient();
    const leaveRoom = await createRoom(leaveHost, 'LeaveHost', 5);
    const leftAck = once(leaveHost, 'leftRoom');
    leaveHost.emit('leaveRoom');
    await leftAck;
    const leftGuest = await connectClient();
    const afterLeave = once(leftGuest, 'joinRejected');
    leftGuest.emit('joinRoom', { roomCode: leaveRoom.roomCode, playerName: 'AfterLeave' });
    check((await afterLeave).code === 'ROOM_NOT_FOUND', 'explicit leave cleans up the room');
}

async function testPuzzleAndChatValidation() {
    console.log('\n[Test] Mechanism allowlist and chat sanitisation');
    const socket = await connectClient();
    const room = await createRoom(socket, 'PuzzleHost', 5);

    const unknown = once(socket, 'mechanismRejected');
    socket.emit('interactMechanism', { mechanismId: 'adminBackdoor', payload: { solved: true } });
    check((await unknown).reason === 'Unknown mechanism', 'unknown mechanism rejected');

    const badValue = once(socket, 'mechanismRejected');
    socket.emit('interactMechanism', { mechanismId: 'waterwheel', payload: { dialA: 99 } });
    check((await badValue).reason.includes('dialA'), 'out-of-range dial rejected');

    const badField = once(socket, 'mechanismRejected');
    socket.emit('interactMechanism', { mechanismId: 'waterwheel', payload: { solved: true } });
    check((await badField).reason.includes('permitted'), 'solved state cannot be client-set');

    const updated = once(socket, 'mechanismUpdated');
    socket.emit('interactMechanism', { mechanismId: 'waterwheel', payload: { dialA: 3, dialB: 2, dialC: 4 } });
    const state = (await updated).state;
    check(state.solved === true && state.sluiceOpen === true, 'valid solution updates room state');

    const chat = once(socket, 'chatMessage');
    socket.emit('chatMessage', { text: '<img src=x onerror=alert(1)>hello <b>world</b>' });
    const message = await chat;
    check(!message.text.includes('<') && message.text.includes('hello'), 'chat markup stripped');
    check(message.text.length <= 160, 'chat length capped');
    check(message.roomCode === undefined, 'chat payload contains no room code');
    check(room.roomCode.length === 6, 'room remains addressable by its generated code');
}

async function main() {
    console.log('The Whispering Wilds - Room Lifecycle Verification');
    console.log(`Server: ${BASE_URL}`);

    try {
        await testCodeFormat();
        await testCreateAndJoin();
        await testInvalidAndMissingRooms();
        await testFailedJoinPreservesMembership();
        await testCapacity();
        await testRoomIsolation();
        await testHostReassignmentAndCleanup();
        await testPuzzleAndChatValidation();
    } catch (err) {
        failed++;
        console.error(`\nFATAL: ${err.stack || err.message}`);
    } finally {
        for (const socket of clients) {
            try { socket.disconnect(); } catch (_) {}
        }
    }

    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
}

main();
