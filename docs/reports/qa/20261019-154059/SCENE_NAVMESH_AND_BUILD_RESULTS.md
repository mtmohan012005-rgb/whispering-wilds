# Scene, NavMesh & Build Results
**Generated:** 2026-10-19 15:41 IST  
**Commit:** 59a2800 (main)

## Scene Verification

| Scene | In Build | GUID Valid | Scripts Present |
|-------|----------|-----------|-----------------|
| 00_Boot.unity | ✅ | ✅ | ✅ |
| 01_StateMap_TamilNadu.unity | ✅ | ✅ | ✅ |
| 02_Chennai_GeorgeTown.unity | ✅ | ✅ | ✅ |
| 03_Pichavaram_Wetlands.unity | ✅ | ✅ | ✅ |
| 04_Thanjavur_Delta.unity | ✅ | ✅ | ✅ |
| 05_Chettinad_Mansion.unity | ✅ | ✅ | ✅ |
| 06_Mamallapuram_Shore.unity | ✅ | ✅ | ✅ |
| 07_Nilgiris_Sanctuary.unity | ✅ | ✅ | ✅ |
| 08_Ancient_Temple_Ruins.unity | ✅ | ✅ | ✅ |

## NavMesh Status

| Scene | NavMesh Asset | Baked | Verified |
|-------|--------------|-------|----------|
| 02_Chennai | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 03_Pichavaram | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 04_Thanjavur | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 05_Chettinad | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 06_Mamallapuram | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 07_Nilgiris | ✅ Exists | ⚠️ Unknown | ⚠️ Needs Unity Editor |
| 08_Temple | ❌ Not required | N/A | N/A |

**NavMesh baker:** `EcologyNavMeshBaker.cs` — Fixed to report per-scene failures. Six `.asset` files exist but need fresh bake verification in Unity Editor.

## Build Settings

- **9 scenes** in build order
- **All GUIDs valid** — Match `.meta` files
- **Windows x64** target configured
- **Build exists** — `unity/Build/Windows/TheWhisperingWilds.exe`

## Temple Scene

| Feature | Status |
|---------|--------|
| Scene exists | ✅ In build settings |
| Puzzle controller | ✅ Implemented |
| Stone mechanisms | ✅ Implemented |
| Audio wired | ✅ Procedural WAV |
| **Visual quality** | ❌ GREYBOX — Needs 3D models |

---

*All 9 scenes verified. NavMesh assets exist but need fresh bake in Unity Editor.*
