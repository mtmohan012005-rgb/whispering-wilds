# The Whispering Wilds (காட்டு வழி • தடம்) - Unity 6 Migration Document

## 1. System Migration Matrix

| System Area | Old System (Three.js Web Prototype) | New Unity 6 PC System | Migration Status |
| :--- | :--- | :--- | :--- |
| **Engine Runtime** | Browser Canvas + WebGL + Three.js | Unity 6000.6.3f1 (HDRP/URP Standalone x64) | In Progress |
| **Locomotion** | Custom JS Raycast / Procedural Locomotion | `CharacterController` with smooth acceleration, slope & step handling | In Progress |
| **Camera** | OrbitControls / Custom JS Pushout | Cinemachine 3rd Person Follow / FreeLook with collision avoidance | In Progress |
| **Input** | HTML Keyboard/Mouse EventListeners | Unity New Input System (`UnityEngine.InputSystem`), Gamepad + KBM | In Progress |
| **Dialogue & NPCs** | Custom JS Dialogue Trees (`dialogue.js`) | C# ScriptableObject Dialogue Engine with branching nodes & audio | In Progress |
| **NPC Schedules** | JS Timer Intervals | `NPCScheduleManager` + TimeOfDay curves | In Progress |
| **Investigation** | DOM Modal Overlays | Interactive 3D Inspection + Investigation Board (`IInteractable`) | In Progress |
| **Quests & Codex** | In-memory JS Objects (`quest-data.js`) | `QuestManager` ScriptableObjects with serializable progression | In Progress |
| **Inventory & Crafting** | JS DOM Tables & LocalStorage | `InventoryManager` + `CraftingManager` with regional recipes | In Progress |
| **Appearance Limit** | UI Flag in JS | **Strict 5-Permanent Appearance Changes** enforced in `PlayerAppearanceManager` | In Progress |
| **Audio** | HTML5 Audio / Web Audio Nodes | Unity 6 Spatial Audio Buses (Master, Ambient, Music, SFX, Voice, UI) | In Progress |
| **Environment / Weather** | Shader uniforms in Three.js | Volumetric Fog, Skybox Day/Night & Weather particle systems | In Progress |
| **Save / Persistence** | `localStorage` / IndexedDB | Versioned JSON encrypted saves in `Application.persistentDataPath` | In Progress |

---

## 2. Regional Scene Architecture

| Scene ID | Region Name | Tamil Name | Environment Theme | Key Landmarks & Features |
| :--- | :--- | :--- | :--- | :--- |
| `00_Boot` | Bootstrap | தொடக்கம் | Splash, Logo Animation, Asset Preload | Cold bootloader, quality auto-detect |
| `01_MainMenu` | Main Menu | முதன்மைப் பட்டியல் | Cinematic Camera on Tamil Nadu Landscape | New Game, Continue, Settings, Codex |
| `02_Chennai` | Chennai George Town | சென்னை ஜார்ஜ் டவுன் | Dense urban fabric, bustling street market, monsoon wetness | Madras High Court plaza, Murugan Tea Kadai, auto traffic |
| `03_Pichavaram` | Pichavaram Wetlands | பிச்சாவரம் | Dense Rhizophora mangroves, narrow tidal canals | Wooden boat docks, birdwatch hide, marsh mud banks |
| `04_CauveryDelta` | Cauvery Delta | காவிரி டெல்டா | Lush paddy fields, irrigation channels, coconut groves | Traditional village houses, cattle sheds, granaries, sluices |
| `05_Thanjavur` | Thanjavur Cultural Hub | தஞ்சாவூர் | Chola granite architecture, classical arts, artisan quarters | Brihadisvara mandapam elements, bronze workshops, lamps |
| `06_Chettinad` | Chettinad Heritage | செட்டிநாடு | Grand courtyard mansions, Athangudi tiles, teak pillars | Heritage mansion halls, brass storage vaults, verandahs |
| `07_Mamallapuram` | Mamallapuram Coastal | மாமல்லபுரம் | Coastal granite boulders, ocean spray, ancient stone craft | Shore rock relief, sculptor workshops, catamaran docks |
| `08_Nilgiris` | Nilgiris Highlands | நீலகிரி | Rolling tea plantations, shola mist, cool mountain trails | Heritage tea factory, Toda mund huts, waterfall paths |

---

## 3. Cultural Authenticity & Strict Gameplay Rules
- **Appearance Constraint**: Maximum of **5 permanent appearance changes** throughout the entire gameplay campaign. This is hard-coded into the game logic and save schema.
- **Investigation Core**: No floating arcade arrows. Clues are discovered organically via environmental inspection, dialogue cues, and photo evidence.
- **Tamil Cultural Elements**: Culturally coherent architecture (thinnai, muttam, madapalli), clothing (veshti, thundu, cotton shirts), and regional tools/props.
