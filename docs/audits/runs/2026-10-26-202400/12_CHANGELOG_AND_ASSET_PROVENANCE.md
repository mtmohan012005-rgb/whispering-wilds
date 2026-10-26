# The Whispering Wilds — Changelog & Asset Provenance
**Date:** 2026-10-26
**Commit:** `ad181d4a32b562538710dc2f77874ee554718803` (Merged via PR #27 at `cfca83a8ba7b8431b64b48a7d74e14a6209b1454`)

---

## 1. Code Changes
1. `scripts/verify-candidate-launcher.js`: Added explicit `.\\Play-Candidate.bat` path to resolve cmd.exe lookup failure when `NoDefaultCurrentDirectoryInExePath=1` is set.
2. `reports/production-3d-asset-report.json` & `.md`: Synchronized texture audit count (43 validated textures) and verified zero missing binary animation tracks.

---

## 2. Asset Provenance & Licensing Integrity
- **Temple Meshes:** Deterministically procedurally generated via `TempleMeshBuilder.cs` with clean UVs and PBR normals (`StoneMechanismDial.asset`, `SanctumDoorLeaf.asset`, etc.). Licensed under in-house MIT project terms.
- **Audio Files:** All 10 physical WAVs in `unity/Assets/_Project/Audio/` documented as `status: "PLACEHOLDER"` generated in-house via `GenerateAudioAssets.cs` (MIT / In-House).
- **3D Models:** Hero model `player.glb` verified: 13 meshes, 7 materials, 24 animations, zero Xbot or external unauthorized assets.
