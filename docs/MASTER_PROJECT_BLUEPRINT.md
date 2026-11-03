# 🗺️ Master Project Blueprint: The Whispering Wilds (Kaattu Vazhi / தடம்)

**Project Status:** v1.0.1 Candidate Build Shipped & Locked (`5d050fd` / `0a87ce0`)  
**Engine / Stack:** Unity 6000.6.3f1 (HDRP 17.7.0) + Node.js Backend / CI  
**Total Test Suites:** 13/13 Passing (100% Green CI)  
**Release Package:** `TheWhisperingWilds-v1.0.1-windows-x64.zip` (59.91 MB)  
**Release Provenance SHA-256:** `F2EEB88905921C42AF57178AE1AFB7136D54CA8F172A0AD9565F10AE01A0924B`  

---

## 1. Core Systems & Gameplay Modules (Code Architecture)

Every core system is modular, fully tested via NUnit EditMode test suites, and integrated into the global game state:

### Economy & Trust System (`VendorSystem.cs`, `VendorInteraction.cs`)
* **Trust Tiers:** Stranger $\rightarrow$ Acquaintance $\rightarrow$ Trusted $\rightarrow$ Confidant (0–100 points).
* **Dynamic Pricing:** Automatic 5% discount scaling per trust tier, scarcity modifiers, and barter payout scaling.
* **Tiered Inventories:** Specialty blueprints and rare items locked behind memory/trust gates.

### Regional Traversal & Encounters (`RegionalTravelManager.cs`, `TravelEncounterSystem.cs`)
* **Node-Based Map:** Inter-region routing across Tamil Nadu with stamina and food ration consumption.
* **Dynamic Roadside Encounters:** Random or memory-gated events (merchant caravans, weather roadblocks, wildlife tracking).

### Regional Gameplay Loops (`AgricultureSystem.cs`, `WildlifeEcologySystem.cs`, `RegionalCraftingSystem.cs`)
* **Agriculture:** Climate-specific crop growth cycles (Cauvery Delta water-dependent paddy, Nilgiris tea, coastal palm sap). Includes environmental moisture simulation and drought-induced withering (<30% water threshold).
* **Wildlife Ecology:** Herd behaviors (Grazing, Migrating, Alert, Fleeing based on 0–100 stress levels) and non-lethal research photography scoring (optimal framing, action shots, distance bonuses, and proximity penalties).
* **Crafting:** Regional blueprint recipes (Chettinad brassware, Thanjavur art plates, Nilgiris herbal salves) with inventory checks and unlock gates.

### Temple Finale Puzzles (`AncientTempleLevelController.cs`, `TempleFolklorePuzzleController.cs`, `NavagrahaShadowPuzzle.cs`, `AcousticPillarPuzzle.cs`)
* **Decoupled Architecture:** Puzzles no longer open doors unilaterally; they notify the master level controller.
* **Strict Null-Guards:** `AreAllTemplePuzzlesSolved()` strictly requires all three Dravidian architectural trials to be non-null and confirmed solved before unlocking the sanctuary.
* **Interactive Props:** Direct `IInteractable` components wired to musical pillars and solar shadow dials with bilingual prompts.

### Runtime Immersion & Atmosphere (`HubNPCController.cs`, `RegionalSoundscapeManager.cs`, `AnimalAIController.cs`, `TimeAndWeatherManager.cs`)
* **Hub NPCs:** Physical colliders and bilingual greeting prompts tied to persistent relationship memories (`NPCMemoryStore`) and vendor trust.
* **Spatial Soundscapes:** Multi-layered ambient audio profiles crossfading across all 6 biomes with randomized environmental acoustic events.
* **Runtime Rig:** Wildlife NavMesh AI, Player Animator State Machine, Viewfinder HUD, and dynamic Time-of-Day/Weather systems.

---

## 2. World Geography & Production Scenes (9 Total)

