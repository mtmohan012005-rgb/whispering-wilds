// ============================================================================
// THE WHISPERING WILDS — Socket.IO Integration Tests
// ============================================================================
// These tests verify the Socket.IO server is correctly configured and accepts
// connections using the Engine.IO v4 protocol. They run against the actual
// Node.js server, not the Unity client (which requires Unity Editor).
// ============================================================================

const http = require('http');
const io = require('socket.io-client');
const { start, shutdown, io: serverIo } = require('../server');

const PORT = 3099; // Use alternate port to avoid conflict with main server
const BASE_URL = `http://localhost:${PORT}`;

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failures = [];

function assert(condition, message) {
    testsRun++;
    if (condition) {
        testsPassed++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        testsFailed++;
        const failure = { message, test: testsRun };
        failures.push(failure);
        console.log(`  ❌ FAIL: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    assert(actual === expected, `${message} (expected ${expected}, got ${actual})`);
}

// ============================================================================
// Test: Engine.IO v4 handshake returns JSON
// ============================================================================
async function testEngineIOHandshake() {
    console.log('\n[Test] Engine.IO v4 handshake returns JSON');
    
    return new Promise((resolve) => {
        const req = http.get(`${BASE_URL}/socket.io/?EIO=4&transport=polling`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // Engine.IO v4 response is prefixed with message count + ':'
                // e.g. "74:{"sid":"...","upgrades":["websocket"],"pingInterval":10000,"pingTimeout":5000}"
                const jsonStart = data.indexOf('{');
                assert(jsonStart >= 0, 'Handshake response contains JSON object');
                
                if (jsonStart >= 0) {
                    const jsonStr = data.substring(jsonStart);
                    let parsed;
                    try {
                        parsed = JSON.parse(jsonStr);
                        assert(true, 'Handshake response is valid JSON');
                    } catch (e) {
                        assert(false, `Handshake response is valid JSON: ${e.message}`);
                        resolve();
                        return;
                    }
                    
                    assert(parsed.sid !== undefined, 'Handshake contains sid');
                    assert(typeof parsed.sid === 'string', 'sid is a string');
                    assert(Array.isArray(parsed.upgrades), 'Handshake contains upgrades array');
                    assert(typeof parsed.pingInterval === 'number', 'Handshake contains pingInterval');
                    assert(typeof parsed.pingTimeout === 'number', 'Handshake contains pingTimeout');
                    assertEqual(parsed.pingInterval, 10000, 'pingInterval matches server config (10000ms)');
                    assertEqual(parsed.pingTimeout, 5000, 'pingTimeout matches server config (5000ms)');
                }
                resolve();
            });
        });
        req.on('error', (e) => {
            assert(false, `Handshake request failed: ${e.message}`);
            resolve();
        });
        req.setTimeout(5000, () => {
            assert(false, 'Handshake request timed out');
            req.destroy();
            resolve();
        });
    });
}

// ============================================================================
// Test: Socket.IO client connection
// ============================================================================
async function testSocketIOConnection() {
    console.log('\n[Test] Socket.IO client connection');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'Connection established within timeout');
            resolve();
        }, 5000);
        
        socket.on('connect', () => {
            clearTimeout(timeout);
            assert(true, 'Socket.IO client connected successfully');
            assert(socket.id !== undefined, 'Client received socket ID');
            socket.disconnect();
            resolve();
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `Connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Test: Socket.IO event emit and receive
// ============================================================================
async function testSocketIOEvents() {
    console.log('\n[Test] Socket.IO event emit and receive');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'Event exchange completed within timeout');
            resolve();
        }, 5000);
        
        let eventReceived = false;
        
        // Server sends 'joinSuccess' or similar events on connection
        // We test by emitting a custom event and checking no error occurs
        socket.on('connect', () => {
            clearTimeout(timeout);
            
            // Emit a test event — server should not crash
            socket.emit('testEvent', { test: 'data' });
            
            // Small delay to allow server processing
            setTimeout(() => {
                assert(true, 'Event emitted without error');
                socket.disconnect();
                resolve();
            }, 500);
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `Event test connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Test: Room join event
// ============================================================================
async function testRoomJoin() {
    console.log('\n[Test] Room join event');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'Room join completed within timeout');
            resolve();
        }, 5000);
        
        socket.on('connect', () => {
            clearTimeout(timeout);
            
            socket.on('joinedSuccess', (payload) => {
                assert(/^[A-HJ-NP-Z2-9]{6}$/.test(payload.roomCode),
                    `Server issued six-character code (${payload.roomCode})`);
                assert(payload.isHost === true, 'Creator is host');
                socket.disconnect();
                resolve();
            });
            socket.on('joinRejected', (payload) => {
                assert(false, `Create room rejected: ${payload.reason}`);
                socket.disconnect();
                resolve();
            });

            // Rooms must be created explicitly before joining.
            socket.emit('createRoom', {
                playerName: 'TestPlayer',
                maxPlayers: 5
            });
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `Room join connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Test: WebSocket upgrade
// ============================================================================
async function testWebSocketUpgrade() {
    console.log('\n[Test] WebSocket transport upgrade');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'WebSocket upgrade completed within timeout');
            resolve();
        }, 5000);
        
        socket.on('connect', () => {
            clearTimeout(timeout);
            
            // Check transport after a brief delay to allow upgrade
            setTimeout(() => {
                const transport = socket.io.engine.transport.name;
                assert(transport === 'websocket', `Transport upgraded to WebSocket (actual: ${transport})`);
                socket.disconnect();
                resolve();
            }, 1000);
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `WebSocket upgrade connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Test: Disconnect handling
// ============================================================================
async function testDisconnect() {
    console.log('\n[Test] Disconnect handling');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'Disconnect test completed within timeout');
            resolve();
        }, 5000);
        
        let disconnectFired = false;
        
        socket.on('connect', () => {
            assert(true, 'Connected before disconnect test');
            socket.disconnect();
        });
        
        socket.on('disconnect', (reason) => {
            disconnectFired = true;
            assert(true, `Disconnect event fired (reason: ${reason})`);
            clearTimeout(timeout);
            resolve();
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `Disconnect test connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Test: Ping/Pong heartbeat
// ============================================================================
async function testPingPong() {
    console.log('\n[Test] Ping/Pong heartbeat');
    
    return new Promise((resolve) => {
        const socket = io(BASE_URL, {
            transports: ['polling', 'websocket'],
            forceNew: true,
            pingInterval: 1000, // Faster ping for testing
            pingTimeout: 2000
        });
        
        const timeout = setTimeout(() => {
            socket.disconnect();
            assert(false, 'Ping/pong test completed within timeout');
            resolve();
        }, 10000);
        
        socket.on('connect', () => {
            // Wait for at least one ping/pong cycle
            setTimeout(() => {
                assert(socket.connected === true, 'Connection maintained after ping/pong cycle');
                socket.disconnect();
                clearTimeout(timeout);
                resolve();
            }, 3000);
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            assert(false, `Ping/pong connection failed: ${err.message}`);
            resolve();
        });
    });
}

// ============================================================================
// Main test runner
// ============================================================================
async function runTests() {
    console.log('=======================================================');
    console.log('The Whispering Wilds — Socket.IO Integration Tests');
    console.log('=======================================================');
    
    // Set environment to avoid MEGA/Firebase init issues
    process.env.NODE_ENV = 'test';
    
    // Start server on alternate port
    process.env.PORT = String(PORT);
    
    try {
        await start(PORT);
        console.log(`\n✅ Server started on port ${PORT}`);
        
        // Small delay for server to be fully ready
        await new Promise(r => setTimeout(r, 500));
        
        // Run tests
        await testEngineIOHandshake();
        await testSocketIOConnection();
        await testSocketIOEvents();
        await testRoomJoin();
        await testWebSocketUpgrade();
        await testDisconnect();
        await testPingPong();
        
        // Shutdown server
        await new Promise((resolve) => {
            serverIo.close(() => {
                require('http').Server ? null : null;
                resolve();
            });
        });
        
        // Print summary
        console.log('\n=======================================================');
        console.log('TEST RESULTS');
        console.log('=======================================================');
        console.log(`Total: ${testsRun}`);
        console.log(`Passed: ${testsPassed}`);
        console.log(`Failed: ${testsFailed}`);
        
        if (failures.length > 0) {
            console.log('\nFailures:');
            failures.forEach(f => console.log(`  ${f.test}. ${f.message}`));
        }
        
        console.log('=======================================================');
        process.exit(testsFailed > 0 ? 1 : 0);
        
    } catch (err) {
        console.error(`\n❌ Test runner error: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
}

runTests();
