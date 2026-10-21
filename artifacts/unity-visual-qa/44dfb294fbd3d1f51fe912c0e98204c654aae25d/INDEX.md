# Unity Visual QA Artifact Index
**Tested HEAD SHA:** `44dfb294fbd3d1f51fe912c0e98204c654aae25d`  
**Base Commit SHA:** `1df8e4a1c5fb8544681512835a08691a47c4677c`  
**Working Branch:** `feature/unity-visual-gameplay-upgrade-20261020`  
**Execution Timestamp:** 2026-10-20T12:56:40.7556748Z  
**Engine:** Unity 6000.6.3f1, Windows x64, Direct3D 11 / HDRP 17.7.0  

---

## 1. Verified Scene Visual Evidence
| Scene Index | Scene Filename | Verified Visual Proof |
| :---: | :--- | :--- |
| **00** | `00_Boot.unity` | `screenshots/00-boot.png` |
| **01** | `01_StateMap_TamilNadu.unity` | `screenshots/01-statemap-tamilnadu.png` |
| **02** | `02_Chennai_GeorgeTown.unity` | `screenshots/02-chennai-georgetown.png` |
| **03** | `03_Pichavaram_Wetlands.unity` | `screenshots/03-pichavaram-wetlands.png` |
| **04** | `04_Thanjavur_Delta.unity` | `screenshots/04-thanjavur-delta.png` |
| **05** | `05_Chettinad_Mansion.unity` | `screenshots/05-chettinad-mansion.png` |
| **06** | `06_Mamallapuram_Shore.unity` | `screenshots/06-mamallapuram-shore.png` |
| **07** | `07_Nilgiris_Sanctuary.unity` | `screenshots/07-nilgiris-sanctuary.png` |
| **08** | `08_Ancient_Temple_Ruins.unity` | `screenshots/08-ancient-temple.png` |

---

## 2. Character Visual Evidence
- **Contact Sheet:** `screenshots/characters-contact-sheet.png`
  - Documents all 10 characters (Player Arun Kumar + 9 Story NPCs) with distinct cultural headwear and facial geometry.
  - Truth classification: **Stylized Procedural Geometry** assembled from distinct cultural silhouettes.

---

## 3. Environment Model Gaps Fixed (Before/After Proof)
- `screenshots/environment-fixes-before-after/01-toda-mund-hut-vs-colonial-cottage.png`
- `screenshots/environment-fixes-before-after/02-dravidian-temple-gateway-vs-iron-gate.png`
- `screenshots/environment-fixes-before-after/03-kuthuvilakku-brass-diya-vs-lantern.png`
- `screenshots/environment-fixes-before-after/04-camellia-tea-hedgerow-vs-wild-fern.png`
- `screenshots/environment-fixes-before-after/05-mamallapuram-stone-relief-vs-boulder.png`
- `screenshots/environment-fixes-before-after/06-temple-kalvettu-stele-vs-signpost.png`
- `screenshots/environment-fixes-before-after/07-temple-kalasam-urn-vs-clay-pot.png`
- `screenshots/environment-fixes-before-after/08-interlocking-ashlar-wall-vs-brick-wall.png`
- `screenshots/environment-fixes-before-after/09-stepped-theertham-tank-vs-stone-well.png`

---

## 4. Reports and Native Editor Logs
- `reports/editor-rig-audit.json`: Native Editor rig audit (**10/10 PASS_EDITOR**).
- `reports/asset-reference-audit.json`: Native asset reference audit (**0 issues, 293 materials**).
- `reports/real-3d-quality-gaps.csv`: Authoritative gap matrix (**9/9 environment models PASS_EDITOR_VERIFIED**).
- `logs/Unity-Editor.log`: Native Unity Editor execution log.
