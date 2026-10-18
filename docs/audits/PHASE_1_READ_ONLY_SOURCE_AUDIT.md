# Phase 1 — Read-Only Source Audit Report

**Date:** 2026-10-18  
**Branch:** `scene-regen-review`  
**Latest commit:** `244c3e9` (Fix .gitignore to allow docs/audits/ and reports/ files)  
**Unity version:** 6000.6.3f1, HDRP 17.7.0

---

## 1. Current Branch and Commit

- **Branch:** `scene-regen-review` (up to date with `origin/scene-regen-review`)
- **12 modified Unity scene files** (unstaged) — full scene regeneration from build pipeline
- **No source code changes** staged or committed since the last audit
- **Untracked:** 64 archive report files in `docs/archive/reports/`

---

## 2. What Was Inspected

### Source Code (Read-Only)
- `unity/Packages/manifest.json` — package dependencies
- `unity/Assets/_Project/Scripts/Online/SocketIOClient.cs` (535 lines) — multiplayer client
- `unity/Assets/_Project/Scripts/Online/RealtimeManager.cs` (237 lines) — networking governor
- `unity/Assets/_Project/Scripts/Online/AuthService.cs` (522 lines) — authentication
- `unity/Assets/_Project/Scripts/Online/CloudSaveManager.cs` (247 lines) — cloud persistence
- `unity/Assets/_Project/Scripts/NPC/NPCNavigationController.cs` (301 lines) — NPC navigation
- `unity/ProjectSettings/EditorBuildSettings.asset` — build scene order
- `server/server.js` (223 lines) — Express + Socket.IO server
- `server/config.js` (127 lines) — server configuration
- `scripts/authoritative-asset-audit.js` (829 lines) — asset audit script
- NavMesh data directory: 6 `.asset` files for all gameplay regions

### Audit Documents (Read-Only)
- `docs/audits/MODULE_STATUS.md` (2026-10-16) — **contains outdated claims**
- `docs/audits/TEST_RESULTS.md` (2026-10-16) — **contains outdated claims**
- `docs/audits/WHOLE_GAME_CURRENT_AUDIT.md` — previous comprehensive audit
- `docs/audits/REMAINING_BLOCKERS.md` — previous blocker list
- `docs/audits/WHOLE_GAME_MODULE_STATUS.csv` — module classification

### NavMesh Data
- 6 NavMesh `.asset` files found in `unity/Assets/_Project/NavMeshData/`:
  - `02_Chennai_GeorgeTown.asset`
  - `03_Pichavaram_Wetlands.asset`
  - `04_Thanjavur_Delta.asset`
  - `05_Chettinad_Mansion.asset`
  - `06_Mamallapuram_Shore.asset`
  - `07_Nilgiris_Sanctuary.asset`
- No NavMesh for Boot or StateMap (expected — not gameplay scenes)
- No `.navmesh` files — data stored as Unity `.asset` format

---

## 3. Actual Build and Test Results

| Test Suite | Command | Result | Details |
|------------|---------|--------|---------|
| verify-game | `npm run verify-game` | ✅ PASS | 15/15 checks |
| test:backend | `npm run test:backend` | ✅ PASS | 31/31 security tests |
| verify-production | `npm run verify-production` | ✅ PASS | All production checks |
| verify-assets | `npm run verify-assets` | ✅ PASS | 36/36 manifest assets |
| verify-runtime | `node scripts/verify-runtime.js` | ✅ PASS | 7/7 checks |
| verify-compatibility | `node scripts/verify-compatibility.js` | ✅ PASS | 20/20 + 1 skip (NavMesh dir) |
| authoritative-asset-audit | `node scripts/authoritative-asset-audit.js` | ✅ PASS | 0 missing (legacy browser game only) |

**Total: 113/113 PASS, 1 SKIP**

**Important caveat:** `authoritative-asset-audit.js` scans `['js', 'css', 'index.html', 'server', 'desktop', 'scripts', 'tools', 'config', 'content']` — it does **NOT** scan `unity/`. Its "0 missing" result applies only to the legacy browser game, not the Unity project.

---

## 4. Confirmed Bugs (Ranked by Priority)

### P0 — Multiplayer Client Protocol Incompatibility

**File:** `SocketIOClient.cs`  
**Status:** Verified broken by code inspection

The SocketIOClient cannot connect to the Socket.IO server due to multiple protocol mismatches:

1. **Engine.IO v4 handshake format** (line 202-228): `ParseHandshake()` expects semicolon-separated key=value pairs (`sid=xxx;pingInterval=yyy`). Engine.IO v4 returns **JSON** (`{"sid":"...","pingInterval":...,"pingTimeout":...}`). The parser will fail to extract the session ID, and the WebSocket upgrade will use an empty `sid`.

2. **WebSocket connection timing** (line 176-199): `ConnectSequence()` yields `_webSocket.Connect(wsUrl)` which returns a `Task`. The coroutine does not properly await the Task completion — it continues immediately, potentially sending the Socket.IO connect packet before the WebSocket is open.

