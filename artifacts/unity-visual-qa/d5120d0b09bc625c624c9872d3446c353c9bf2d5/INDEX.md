# Unity Visual QA Artifact Index
**Tested HEAD SHA:** `d5120d0b09bc625c624c9872d3446c353c9bf2d5`  
**Base Commit SHA:** `1df8e4a1c5fb8544681512835a08691a47c4677c`  
**Working Branch:** `feature/unity-visual-gameplay-upgrade-20261020`  
**Execution Timestamp:** 2026-10-20T16:04:03.5497974Z  
**Engine:** Unity 6000.6.3f1, Windows x64, Direct3D 11 / HDRP 17.7.0  
**Captures Passed:** 19 / 19  

---

## 1. Verified Scene Visual Evidence
| Scene Index | Scene Filename | Verified Visual Proof | Resolution | File Size | SHA-256 |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **00** | `00_Boot.unity` | `screenshots/00-boot.png` | 1920x1080 | 145 KB | `4f1e28b0...` |
| **01** | `01_StateMap_TamilNadu.unity` | `screenshots/01-statemap-tamilnadu.png` | 1920x1080 | 40 KB | `90180c0c...` |
| **02** | `02_Chennai_GeorgeTown.unity` | `screenshots/02-chennai-georgetown.png` | 1920x1080 | 1744 KB | `273f6213...` |
| **03** | `03_Pichavaram_Wetlands.unity` | `screenshots/03-pichavaram-wetlands.png` | 1920x1080 | 533 KB | `f21863b5...` |
| **04** | `04_Thanjavur_Delta.unity` | `screenshots/04-thanjavur-delta.png` | 1920x1080 | 437 KB | `64b52364...` |
| **05** | `05_Chettinad_Mansion.unity` | `screenshots/05-chettinad-mansion.png` | 1920x1080 | 297 KB | `96e398e8...` |
| **06** | `06_Mamallapuram_Shore.unity` | `screenshots/06-mamallapuram-shore.png` | 1920x1080 | 240 KB | `8250f9b1...` |
| **07** | `07_Nilgiris_Sanctuary.unity` | `screenshots/07-nilgiris-sanctuary.png` | 1920x1080 | 467 KB | `d5344509...` |
| **08** | `08_Ancient_Temple_Ruins.unity` | `screenshots/08-ancient-temple.png` | 1920x1080 | 569 KB | `056c4087...` |

## 2. Character & Environment Verification
- **Characters Contact Sheet:** `screenshots/characters-contact-sheet.png` (Real in-engine portraits of all 10 characters)
- **9 Culturally Grounded Model Fixes:** Rendered in `screenshots/environment-fixes-before-after/`

## 3. Audits & Reports
- [`reports/editor-rig-audit.json`](reports/editor-rig-audit.json) (10/10 PASS_EDITOR)
- [`reports/asset-reference-audit.json`](reports/asset-reference-audit.json) (0 broken references across 9 scenes)
- [`reports/BUILD_REPORT.json`](reports/BUILD_REPORT.json) (Windows Standalone Production Build)
