# Character Asset Audit — The Whispering Wilds

**Date:** 2026-10-19
**Auditor:** Junie (automated audit)
**Unity Version:** 6000.6.3f1
**Source:** `unity/Assets/_Project/Prefabs/Characters/` and `CharacterPrefabCatalog.cs`

---

## Summary

| Character | Prefab Path | Model Quality | Rig | Animator | Animation Clips | Status |
|-----------|-------------|---------------|-----|----------|-----------------|--------|
| Player | `PlayerCharacter.prefab` | ✅ Production | ✅ Rigged (23 bones) | ✅ Configured | ✅ 24 clips | **READY** |
| NPC_Murugan | `NPC_Murugan.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Velu | `NPC_Velu.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Selvam | `NPC_Selvam.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Artisan | `NPC_Artisan.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Farmer | `NPC_Farmer.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Fisher | `NPC_Fisher.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_ForestGuide | `NPC_ForestGuide.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_TeaWorker | `NPC_TeaWorker.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Meenakshi | `NPC_Meenakshi.prefab` | ⚠️ Placeholder | ❌ Unrigged | ❌ Missing | ❌ Missing | **BLOCKED** |
| NPC_Kannan | N/A | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | **MISSING** |

---

## Detailed Findings

### Player Character ✅ READY

- **Model:** `player.glb` — 13 meshes, 7 materials, 23 bones, 24 animation clips
- **Rig:** Humanoid rig with proper bone mapping
- **Animator:** Configured with idle, walk, run, jump, crouch, sprint animations
- **Collider:** CharacterController component present
- **Scripts:** PlayerMovement, PlayerInputHandler, PlayerInteractor all attached
- **Verdict:** Production-quality, ready for gameplay

### NPC Characters ⚠️ ALL PLACEHOLDER

**Source:** `CharacterPrefabCatalog.cs` explicitly marks all 9 legacy NPC GLBs as PLACEHOLDER.

**Common Issues:**
- Models are low-poly block primitives, not rigged human characters
- No SkinnedMeshRenderer components
- No humanoid skeleton or Avatar configuration
- No Animator Controllers or animation clips
- No facial animations or gesture support
- Materials are basic, not PBR

**Individual NPC Status:**

| NPC | Role | Region | GLB File | Size | Quality |
|-----|------|--------|----------|------|---------|
| Murugan | Story NPC | Chennai | `murugan.glb` | ~12 KB | Placeholder block |
| Velu | Villager | Chennai | `velu.glb` | ~10 KB | Placeholder block |
| Selvam | Guide | Pichavaram | `selvam.glb` | ~11 KB | Placeholder block |
| Artisan | Craftsman | Thanjavur | `artisan.glb` | ~9 KB | Placeholder block |
| Farmer | Agricultural | Thanjavur | `farmer.glb` | ~8 KB | Placeholder block |
| Fisher | Coastal | Pichavaram | `fisher.glb` | ~10 KB | Placeholder block |
| ForestGuide | Wildlife | Nilgiris | `forestguide.glb` | ~11 KB | Placeholder block |
| TeaWorker | Plantation | Nilgiris | `teaworker.glb` | ~9 KB | Placeholder block |
| Meenakshi | Temple | Thanjavur | `meenakshi.glb` | ~10 KB | Placeholder block |

### Kannan NPC ❌ MISSING

- **GLB file:** `kannan.glb` does not exist in the repository
- **Code reference:** `CharacterPrefabCatalog.cs` logs "Missing production asset: kannan.glb"
- **Impact:** Cannot spawn this NPC in any scene

---

## Requirements for Production NPCs

Each NPC needs:

1. **3D Model:** Rigged humanoid mesh with Tamil Nadu-appropriate clothing
2. **Skeleton:** Humanoid rig with proper bone mapping (Hips, Spine, Chest, Neck, Head, etc.)
3. **Avatar:** Unity Avatar configuration for animation retargeting
4. **Animator Controller:** State machine with idle, walk, talk, gesture states
5. **Animation Clips:** At minimum: idle, walk, talk
6. **Materials:** PBR materials with appropriate textures
7. **Collider:** Capsule or box collider for interaction
8. **Scripts:** NPCCharacter, NPCNavigationController, NPCScheduleManager

---

## Recommended Actions

### Immediate (High Priority)

1. **Acquire rigged NPC models** — Source or create 9 production-quality humanoid models with Tamil Nadu clothing
2. **Create Kannan model** — `kannan.glb` is completely missing
3. **Configure Avatars** — Import models with humanoid rig and configure Unity Avatars
4. **Create Animator Controllers** — At minimum: idle, walk, talk states

### Medium Priority

5. **Add gesture animations** — Pointing, waving, nodding for dialogue
6. **Add facial animations** — Mouth movement for lip-sync (if voice acting is added)
7. **Create region-specific clothing** — Different outfits per region (Chennai urban, Pichavaram coastal, etc.)

### Low Priority

8. **Add NPC-specific animations** — Fishing, farming, tea picking, etc.
9. **Create NPC LODs** — Level of detail for distant NPCs
10. **Add NPC audio** — Voice lines and ambient sounds

---

## Asset Sources

Potential sources for licensed NPC models:

- **Mixamo** (Adobe) — Free rigged characters with animations
- **Unity Asset Store** — Paid humanoid packs
- **Sketchfab** — Licensed 3D models
- **Custom creation** — Commission Tamil Nadu-specific character art

**Note:** All assets must have licenses compatible with the intended game distribution.

---

## Conclusion

**Player character is production-ready.** All 9 NPC characters are placeholder quality. Kannan NPC model is completely missing. The game is functional but NPCs will appear as low-poly blocks until production models are acquired and integrated.

**Verdict:** ⚠️ **PARTIAL** — Player ready, NPCs blocked by missing production assets.
