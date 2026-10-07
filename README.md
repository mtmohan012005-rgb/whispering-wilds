# 🌿 The Whispering Wilds (காட்டு வழி • தடம்)

[![Unity 6](<https://img.shields.io/badge/Engine-Unity%206%20(6000.6.3f1)-black?style=for-the-badge&logo=unity>)](https://unity.com/)
[![Render Pipeline](https://img.shields.io/badge/Render%20Pipeline-HDRP%2017.7.0-blue?style=for-the-badge)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/index.html)
[![Platform](<https://img.shields.io/badge/Platform-Windows%20x64%20(DirectX%2011%2F12)-brightgreen?style=for-the-badge&logo=windows>)](https://github.com/mtmohan012005-rgb/whispering-wilds)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

An atmospheric open-world exploration, cultural mystery investigation, and survival adventure set across authentic Tamil Nadu landscapes—now built as a native **Unity 6 PC Game** with zero dependency on browsers, Node.js, Electron, or localhost runtimes.

---

## 🎮 1. Unity 6 Standalone PC Release

The game is delivered as a standalone Windows x64 executable:

- **Executable**: `Build/Windows/TheWhisperingWilds.exe`
- **Engine Version**: Unity 6000.6.3f1 (Release x64)
- **Render Pipeline**: High Definition Render Pipeline (HDRP 17.7.0)
- **Target Graphics API**: Direct3D 11 & Direct3D 12
- **Unity Project Directory**: [`unity/`](./unity/)
- **Architecture Documentation**: [`unity/UNITY_MIGRATION.md`](./unity/UNITY_MIGRATION.md)
- **QA & Verification Guide**: [`unity/QA_AND_VERIFICATION.md`](./unity/QA_AND_VERIFICATION.md)
- **Asset License Ledger**: [`unity/ASSET_LICENSE_MANIFEST.md`](./unity/ASSET_LICENSE_MANIFEST.md)

### Running the Standalone PC Game

```powershell
# Double-click or launch directly from PowerShell / Command Prompt:
& ".\Build\Windows\TheWhisperingWilds.exe"
```

### Opening in Unity 6 Editor

1. Open **Unity Hub**.
2. Click **Add** $\rightarrow$ **Add project from disk**.
3. Select the `unity/` folder (or `C:\Users\mohan\My project`).
4. Ensure the Editor version is **Unity 6 (6000.6.3f1)** with HDRP.
5. Open `Assets/_Project/Scenes/00_Boot.unity` and click **Play**.

---

## 🛡️ 2. Core Rule: Strict 5-Permanent Appearance Changes

The game strictly enforces an absolute ceiling of **5 permanent appearance changes** across the entire playthrough:

- **Runtime Logic (`PlayerAppearanceManager.cs`)**: Tracks remaining change tokens (`5/5`). Once `0/5` is reached, further physical customization is permanently rejected.
- **HUD & Title UI (`HUDManager.cs` & `TitleMenuController.cs`)**: Continuously displays `Appearance Changes: X / 5` on screen and displays the bilingual rule notice on the main menu:
  > _"விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும் (Rule: Strict maximum of 5 permanent appearance changes across the entire journey)."_
- **Save Integrity (`SaveSystem.cs`)**: Save files store `remainingPermanentAppearanceChanges` and enforce `Mathf.Clamp(count, 0, 5)` upon deserialization.
- **Regional Attire Swaps**: Cultural outfit swaps (Chennai everyday veshti, Cauvery village cottons, Thanjavur silks, Pichavaram boatman wear, Nilgiri mountain wools) are unrestricted and do not consume permanent appearance tokens.

---

## 🏛️ 3. Main Story & Investigation

- **Prologue:** Outside the Indo-Saracenic red-brick arches of the **Madras High Court** in George Town, Chennai.
- **Inciting Incident:** While reviewing an inherited century-old architectural blueprint during a sudden Chennai downpour, a mysterious rider on a vintage Royal Enfield steals critical records and speeds away into George Town's alleyways.
- **Objective:** Follow tyre treads across authentic Tamil Nadu geography, interrogate local figures (Murugan the tea stall owner, Velu the auto driver), gather forensic clues, decode ancient Chola hydraulic engineering, and uncover **Pasumai Thadam** (a subterranean sanctuary in the Western Ghats).

---

## 🗺️ 4. Regional Progression

1. **Chennai George Town & High Court Perimeter**:
   - Monsoonal wet asphalt, Murugan's authentic Tea Kadai, auto-rickshaws, street row architecture, and colonial High Court plaza.
2. **Pichavaram Wetlands & Delta**:
   - Mangrove root mazes, tidal waterways, wooden catamarans, and ancient Chola granite waterwheel sluices.
3. **Cauvery Delta & Thanjavur**:
   - Thanjavur Brihadisvara gopuram, bronze sculpting workshops, and lush green paddy field irrigation canals.
4. **Chettinad Mansions**:
   - Carved teak woodwork, Athangudi handmade tiles, courtyards, and ancestral antique archives.
5. **Mamallapuram Shore**:
   - Granite stone carving, rock-cut cave temples, and coastal shores.
6. **Nilgiris & Western Ghats**:
   - Stepped tea plantations, Shola cloud forests, Toda tribal _mund_ barrel-vault huts, wild Nilgiri Tahr, and the lost eco-sanctuary portal.

---

## 🎮 5. PC Controls

| Action                   | Keyboard & Mouse                  | Gamepad (Xbox / PlayStation)   |
| :----------------------- | :-------------------------------- | :----------------------------- |
| **Move / Locomotion**    | `W`, `A`, `S`, `D`                | Left Analog Stick              |
| **Walk** (analog gentle) | Minor analog tilt / partial press | Left Stick gentle tilt (< 0.6) |
| **Run** (standard)       | Normal WASD / full tilt           | Left Stick full tilt (≥ 0.6)   |
| **Sprint**               | Hold `Left Shift`                 | Click Left Stick (L3)          |
| **Crouch**               | `C`                               | `B` / `Circle`                 |
| **Jump**                 | `Spacebar`                        | `A` / `Cross`                  |
| **Orbit Camera**         | Mouse Movement                    | Right Analog Stick             |
| **Interact**             | `E`                               | `X` / `Square`                 |
| **Inventory & Codex**    | `Tab` / `I`                       | `View` / `Touchpad`            |
| **Crafting Workbench**   | `G`                               | D-Pad Down                     |
| **Belt Lantern**         | `L`                               | D-Pad Left                     |
| **Deploy Campfire**      | `B`                               | D-Pad Right                    |
| **Pitch Tent (Rest)**    | `T`                               | D-Pad Up                       |

---

## 📦 6. Real 3D Assets Breakdown (No Placeholders)

All models in the game are authored 3D models imported natively:

| Asset                    | Model File                                                                    | Cultural & Technical Details                                                                                      |
| :----------------------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Player Character**     | `Assets/_Project/Art/Models/Characters/Player/player.glb`                     | Rigged 3D model with 23 bones, `Player_LOD0` SkinnedMeshRenderer, 24 animations, and cotton veshti attire.        |
| **NPC Murugan**          | `Assets/_Project/Art/Models/Characters/NPCs/murugan.glb`                      | George Town tea stall vendor with red-bordered cotton lungi, shoulder towel (_thundu_), moustache, and tea glass. |
| **NPC Velu**             | `Assets/_Project/Art/Models/Characters/NPCs/velu.glb`                         | Chennai auto-rickshaw driver and guide in khaki uniform.                                                          |
| **Tea Kadai Stall**      | `Assets/_Project/Art/Models/Architecture/chennai/tea_kadai_stall.glb`         | Green wooden tea stall with tin canopy, bench, and brass boiling samovar.                                         |
| **Chennai Auto**         | `Assets/_Project/Art/Models/Vehicles/auto_rickshaw/chennai_auto.glb`          | Yellow-and-black 3-wheeled auto-rickshaw with canvas roof.                                                        |
| **Street Row**           | `Assets/_Project/Art/Models/Architecture/chennai/street_row.glb`              | Indo-Saracenic colonial shopfronts with arched verandas.                                                          |
| **Old Tamil House**      | `Assets/_Project/Art/Models/Architecture/chennai/old_tamil_house.glb`         | Heritage residential facade with traditional raised front _thinnai_ veranda.                                      |
| **Brihadisvara Gopuram** | `Assets/_Project/Art/Models/Architecture/thanjavur_gopuram.glb`               | Chola granite vimana and gopuram temple architecture.                                                             |
| **Courtyard Mansion**    | `Assets/_Project/Art/Models/Architecture/chettinad/courtyard_mansion.glb`     | Chettinad heritage courtyard palace with Athangudi flooring and carved doors.                                     |
| **Shore Temple Shrine**  | `Assets/_Project/Art/Models/Architecture/mamallapuram/heritage_structure.glb` | Pallava 7th-century coastal rock-cut granite shrine.                                                              |
| **Toda Mund Hut**        | `Assets/_Project/Art/Models/Architecture/nilgiris/toda_mund_hut.glb`          | Indigenous Nilgiri Toda barrel-vaulted thatch-and-stone dwelling.                                                 |
| **Nilgiri Tahr**         | `Assets/_Project/Art/Models/Wildlife/nilgiri_tahr.glb`                        | Western Ghats endangered mountain ungulate with autonomous wandering.                                             |
| **Degree Kaapi Tumbler** | `Assets/_Project/Art/Models/Props/food/filter_coffee_tumbler.glb`             | Traditional brass davarah and tumbler with frothy filter coffee.                                                  |
| **Agal Vilakku**         | `Assets/_Project/Art/Models/Props/cultural/agal_lamp.glb`                     | Terracotta earthen oil lamp.                                                                                      |
| **Ammi Kallu**           | `Assets/_Project/Art/Models/Props/cultural/ammi_kallu.glb`                    | Authentic heritage granite grinding stone and roller.                                                             |
| **Kuthu Vilakku**        | `Assets/_Project/Art/Models/Props/cultural/kuthu_vilakku.glb`                 | Five-spout ceremonial brass oil lamp.                                                                             |
| **Flower Cart**          | `Assets/_Project/Art/Models/Props/market/flower_cart.glb`                     | Wooden pushcart with jasmine (_malli_) and marigold garlands.                                                     |

---

## ⚡ 7. Hardware Scalability & Quality Profiles

The game includes full low-end laptop to high-end 4K gaming PC support:

- **Auto Quality Detection (`AutoQualityDetector.cs`)**: Evaluates GPU VRAM, CPU threads, and system RAM to select the optimal default profile upon initial boot.
- **5 Granular Presets (`QualityPresetManager.cs`)**:
  - **Very Low**: 0.70x render scale, 20m shadow distance, 1 cascade, 256MB texture budget, 30 FPS target.
  - **Low**: 0.80x render scale, 40m shadow distance, 2 cascades, 512MB texture budget, 30 FPS target.
  - **Medium**: 0.90x render scale, 75m shadow distance, 2 cascades, 1024MB texture budget, 60 FPS target.
  - **High**: 1.00x render scale, 150m shadow distance, 4 cascades, 2048MB texture budget, 60 FPS target.
  - **Ultra**: 1.00x render scale, 250m shadow distance, 4 cascades, 8x MSAA, 4096MB texture budget, 120 FPS target.
- **Adaptive Performance Adaptation (`AdaptiveQualityManager.cs`)**: Automatically adapts dynamic render scale and LOD bias with hysteresis to guarantee 60 FPS frame pacing.
- **Memory & Mipmap Streaming (`MemoryBudgetManager.cs`)**: Enforces subsystem memory budgets and deterministic asset unloads on regional transitions.

---

## 📊 8. Automated Performance Benchmarks

The project includes 4 automated benchmark suites:

- `WW_Benchmark_Chennai` — Dense urban market stress testing.
- `WW_Benchmark_Pichavaram` — Mangrove wetland and water overdraw stress testing.
- `WW_Benchmark_Delta` — Alluvial landscape and shadow cascade stress testing.
- `WW_Benchmark_Nilgiris` — High-altitude montane foliage and physics stress testing.

Benchmarks execute automated 15-second passes, compute average/1% low FPS, and write structured JSON logs to:
`Application.persistentDataPath/benchmark_report.json`.

---

## 📜 9. License

MIT License • Created for **The Whispering Wilds (காட்டு வழி • தடம்)**.
