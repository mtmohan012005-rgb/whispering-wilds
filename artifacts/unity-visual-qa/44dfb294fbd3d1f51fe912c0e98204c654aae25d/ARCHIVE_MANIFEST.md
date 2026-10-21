# Historical QA Evidence Archive Manifest: Commit `44dfb294fbd3d1f51fe912c0e98204c654aae25d`

## 1. Provenance and Archival Rationale
- **Tested Code Commit SHA:** `44dfb294fbd3d1f51fe912c0e98204c654aae25d`
- **Initial Introduction Commit:** `65f6350fc09a274406b369ce875c780c6c234b6f`
- **Final Update Commit in Git History:** `fa06ced8b8e61371119c3097e7e3eed3bfcf676a`
- **Engine Version:** Unity 6000.6.3f1, Windows x64, Direct3D 11, HDRP 17.7.0
- **Archival Rationale:**
  The binary screenshot files (`screenshots/*.png` totaling ~35MB across 20 high-resolution captures) were generated during the audit of commit `44dfb294fbd3d1f51fe912c0e98204c654aae25d`. To keep active Git operations agile and prevent network transfer timeouts during Git pushes, the heavy binary PNGs were pruned from the active head in commit `7cf79a9f6bba62299aae1bb7fc98476c08eef633` while remaining permanently preserved in the Git commit object database at `fa06ced8b8e61371119c3097e7e3eed3bfcf676a`.
  All analytical reports, rig audits, asset reconciliations, and the test index have been restored directly to the repository working tree in this directory.

## 2. Preserved Files in Working Tree
| File | Description | Status |
| :--- | :--- | :--- |
| `INDEX.md` | QA index summarizing tests and evidence | Present in working tree |
| `reports/asset-reference-audit.json` | 9-scene asset reference audit (0 broken references) | Present in working tree |
| `reports/editor-rig-audit.json` | 10 character rig hierarchy and collider audit | Present in working tree |
| `reports/real-3d-quality-gaps.csv` | Categorized gap ledger across visual & audio assets | Present in working tree |
| `reports/BUILD_REPORT.json` | Build metrics and compilation results | Present in working tree |

## 3. How to Retrieve Full Historical Binary Screenshots
To view or export the exact binary PNG files generated for this historical run:
```bash
git checkout fa06ced8b8e61371119c3097e7e3eed3bfcf676a -- artifacts/unity-visual-qa/44dfb294fbd3d1f51fe912c0e98204c654aae25d/screenshots/
```
The files will be checked out from git object storage immediately with bit-identical contents.
