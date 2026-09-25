# Automated Regression Matrix
## Project: The Whispering Wilds (`Kaattu Vazhi`)

| Category | Test Suite ID | Test Description | Target Threshold / Requirement | Status | Last Tested Build | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BOOT** | `REG_BOOT_01` | Splash to Main Menu sequence | Transitions clean, < 3s init | PASS | `BUILD_PROD_QA_2026` | WebGL probed |
| **MENU** | `REG_MENU_01` | Main Menu interactive buttons | No memory leaks, active focus | PASS | `BUILD_PROD_QA_2026` | Safe transitions |
| **ACCOUNT** | `REG_ACCT_01` | Guest vs Email Auth & Token safety | Zero enumeration, 24h token | PASS | `BUILD_PROD_QA_2026` | Sanitized inputs |
| **PLAYER** | `REG_PLYR_01` | Locomotion, Biomechanics & Safe Bounds | No NaN, y >= -50m, 17-state rig | PASS | `BUILD_PROD_QA_2026` | Floor protection active |
| **MOVEMENT** | `REG_MOVE_01` | Decel, Sprint, Pivot180, Surface Drag | Frame-independent dt | PASS | `BUILD_PROD_QA_2026` | 30/60/120 FPS parity |
| **CAMERA** | `REG_CAM_01` | Orbit, Collision, Photo Mode FOV | No clipping, ultrawide 21:9 FOV | PASS | `BUILD_PROD_QA_2026` | ThreeCanvas capture |
| **WORLD** | `REG_WRLD_01` | 8 Tamil Nadu Biomes & Streaming Chunks | Deterministic WorldRNG | PASS | `BUILD_PROD_QA_2026` | Region boundaries |
| **NPC** | `REG_NPC_01` | Schedules, Perception & Bilingual Dialogue | No teleport navigation | PASS | `BUILD_PROD_QA_2026` | Murugan routine pass |
| **WILDLIFE** | `REG_WILD_01` | 9 Native Species & Flee/Alert AI | Nilgiri Tahr & Elephant defence | PASS | `BUILD_PROD_QA_2026` | Biome spawns verified |
| **QUEST** | `REG_QST_01` | 7-Chapter Arc & Prerequisite Integrity | Zero-reward duplication | PASS | `BUILD_PROD_QA_2026` | Atomic reward claims |
| **DIALOGUE**| `REG_DLG_01` | Bilingual Tamil/English Choice Trees | Tamil script rendered cleanly | PASS | `BUILD_PROD_QA_2026` | Audio cues linked |
| **INVESTIGATION** | `REG_INVG_01` | Clue Board & Red Yarn Deductions | Accurate hypothesis evaluation | PASS | `BUILD_PROD_QA_2026` | Non-blocking |
| **INVENTORY** | `REG_INV_01` | 20kg Satchel Capacity & Item Stacks | No negative quantities | PASS | `BUILD_PROD_QA_2026` | Weight enforced |
| **CRAFTING** | `REG_CRFT_01` | Traditional Crafting & Recipe Unlocks | Recipes consume exact items | PASS | `BUILD_PROD_QA_2026` | Deterministic |
| **ECONOMY** | `REG_ECON_01` | Single Deduction Authority & Prices | Balance >= 0, tea kadai trade | PASS | `BUILD_PROD_QA_2026` | Negative values rejected |
| **TRANSPORT** | `REG_TRNS_01` | Madras Auto & Coracle Boat Routes | No locked destination travel | PASS | `BUILD_PROD_QA_2026` | Fare validation |
| **WEATHER** | `REG_WTHR_01` | Monsoon Rain, Thunderstorm & Mist | Dynamic wetness & puddle decals | PASS | `BUILD_PROD_QA_2026` | Bounded particle counts |
| **AUDIO** | `REG_AUD_01` | Positional Ambience & Footsteps | Silent fallback if audio fails | PASS | `BUILD_PROD_QA_2026` | Leaks bounded |
| **PHOTO** | `REG_PHT_01` | 3D Viewfinder & Snapshot Metadata | Correct subject identification | PASS | `BUILD_PROD_QA_2026` | Gallery saved |
| **SETTINGS** | `REG_SETT_01` | Graphics presets & Target FPS (30-240) | Hot apply without full reload | PASS | `BUILD_PROD_QA_2026` | Persisted to storage |
| **ACCESSIBILITY**| `REG_ACC_01` | Key remapping & Gamepad support | Disconnect triggers fallback | PASS | `BUILD_PROD_QA_2026` | Keyboard remains active |
| **SAVE** | `REG_SAVE_01` | Atomic Save, Checkpoint & Backup | Valid save never overwritten | PASS | `BUILD_PROD_QA_2026` | Backup restore pass |
| **CLOUD** | `REG_CLD_01` | 3-Way Merge & Revision Numbers | Timestamp arbitration | PASS | `BUILD_PROD_QA_2026` | Network resilient |
| **MULTIPLAYER** | `REG_NET_01` | 5-Player Lobby & 20Hz Throttling | Host migration, no desync crash | PASS | `BUILD_PROD_QA_2026` | Single socket session |
| **PERFORMANCE** | `REG_PERF_01` | VERY_LOW to ULTRA Adaptive Scaling | 3.5s/6.5s hysteresis, 1% low | PASS | `BUILD_PROD_QA_2026` | Single authority (PM) |
| **RECOVERY** | `REG_RCV_01` | Safe Mode & WebGL Context Restore | Dialog offers safe actions | PASS | `BUILD_PROD_QA_2026` | Zero raw stack traces |
| **CUSTOMIZATION**| `REG_CUST_01` | Permanent Progression Customization | **0 <= changes <= 5 strictly** | PASS | `BUILD_PROD_QA_2026` | **6th change blocked** |
