# WINDOWS BUILD AND RUNTIME REPORT

**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Step:** 32-35 Combined Validation  
**Date:** 2026-10-11  
**Branch:** `ai/unity-graphics-world-upgrade`  
**Commit:** 85b5ffe

## BUILD STATUS

**BUILD STATUS: BUILT — RUNTIME NOT VERIFIED**

### Existing Build

| Property | Value |
|----------|-------|
| Executable | `The Whispering Wilds.exe` (651.5 KB) |
| Data Folder | `The Whispering Wilds_Data/` |
| Location | Repository root |
| Build Date | Predates Steps 30-31 character changes |
| Architecture | Windows x64 |
| Unity Version | 6000.6.3f1 |

### Build Configuration

| Property | Value |
|----------|-------|
| Unity Version | 6000.6.3f1 |
| Render Pipeline | HDRP 17.7.0 |
| Target Platform | WindowsStandalone x64 |
| Scenes in Build | 12 (6 campaign + boot + state map + 4 benchmark) |

### Scenes in Build Settings

| # | Scene | Purpose | Required |
|---|-------|---------|----------|
| 1 | 00_Boot | Boot scene, managers | ✓ |
| 2 | 01_StateMap_TamilNadu | State map UI | ✓ |
| 3 | 02_Chennai_GeorgeTown | Campaign region 1 | ✓ |
| 4 | 03_Pichavaram_Wetlands | Campaign region 2 | ✓ |
| 5 | 04_Thanjavur_Delta | Campaign region 3 | ✓ |
| 6 | 05_Chettinad_Mansion | Campaign region 4 (gated) | ✓ |
| 7 | 06_Mamallapuram_Shore | Campaign region 5 (gated) | ✓ |
| 8 | 07_Nilgiris_Sanctuary | Campaign region 6 (gated, final) | ✓ |
| 9 | WW_Benchmark_Chennai | Performance benchmark | Optional |
| 10 | WW_Benchmark_Pichavaram | Performance benchmark | Optional |
| 11 | WW_Benchmark_Delta | Performance benchmark | Optional |
| 12 | WW_Benchmark_Nilgiris | Performance benchmark | Optional |

## RUNTIME VERIFICATION

**Status: NOT_RUNTIME_VERIFIED**

Unity editor is not available in this environment. The following runtime checks could not be executed:

| Check | Status | Reason |
|-------|--------|--------|
| Launch executable | NOT_RUNTIME_VERIFIED | No Unity editor to rebuild with current changes |
| Main menu display | NOT_RUNTIME_VERIFIED | Requires running build |
| New game initialization | NOT_RUNTIME_VERIFIED | Requires running build |
| Player visibility | NOT_RUNTIME_VERIFIED | Requires running build |
| Player movement | NOT_RUNTIME_VERIFIED | Requires running build |
| NPC visibility | NOT_RUNTIME_VERIFIED | Requires running build |
| NPC interaction | NOT_RUNTIME_VERIFIED | Requires running build |
| Dialogue system | NOT_RUNTIME_VERIFIED | Requires running build |
| Quest progression | NOT_RUNTIME_VERIFIED | Requires running build |
| Scene transitions | NOT_RUNTIME_VERIFIED | Requires running build |
| Save/load cycle | NOT_RUNTIME_VERIFIED | Requires running build |
| Graphics presets | NOT_RUNTIME_VERIFIED | Requires running build |
| English/Tamil localization | NOT_RUNTIME_VERIFIED | Requires running build |
| Clean exit | NOT_RUNTIME_VERIFIED | Requires running build |

## BUILD REQUIREMENTS

To build the Windows x64 standalone player:

1. **Unity 6000.6.3f1** installed with Windows Build Support
2. **HDRP 17.7.0** package (in manifest.json)
3. **Unity license** (personal or pro)
4. **Git LFS** for large assets

### Build Command (Unity Editor)

```
Unity -batchmode -nographics -projectPath unity/ -executeMethod BuildPipelineAutomation.BuildWindows -quit
```

### Build Command (CI/CD)

The GitHub Actions workflow (`.github/workflows/unity-ci.yml`) handles:
- Repository validation
- EditMode tests
- PlayMode tests
- Windows x64 build
- Artifact upload

**Required secret:** `UNITY_LICENSE` must be configured in repository settings.

## EXISTING BUILD LIMITATIONS

1. **Predates character changes:** The existing Windows build was created before Steps 30-31 added the character prefabs and NPC system. It does not include the latest character assets.
2. **New build required:** A fresh build is needed after importing the project in Unity 6 to include all character/NPC changes.
3. **NavMesh baking:** Non-Chennai NavMesh assets may need to be baked via EcologyNavMeshBaker.

## RECOMMENDED NEXT STEPS

1. Open project in Unity 6000.6.3f1.
2. Wait for asset import to complete.
3. Run `AssembleAllRegions` editor script if scenes need population.
4. Bake NavMesh for all regions.
5. Build Windows x64 standalone player.
6. Launch executable and verify gameplay.
7. Run RuntimeAutomatedSmokeTest with `-automatedSmokeTest` flag.
8. Capture screenshots and performance metrics.
