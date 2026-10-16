# Test Results — The Whispering Wilds

**Date:** 2026-10-16  
**Commit:** 2bc3a68

## Automated Test Results

| Test Suite | Command | Result | Details |
|------------|---------|--------|---------|
| verify-game | `npm run verify-game` | ✅ PASS | 15/15 checks passed |
| test:backend | `npm run test:backend` | ✅ PASS | 31/31 security tests passed |
| verify-production | `npm run verify-production` | ✅ PASS | All production checks passed |
| verify-runtime | `node scripts/verify-runtime.js` | ✅ PASS | 7/7 checks passed |
| verify-compatibility | `node scripts/verify-compatibility.js` | ✅ PASS | 20/20 passed, 1 skipped |
| verify-assets | `npm run verify-assets` | ✅ PASS | All asset checks passed |
| C# Compilation | Unity Tundra build | ✅ PASS | 0 errors, 25.9s |
| Windows Build | BuildPipelineAutomation | ✅ PASS | 140 MB, LZ4HC, 0 errors |
| Standalone Smoke Test | Launch executable | ✅ PASS | Game launches, intro plays, menu visible, 60 FPS, 0 errors |

## Unity Test Suites

| Suite | Tests | Compiled | Executed | Passed | Failed | Blocked |
|-------|-------|----------|----------|--------|--------|---------|
| EditMode | 78 | ✅ Yes | ❌ No | — | — | Licensing Code 404 |
| PlayMode | 34 | ✅ Yes | ❌ No | — | — | Licensing Code 404 |

**Blocker:** Unity batchmode cannot load Editor asmdef (licensing validation Code 404). Tests require interactive Unity Editor Test Runner.

## Backend Health Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| /health | ✅ PASS | Returns ok, player/room counts |
| /api/v1/health | ✅ PASS | Returns version, uptime, memory |
| /ready | ⚠️ PARTIAL | Auth DB ok, Firebase depends on credentials |

## Runtime Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Game launches | ✅ PASS | Process starts, no crash |
| Intro plays | ✅ PASS | Player.log: `PlayIntroOnStartup=True` |
| Intro skip | ✅ PASS | Player.log: `Intro completed, showing main menu` |
| Menu visible | ✅ PASS | Player.log: `GameManager state: MainMenu` |
| Tamil font loads | ✅ PASS | Player.log: `LocalizedFontProvider loaded from Resources/Fonts/TamilFont` |
| Localization loads | ✅ PASS | Player.log: `LocalizationManager loaded 265 keys` |
| Graphics tier | ✅ PASS | Player.log: `GraphicsPerformanceManager applied High tier` |
| No errors | ✅ PASS | Player.log: 0 errors |
| FPS | ✅ PASS | 58.5-60 FPS after initial shader compilation |

## Not Tested (Requires Human Operator)

| Test | Reason |
|------|--------|
| NPC dialogue interaction | Requires mouse/keyboard input in standalone |
| Clue discovery | Requires player movement and interaction |
| Quest progression | Requires completing NPC dialogue and clue interactions |
| Save/load cycle | Requires in-game save and process restart |
| Region transitions | Requires completing quest prerequisites |
| Full campaign playthrough | Requires 6-region progression through all clues |
| Vendor trading | Requires approaching vendor NPC and opening UI |
| Settings changes | Requires opening settings panel and changing values |
| Login with backend | Requires running backend server |
| Multiplayer | Requires Socket.IO client implementation |

## Test Coverage Summary

| Category | Covered | Not Covered |
|----------|---------|-------------|
| Startup and menu | ✅ | — |
| Build and packaging | ✅ | — |
| Backend security | ✅ | — |
| Asset integrity | ✅ | — |
| Project configuration | ✅ | — |
| Player controls | ⚠️ Code audit only | Runtime not verified |
| NPC interaction | ⚠️ Code audit only | Runtime not verified |
| Campaign progression | ⚠️ Code audit only | Runtime not verified |
| Save/load | ⚠️ Code audit only | Runtime not verified |
| Multiplayer | ❌ Missing client | Cannot test |
| Cloud saves | ⚠️ Not configured | Cannot test |
| Firebase | ⚠️ No credentials | Cannot test |
