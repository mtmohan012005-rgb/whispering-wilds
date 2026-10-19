# Final Blockers & Next Actions
**Generated:** 2026-10-19 15:41 IST  
**Commit:** 59a2800 (main)

## Remaining Blockers

| # | Blocker | Impact | What's Needed |
|---|---------|--------|---------------|
| 1 | **CI Workflows** | No automated CI on GitHub | Add `workflow` scope to GitHub PAT, then push |
| 2 | **NPC Quality** | All 9 NPCs are placeholder blocks | Purchase/create rigged 3D humanoid models |
| 3 | **Firebase** | Cloud saves need credentials | Create Firebase project, set credentials |
| 4 | **NavMesh** | NPC navigation unverified | Open Unity → Bake NavMesh for all regions |
| 5 | **Temple 3D** | Temple scene is greybox | Place temple GLB models in Unity Editor |
| 6 | **Campaign Test** | Full playthrough unverified | Play through all 6 regions manually |

## Blocker Details

### 1. CI Workflows
- **Files:** `.github/workflows/backend-ci.yml`, `unity-validation.yml`
- **Status:** Exist locally but push rejected by GitHub
- **Fix:** GitHub Settings → Personal access tokens → check `workflow` scope → save → `git push origin main`

### 2. NPC Quality
- **Files:** 9 NPC prefabs in `unity/Assets/_Project/Prefabs/Characters/`
- **Status:** All placeholder quality (low-poly blocks)
- **Fix:** Purchase or create rigged 3D humanoid models with Tamil Nadu clothing

### 3. Firebase
- **Files:** `.env.example` has blank credentials
- **Status:** Cloud saves fall back to local-only
- **Fix:** Create Firebase project → Enable Firestore → Set `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`

### 4. NavMesh
- **Files:** 6 `.asset` files in `unity/Assets/_Project/NavMeshData/`
- **Status:** Assets exist but need fresh bake verification
- **Fix:** Open Unity → Whispering Wilds → Ecology → Bake NavMesh For All Regions

### 5. Temple 3D
- **Files:** `08_Ancient_Temple_Ruins.unity`
- **Status:** Greybox with cubes, planes, spheres
- **Fix:** Open Unity → Place temple GLB models (heritage_temple_area, gopuram, props)

### 6. Campaign Test
- **Files:** `docs/qa/HUMAN_CAMPAIGN_PLAYTHROUGH.md`
- **Status:** Checklist exists but unexecuted
- **Fix:** Human player to play through all 6 regions and record results

## Next Actions (Prioritized)

1. **Play through the game** — Use `docs/qa/HUMAN_CAMPAIGN_PLAYTHROUGH.md`
2. **Add GitHub workflow scope** — Enable CI/CD automation
3. **Configure Firebase** — For cloud saves to work
4. **Bake NavMesh in Unity** — For NPC navigation
5. **Add 3D temple models** — For visual polish
6. **Replace NPC models** — For character quality

---

*All code-level work is complete. Remaining blockers require human actions, credentials, or 3D assets.*
