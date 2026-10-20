# Remaining Release Blockers & Production Roadmap
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Active Branch:** `fix/real-3d-characters-world-20261020`  

---

## 1. High-Priority Blockers for Production Acceptance

### 1.1 Authentic Tamil Nadu Audio & Foley Replacement
- **Current State:** 10 procedural sine tones generated via `GenerateAudioAssets.cs`.
- **Blocker:** Although functional for code testing, synthetic tones do not deliver the authentic acoustic immersion of Tamil Nadu.
- **Action Required:** Record or license authentic field recordings (Western Ghats avifauna, coastal Pichavaram water, temple bronze ghanta, Cauvery monsoon rain) and footstep foley (leather chappals on Thanjavur granite).
- **Classification:** `BLOCKED_EXTERNAL_ASSET`

### 1.2 Multi-Client Synchronized Multiplayer Testing
- **Current State:** Network controllers and Socket.IO client/server endpoints implemented.
- **Blocker:** End-to-end two-player synchronization has not been stress-tested across external network conditions.
- **Action Required:** Deploy headless server and run dual-client verification harness.
- **Classification:** `NOT_TESTED_MULTI_CLIENT`

### 1.3 Live Firebase Cloud Save Credentials
- **Current State:** Local save system is 100% verified. Live cloud tests were skipped.
- **Blocker:** Cloud save requires secure Google Cloud / Firebase service account credentials.
- **Action Required:** Provide production Firebase configuration securely via environment secrets.
- **Classification:** `BLOCKED_CREDENTIALS`

### 1.4 Unique Model DCC Remodeling Pass (15 Groups)
- **Current State:** 15 GLB model groups share identical binary hashes across different prop names (e.g., farm tools vs artisan tools).
- **Blocker:** While functional, identical models should be visually distinct in a finished production title.
- **Action Required:** Authored 3D remodeling pass in Blender to give each prop unique silhouette geometry.
- **Classification:** `ART_ASSET_DIFFERENTIATION`

---

## 2. Resolved Quality Gaps (This Sprint)
- [x] Player 2048x2048 PBR texture maps (`albedo`, `normal`, `roughness`, `ao`) generated and verified.
- [x] `CHARACTER_MANIFEST.json` updated with exact SHA-256 hashes and dimensions.
- [x] Nilgiri Tahr vs Goat binary collision resolved with authentic Nilgiri Tahr geometry.
- [x] Ancient Temple Ruins verified with zero visible greybox cubes.
- [x] `MasterRuntimeFeatureValidator.cs` rewritten for truthful instance/component validation.
- [x] `AssetReferenceAudit.cs` implemented and verified (0 missing scenes, 0 broken shaders).
- [x] Scene build registration reconciled (9 release story scenes, 4 benchmark scenes).
