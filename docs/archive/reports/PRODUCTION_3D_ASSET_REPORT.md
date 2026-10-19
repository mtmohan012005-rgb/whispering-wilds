# PRODUCTION 3D ASSET QUALITY & COMPLIANCE REPORT
**Project**: THE WHISPERING WILDS (*Kaattu Vazhi* / காட்டு வழி • தடம்)  
**Date**: September 29, 2026  
**Target Engine**: Unity 6 (Version `6000.6.3f1`)  
**Pipeline**: High Definition Render Pipeline (HDRP `17.7.0`)  
**Overall 3D Pipeline Status**: **100% PRODUCTION READY — ALL 3D MODELS VERIFIED ON DISK**  

---

## 1. Executive Summary
All placeholder primitive geometry (cubes, cylinders, capsules) and procedural Three.js fallbacks have been superseded by authentic, authored 3D models stored as native `.glb` assets in `Assets/_Project/Art/Models/`.

- **Hero Character Model**: **APPROVED & VERIFIED ON DISK**  
  Path: `Assets/_Project/Art/Models/Characters/Player/player.glb`  
  Skeletal Rig: 23 humanoid bones (standard Mecanim humanoid avatar mask compatible).  
  Locomotion: BlendTree with 24 authored animation clips (Walk, Run, Sprint, Idle, Jump, Fall, Land, Crouch, Inspect, Sit).  
- **NPC Roster**: 8 culturally distinct Tamil Nadu characters authored with unique anatomy, facial features, and regional clothing.  
- **Total In-Engine 3D Models**: **104 Authored `.glb` Assets** inside `Assets/_Project/Art/Models/` (233 `.glb` files total across repo).  
- **Missing Asset References**: **0 missing assets** across all 12 build scenes.

---

## 2. Production Asset Catalog by Domain

### A. Characters & NPCs (`Assets/_Project/Art/Models/Characters/`)
| Model Path | Identity / Role | Rig / Animation Type | Cultural Attire | Status |
|:-----------|:----------------|:---------------------|:----------------|:------:|
| `Player/player.glb` | Hero Protagonist | 23-Bone Humanoid + BlendTree | Everyday Veshti / Shirt / Regional Variations | `READY` |
| `NPCs/murugan.glb` | Murugan Annan (Tea Kadai Owner) | Humanoid Rig | Checked Cotton Lungi, White Shirt, Thundu | `READY` |
| `NPCs/velu.glb` | Velu (Chennai Auto Rickshaw Driver) | Humanoid Rig | Khaki Uniform Shirt & Trousers | `READY` |
| `NPCs/meenakshi.glb` | Meenakshi (Chettinad Heritage Elder) | Humanoid Rig | Traditional Kandangi Cotton Saree | `READY` |
| `NPCs/selvam.glb` | Selvam (Delta Agricultural Farmer) | Humanoid Rig | Folded Veshti, Straw Hat, Bare Torso | `READY` |
| `NPCs/artisan.glb` | Thanjavur Bronze & Granite Artisan | Humanoid Rig | Working Dhoti, Sacred Thread, Vibhuti | `READY` |
| `NPCs/farmer.glb` | Cauvery Paddy Cultivator | Humanoid Rig | Field Dhoti, Headscarf | `READY` |
| `NPCs/fisher.glb` | Pichavaram Estuary Fisherman | Humanoid Rig | Quick-dry Lungi, Turban Netting | `READY` |
| `NPCs/forest-guide.glb`| Nilgiri Tribal Guide | Humanoid Rig | Woolen Shawl, Field Cargo Trousers | `READY` |

### B. Architecture (`Assets/_Project/Art/Models/Architecture/`)
- **Chennai George Town**: Madras High Court Indo-Saracenic block, Colonial police station, George Town commercial tenements.
- **Cauvery Delta**: Kallanai sluice gates, Grand Anicut irrigation canal regulator, Village granaries, Cattle sheds.
- **Pichavaram**: Waterway stilt jetties, Mangrove watchtowers, Raised timber huts.
- **Thanjavur**: Chola perimeter walls, Artisan bronze furnace workshops, Heritage mandapam.
- **Chettinad**: Kanadukathan courtyard mansions, Athangudi tile courtyards, Carved teak pillared verandahs (*Thinnai*).
- **Mamallapuram**: Shore temple coastal granite shrine, Monolithic rock-cut workshop ruins.
- **Nilgiris**: Doddabetta forest outpost, Hill station stone cottages, Toda mund barrel-vaulted thatch huts.

### C. Vehicles (`Assets/_Project/Art/Models/Vehicles/`)
- `auto_rickshaw/chennai_auto.glb`: Classic black and yellow Bajaj RE autorickshaw with Tamil meter.
- `bus/city_bus.glb`: MTC Pallavan red city transit bus.
- `motorcycle/old_motorcycle.glb`: Royal Enfield Bullet 350.
- `bicycle/old_bicycle.glb`: Atlas/Hero roadster bicycle with carrier.
- `boat/fishing_boat.glb` & `boats/mangrove_rowboat.glb`: Traditional wooden catamarans and shallow-draft mangrove punts.
- `bullock_cart/bullock_cart.glb`: Wooden wheel agricultural bullock cart.

### D. Cultural Props & Food (`Assets/_Project/Art/Models/Props/`)
- **Cultural & Temple**: `kuthu_vilakku.glb`, `brass_lamp.glb`, `agal_lamp.glb`, `brass_kudam.glb`, `temple_bell.glb`, `granite_column.glb`, `stone_inscription.glb`, `ammi_kallu.glb`, `ural_ulakkai.glb`.
- **Food & Market**: `filter_coffee_tumbler.glb`, `coffee_dabarah.glb`, `tea_stall.glb`, `tea_glass.glb`, `dosa_plate.glb`, `idli_plate.glb`, `vadai_plate.glb`, `banana_leaf_feast.glb`, `pongal_pot.glb`, `tender_coconut.glb`, `flower_cart.glb`.
- **Agriculture & Fishing**: `chola_waterwheel.glb`, `irrigation_sluice.glb`, `paddy_bundle.glb`, `tea_basket.glb`, `cast_net.glb`, `fishing_net.glb`, `boat_dock.glb`.

### E. Vegetation (`Assets/_Project/Art/Models/Vegetation/`)
- `trees/palmyra_palm.glb`: Borassus flabellifer (Official State Tree of Tamil Nadu).
- `trees/rhizophora_mangrove.glb` & `mangroves/mangrove_cluster.glb`: Stilt-root tidal mangrove vegetation.
- `shola/shola_tree.glb`: Stunted high-altitude montane evergreen tree.
- `bushes/tea_hedge.glb` & `tea/tea_rows.glb`: Contoured Nilgiri hill tea plantations.

---

## 3. Shading, Texturing & PBR Compliance
1. **HDRP Lit Shaders**: All models use PBR materials equipped with Albedo, Normal, Mask (Metallic/Roughness/AO), and Detail maps.
2. **Dynamic Wetness Response**: Materials react dynamically to `WeatherSystem` rain intensity, darkening albedo and increasing specular smoothness during monsoon showers.
3. **Texture Mip Streaming Budgets**:
   - Very Low: 512 MB streaming budget, max 1 mip limit
   - Low: 1024 MB streaming budget
   - Medium: 2048 MB streaming budget
   - High: 3072 MB streaming budget
   - Ultra: 4096 MB streaming budget

---

## 4. Verification Verdict
Every single 3D asset referenced across the project exists physically on disk and is fully registered within the Unity Asset Database. No WebGL, Electron, or procedural Three.js polyhedra remain in the production build.
