# The Whispering Wilds (காட்டு வழி • தடம்)
## Unity 6 PC Standalone Game — QA & Verification Guide

This document provides complete, line-by-line verification procedures for every subsystem of **The Whispering Wilds** running as a native Windows x64 Unity 6 PC game.

---

### 1. Build Verification & Deliverable Inspection

- **Target Executable**: `Build/Windows/TheWhisperingWilds.exe`
- **Engine**: Unity 6 (6000.6.3f1)
- **Render Pipeline**: High Definition Render Pipeline (HDRP 17.7.0)
- **Input System**: Unity New Input System (`com.unity.inputsystem` v1.18.0)
- **Scenes Included**:
  1. `00_Boot.unity` (Build Index 0) — Title screen, New Game, Continue, Codex archive, Appearance limit rules display.
  2. `02_Chennai_GeorgeTown.unity` (Build Index 1) — George Town street level, Madras High Court perimeter, Murugan Tea Kadai, Velu auto-rickshaw, full NPC interactions.

---

### 2. Locomotion & Controls

| Action | Keyboard & Mouse | Gamepad (Xbox / DualSense) | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` | Left Stick | Camera-relative character movement with smooth acceleration (`speedChangeRate: 10 m/s²`). Analog stick angle drives character facing smoothly via `Mathf.SmoothDampAngle`. |
| **Walk / Jog** | Gentle stick tilt / partial keying | Partial tilt (< 0.6) | 3.5 m/s walk speed driving `Player_Walk` animation. |
| **Run** | Full keypress / full tilt | Full tilt (≥ 0.6) | 6.0 m/s run speed driving `Player_Run` animation. |
| **Sprint** | Hold `Left Shift` | Click `Left Stick` (L3) | 8.5 m/s sprint speed driving `Player_Sprint` animation. |
| **Crouch** | `C` | `B` / `Circle` | 2.0 m/s crouch locomotion driving `Player_Crouch_Idle` & `Player_Crouch_Walk`. |
| **Jump** | `Space` | `A` / `Cross` | Vertical jump (`1.4m` peak height, `gravity: -18 m/s²`) with coyote time (`0.12s`) and jump buffering (`0.15s`). Triggers `Jump` animation state. |
| **Camera Orbit** | Mouse Delta | Right Stick | 3rd-person orbital framing with `SphereCast` occlusion pushout (min distance `0.8m`, normal distance `4.0m`). |
| **Interact** | `E` | `X` / `Square` | Contextual interaction (`Talk`, `Inspect`, `Pickup`, `Photograph`). |
| **Inventory / Codex**| `Tab` / `I` | `View` / `Touchpad` | Opens bilingual cultural codex and inventory bag. |

---

### 3. Absolute Constraint: Strict 5-Permanent Appearance Changes

#### Rule Specification:
- **Maximum Changes**: Exactly **5 permanent appearance changes** are permitted across the player's entire playthrough.
- **Enforcement Layers**:
  1. **Runtime Logic (`PlayerAppearanceManager.cs`)**:
     - `TryApplyPermanentAppearance(AppearanceProfile newProfile)` checks `remainingPermanentChanges > 0`.
     - When `remainingPermanentChanges == 0`, subsequent attempts are strictly rejected with a console warning and the event `OnAppearanceLimitReached`.
  2. **User Interface (`HUDManager.cs` & `TitleMenuController.cs`)**:
     - Displays `Appearance Changes Remaining: X / 5` in the HUD at all times.
     - Displays cultural rules notice on the Title Screen:
       *"விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும் (Rule: Strict maximum of 5 permanent appearance changes across the entire journey)."*
  3. **Save System Integrity (`SaveSystem.cs`)**:
     - `SaveGame()` writes `remainingPermanentAppearanceChanges` to the JSON payload.
     - `RestoreState()` executes `Mathf.Clamp(remainingChanges, 0, MaxPermanentAppearanceChanges)` upon load to ensure save file tampering cannot exceed the limit of 5.
  4. **Regional Outfits Distinction**:
     - Regional cultural attire swaps (Everyday Chennai veshti, Cauvery village cottons, Thanjavur festival silks, Pichavaram boatman wear, Nilgiri mountain wools) are **unrestricted** and do **not** consume permanent appearance tokens.

#### Verification Steps:
1. Start a New Game. Verify HUD displays `Appearance Changes: 5/5`.
2. Open Appearance Customizer (or call `PlayerAppearanceManager.TryApplyPermanentAppearance()`).
3. Apply 5 modifications. Observe the counter decrementing: `4/5`, `3/5`, `2/5`, `1/5`, `0/5`.
4. Attempt a 6th modification. Verify that the UI and console reject the change with:
   `[Appearance] Permanent appearance change REJECTED: Maximum of 5 permanent changes reached!`
5. Save the game and reload. Verify the remaining count remains strictly `0/5`.

---

### 4. Real 3D Assets Breakdown (No Placeholders)

All assets utilized in the game are authored 3D models imported via Unity glTFast:

| Category | Model Asset Path | Key Visual / Cultural Elements |
| :--- | :--- | :--- |
| **Player Character** | `Assets/_Project/Art/Models/Characters/Player/player.glb` | Rigged character with `Player_LOD0` SkinnedMeshRenderer, 23 bones, 24 embedded animations, and white cotton veshti attire. |
| **NPC Murugan** | `Assets/_Project/Art/Models/Characters/NPCs/murugan.glb` | Traditional George Town tea stall owner with red-bordered cotton lungi, shoulder thundu, moustache, and hand-held tea glass. |
| **NPC Velu** | `Assets/_Project/Art/Models/Characters/NPCs/velu.glb` | Chennai auto-rickshaw driver and guide in khaki driver's uniform. |
| **Murugan's Tea Kadai**| `Assets/_Project/Art/Models/Architecture/chennai/tea_kadai_stall.glb`| Authentic wood-framed green tea stall with corrugated tin canopy, wooden customer bench, and brass boiling samovar. |
| **Chennai Auto-Rickshaw**| `Assets/_Project/Art/Models/Vehicles/auto_rickshaw/chennai_auto.glb`| Classic yellow-and-black 3-wheeled autorickshaw with canvas weather top and spoke wheels. |
| **George Town Street Row**| `Assets/_Project/Art/Models/Architecture/chennai/street_row.glb` | Indo-Saracenic colonial shopfronts, arched verandas, and Madras terrace roofing. |
| **Old Tamil House** | `Assets/_Project/Art/Models/Architecture/chennai/old_tamil_house.glb` | Heritage Chettinad/Madras residential facade with raised front *thinnai* (veranda) and clay tile eaves. |
| **Filter Kaapi Tumbler**| `Assets/_Project/Art/Models/Props/food/filter_coffee_tumbler.glb` | Brass davarah and tumbler with frothy South Indian degree filter coffee. |
| **Agal Vilakku** | `Assets/_Project/Art/Models/Props/cultural/agal_lamp.glb` | Traditional terracotta earthen oil lamp. |
| **Flower Cart** | `Assets/_Project/Art/Models/Props/market/flower_cart.glb` | Wooden pushcart laden with jasmine (*malli*), marigold strings, and banana leaves. |

---

### 5. Investigation Board & Narrative Systems

- **Bilingual Support**: All quests, dialogue, item descriptions, and clues provide simultaneous Tamil (தமிழ்) and English text.
- **George Town Case**:
  - Clue 1: `clue_murugan_ledger` — Murugan's old tea stall account book recording suspicious midnight visitors near Madras High Court.
  - Clue 2: `clue_temple_inscription` — Inscription rubbings from the nearby temple corridor.
  - Clue 3: `clue_chola_coin` — Authentic Chola bronze coin discovered under the veranda floorboards.
- **Deduction Engine**:
  - Combining Clue 1 + Clue 3 unlocks the deduction: *"Midnight Smuggling Route through Pichavaram Mangroves"*, granting access to the next regional travel stage with Velu's auto.

---

### 6. Environmental Simulation & Day/Night Cycle

- **24-Hour Cycle**: Driven by `TimeOfDayManager.cs` (`dayDurationMinutes: 20`).
- **Dynamic Lighting**:
  - `06:00` — Soft golden sunrise over the Bay of Bengal.
  - `12:00` — High-intensity Chennai midday sun (`intensity: 1.35f`).
  - `18:00` — Deep amber and violet evening twilight over George Town.
  - `22:00 - 05:00` — Cool midnight moonlight with warm street lamp illumination.
- **Monsoon Weather**:
  - `WeatherSystem.cs` simulates tropical coastal showers and North-East Monsoon rainstorms with surface wetness reflections on the asphalt and road puddles.
