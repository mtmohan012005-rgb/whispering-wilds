# Architecture — The Whispering Wilds

## Overview
The Whispering Wilds (காட்டு வழி • தடம்) is an open-world narrative exploration game set across Tamil Nadu. The project architecture comprises:

1. **Unity 6 HDRP Standalone PC Game** (authoritative client)
2. **Node.js Multiplayer & Cloud-Save Backend** (services, real-time networking, persistence)
3. **GitHub Pages Project Portal** (lightweight project landing page and release portal)

## 1. Unity 6 Standalone Game (Primary)

**Engine:** Unity 6000.6.3f1, HDRP 17.7.0, Windows x64

**Directory:** `unity/`

**Canonical Executable:** `unity/Build/Windows/TheWhisperingWilds.exe`

### Assembly Structure

| Assembly | Path | Purpose |
|----------|------|---------|
| `WhisperingWilds` | `unity/Assets/_Project/Scripts/` | Main game runtime (movement, dialogue, quests, ecology, save system) |
| `WhisperingWilds.Editor` | `unity/Assets/_Project/Scripts/Editor/` | Editor tools, scene generation, ecology NavMesh baking, build pipeline |
| `WhisperingWilds.Tests.Editor` | `unity/Assets/_Project/Tests/Editor/` | EditMode unit tests (NUnit, Unity Test Framework) |

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
| Quality | `GraphicsPerformanceManager`, `QualityPresetManager`, `MemoryManager` | HDRP quality profiles, hardware auto-detection, dynamic resolution, memory budgets |
| Cloud Save | `CloudSaveManager` | Firebase-backed cloud persistence (optional) |

### Regional Scenes

| Scene | Path | Status |
|-------|------|--------|
| Boot | `00_Boot.unity` | Entry point, title menu, cinematic intro |
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
- Built-in UnityEngine.AI (UnityEngine.AIModule)
- Unity.Cinemachine 3.1.2
- Unity.Timeline 6.6.0
- com.unity.cloud.gltfast 6.20.0
- com.unity.test-framework 1.4.5

## 2. Node.js Backend Server

**Entry point:** `server.js` → `server/server.js`

**Port:** Configurable via `server/config.js` (default: 3000)

**Dependencies:** Express, Socket.IO, Firebase Admin, PostgreSQL (`pg`), CORS

### API Endpoints

| Path | Purpose | Auth |
|------|---------|------|
| `/health` | Process liveness check | None |
| `/ready` | Full subsystem readiness probe (Firebase, PostgreSQL, rooms) | None |
| `/api/v1/health` | Versioned health with memory telemetry | None |
| `/api/auth/*` | Registration, login, session validation | Public / Session |
| `/api/profile/*` | Player profile CRUD | Session cookie / Bearer |
| `/api/saves/*` | Relational save persistence (PostgreSQL) | Session cookie / Bearer |
| `/api/v1/persistence/*` | Authoritative cloud saves & appearance tokens | Firebase ID token |

### Security Architecture

- CSRF protection on state-changing routes
- Rate limiting on authentication and registration endpoints
- Firebase ID token verification for authoritative cloud saves
- Save integrity checksums (FNV-1a / HMAC)
- Optimistic concurrency control (revision-based)
- 5-player co-op room cap enforced server-side
- Session rotation on authentication against session fixation
- Strict no-logging rule for secrets, tokens, and passwords

### Deployment

- **Landing Page:** GitHub Pages (`docs/landing/index.html`) via `.github/workflows/pages.yml`
- **Backend:** Node.js container / cloud service (Render / GCP)
- **Authoritative Persistence:** Firebase Firestore / Cloud Storage
- **Relational Storage:** PostgreSQL

## 3. Desktop Launchers

**Scripts:**
- `Launch-Game-PC.ps1` — Canonical native game launcher
- `Launch-Game-PC.bat` — Windows double-click wrapper invoking `Launch-Game-PC.ps1`
- `Launch-Game-Unity.ps1` — Core launcher targeting `unity/Build/Windows/TheWhisperingWilds.exe`

These launchers target the native standalone executable and never fall back to obsolete web wrappers. If the executable is missing, clear build guidance is presented.

## 4. Build & Verification Pipeline

### Unity Build

```powershell
# Production Windows x64 build
& "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" `
  -batchmode -quit -nographics `
  -projectPath "unity" `
  -executeMethod "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
```

### Automated Verification

```bash
npm run verify-game       # 15-point Unity project & scene verification
npm run verify-production # Production configuration & security audit
npm run verify-assets     # Authoritative 3D & audio asset manifest verification
npm run test:backend      # Backend security & persistence test suite (31 tests)
```

### Unity EditMode Tests

```powershell
# Run EditMode unit tests
& "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" `
```

## 5. Data Flow

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
