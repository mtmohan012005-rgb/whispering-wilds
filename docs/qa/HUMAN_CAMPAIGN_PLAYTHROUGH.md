# Human Campaign Playthrough Checklist

**REQUIRES HUMAN EXECUTION** — This checklist must be completed by a human player. Automated tests cannot replace this.

## Test Information

| Field | Value |
|-------|-------|
| Build Version | |
| Tester Name | |
| Date | |
| Platform | Windows PC |
| Unity Version | 6000.6.3f1 |
| Hardware | |

---

## 1. Boot, Intro & Main Menu

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 1.1 | Launch the game | Game starts without crash | | |
| 1.2 | Cinematic intro plays | 7-second intro with visuals | | |
| 1.3 | Press any key to skip intro | Intro skips to main menu | | |
| 1.4 | Main menu displays | New Game, Continue, Settings, Quit visible | | |
| 1.5 | Click "New Game" | Game starts new campaign | | |
| 1.6 | Click "Continue" (with save) | Loads previous save | | |
| 1.7 | Click "Continue" (no save) | Shows "No save found" or similar | | |
| 1.8 | Click "Settings" | Opens settings menu | | |
| 1.9 | Click "Quit" | Game closes | | |

---

## 2. Settings

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 2.1 | Language: English | All UI in English | | |
| 2.2 | Language: Tamil (தமிழ்) | All UI in Tamil, text renders correctly | | |
| 2.3 | Display: Resolution change | Resolution changes, applies on restart | | |
| 2.4 | Display: Fullscreen toggle | Fullscreen/windowed mode works | | |
| 2.5 | Graphics: Quality preset | Quality changes (Very Low to Ultra) | | |
| 2.6 | Audio: Master volume | Master volume affects all sound | | |
| 2.7 | Audio: Music volume | Music volume slider works | | |
| 2.8 | Audio: SFX volume | Sound effects volume slider works | | |
| 2.9 | Controls: Sensitivity | Mouse sensitivity changes | | |
| 2.10 | Settings persist after restart | Settings are saved and restored | | |

---

## 3. New Game — Chennai (George Town)

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 3.1 | Player spawns in Chennai | Character appears on ground, not floating | | |
| 3.2 | Player movement (WASD) | Character walks/runs smoothly | | |
| 3.3 | Mouse camera control | Camera rotates with mouse | | |
| 3.4 | Jump (Space) | Character jumps | | |
| 3.5 | Sprint (Shift) | Character runs faster | | |
| 3.6 | Crouch (Ctrl) | Character crouches | | |
| 3.7 | Collision with buildings | Character cannot walk through walls | | |
| 3.8 | Quest "First Day in George Town" activates | Quest appears in journal | | |
| 3.9 | NPC dialogue (E key) | Dialogue window opens, text readable | | |
| 3.10 | Clue discovery | Clue appears in journal/inventory | | |
| 3.11 | Journal UI | Journal shows clues, quests, discoveries | | |

---

## 4. Regional Progression

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 4.1 | Travel to Pichavaram | Scene loads, player spawns correctly | | |
| 4.2 | Pichavaram environment | Mangroves, water, wetland atmosphere | | |
| 4.3 | Travel to Thanjavur | Scene loads, player spawns correctly | | |
| 4.4 | Thanjavur environment | Rural delta, irrigation, fields | | |
| 4.5 | Travel to Chettinad | Scene loads, player spawns correctly | | |
| 4.6 | Chettinad environment | Mansion, courtyards, architecture | | |
| 4.7 | Travel to Mamallapuram | Scene loads, player spawns correctly | | |
| 4.8 | Mamallapuram environment | Coastal shore, rocks, beach | | |
| 4.9 | Travel to Nilgiris | Scene loads, player spawns correctly | | |
| 4.10 | Nilgiris environment | Hills, forest, tea plantation | | |
| 4.11 | Region unlock requirements | Regions unlock based on clues/progress | | |

---

## 5. NPC Interactions

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 5.1 | NPC spawns in scene | NPC character visible | | |
| 5.2 | NPC navigation | NPC moves/walks (if animated) | | |
| 5.3 | Dialogue with NPC | Dialogue opens, choices work | | |
| 5.4 | Clue from NPC | Clue added to journal | | |
| 5.5 | NPC in Tamil mode | Dialogue in Tamil | | |
| 5.6 | Vendor interaction (if any) | Buy/sell items | | |

---

## 6. Temple Level (Ancient Temple Ruins)

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 6.1 | Temple scene loads | Scene loads without crash | | |
| 6.2 | Temple ambience plays | Background temple atmosphere audio | | |
| 6.3 | Explore temple grounds | Player can walk around temple | | |
| 6.4 | Discover clue #1 | First clue found and recorded | | |
| 6.5 | Discover clue #2 | Second clue found and recorded | | |
| 6.6 | Discover clue #3 | Third clue found and recorded | | |
| 6.7 | Clues in Tamil/English | Clue text readable in both languages | | |
| 6.8 | Interact with stone mechanism (E) | Stone position cycles | | |
| 6.9 | Wrong sequence | Feedback shown, puzzle resets | | |
| 6.10 | Wrong answer sound | Failure audio plays | | |
| 6.11 | Hint after failed attempts | Hint appears in UI | | |
| 6.12 | Correct sequence (0,2,1) | Chamber door opens | | |
| 6.13 | Success sound | Puzzle success audio plays | | |
| 6.14 | Door open sound | Door opening audio plays | | |
| 6.15 | Collect Kaveri Star Seal | Artifact collected, journal updated | | |
| 6.16 | No duplicate collection | Artifact cannot be collected again | | |
| 6.17 | Quest progression updated | Quest advances after artifact | | |

