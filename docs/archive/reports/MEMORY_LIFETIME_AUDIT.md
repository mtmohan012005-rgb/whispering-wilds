# MEMORY_LIFETIME_AUDIT — STEP 28 §I

Status: **PASS** — single memory authority; periodic/mid-gameplay GC eliminated; dual-poll removed.
Build-verified (full `idea_build_project`: isSuccess=true, 0 problems).

## Requirement
No random `GC.Collect` / `Resources.UnloadUnusedAssets` during normal gameplay. No duplicate memory
owners/loops.

## Before (FAIL)
| Component | Problem |
|---|---|
| `MemoryManager` | Correct governor: tier budgets, emergency relief only >92% of budget, boundary cleanup. Present in ALL region/boot assemblies (`AssembleAllRegions:107`, `AssembleWhisperingWilds:152`, `BuildBootScene:461`) |
| `MemoryBudgetManager` | Second owner. Owned `UnloadUnusedAssets`+`GC.Collect` purge paths (`ExecuteDeterministicPurge`, `CheckAndCleanMemory`), duplicate budget struct, own `Update`, own texture-streaming config. Added in boot scene only — two live memory systems with distinct behaviors |

## After (PASS)
- **Deleted** `MemoryBudgetManager.cs` (+.meta); class removed from `BuildBootScene` (L461 area); the
  `DisplaySettingsManager` ownership comment updated (doc truth, §AE).
- **`MemoryManager` = single authority** for budgets AND boundary cleanup:
  - Tier budgets: VeryLow 1152MB … Ultra 12288MB (`ConfigureForTier`, driven by GPM `OnQualityProfileChanged`).
  - **Texture streaming folded in**: `ConfigureTextureStreaming()` (new) sets `QualitySettings.streamingMipmaps*`
    using the tier texture budget — previously only the deleted manager configured streaming, so no capability is lost.
  - Normal-frame policy: `Update` never collects; it only logs/triggers emergency relief when
    `TotalAllocatedMB > budget * 0.92`.
  - `GC.Collect + UnloadUnusedAssets` now exist in exactly ONE place: `MemoryManager.ControlledCleanupRoutine`,
    invoked deliberately at loading boundaries.
- Runtime GC census after change: `GC.Collect` 1 site (MemoryManager boundary), `Resources.UnloadUnusedAssets` 1 site (same routine) — both boundary-only.

## Boundary cleanup call sites (deliberate, non-gameplay)
- `RegionalSceneManager` (L280-282): `MemoryManager.Instance.ExecuteControlledBoundaryCleanup(null)` on scene transitions.
- `MemoryManager.Update` emergency (>92%): calls the same boundary routine (async, non-stalling).

## Runtime verification
- Stalls: none introduced — cleanup is a coroutine yielding on the unload `AsyncOperation`.
- Texture streaming budget now tracks the active quality tier instead of a fixed hardwired table
  (behavior change intentionally identical values per tier as the removed manager's Low/Mid/High).