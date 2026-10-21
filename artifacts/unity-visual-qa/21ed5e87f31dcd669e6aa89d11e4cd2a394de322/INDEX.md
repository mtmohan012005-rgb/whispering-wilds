# Unity Visual QA Artifact Index
**Tested HEAD SHA:** `21ed5e87f31dcd669e6aa89d11e4cd2a394de322`  
**Base Commit SHA:** `7e3955cbb92095fda94df58fa34e7ef9e80c7fd9`  
**Working Branch:** `feature/real-gameplay-map-vertical-slice-20261021`  
**Execution Timestamp:** 2026-10-21T04:17:38.3734285Z  
**Engine:** Unity 6000.6.3f1, Windows x64, Direct3D 11 / HDRP 17.7.0  
**Captures Passed:** 19 / 19  

---

## 1. Verified Scene Visual Evidence
| Scene Index | Scene Filename | Verified Visual Proof | Resolution | File Size | SHA-256 |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **00** | `00_Boot.unity` | `screenshots/00-boot.png` | 1920x1080 | 145 KB | `4f1e28b0...` |
| **01** | `01_StateMap_TamilNadu.unity` | `screenshots/01-statemap-tamilnadu.png` | 1920x1080 | 48 KB | `78b9df47...` |
| **02** | `02_Chennai_GeorgeTown.unity` | `screenshots/02-chennai-georgetown.png` | 1920x1080 | 1744 KB | `273f6213...` |
| **03** | `03_Pichavaram_Wetlands.unity` | `screenshots/03-pichavaram-wetlands.png` | 1920x1080 | 533 KB | `f21863b5...` |
| **04** | `04_Thanjavur_Delta.unity` | `screenshots/04-thanjavur-delta.png` | 1920x1080 | 437 KB | `64b52364...` |
| **05** | `05_Chettinad_Mansion.unity` | `screenshots/05-chettinad-mansion.png` | 1920x1080 | 297 KB | `96e398e8...` |
| **06** | `06_Mamallapuram_Shore.unity` | `screenshots/06-mamallapuram-shore.png` | 1920x1080 | 240 KB | `8250f9b1...` |
| **07** | `07_Nilgiris_Sanctuary.unity` | `screenshots/07-nilgiris-sanctuary.png` | 1920x1080 | 469 KB | `1da07f44...` |
| **08** | `08_Ancient_Temple_Ruins.unity` | `screenshots/08-ancient-temple.png` | 1920x1080 | 569 KB | `056c4087...` |

## 2. Character & Environment Verification
- **Characters Contact Sheet:** `screenshots/characters-contact-sheet.png` (Real in-engine portraits of all 10 characters)
- **9 Culturally Grounded Model Fixes:** Rendered in `screenshots/environment-fixes-before-after/`

## 3. Audits & Reports
- [`reports/editor-rig-audit.json`](reports/editor-rig-audit.json) (10/10 PASS_EDITOR)
- [`reports/asset-reference-audit.json`](reports/asset-reference-audit.json) (0 broken references across 9 scenes)
- [`reports/BUILD_REPORT.json`](reports/BUILD_REPORT.json) (Windows Standalone Production Build)
