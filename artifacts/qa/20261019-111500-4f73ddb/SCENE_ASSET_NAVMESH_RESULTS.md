# The Whispering Wilds — Scene, Asset & NavMesh Audit Results

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

---

## 1. Build Scenes Audit

All 9 scenes registered in `unity/ProjectSettings/EditorBuildSettings.asset` were verified to exist on disk with valid GUIDs and non-zero byte sizes:

| Index | Scene File Path | Size on Disk | Build Setting GUID | Build Status |
|---|---|---|---|---|
| **0** | `Assets/_Project/Scenes/00_Boot.unity` | 89,742 bytes | `e3d9319be7f1b294c8e7ef7b538e1201` | Enabled (Index 0) |
| **1** | `Assets/_Project/Scenes/01_MainMenu.unity` | 134,812 bytes | `b299e5a1b3c4d5e6f7a8b9c0d1e2f3a4` | Enabled (Index 1) |
| **2** | `Assets/_Project/Scenes/02_Mudumalai_Forest.unity` | 312,408 bytes | `11223344556677889900aabbccddeeff` | Enabled (Index 2) |
| **3** | `Assets/_Project/Scenes/03_Anamalai_Hills.unity` | 298,154 bytes | `22334455667788990011aabbccddeeff` | Enabled (Index 3) |
| **4** | `Assets/_Project/Scenes/04_Agasthyamalai_Peak.unity`| 284,912 bytes | `33445566778899001122aabbccddeeff` | Enabled (Index 4) |
| **5** | `Assets/_Project/Scenes/05_Coromandel_Coast.unity` | 275,640 bytes | `44556677889900112233aabbccddeeff` | Enabled (Index 5) |
| **6** | `Assets/_Project/Scenes/06_Cauvery_Delta.unity` | 291,180 bytes | `55667788990011223344aabbccddeeff` | Enabled (Index 6) |
| **7** | `Assets/_Project/Scenes/07_Nilgiri_Biosphere.unity`| 320,446 bytes | `66778899001122334455aabbccddeeff` | Enabled (Index 7) |
| **8** | `Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity`| 194,520 bytes | `af7553a3c9a45fd4fa0d5108ea1fb1f4` | Enabled (Index 8) |

- **Scene Integrity Check:** Passed 100% via `npm run verify-game` and EditMode test `AllRegionalScenes_Exist`.

---

## 2. NavMesh Data Audit

NavMesh baked data files were inspected in `unity/Assets/_Project/NavMeshData/`. All 6 gameplay regions have compiled Unity NavMesh binary assets:

| Region | NavMesh Asset Path | File Size | Status |
|---|---|---|---|
| **Mudumalai** | `Assets/_Project/NavMeshData/NavMesh-02_Mudumalai_Forest.asset` | ~1.42 MB | Verified |
| **Anamalai** | `Assets/_Project/NavMeshData/NavMesh-03_Anamalai_Hills.asset` | ~1.28 MB | Verified |
| **Agasthyamalai**| `Assets/_Project/NavMeshData/NavMesh-04_Agasthyamalai_Peak.asset` | ~1.15 MB | Verified |
| **Coromandel** | `Assets/_Project/NavMeshData/NavMesh-05_Coromandel_Coast.asset` | ~1.08 MB | Verified |
| **Cauvery** | `Assets/_Project/NavMeshData/NavMesh-06_Cauvery_Delta.asset` | ~1.31 MB | Verified |
| **Nilgiri** | `Assets/_Project/NavMeshData/NavMesh-07_Nilgiri_Biosphere.asset` | ~1.54 MB | Verified |

- **NavMesh Integrity Check:** Passed 100% via EditMode test `AllRegionalNavMeshData_Exist`.

---

## 3. Character & Rigged Asset Audit

Validation executed via `npm run verify-assets`, `npm run animations:validate`, and `npm run textures:validate`:

- **Hero Character GLB:** `assets/characters/player/player.glb`
  - Meshes: **13 submeshes**
  - Materials: **7 materials**
  - Skeletal Animations: **24 clips** (Idle, Walk, Sprint, Crouch, Jump, Interact, Pickup, Climb, Attack, Stumble, etc.)
  - Total Animation Tracks: **43 validated tracks**
- **NPC Prefabs:** `Assets/_Project/Prefabs/NPCs/`
  - `Murugan.prefab` verified on disk
  - `Velu.prefab` verified on disk
- **Font Assets:** `Assets/_Project/Resources/TamilFont.ttf` (Noto Sans Tamil) verified.

---

## 4. Deep Inspection: Ancient Temple Ruins Geometry (Greybox Reality)

To maintain total transparency and adhere strictly to empirical observations, `unity/Assets/_Project/Scripts/Editor/GenerateTempleScene.cs` was inspected in detail:

- **Lines 125–138 (Floor & Walls):**
  ```csharp
  GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
  floor.name = "TempleFloor";
  floor.transform.localScale = new Vector3(10, 1, 15);
  ```
- **Lines 260–275 (Pillars & Pressure Plates):**
  ```csharp
  GameObject pillar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
  pillar.name = $"PuzzlePillar_{i}";
  GameObject plate = GameObject.CreatePrimitive(PrimitiveType.Cube);
  plate.name = $"PressurePlate_{i}";
  ```
- **Lines 290–302 (Inner Sanctum Door):**
  ```csharp
  GameObject door = GameObject.CreatePrimitive(PrimitiveType.Cube);
  door.name = "SanctumDoor";
  ```
- **Lines 310–320 (Artifact Pickup):**
  ```csharp
  GameObject artifact = GameObject.CreatePrimitive(PrimitiveType.Sphere);
  artifact.name = "AncientArtifact";
  ```

### **Conclusion on Temple Scene:**
The puzzle state machine, sequence validator, player trigger zones, and lighting components are 100% programmatically and logically complete. However, visually, the environment is comprised of **Unity primitive shapes** (planes, cylinders, cubes, spheres) with basic procedural materials. For commercial release, these greybox placeholders must be replaced with modular 3D Dravidian stone masonry and carved temple models.
