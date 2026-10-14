# Backend Classification — The Whispering Wilds

## Overview

The backend consists of multiple authentication, persistence, and service paths. This document classifies each path by its current status and intended use.

## Authentication Paths

### 1. Firebase Authentication — **CANONICAL (Unity Game)**

- **Files:** `server/firebase/admin.js`, Unity client authentication scripts
- **Status:** Actively used by the Unity game for cloud saves and multiplayer authentication.
- **Data flow:** Unity client → Firebase SDK → Firebase Auth → Server verification via admin SDK.
- **Production requirement:** Requires Firebase project configuration (service account key, project ID).

### 2. Custom Email/Password Authentication — **CANONICAL (Legacy API)**

- **Files:** `server/auth/auth-service.js`, `server/auth/auth-controller.js`, `server/auth/auth-routes.js`
- **Status:** Actively maintained. Supports registration, login, password reset, email verification, and session management.
- **Database:** Uses `server/auth/db.js` (see Persistence section below).
- **Security:** bcrypt password hashing, JWT sessions, rate limiting, CSRF protection.

### 3. Email Verification — **ACTIVE**

- **Files:** `server/auth/email-verification-service.js`, `server/auth/email-service.js`, `server/auth/email-templates.js`
- **Status:** Implemented and integrated into the registration flow.
- **Policy:** Email verification is currently **optional** for login. Unverified accounts can log in but receive a verification prompt.

### 4. OTP Service — **DEPRECATED**

- **Files:** `server/auth/otp-service.js`
- **Status:** Not actively used in the main authentication flow. May have been used for legacy browser game or testing.
- **Recommendation:** Await removal after confirming no active callers.

## Persistence Paths

### 1. File-Backed JSON Database — **DEVELOPMENT/TEST ONLY**

- **Files:** `server/auth/db.js` (JSON file mode)
- **Path:** `server/data/auth_database.json`
- **Status:** Default mode when `DATABASE_URL` is not set. Used for local development and testing.
- **Production status:** **NOT suitable for production.** Data is stored in a local JSON file with no durability guarantees across deployments.
- **Behavior:** When PostgreSQL is unavailable, the system falls back to JSON mode. In production, this fallback should be prevented by requiring `DATABASE_URL`.

### 2. PostgreSQL Database — **CANONICAL (Production)**

- **Files:** `server/auth/db.js` (PostgreSQL mode)
- **Status:** Active when `DATABASE_URL` environment variable is set. Schema is bootstrapped automatically on first connection.
- **Tables:** `ww_users`, `ww_sessions`, `ww_password_reset_tokens`, `ww_email_verification_tokens`, `ww_cloud_saves`, `ww_profiles`.
- **Production requirement:** Set `DATABASE_URL` in production environment. The system uses PostgreSQL as the authoritative read/write store.

### 3. Firebase Cloud Saves — **CANONICAL (Unity Game)**

- **Files:** `server/firebase/persistence-service.js`, `server/routes/persistence-routes.js`
- **Status:** Used by the Unity game for cloud save persistence.
- **Data flow:** Unity client → Firebase Firestore → Server persistence service.
- **Production requirement:** Requires Firebase configuration and restrictive Firestore security rules.

## Session Management

### Session Service — **ACTIVE**

- **Files:** `server/auth/session-service.js`
- **Status:** Manages JWT-based sessions with expiry and rotation.
- **Security:** Sessions are stored in the database (PostgreSQL or JSON fallback). Expired sessions are cleaned up.

### Session Middleware — **ACTIVE**

- **Files:** `server/auth/auth-middleware.js`
- **Status:** Protects routes by verifying session tokens. Used by all protected endpoints.

## Supporting Services

### Rate Limiting — **ACTIVE**

- **Files:** `server/auth/rate-limit.js`
- **Status:** Applied to authentication endpoints to prevent brute-force attacks.

### Password Service — **ACTIVE**

- **Files:** `server/auth/password-service.js`
- **Status:** Handles password hashing (bcrypt) and validation.

### Validation — **ACTIVE**

- **Files:** `server/auth/validation.js`
- **Status:** Input validation for registration, login, and profile updates.

### Recovery Service — **ACTIVE**

- **Files:** `server/auth/recovery-service.js`
- **Status:** Password reset token generation and verification.

## Multiplayer

### Socket.IO Server — **ACTIVE**

- **Files:** `server/server.js` (Socket.IO integration)
- **Status:** Supports real-time multiplayer connections. Room-based with 5-player cap.
- **Production requirement:** Requires WebSocket-compatible hosting (Render, etc.).

## Summary Table

| Component | Status | Production Ready | Notes |
|-----------|--------|-----------------|-------|
| Firebase Auth | Canonical | ✓ Yes | Unity game primary auth |
| Custom Email/Password | Canonical | ✓ Yes (with PostgreSQL) | Legacy API, actively maintained |
| Email Verification | Active | ✓ Yes | Optional for login |
| OTP Service | Deprecated | — | No active callers |
| JSON Database | Dev/Test | ✗ No | Local development only |
| PostgreSQL | Canonical | ✓ Yes | Production authority |
| Firebase Cloud Saves | Canonical | ✓ Yes | Unity game saves |
| Session Management | Active | ✓ Yes | JWT-based |
| Rate Limiting | Active | ✓ Yes | On auth endpoints |
| Multiplayer (Socket.IO) | Active | ✓ Yes | 5-player room cap |

## Recommendations

1. **Enforce `DATABASE_URL` in production** — Prevent silent fallback to JSON mode.
2. **Document email verification policy** — Currently optional; decide if mandatory.
3. **Remove OTP service** — After confirming no active callers reference it.
4. **Restore Firestore security rules** — `firestore.rules` was removed during cleanup; restore restrictive rules if Firebase is used in production.
5. **Restore Render deployment config** — `render.yaml` was removed; restore if Render is the backend host.
