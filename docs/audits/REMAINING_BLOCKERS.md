# Remaining Blockers — The Whispering Wilds

**Date:** 2026-10-18  
**Branch:** `scene-regen-review`  
**Commit:** `b2e8658`  

---

## 🔴 CRITICAL BLOCKERS

### 1. NPC Characters Are Unrigged Placeholders

**Impact:** NPCs are visible but don't animate properly. Visual quality is significantly reduced.

**Evidence:**
- Smoke test: `NPC_Murugan: UNRIGGED, NPC_Velu: UNRIGGED`
- `CharacterPrefabCatalog.cs` marks all legacy GLBs as PLACEHOLDER

**Required Action:**
- Replace placeholder NPC GLBs with properly rigged and animated models
- Ensure Tamil Nadu-appropriate clothing and roles
- Add animation clips for walk, talk, idle, and interaction states

**Estimated Effort:** HIGH — requires 3D artist work or asset purchase

---

### 2. Game Is Largely Silent

**Impact:** No sound effects, music, or ambient audio during gameplay.

**Evidence:**
- 149 unused physical assets (audio files not referenced in source code)
- Authoritative audit shows audio files exist but are not referenced

**Required Action:**
- Reference audio files in source code or embed them in Unity scenes
- Ensure audio is properly imported and configured in Unity Audio Mixer

**Estimated Effort:** MEDIUM — requires Unity Editor access

---

### 3. Firebase Credentials Missing

**Impact:** Cloud saves are local-only; no cloud synchronization.

**Evidence:**
- Player.log: "Cloud sync unavailable (no backend endpoint / no signed-in Firebase user)"
- `CloudSaveManager.cs` gracefully falls back to local-only when unconfigured

**Required Action:**
- Create Firebase project and obtain service account JSON
- Configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` environment variables
- Test cloud save upload and download

**Estimated Effort:** LOW — requires user action (Firebase account setup)

---

### 4. Full Campaign Not Runtime-Verified

**Impact:** Cannot confirm all 6 regions, quest progression, and ending work end-to-end.

**Evidence:**
- Only Chennai → Pichavaram transition verified by automated tests
- AI agent cannot operate mouse/keyboard in standalone build

**Required Action:**
- Human operator must play through complete campaign:
  - Chennai → Pichavaram → Thanjavur → Chettinad → Mamallapuram → Nilgiris
  - Complete all quests and verify ending sequence
  - Test save/load at each region

**Estimated Effort:** MEDIUM — requires 1-2 hours of human playtime

---

## 🟡 HIGH BLOCKERS

### 5. Tamil Font Not Bundled

**Impact:** Release risk — Nirmala UI OS font is not redistributed in builds.

**Evidence:**
- Player.log: "Using OS font 'Nirmala UI'. Not redistributed in builds; add an OFL Tamil font under Assets/_Project/Fonts before release."

**Required Action:**
- Download an OFL (Open Font License) Tamil font (e.g., Noto Sans Tamil)
- Place it in `Assets/_Project/Fonts/`
- Update `LocalizedFontProvider.cs` to use the bundled font

**Estimated Effort:** LOW — requires Unity Editor access

---

### 6. Unity Editor Tests Blocked

**Impact:** 112 Unity tests compile but cannot execute.

**Evidence:**
- Licensing Code 404 prevents batchmode execution
- Tests require interactive Unity Editor Test Runner

**Required Action:**
- Activate Unity license through Unity Hub
- Open project in Unity Editor and run Test Runner

**Estimated Effort:** LOW — requires user action (Unity license activation)

---

### 7. Multiplayer Not Runtime-Tested

**Impact:** Cannot verify two-player functionality works.

**Evidence:**
- `SocketIOClient.cs` (535 lines) and `RealtimeManager.cs` (237 lines) are implemented
- AI agent cannot operate two simultaneous game windows

**Required Action:**
- Run two instances of the standalone build
- Connect both to the backend server
- Verify room join, player movement sync, and chat

**Estimated Effort:** MEDIUM — requires two client instances

---

## 🟢 LOW BLOCKERS

### 8. Missing Localization Keys

**Impact:** Cosmetic display issues for resolution and FPS cap values.

**Evidence:**
- Player.log: "Missing localization key: '30'"
- Player.log: "Missing localization key: '1366 x 768'"

**Required Action:**
- Add keys '30' and '1366 x 768' to `LocalizationDatabase`

**Estimated Effort:** TRIVIAL

---

### 9. GitHub Actions Not Pushed

**Impact:** CI workflows exist locally but are not deployed.

**Evidence:**
- PAT (Personal Access Token) lacks `workflow` scope

**Required Action:**
- Update GitHub PAT with workflow scope
- Push `.github/workflows/` to remote

**Estimated Effort:** LOW — requires user action

---

### 10. "Missing Script" Warnings

**Impact:** 3 harmless serialization artifacts on MANAGERS GameObject.

**Evidence:**
- Player.log: "The referenced script on this Behaviour (Game Object '--- MANAGERS ---') is missing!"

**Required Action:**
- Clean scene serialization in Unity Editor
- Remove orphaned MonoBehaviour references

**Estimated Effort:** LOW — requires Unity Editor access

---

### 11. No Streaming Cells for Chennai

**Impact:** Content gap — world streaming is inactive for Chennai region.

**Evidence:**
- Player.log: "Region 'chennai' authored no streaming cells. Streaming evaluation is inactive for this region; this is a content gap, not a failure."

**Required Action:**
- Author streaming cells for Chennai region in Unity Editor

**Estimated Effort:** MEDIUM — requires Unity Editor access

---

## BLOCKER SUMMARY

| Priority | Count | Blockers |
|----------|-------|----------|
| 🔴 Critical | 4 | NPC rigging, audio, Firebase, campaign verification |
| 🟡 High | 3 | Tamil font, Unity license, multiplayer testing |
| 🟢 Low | 4 | Localization keys, GitHub Actions, script warnings, streaming cells |

## BLOCKERS REQUIRING USER ACTION

| Blocker | What the User Must Do |
|---------|----------------------|
| Firebase credentials | Create Firebase project and provide service account JSON |
| Unity license | Activate Unity license through Unity Hub |
| Full campaign test | Play through all 6 regions and verify ending |
| Multiplayer test | Run two client instances |
| GitHub Actions | Update PAT with workflow scope |

## BLOCKERS REQUIRING ASSET WORK

| Blocker | What Needs to Be Done |
|---------|----------------------|
| NPC rigging | Replace placeholder GLBs with rigged, animated models |
| Audio | Reference audio files in source or embed in Unity scenes |
| Tamil font | Download and bundle OFL Tamil font |

## BLOCKERS REQUIRING UNITY EDITOR

| Blocker | What Needs to Be Done |
|---------|----------------------|
| Audio configuration | Import and configure audio in Unity |
| Tamil font | Bundle font in Assets/_Project/Fonts |
| Script warnings | Clean scene serialization |
| Streaming cells | Author streaming cells for Chennai |
| Unity tests | Run Test Runner with valid license |

---

*Report generated by Junie (AI Agent) on 2026-10-18*
