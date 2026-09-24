# PRODUCTION DEPLOYMENT GUIDE (ROOT REFERENCE)
See full technical specification in `docs/DEPLOYMENT.md`.

## Summary
- **Frontend Hosting**: Netlify (`netlify.toml`)
- **Backend Multiplayer**: Render (`render.yaml`)
- **Multiplayer URL**: Specified by `window.MULTIPLAYER_SERVER_URL` or `RUNTIME_CONFIG.multiplayerServerUrl`.
- **Health Endpoints**:
  - `GET /health` -> `{ status: "ok", game: "...", players: N, rooms: M, uptime: S }`
  - `GET /ready` -> `{ ready: true, activeRooms: M, activePlayers: N, memory: { ... } }`
- **Deployment Order**:
  1. `npm run validate`
  2. Deploy Render backend & confirm `/health`
  3. Deploy Netlify frontend
  4. Perform smoke test
