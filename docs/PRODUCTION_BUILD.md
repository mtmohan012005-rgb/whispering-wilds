# PRODUCTION BUILD & RELEASE PIPELINE
**Project**: THE WHISPERING WILDS (*Kaattu Vazhi* / காட்டு வழி)  
**Target**: PC Exclusive (Desktop Browser / Electron / Standalone WebView)  

---

## 1. Overview
This pipeline guarantees that all game assets, schemas, environment configurations, and network layers are strictly validated prior to production deployment.

## 2. Directory Structure
```
scripts/
├── validate-assets.js       # Audits binary & raster assets (.glb, .webp, .ogg, etc.)
├── validate-data.js         # Cross-references quests, NPCs, items, and regions
├── validate-links.js        # Validates script/link dependencies in index.html
├── validate-production.js   # Detects debug leftovers and unauthorized URLs
└── build-report.js          # Aggregates results into BUILD_REPORT.json

config/
├── development.json         # Local dev environment profile
├── production.json          # Production Netlify/Render environment profile
├── graphics-defaults.json   # Quality presets (LOW, MEDIUM, HIGH, ULTRA)
└── three-version.json       # Three.js r128 compatibility lock
```

## 3. Running Validation Scripts
```bash
# Run all data, asset, link, and code safety audits
npm run validate

# Generate full build report
npm run build-report

# Check production deployment readiness
npm run production-check
```

## 4. Build Environment Configuration
The frontend automatically selects the environment using `js/config/runtime-config.js`:
- In **development**, debug logging and local multiplayer (`http://localhost:3000`) are active.
- In **production**, telemetry and debug logs are strictly disabled, and the client binds to the Render backend service via `window.MULTIPLAYER_SERVER_URL` or `RUNTIME_CONFIG.multiplayerServerUrl`.

## 5. Artifacts Produced
- `BUILD_REPORT.json`: Complete build summary and readiness verdict.
- `ASSET_AUDIT_REPORT.json`: Physical vs referenced asset catalog.
- `DATA_AUDIT_REPORT.json`: Cross-reference and entity uniqueness audit.
- `LINK_AUDIT_REPORT.json`: Static HTML dependency resolution audit.
- `PRODUCTION_SAFETY_REPORT.json`: Code safety and URL sanitization audit.
