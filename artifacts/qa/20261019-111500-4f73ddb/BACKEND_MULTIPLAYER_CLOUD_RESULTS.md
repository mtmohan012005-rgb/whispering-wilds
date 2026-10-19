# The Whispering Wilds — Backend, Cloud Save & Multiplayer Results

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

---

## 1. Backend Security Test Suite (`npm run test:backend`)

- **Execution Mode:** Live Node.js Express server spawned on port 3000 (PID 5544) with clean teardown.
- **Total Tests:** **34**
- **Passed:** **34** (100%)
- **Failed:** **0**
- **Skipped:** **0**
- **Status:** **`PASS_RUNTIME`**

### Summary of Passed Security Assertions:
1. **Health & Readiness Endpoints (6 tests):** `/health`, `/api/v1/health`, and `/readiness` return valid HTTP status, uptime, and component status maps.
2. **CSRF Protection (4 tests):** POST without `X-WW-CSRF` header is rejected with HTTP 403; requests with header proceed.
3. **Authentication & Session Tokens (4 tests):** Unauthenticated requests rejected with 401; valid login produces cryptographically random session token.
4. **CORS & Rate Limiting (2 tests):** Cross-origin headers present; burst traffic activates 429 Too Many Requests.
5. **Input Validation (3 tests):** Empty payloads, malformed emails, and payloads > 5 MB are rejected (400 / 413).
6. **Error Sanitization (3 tests):** 404/500 handlers do not leak internal stack traces or environment paths.
7. **MEGA Decommissioning Verification (4 tests):** Confirmed MEGA routes return 404; no `megajs` dependencies in `package.json` or credentials in `server/config.js`.
8. **Security Headers (2 tests):** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` verified.

---

## 2. Cloud Save Regression Test Suite (`npm run test:cloudsave`)

- **Total Tests:** **22**
- **Passed:** **20**
- **Failed:** **0**
- **Skipped:** **2** (Live Firebase unconfigured)
- **Status:** **`PASS_RUNTIME` (with documented external dependency skip)**

### 2.1 SHA-256 Checksum Parity Across Client & Server
Client and server use identical normalized JSON sorting before computing SHA-256 checksums. Parity was verified across 6 test vectors:
- Vector 1 (Reordered Keys): `5314055b === 5314055b` (PASS)
- Vector 2 (Hex format): `4db3b2d0` (PASS)
- Vector 3 (Unicode Tamil text): `ff9a95df` (PASS)
- Vector 4 (Null & numeric data): `57be00b9` (PASS)
- Vector 5 (Empty object): `5465b825 === 5465b825` (PASS)
- Vector 6 (Deterministic state): `a22e9376 === a22e9376` (PASS)

### 2.2 Cloud Save Access & Schema Enforcement
- **Authentication Requirement:** GET/POST to `/saves` without session token returns HTTP 401.
- **Cross-Account Isolation:** Attempting to download User A's save with User B's token returns 404/503.
- **Payload Validation:** Missing checksum returns HTTP 422; payloads exceeding 1 MB return HTTP 413.
- **Backward Compatibility:** Raw `GameSaveData` payloads are converted to Schema v4 wrapper.

### 2.3 Skipped Tests (Firebase Credentials Missing)
- Test 1: `Schema v4 save round-trip with real checksum` (Skipped: server returns 503 Service Unavailable because `GOOGLE_APPLICATION_CREDENTIALS` is not set).
- Test 2: `Stale revision conflict detection` (Skipped: requires live Firestore collection).

---

## 3. Multiplayer Socket.IO Status

- **Server Handshake:** Socket.IO endpoint verified active and reachable at `/socket.io/`.
- **Room Cap Enforcement:** Server config enforces a maximum of 5 concurrent players per region room.
- **Limitation:** In headless CI, full two-player interactive peer gameplay cannot be simulated without launching two distinct Unity game clients simultaneously. This aspect is marked **`BLOCKED`** for automated CI and requires 2-workstation LAN testing.
