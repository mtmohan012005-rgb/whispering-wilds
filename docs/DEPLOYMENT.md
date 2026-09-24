# PRODUCTION DEPLOYMENT GUIDE
**Project**: THE WHISPERING WILDS (*Kaattu Vazhi* / காட்டு வழி)  

---

## 1. Architectural Split
The production infrastructure is cleanly partitioned into a static frontend edge host and an autoscaled stateful Node.js WebSocket backend:
- **Frontend**: Netlify (Static Web Architecture, Edge CDN, Global HTTP/3 Caching)
- **Multiplayer Backend**: Render (Node.js Web Service, WebSocket / Socket.IO 20Hz state synchronization)

---

## 2. Deployment Sequence
Always follow this strict sequential order:
1. **Validate Code & Assets**:
   ```bash
   npm run validate
   npm run build-report
   ```
2. **Deploy Multiplayer Backend (Render)**:
   - Push to repository with `render.yaml`.
   - Ensure Render builds using `node server.js` and binds to `0.0.0.0`.
   - Verify health check: `GET https://<your-render-url>/health` returns HTTP 200.
3. **Configure Frontend Production URL**:
   - Provide the backend URL via `window.MULTIPLAYER_SERVER_URL` or environment variable.
4. **Deploy Frontend (Netlify)**:
   - Deploy using `netlify.toml`.
   - Verify Content Security Policy and security headers.
5. **Post-Deployment Smoke Verification**:
   - Launch title screen, start a new game, verify 3D world loads, test multiplayer connection toast (`CONNECTED TO LOBBY` or safe offline message).

---

## 3. Netlify Configuration (`netlify.toml`)
- **Publish Directory**: `.`
- **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Cache Strategy**:
  - `/assets/*`: `Cache-Control: public, max-age=31536000, immutable` (Versioned static assets)
  - `index.html`: `Cache-Control: no-cache, no-store, must-revalidate` (Fresh configuration entry point)

---

## 4. Render Backend Configuration (`render.yaml`)
- **Service Type**: `web`
- **Runtime**: `node`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `CORS_ORIGIN=https://whispering-wilds.netlify.app`
  - `MAX_PLAYERS_PER_ROOM=16`
