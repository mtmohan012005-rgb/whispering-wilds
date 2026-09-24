# MULTIPLAYER SERVER CONFIGURATION & SPECIFICATION
**Project**: THE WHISPERING WILDS (*Kaattu Vazhi* / காட்டு வழி)  
**Service**: Node.js WebSocket & Express Server (`server.js`)  

---

## 1. Hosting Architecture
The multiplayer service runs as a stateful Node.js Web Service on **Render** (or equivalent cloud platform). It synchronizes player transforms, animations, chat, and room state across up to 16 concurrent explorers per room.

---

## 2. Environment Variables
| Variable | Default Value | Description |
|:---------|:--------------|:------------|
| `PORT` | `3000` (Local) / `10000` (Render) | Server listening port |
| `HOST` | `0.0.0.0` | Binds to all network interfaces |
| `NODE_ENV` | `production` | Execution environment |
| `CORS_ORIGIN` | `https://whispering-wilds.netlify.app` | Restricts allowed origin domains |
| `MAX_PLAYERS_PER_ROOM` | `16` | Maximum concurrent players per room |
| `TICK_RATE` | `20` | Server tick rate (updates per second, 50ms) |
| `RATE_LIMIT_CHAT` | `5 / 10s` | Chat message burst prevention |
| `RATE_LIMIT_MOVE` | `35 / 1s` | Movement packet rate limit |

---

## 3. Health & Readiness Endpoints
### `GET /health`
Returns system status, active room counts, connected player totals, and uptime:
```json
{
  "status": "ok",
  "game": "The Whispering Wilds (Kaattu Vazhi)",
  "players": 4,
  "rooms": 2,
  "uptime": 1420,
  "timestamp": "2026-09-24T06:30:00.000Z"
}
```

### `GET /ready`
Returns operational readiness and memory telemetry:
```json
{
  "ready": true,
  "activeRooms": 2,
  "activePlayers": 4,
  "memory": {
    "heapUsedMB": 38,
    "rssMB": 82
  }
}
```

---

## 4. Operational Logging
- Log levels: `INFO`, `WARN`, `ERROR`.
- **Privacy Policy**: Never log player credentials, session tokens, exact IP addresses, or private gameplay snapshots. Verbose debug logging is disabled when `NODE_ENV=production`.