| Scene Index & Name | Region / Setting | Key Gameplay & Architectural Focus |
| :--- | :--- | :--- |
| `00_Boot` | Title & Menu | Authentication, save slot management, settings, credits. |
| `01_StateMap_TamilNadu` | Regional Map | State-wide GIS node graph, inter-region travel paths, stamina tracking. |
| `02_Chennai_GeorgeTown` | Urban Hub | Colonial trade alleys, initial NPC dialogue, market barter economy. |
| `03_Pichavaram_Wetlands` | Wetlands Hub | Mangrove canal maze, boat navigation, aquatic wildlife ecology. |
| `04_Thanjavur_Delta` | Agricultural Hub | Brihadisvara temple shadow, Cauvery delta paddy farming & irrigation. |
| `05_Chettinad_Mansion` | Heritage Hub | Athangudi-tiled heritage mansion, antique vaults, regional brass crafting. |
| `06_Mamallapuram_Shore` | Coastal Hub | Pallava shore rock reliefs, coastal winds, maritime travel nodes. |
| `07_Nilgiris_Sanctuary` | Highland Hub | Misty Western Ghats tea estates, Toda shola reserves, high-altitude flora. |
| `08_Ancient_Temple_Ruins` | Sacred Sanctuary | Final endgame dungeon housing the 3 Dravidian trials and master puzzles. |

### Expansion Waypoints (Sangam Horizons)
* `09_Madurai_Meenakshi`: Cultural capital, night jasmine markets & Vaigai archaeology.
* `10_Kanyakumari_Cape`: Confluence of three oceans, maritime lighthouses & sunrise rocks.
* `11_Agasthyamalai_Wilds`: High-biodiversity nocturnal biosphere & indigenous medicinal flora.

---

## 3. Characters, Entities & Interactive Objects

### Playable Character (The Explorer / Traveler)
* Equipped with `PlayerInteractor` (raycast-based interaction handler).
* `PlayerAnimationStateController` managing locomotion, farming harvest swings, camera-holding photography poses, and puzzle manipulation.

### Regional Hub NPCs
* Cauvery Delta Farmers, Nilgiris Tea Curators, Chettinad Artisans, George Town Merchants, and Sangam regional guides (Meenakshi, Kumaran, Siddhar Maruthuvar).
* Managed via `HubNPCController` implementing `IInteractable`, connected to `VendorSystem` and persistent memory flags.

### Fauna & Wildlife Entities
* Regional animals managed by `WildlifeEcologySystem` and NavMesh AI flocking scripts (`AnimalAIController`).
* React to player distance, herd stress thresholds, and camera research framing.

### Interactable World Objects
* Navagraha mirror pedestals (`NavagrahaPedestalInteractable.cs`).
* Acoustic musical pillars (`AcousticPillarInteractable.cs`).
* Crop plots, vendor inventory stalls, and travel node triggers.

---

## 4. Verification & Testing Fortress (13 Suites)

The project's integrity is guaranteed by 13 fully automated test suites running across Unity EditMode and backend CI:

1. **Backend Security Tests:** 34/34 checks (Auth, CORS, Rate Limiting, Save Security).
2. **Cloud Save Regression Tests:** Checksum parity, payload validation.
3. **Game Architecture Verification:** 16/16 checks (Project hierarchy, asmdefs, build settings, Tamil typography).
4. **Production Readiness:** Endpoint security, room caps.
5. **Production Asset Verification:** 41/41 checks (3D assets, audio, player rig).
6. **Tamil Nadu GIS Map Data & Negative Edge Fixtures:** 37/37 checks (GeoJSON compliance, origin 10.79° N, 78.37° E).
7. **Game Data Manifest Validation:** 83 entries audited, 0 errors.
8. **Room Lifecycle & Invite Code Tests:** 46/46 checks (Isolation, host migration).
9. **Server Process Cleanup:** Port release regression.
10. **Step 2 Player Controller & First Region:** 41/41 checks.
11. **Step 3 Campaign Flow & Navigation:** 53/53 checks.
12. **Candidate Windows Launcher Safety Suite:** 85/85 checks (SHA-256 validation, path traversal defense, exit status 3).
13. **Audit Evidence & Count Reconciliation:** 70/70 checks (391 execution counts reconciled).

---

## 🤖 Guide for Future AI Agents

When picking up this project in future sessions, note these mandatory rules:

* **No Direct Scene Modification Without Guards:** Always respect the 3-puzzle null-safety pattern established in `AncientTempleLevelController`.
* **Bilingual Requirement:** All player-facing UI prompts, dialogues, and interactions must support English and Tamil localization keys.
* **Deterministic Builds:** Any additions to scenes or assets must be accompanied by matching `.meta` files and verified via `npm run validate`.
* **Testing Standard:** New code must include corresponding NUnit EditMode tests before merging into `main`.
* **Provenance Preservation:** Never overwrite public release `v1.0.0`; all candidate release packages must target `v1.0.1` or higher and maintain strict cryptographic SHA-256 checksums.
