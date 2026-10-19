# The Whispering Wilds — Human Visual & Campaign Verification Checklist

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

> [!IMPORTANT]
> **Headless Automated Limitation:** Automated tests prove that scripts compile, game states transition, checksums match, and processes launch. However, only a human tester with hands on keyboard/mouse and eyes on display can assess subjective visual quality, camera smoothness, audio balance, and campaign feel.

---

## 1. Prerequisites for Manual Tester

1. **Hardware:** Windows 10/11 x64 PC with keyboard, mouse, and audio headphones or speakers.
2. **Binary:** `unity/Build/Windows/TheWhisperingWilds.exe` (run directly from folder).
3. **Save State:** Ensure `%USERPROFILE%\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\` has no corrupted files before starting.

---

## 2. Interactive QA Checklist (60 Key Verifications)

### Phase 1: Boot & Main Menu
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 1 | Double-click `TheWhisperingWilds.exe` | Launches full-screen or 1920x1080 window within 5s | `[ ] NOT_TESTED` |
| 2 | Observe Cinematic Intro | Atmospheric twilight gradient and treeline fade in | `[ ] NOT_TESTED` |
| 3 | Press `Space` or `Escape` during intro | Intro skips immediately to Main Menu | `[ ] NOT_TESTED` |
| 4 | Check Main Menu typography | Clean display of English and Tamil script | `[ ] NOT_TESTED` |
| 5 | Toggle Language switch | UI instantaneously updates string tables | `[ ] NOT_TESTED` |
| 6 | Open Options / Audio Settings | Volume sliders move smoothly | `[ ] NOT_TESTED` |
| 7 | Click "New Game" | Confirmation modal dialog appears | `[ ] NOT_TESTED` |
| 8 | Confirm "New Game" | Loads opening region without hitching | `[ ] NOT_TESTED` |

### Phase 2: Locomotion & Camera
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 9 | Press `W`, `A`, `S`, `D` | Player moves in all 4 directions smoothly | `[ ] NOT_TESTED` |
| 10 | Move Mouse | 3rd person camera orbits around player without clipping | `[ ] NOT_TESTED` |
| 11 | Hold `Left Shift` while moving | Player transitions to sprinting animation | `[ ] NOT_TESTED` |
| 12 | Press `Space` | Player jumps with realistic arc and landing | `[ ] NOT_TESTED` |
| 13 | Press `C` or `Left Ctrl` | Player crouches; camera lowers | `[ ] NOT_TESTED` |
| 14 | Walk into uneven terrain | Character controller steps up small slopes without sticking | `[ ] NOT_TESTED` |

### Phase 3: Mudumalai & Regional Biomes
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 15 | Observe forest vegetation | Foliage shaders render without flickering | `[ ] NOT_TESTED` |
| 16 | Observe Day/Night Cycle | Sun angle and shadows shift gradually | `[ ] NOT_TESTED` |
| 17 | Observe Rain weather trigger | Rain particle effects and wetness shaders activate | `[ ] NOT_TESTED` |
| 18 | Approach Spotted Deer | Deer alerts and flees along NavMesh paths | `[ ] NOT_TESTED` |
| 19 | Approach Bonnet Macaque | Monkey reacts or climbs designated tree nodes | `[ ] NOT_TESTED` |
| 20 | Approach Medicinal Herb | Interaction prompt appears on HUD | `[ ] NOT_TESTED` |
| 21 | Press `E` to harvest herb | Herb collected into inventory; notification shown | `[ ] NOT_TESTED` |

### Phase 4: NPC Interaction & Clue Investigation
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 22 | Locate Guide Murugan in Chennai | Interaction prompt displays above NPC | `[ ] NOT_TESTED` |
| 23 | Press `E` to speak with Murugan | Dialogue panel opens with Tamil & English subtitles | `[ ] NOT_TESTED` |
| 24 | Select opening conversation choice | NPC responds; opening quest accepted | `[ ] NOT_TESTED` |
| 25 | Open Investigation Ledger (`J` or `Tab`) | Murugan's Tea Ledger clue is displayed | `[ ] NOT_TESTED` |
| 26 | Locate Informant Velu | Dialogue initiates secondary clue chain | `[ ] NOT_TESTED` |

### Phase 5: Ancient Temple Ruins Walkthrough
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 27 | Transition to `08_Ancient_Temple_Ruins` | Scene loads without missing shader purple meshes | `[ ] NOT_TESTED` |
| 28 | Observe temple architecture | Verify greybox geometry layout (pillars, floor, sanctum) | `[ ] NOT_TESTED` |
| 29 | Step on Pressure Plate 1 | Audio/visual trigger feedback plays | `[ ] NOT_TESTED` |
| 30 | Step on Pressure Plate 2 & 3 in order | Puzzle sequence validator accepts combo | `[ ] NOT_TESTED` |
| 31 | Observe Sanctum Door | Door lowers/opens smoothly | `[ ] NOT_TESTED` |
| 32 | Enter Inner Sanctum | Lighting shifts to ceremonial glow | `[ ] NOT_TESTED` |
| 33 | Interact with Ancient Artifact | Artifact collected; quest milestone completes | `[ ] NOT_TESTED` |

### Phase 6: Persistence & Session Restoration
| # | Test Action | Expected Result | Tester Status |
|---|---|---|---|
| 34 | Press `Esc` to open Pause Menu | Pause menu halts world time cleanly | `[ ] NOT_TESTED` |
| 35 | Click "Save Game" (Slot 1) | Save confirmation notification displays | `[ ] NOT_TESTED` |
| 36 | Exit to Desktop | Game closes without hanging in Task Manager | `[ ] NOT_TESTED` |
| 37 | Check `whispering_wilds_save.json` | Timestamp and position in slot 1 match save point | `[ ] NOT_TESTED` |
| 38 | Restart `TheWhisperingWilds.exe` | Main Menu displays "Continue" enabled | `[ ] NOT_TESTED` |
| 39 | Click "Continue" | Spawns player at exact saved coordinates with inventory intact | `[ ] NOT_TESTED` |

---

## 3. Human QA Sign-Off

- **Tester Name:** _____________________
- **Testing Date:** _____________________
- **Overall Subjective Gameplay Rating (1–10):** _____
- **Observations / Feedback:**
