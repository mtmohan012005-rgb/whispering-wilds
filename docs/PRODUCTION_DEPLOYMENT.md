# Production Deployment & Infrastructure Guide — The Whispering Wilds

This document defines the production deployment topology, environment configuration, database authorities, health probes, and release procedures for **The Whispering Wilds (காட்டு வழி • தடம்)**.

---

## 1. Production Topology

The production architecture consists of three distinct layers:

```
┌────────────────────────────────┐
│   GitHub Pages Landing Portal  │  https://mtmohan012005-rgb.github.io/whispering-wilds
│   (Static HTML5 / CSS / Assets)│  Source: docs/landing/index.html
└────────────────────────────────┘
                │
                ▼
┌────────────────────────────────┐       HTTPS / WSS       ┌──────────────────────────────┐
│  Unity 6 Windows Standalone PC │ ◄─────────────────────► │  Node.js Game & Auth Server  │
│  TheWhisperingWilds.exe        │                         │  Express + Socket.IO         │
└────────────────────────────────┘                         └──────────────────────────────┘
                                                                 │                 │
                                              Firebase Auth &    │                 │ PostgreSQL
                                              Firestore Saves    │                 │ ww_* tables
                                                                 ▼                 ▼
                                                   ┌─────────────────┐ ┌─────────────────┐
                                                   │ Google Firebase │ │   PostgreSQL    │
                                                   │ Firestore Cloud │ │   Relational DB │
                                                   └─────────────────┘ └─────────────────┘
```

---

## 2. Persistence Authorities & Rules

### Authoritative Cloud Saves (Firebase Firestore)
- **Mount Point:** `/api/v1/persistence/*`
- **Identity Rule:** Derived strictly from verified Firebase Auth ID tokens passed in the `Authorization: Bearer <token>` header. Client-supplied IDs are never trusted.
- **Integrity:** Every save payload is validated against FNV-1a checksums and enforced against schema limits.
- **Appearance Change Ceiling:** A strict, non-negotiable lifetime limit of 5 permanent appearance changes is tracked server-side in Firestore (`/customization`). Requests exceeding 5 are rejected with HTTP 403 `CUSTOMIZATION_LIMIT_REACHED`.
- **Fail-Closed Rule:** If Firebase credentials are missing or unconfigured, the endpoint immediately returns HTTP 503 `FIREBASE_NOT_CONFIGURED`. Writes are never silently discarded or redirected to ephemeral stores.

### Relational Account Storage (PostgreSQL)
- **Tables:** `ww_users`, `ww_sessions`, `ww_cloud_saves`, `ww_profiles`
- **Production Requirement:** In production (`NODE_ENV=production`), `DATABASE_URL` is mandatory.
- **Fail-Closed Rule:** If `DATABASE_URL` is absent or the connection fails, `AuthDB.isReady()` returns `false`, causing `/ready` to return 503 and blocking state writes.
- **File-Backed Storage:** `server/data/auth_database.json` is strictly restricted to local development and unit tests. It is never used as a production persistence authority.

---

## 3. Environment Variables

Configure these environment variables in your production host (e.g. Render, Railway, AWS ECS, GCP Cloud Run):

| Variable | Description | Example / Required Format |
|---|---|---|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | HTTP/WebSocket listening port | `3000` or `10000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host.region.provider.com/dbname?sslmode=require` |
| `FIREBASE_PROJECT_ID` | GCP / Firebase project identifier | `whispering-wilds-prod` |
| `FIREBASE_DATABASE_URL` | Firebase Realtime / Firestore URL | `https://whispering-wilds-prod.firebaseio.com` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account JSON secret | `{"type":"service_account",...}` |
| `CORS_ORIGIN` | Allowed web origins | `https://mtmohan012005-rgb.github.io` |
| `APP_PUBLIC_URL` | Canonical portal URL | `https://mtmohan012005-rgb.github.io/whispering-wilds` |
| `REQUIRE_EMAIL_VERIFICATION`| Require verified email for login | `false` (default: optional for casual exploration) |

> [!CAUTION]
> Never commit service account keys, passwords, or production secrets to Git. Configure them exclusively through secure cloud environment secret managers.

---

## 4. Monitoring & Readiness Probes

### Liveness Probe (`GET /health`)
Verifies that the Node.js process is active and serving HTTP requests:
```json
{
  "status": "ok",
  "game": "The Whispering Wilds (Kaattu Vazhi)",
  "players": 0,
  "rooms": 0,
  "uptime": 1240,
  "timestamp": "2026-10-14T06:30:00.000Z"
}
```

### Readiness Probe (`GET /ready`)
Performs a deep dependency audit. Returns **HTTP 200** when ready to process player traffic, or **HTTP 503** if any backing service is degraded:
```json
{
  "ready": true,
  "service": "whispering-wilds-multiplayer",
  "checks": {
    "rooms": { "ok": true, "activeRooms": 0 },
    "players": { "ok": true, "activePlayers": 0 },
    "firebase": { "ok": true, "projectId": "whispering-wilds-prod" },
    "authDb": { "ok": true, "mode": "postgresql" },
    "memory": { "ok": true, "heapUsedMB": 42, "rssMB": 78 }
  },
  "timestamp": "2026-10-14T06:30:00.000Z"
}
```

---

## 5. Web Portal & Landing Page Deployment

The project portal is hosted on GitHub Pages from `docs/landing/index.html`.
- **Automated Workflow:** `.github/workflows/pages.yml` triggers on changes to `docs/landing/**`.
- **Artifact:** Uploads and publishes the self-contained static page.
- **Content:** Introduces the Unity 6 PC game, details system requirements, links to the repository and release downloads when available.

---

## 6. Client Release & Packaging

1. Build the production Windows x64 player in Unity:
   ```powershell
   & "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" `
     -batchmode -quit -nographics -projectPath "unity" `
     -executeMethod "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
   ```
2. Verify output executable: `unity/Build/Windows/TheWhisperingWilds.exe`.
3. Package the directory `unity/Build/Windows/` into a standard zip archive:
   `TheWhisperingWilds_v1.0.0_Windows_x64.zip`.
4. Create a tagged release on GitHub:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 — The Whispering Wilds Windows Standalone"
   git push origin v1.0.0
   ```
5. Attach the zip archive to the GitHub Release. Only publish release download links on the landing page after the build has been successfully uploaded.