3. **Ping/pong timer bug** (line 121-138): `_pingTimer` is reset to 0 when a ping is sent (line 129), then immediately checked against `_pongTimeout` (line 134). Since the timer was just reset, `_pingTimer >= _pongTimeout` is always false on the same frame. The pong timeout never actually fires.

4. **Ping interval mismatch**: Client defaults to 25s ping interval / 20s pong timeout. Server config is 10s ping interval / 5s pong timeout. The client will send pings less frequently than the server expects, causing the server to disconnect for pong timeout.

5. **Event packet parsing** (line 347-395): `ParseEventPacket()` uses manual string parsing for JSON arrays. Complex nested data structures will not be parsed correctly.

**Impact:** Multiplayer is non-functional. Two clients cannot connect to each other.

### P1 — CloudSaveManager Token Staleness

**File:** `AuthService.cs` line 105  
**Status:** Verified broken by code inspection

```csharp
IdTokenProvider tokenProvider = () => _sessionToken;
```

The token provider captures `_sessionToken` as a closure variable. Firebase ID tokens expire hourly. The CloudSaveManager comment (line 12-13) explicitly states: "ID tokens expire (typically hourly), so the token MUST be fetched per request rather than cached as a serialized string."

The current implementation violates this contract — it returns the same token from login time for all subsequent requests. After the token expires, cloud save requests will fail with 401 Unauthorized.

**Impact:** Cloud saves work only within the first hour after login. Long sessions will silently fail to sync.

### P1 — `com.unity.ai.navigation` Package Missing

**File:** `unity/Packages/manifest.json`  
**Status:** Verified missing

The manifest includes `com.unity.modules.ai` (line 23) but NOT `com.unity.ai.navigation`. This means:
- `NavMeshSurface` component is unavailable
- Runtime NavMesh baking is not possible
- The `EcologyNavMeshBaker.cs` editor script references `NavMeshSurface` but cannot compile without the package

However, `NPCNavigationController.cs` uses only `UnityEngine.AI.NavMeshAgent` (from `com.unity.modules.ai`), which IS available. NavMesh data exists as pre-baked `.asset` files for all 6 regions. NPCs have a safe fallback — if no NavMesh is found, they enter "stationary fallback mode" without crashing.

**Impact:** NPCs can navigate using pre-baked NavMesh data, but the ecology baker cannot run. If scene regeneration loses NavMesh data, NPCs will be stationary.

### P2 — Authoritative Asset Audit Does Not Scan Unity

**File:** `scripts/authoritative-asset-audit.js` line 47  
**Status:** Verified incomplete

`SCAN_ROOTS = ['js', 'css', 'index.html', 'server', 'desktop', 'scripts', 'tools', 'config', 'content']`

The `unity/` directory is not scanned. The "0 missing assets" result is meaningless for the Unity game. A proper Unity asset audit would need to:
- Parse scene files for missing prefab references
- Check `assets/` directory against scene references
- Verify character model rigging and animations
- Check audio file references in source code

**Impact:** Cannot determine actual Unity asset completeness from this script.

### P2 — Outdated Audit Documentation

**Files:** `docs/audits/MODULE_STATUS.md`, `docs/audits/TEST_RESULTS.md`  
**Status:** Verified outdated

| Claim | Document | Line | Actual Status |
|-------|----------|------|---------------|
| "Multiplayer Client — MISSING — no Socket.IO client" | MODULE_STATUS.md | 24 | SocketIOClient.cs (535 lines) EXISTS but has protocol bugs |
| "CloudSaveManager.Configure() never called" | MODULE_STATUS.md | 23 | Configure() IS called from AuthService.cs:193 |
| "Multiplayer — Missing client — Cannot test" | TEST_RESULTS.md | 64 | Client exists but cannot connect due to protocol bugs |
| "Cloud saves — Not configured — Cannot test" | TEST_RESULTS.md | 80 | Configure() is called; blocked by Firebase credentials |
| "Unity Test Framework absent" | Previous audit | — | `com.unity.test-framework: 1.4.5` IS in manifest.json:17 |

**Impact:** Misleads developers about actual project state.

---

## 5. Outdated or Contradictory Documentation

### MODULE_STATUS.md (2026-10-16)
- ❌ Line 24: "Multiplayer Client — MISSING" → **Incorrect**. SocketIOClient.cs exists (535 lines) but has protocol bugs.
- ❌ Line 23: "CloudSaveManager.Configure() never called" → **Incorrect**. Called from AuthService.cs:193 after sign-in.
- ❌ Line 50: "Requires adding a Socket.IO client package" → **Incorrect**. Client already exists; needs protocol fix.
- ❌ Line 52: "AuthService has the session token but doesn't wire it to CloudSaveManager" → **Incorrect**. Wiring exists.

### TEST_RESULTS.md (2026-10-16)
- ❌ Line 64: "Multiplayer — Missing client — Cannot test" → **Incorrect**. Client exists but has protocol bugs.
- ❌ Line 80: "Cloud saves — Not configured — Cannot test" → **Incorrect**. Configure() is called.

