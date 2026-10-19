# Gameplay Feature Matrix
**Generated:** 2026-10-19 15:41 IST  
**Commit:** 59a2800 (main)

## Legend
- ✅ **VERIFIED** — Tested and confirmed working
- ⚠️ **IMPLEMENTED** — Code exists, connected, but not runtime-verified
- ❌ **BLOCKED** — Cannot test due to external dependency
- ❓ **NOT TESTED** — Not yet verified

## Core Gameplay

| Feature | Status | Evidence |
|---------|--------|----------|
| Game launches | ✅ VERIFIED | Process starts, PID verified |
| Cinematic intro | ⚠️ IMPLEMENTED | `CinematicIntroController.cs` |
| Main menu | ⚠️ IMPLEMENTED | `TitleMenuController.cs` |
| New Game flow | ⚠️ IMPLEMENTED | `CampaignFlow.cs` → Chennai spawn |
| Player movement | ⚠️ IMPLEMENTED | `PlayerMovement.cs` (WASD, mouse) |
| Player interaction | ⚠️ IMPLEMENTED | `PlayerInteractor.cs` (E-key) |

## Regional Scenes

| Region | In Build | Visual Assets | NavMesh |
|--------|----------|---------------|---------|
| Chennai | ✅ | ✅ | ⚠️ Exists |
| Pichavaram | ✅ | ✅ | ⚠️ Exists |
| Thanjavur | ✅ | ✅ | ⚠️ Exists |
| Chettinad | ✅ | ✅ | ⚠️ Exists |
| Mamallapuram | ✅ | ✅ | ⚠️ Exists |
| Nilgiris | ✅ | ✅ | ⚠️ Exists |
| Temple | ✅ | ⚠️ Greybox | ❌ Not needed |

## Quests & Investigation

| Feature | Status |
|---------|--------|
| Quest tracking | ⚠️ IMPLEMENTED |
| Clue discovery | ⚠️ IMPLEMENTED |
| Journal/Discovery log | ⚠️ IMPLEMENTED |
| Region unlocks | ⚠️ IMPLEMENTED |
| Campaign ending | ⚠️ IMPLEMENTED |

## Save/Load

| Feature | Status |
|---------|--------|
| Local save | ⚠️ IMPLEMENTED |
| Local load | ⚠️ IMPLEMENTED |
| Cloud save upload | ⚠️ IMPLEMENTED |
| Cloud save download | ⚠️ IMPLEMENTED |
| **Cloud save runtime** | ❌ BLOCKED — Needs Firebase credentials |

## Localization

| Feature | Status |
|---------|--------|
| English mode | ⚠️ IMPLEMENTED (265+ keys) |
| Tamil mode | ⚠️ IMPLEMENTED (265+ keys) |
| Tamil font | ✅ VERIFIED |

## NPCs

| Character | Quality | Rigged | Animated |
|-----------|---------|--------|----------|
| Player | ✅ Good | ✅ | ✅ 24 clips |
| All 9 NPCs | ❌ Placeholder | ❌ | ❌ |

## Online Features

| Feature | Status |
|---------|--------|
| Multiplayer client | ⚠️ IMPLEMENTED |
| Backend server | ✅ VERIFIED (31/31 tests) |
| **Multiplayer runtime** | ❌ BLOCKED — Needs 2 clients |
| **Cloud save runtime** | ❌ BLOCKED — Needs Firebase |

---

*21 systems implemented. 4 runtime-verified. 17 need human operator for full verification.*