---

## 7. Save/Load

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 7.1 | Save game | Save confirmation shown | | |
| 7.2 | Quit to desktop | Game closes cleanly | | |
| 7.3 | Restart game | Game launches normally | | |
| 7.4 | Continue from save | Progress restored (clues, quests, region) | | |
| 7.5 | Inventory persists | Items/clues still present | | |
| 7.6 | Quest state persists | Quests at correct stage | | |
| 7.7 | Region unlock persists | Unlocked regions still unlocked | | |
| 7.8 | Temple puzzle state persists | Solved puzzle remains solved | | |
| 7.9 | Artifact state persists | Collected artifact still collected | | |
| 7.10 | Settings persist | Language, audio, graphics settings saved | | |

---

## 8. Localization

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 8.1 | English mode: Main menu | All text in English | | |
| 8.2 | Tamil mode: Main menu | All text in Tamil | | |
| 8.3 | Tamil font renders | Tamil text displays correctly (not tofu/boxes) | | |
| 8.4 | English mode: Dialogue | NPC dialogue in English | | |
| 8.5 | Tamil mode: Dialogue | NPC dialogue in Tamil | | |
| 8.6 | English mode: Quests | Quest text in English | | |
| 8.7 | Tamil mode: Quests | Quest text in Tamil | | |
| 8.8 | English mode: Journal | Journal entries in English | | |
| 8.9 | Tamil mode: Journal | Journal entries in Tamil | | |
| 8.10 | English mode: Temple clues | Temple clues in English | | |
| 8.11 | Tamil mode: Temple clues | Temple clues in Tamil | | |
| 8.12 | Language switch in-game | Language changes without restart | | |
| 8.13 | No text clipping | Text fits in UI elements | | |

---

## 9. Audio

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 9.1 | Temple ambience | Temple atmosphere audio plays | | |
| 9.2 | Stone mechanism click | Click sound on interaction | | |
| 9.3 | Puzzle success sound | Success audio on correct sequence | | |
| 9.4 | Puzzle failure sound | Failure audio on wrong sequence | | |
| 9.5 | Door open sound | Door audio when chamber opens | | |
| 9.6 | Footstep sounds | Footstep audio while walking | | |
| 9.7 | UI click sound | Menu/button click audio | | |
| 9.8 | Volume controls | Master/Music/SFX volumes work | | |
| 9.9 | No duplicate audio | Sounds don't overlap/repeat | | |
| 9.10 | Audio stops on scene exit | Ambience stops when leaving temple | | |

---

## 10. Performance & Stability

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 10.1 | Frame rate | Consistent FPS (note actual value) | | |
| 10.2 | No crashes | Game runs without crashing | | |
| 10.3 | No console errors | Check Player.log for errors | | |
| 10.4 | Scene transitions | Smooth loading between regions | | |
| 10.5 | Memory usage | No memory leaks over time | | |
| 10.6 | Long loading pauses | No excessive loading times | | |
| 10.7 | Missing materials | No pink/missing material errors | | |
| 10.8 | Missing scripts | No "Missing Script" errors | | |

---

## 11. Campaign Ending

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 11.1 | Complete all quests | All quests can be completed | | |
| 11.2 | Unlock all regions | All 6 regions accessible | | |
| 11.3 | Ending sequence triggers | Ending plays after requirements met | | |
| 11.4 | Ending in English | Ending text in English | | |
| 11.5 | Ending in Tamil | Ending text in Tamil | | |
| 11.6 | Multiple endings (if any) | Different endings based on choices | | |

---

## 12. Cloud Save (if Firebase configured)

| # | Test | Expected Result | PASS/FAIL | Notes |
|---|------|----------------|-----------|-------|
| 12.1 | Login with account | Login succeeds | | |
| 12.2 | Cloud save upload | Save uploaded to cloud | | |
| 12.3 | Cloud save download | Save downloaded from cloud | | |
| 12.4 | Cloud save restores | Progress restored from cloud | | |
| 12.5 | Offline fallback | Local save works when offline | | |

---

## Summary

| Category | Tests | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Boot & Menu | 9 | | | |
| Settings | 10 | | | |
| Chennai | 11 | | | |
| Regional Progression | 11 | | | |
| NPC Interactions | 6 | | | |
| Temple Level | 17 | | | |
| Save/Load | 10 | | | |
| Localization | 13 | | | |
| Audio | 10 | | | |
| Performance | 8 | | | |
| Campaign Ending | 6 | | | |
| Cloud Save | 5 | | | |
| **Total** | **116** | | | |

## Issues Found

| # | Severity | Description | Steps to Reproduce | Screenshot/Log |
|---|----------|-------------|-------------------|----------------|
| | | | | |

## Tester Sign-off

- [ ] All tests completed
- [ ] Issues documented
- [ ] Screenshots/logs attached for failures

**Tester Signature:** ________________________  **Date:** _______________