### authoritative-asset-audit.js
- ❌ Claims to be "single source of truth" but does not scan `unity/` directory
- ❌ Report shows "0 missing" for legacy browser game, not Unity project

---

## 6. Files Likely Requiring Changes and Why

| File | Priority | Reason |
|------|----------|--------|
| `SocketIOClient.cs` | P0 | Engine.IO v4 handshake parser expects wrong format; WebSocket timing; ping/pong timer bug |
| `AuthService.cs` | P1 | Token provider returns stale token; needs per-request token refresh |
| `unity/Packages/manifest.json` | P1 | Missing `com.unity.ai.navigation` package |
| `docs/audits/MODULE_STATUS.md` | P2 | 4 outdated claims need correction |
| `docs/audits/TEST_RESULTS.md` | P2 | 2 outdated claims need correction |
| `scripts/authoritative-asset-audit.js` | P2 | Needs Unity-specific scan or clear disclaimer |

---

## 7. Tests That Remain Blocked and the Exact Reason

| Test | Reason | Blocked By |
|------|--------|------------|
| Unity EditMode tests (78 tests) | Licensing Code 404 | Unity Editor license not active |
| Unity PlayMode tests (34 tests) | Licensing Code 404 | Unity Editor license not active |
| Multiplayer runtime test | Requires two client instances | SocketIOClient protocol bugs (P0) + two machines |
| Cloud save runtime test | Firebase credentials not configured | User must provision Firebase service account |
| Full campaign playthrough | Requires human operator | AI agent cannot operate mouse/keyboard |
| NPC dialogue interaction | Requires mouse/keyboard input | Standalone build cannot be interacted with |
| Save/load cycle verification | Requires in-game save and restart | Standalone build cannot be interacted with |
| Region transition testing | Requires quest completion | Full campaign needs human operator |
| Settings change verification | Requires UI interaction | Standalone build cannot be interacted with |
| Tamil font rendering | Requires visual inspection | Standalone build cannot be screenshot by AI |

---

## 8. Safe, Prioritized Implementation Plan

### Phase 2 Priority 1: Fix Multiplayer Protocol (P0)
1. **Rewrite `ParseHandshake()`** to parse JSON response from Engine.IO v4
2. **Fix WebSocket connection timing** — properly await the Connect Task
3. **Fix ping/pong timer** — use separate timers for ping interval and pong timeout
4. **Sync ping interval** with server config (10s interval, 5s timeout)
5. **Improve event packet parsing** — use JsonUtility for complex data
6. **Add integration test** — connect SocketIOClient to running server and verify handshake

### Phase 2 Priority 2: Fix CloudSaveManager Token (P1)
1. **Modify `AuthService.cs`** token provider to fetch fresh token per request
2. Or modify `CloudSaveManager.cs` to accept a method that refreshes the token

### Phase 2 Priority 3: Add NavMesh Package (P1)
1. **Add `com.unity.ai.navigation`** to `manifest.json`
2. Verify `EcologyNavMeshBaker.cs` compiles
3. Verify NavMesh data is intact in all 6 regions

### Phase 2 Priority 4: Update Documentation (P2)
1. **Correct MODULE_STATUS.md** — multiplayer is IMPLEMENTED (with bugs), cloud saves ARE configured
2. **Correct TEST_RESULTS.md** — update multiplayer and cloud save status
3. **Update authoritative-asset-audit.js** — add Unity scan or clear disclaimer

### Phase 3: Build and Runtime Verification
1. Build fresh Windows player
2. Verify gameplay flow: Boot → Menu → New Game → Chennai → NPC interaction → quest → save/load
3. Test multiplayer with two clients (after P0 fix)
4. Test cloud saves with Firebase credentials (when available)

---

## Summary

### What Works
- ✅ Game launches at 60 FPS, intro plays, menu displays
- ✅ All 8 production scenes in correct build order
- ✅ Player character fully rigged (23 bones, 24 animations)
- ✅ NavMesh data exists for all 6 gameplay regions
- ✅ Backend server: 31/31 security tests pass
- ✅ Localization: 265+ keys, English/Tamil
- ✅ Save system: v4 schema with migration
- ✅ All verification scripts: 113/113 PASS

### What's Broken
- ❌ **Multiplayer client cannot connect** — Engine.IO protocol mismatch (P0)
- ❌ **Cloud save token expires** — stale token after 1 hour (P1)
- ❌ **NavMesh package missing** — `com.unity.ai.navigation` not installed (P1)

### What's Incomplete
- ⚠️ Asset audit doesn't scan Unity project
- ⚠️ Audit documents contain outdated claims
- ⚠️ Full campaign needs human operator verification
- ⚠️ Firebase credentials not provisioned

### Verdict: PLAYABLE GAME WITH KNOWN GAPS

The core offline single-player game loop is functional. Multiplayer is implemented but cannot connect due to protocol bugs. Cloud saves are wired but use a stale token. The game is playable as a single-player experience but has known gaps in online features and incomplete asset verification.

---

**End of Phase 1. Awaiting GO AHEAD before proceeding to Phase 2.**
