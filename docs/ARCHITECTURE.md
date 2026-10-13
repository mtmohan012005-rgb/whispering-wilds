# Architecture — The Whispering Wilds

## Overview

The Whispering Wilds (காட்டு வழி • தடம்) is an open-world narrative exploration game set across Tamil Nadu. The repository contains **three implementation layers**:

1. **Unity 6 standalone PC game** (primary release target)
2. **Browser/Three.js web game** (legacy parallel implementation)
3. **Node.js multiplayer & cloud-save backend** (shared by both)

## 1. Unity 6 Standalone Game (Primary)

**Engine:** Unity 6000.6.3f1, HDRP 17.7.0, Windows x64

**Directory:** `unity/`

**Executable:** `unity/Build/Windows/TheWhisperingWilds.exe` (192 MB)

### Assembly Structure

| Assembly | Path | Purpose |
|----------|------|---------|
| `WhisperingWilds` | `unity/Assets/_Project/Scripts/` | Main game code (159 scripts) |
| `WhisperingWilds.Editor` | `unity/Assets/_Project/Scripts/Editor/` | Editor tools, build pipeline, QA |
| `WhisperingWilds.Tests.Editor` | `unity/Assets/_Project/Tests/Editor/` | EditMode unit tests |

### Key Systems

| System | Scripts | Description |
|--------|---------|-------------|
| Campaign | `CampaignFlow`, `QuestManager`, `QuestEndingBridge` | Quest progression, region unlocks, story ending |
| Save/Load | `SaveSystem`, `SaveManager`, `SaveMigrator` | Local JSON persistence with schema migration |
| Localization | `LocalizationManager`, `LocalizedFontProvider` | English/Tamil bilingual UI |
| NPCs | `NPCCharacter`, `NPCStateMachine`, `NPCNavigationController`, `NPCScheduleManager` | NPC AI, schedules, navigation |
| Player | `PlayerMovement`, `PlayerInputHandler`, `PlayerInteractor` | Movement, camera, interaction |
| Investigation | `InvestigationManager`, `ClueData` | Clue discovery, deduction system |
| Economy | `InventoryManager`, `VendorInteraction`, `NPCWallet` | Trading, currency, items |
| World | `RegionalSceneManager`, `WeatherSystem`, `WorldSimulationManager` | Scene transitions, weather, day/night |
| Quality | `GraphicsPerformanceManager`, `QualityPresetManager`, `AdaptiveQualityManager` | HDRP quality, dynamic resolution |
| Cloud Save | `CloudSaveManager` | Firebase-backed cloud persistence (optional) |

### Regional Scenes

| Scene | Path | Status |
|-------|------|--------|
| Boot | `00_Boot.unity` | Entry point, title menu |
| State Map | `01_StateMap_TamilNadu.unity` | Regional overview |
| Chennai | `02_Chennai_GeorgeTown.unity` | Opening region |
| Pichavaram | `03_Pichavaram_Wetlands.unity` | Mangrove wetlands |
| Thanjavur | `04_Thanjavur_Delta.unity` | Cauvery delta |
| Chettinad | `05_Chettinad_Mansion.unity` | Heritage mansions |
| Mamallapuram | `06_Mamallapuram_Shore.unity` | Coastal temples |
| Nilgiris | `07_Nilgiris_Sanctuary.unity` | Western Ghats (final region) |

All 6 gameplay regions have baked NavMeshData assets.

### Dependencies

- Unity.InputSystem 1.20.0
- Unity.RenderPipelines.HighDefinition 17.7.0
- Unity.TextMeshPro
- Unity.AI.Navigation (built-in module)
- Unity.Cinemachine 3.1.2
- Unity.Timeline 6.6.0
- com.unity.cloud.gltfast 6.20.0

## 2. Browser/Three.js Web Game (Legacy)

**Directory:** Root level (`js/`, `css/`, `index.html`, `assets/`)

**Scripts:** 519 JavaScript files in `js/`

**Entry point:** `index.html`

This is a complete parallel implementation of the game using Three.js, Canvas, and Web Audio. It shares the same backend server for multiplayer and cloud saves but runs independently in the browser.

**Status:** Maintained in parallel. Not the primary release target per README.

## 3. Node.js Backend Server

**Entry point:** `server.js` → `server/server.js`

**Port:** Configurable via `server/config.js` (default: 3000)

**Dependencies:** Express, Socket.IO, Firebase Admin, PostgreSQL (optional), CORS

### API Endpoints

| Path | Purpose | Auth |
|------|---------|------|
| `/health` | Liveness check | None |
| `/ready` | Readiness probe (Firebase, rooms) | None |
| `/api/v1/health` | Versioned health with memory stats | None |
| `/api/auth/*` | Registration, login, password reset | Public |
| `/api/profile/*` | Player profile CRUD | JWT required |
| `/api/saves/*` | Local save persistence | JWT required |
| `/api/v1/persistence/*` | Firebase-backed cloud saves | Firebase ID token |

### Security

- CSRF protection on state-changing routes
- Rate limiting on auth endpoints
- Firebase ID token verification for cloud saves
- Save integrity checksums (HMAC)
- Optimistic concurrency control (revision-based)
- 5-player room cap enforced server-side

### Deployment

- **Frontend:** Netlify (`netlify.toml`)
- **Backend:** Render (`render.yaml`)
- **Firebase:** Firestore for cloud persistence

## 4. Desktop Launcher

**Scripts:** `Launch-Game-PC.ps1`, `Launch-Game-Unity.ps1`, `Launch-Legacy-Web-Game.ps1`

These PowerShell scripts launch the appropriate game version:
- `Launch-Game-PC.ps1` — Unity standalone executable
- `Launch-Game-Unity.ps1` — Unity Editor play mode
- `Launch-Legacy-Web-Game.ps1` — Browser game via localhost server

## 5. Build & Test

### Unity Build

```powershell
# Production Windows x64 build
& "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" ^
  -batchMode -quit -nographics ^
  -projectRoot "unity" ^
  -executeMethod "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
```

### Web Game Verification

```bash
npm run verify-game      # 15-point production verification
npm run verify-production # Production readiness checks
npm run verify-assets     # Asset manifest validation
npm run test:backend      # Backend security tests (31 tests)
```

### Unity Tests

EditMode tests in `unity/Assets/_Project/Tests/Editor/` require Unity Editor Test Runner. Batch mode test discovery is limited by licensing validation in headless mode.

## 6. Data Flow

```
Player → Unity Game → SaveSystem (local JSON)
                        ↓
                  CloudSaveManager → /api/v1/persistence → Firebase Firestore
                        ↓
                  Socket.IO → server/room-manager → Multiplayer peers
```

## 7. Key Design Decisions

- **5 permanent appearance changes** enforced across all systems (runtime, HUD, save)
- **Tamil font** via Noto Sans Tamil (SIL OFL 1.1) in `Resources/Fonts/TamilFont.ttf`
- **Codex feature removed** — no Codex button, menu, or gameplay integration
- **NavMesh** baked per-scene using built-in Unity.AI module (no external package needed)
- **Cloud saves are optional** — game functions fully offline with local persistence
