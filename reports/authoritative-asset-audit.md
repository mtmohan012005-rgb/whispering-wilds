# Authoritative Asset Audit

Generated `2026-09-28T01:24:17.273Z` by `scripts/authoritative-asset-audit.js` from the working tree at `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds`.

> This report **supersedes** ASSET_AUDIT_REPORT.json, BUILD_REPORT.json, PRODUCTION_ASSET_STATUS.json, PRODUCTION_3D_ASSET_REPORT.json, DATA_AUDIT_REPORT.json.
> No figure below is hardcoded; every number is recomputed from the current repository.

## Method
- **note**: No count in this document is hardcoded. Existence is decided by fs.statSync on the working tree.
- **referenceExtraction**: Regex over asset/... literals in js, css, index.html, server, desktop, scripts, tools, config, content
- **templatedReferences**: References containing ${...} are flagged dynamicTemplate=true and are NOT resolved as literal paths
- **externalReferences**: Absolute http(s), data: and blob: references are excluded from the repo inventory
- **glbInspection**: 12-byte GLB header + JSON chunk parsed directly; meshes/skins/animations/materials/images counted

## Totals
| Metric | Value |
| --- | --- |
| Physical asset files | 167 |
| Physical asset bytes | 3,03,39,118 |
| Source files scanned | 637 |
| Distinct referenced paths | 274 |
| Total reference occurrences | 341 |
| **PRESENT** | **131** |
| **MISSING** | **143** |
| Case-mismatched paths | 0 |
| Templated / dynamic references | 4 |
| Unused physical assets | 34 |
| Duplicate groups | 27 |
| GLB files on disk | 124 |

## By category
| Category | Referenced | Present | Missing |
| --- | --- | --- | --- |
| AUDIO_FOOTSTEPS | 36 | 0 | 36 |
| AUDIO_OTHER | 23 | 0 | 23 |
| AUDIO_MUSIC | 19 | 0 | 19 |
| AUDIO_WILDLIFE | 19 | 0 | 19 |
| AUDIO_AMBIENCE | 17 | 0 | 17 |
| AUDIO_VEHICLES | 7 | 0 | 7 |
| TEXTURE | 17 | 11 | 6 |
| AUDIO_VOICE | 5 | 0 | 5 |
| AUDIO_WEATHER | 5 | 0 | 5 |
| CHARACTER | 24 | 20 | 4 |
| ARCHITECTURE | 27 | 25 | 2 |
| ENVIRONMENT | 7 | 7 | 0 |
| ICON | 1 | 1 | 0 |
| OTHER | 1 | 1 | 0 |
| PROP | 54 | 54 | 0 |
| VEHICLE | 8 | 8 | 0 |
| VEGETATION | 4 | 4 | 0 |

## By region
| Region | Referenced | Present | Missing |
| --- | --- | --- | --- |
| NILGIRI | 18 | 10 | 8 |
| CHENNAI | 14 | 8 | 6 |
| CHETTINAD | 11 | 5 | 6 |
| PICHAVARAM | 10 | 4 | 6 |
| DELTA | 7 | 2 | 5 |
| MAMALLAPURAM | 9 | 6 | 3 |
| THANJAVUR | 5 | 2 | 3 |

## GLB inventory (physically parsed)
| Path | Bytes | Valid | Meshes | Nodes | Skins | Anim | Mats | Imgs | Embedded | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `assets/architecture/chennai/electrical_pole.glb` | 7036 | yes | 4 | 4 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/chennai/market_building.glb` | 13012 | yes | 8 | 8 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/architecture/chennai/old_tamil_house.glb` | 7296 | yes | 4 | 4 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/architecture/chennai/street_row.glb` | 19256 | yes | 11 | 11 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/architecture/chennai/tea_kadai_stall.glb` | 12796 | yes | 8 | 8 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/architecture/chettinad/athangudi_floor.glb` | 2040 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/architecture/chettinad/carved_door.glb` | 3616 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/chettinad/courtyard_mansion.glb` | 15196 | yes | 9 | 9 | 0 | 0 | 4 | 0 | 0 | - |
| `assets/architecture/chettinad/wooden_column.glb` | 3800 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/delta/irrigation_sluice.glb` | 7180 | yes | 4 | 4 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/mamallapuram/heritage_structure.glb` | 3776 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/mamallapuram/stone_workshop.glb` | 3776 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/nilgiris/forest_station.glb` | 3784 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/nilgiris/hill_house.glb` | 3784 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/nilgiris/toda_mund_hut.glb` | 7416 | yes | 4 | 4 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/sanctuary/botanical_portal.glb` | 3784 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/thanjavur_gopuram.glb` | 10244 | yes | 6 | 6 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/thanjavur/artisan_workshop.glb` | 3776 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/thanjavur/heritage_temple_area.glb` | 10244 | yes | 6 | 6 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/village/cattle_shed.glb` | 7668 | yes | 5 | 5 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/village/granary.glb` | 3840 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/architecture/village/village_house.glb` | 3812 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/npcs/artisan.glb` | 7196 | yes | 4 | 4 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/npcs/farmer.glb` | 7644 | yes | 4 | 4 | 0 | 0 | 4 | 0 | 0 | - |
| `assets/characters/npcs/fisher.glb` | 7508 | yes | 4 | 4 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/npcs/forest-guide.glb` | 9012 | yes | 5 | 5 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/npcs/meenakshi.glb` | 10904 | yes | 6 | 6 | 0 | 0 | 5 | 0 | 0 | - |
| `assets/characters/npcs/murugan.glb` | 12568 | yes | 7 | 7 | 0 | 0 | 5 | 0 | 0 | - |
| `assets/characters/npcs/selvam.glb` | 10228 | yes | 6 | 6 | 0 | 0 | 4 | 0 | 0 | - |
| `assets/characters/npcs/velu.glb` | 9044 | yes | 5 | 5 | 0 | 0 | 4 | 0 | 0 | - |
| `assets/characters/player/player.glb` | 43952 | yes | 13 | 22 | 1 | 24 | 7 | 0 | 0 | - |
| `assets/characters/wildlife/cattle.glb` | 13560 | yes | 9 | 9 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/wildlife/egret.glb` | 7620 | yes | 5 | 5 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/wildlife/elephant.glb` | 17660 | yes | 11 | 11 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/wildlife/gaur.glb` | 19620 | yes | 13 | 13 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/wildlife/goat.glb` | 12232 | yes | 8 | 8 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/wildlife/kingfisher.glb` | 5504 | yes | 3 | 3 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/characters/wildlife/nilgiri-langur.glb` | 9764 | yes | 6 | 6 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/wildlife/nilgiri-tahr.glb` | 12232 | yes | 8 | 8 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/characters/wildlife/peafowl.glb` | 6868 | yes | 4 | 4 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/environment/mamallapuram/coastal_rock.glb` | 1936 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/environment/mamallapuram/granite_boulder.glb` | 1936 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/environment/nilgiris/forest_path.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/environment/nilgiris/grassland.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/environment/nilgiris/waterfall.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/environment/pichavaram/canal.glb` | 3648 | yes | 2 | 2 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/environment/pichavaram/mud_bank.glb` | 3648 | yes | 2 | 2 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/landmarks/chennai/madras_high_court.glb` | 19560 | yes | 12 | 12 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/landmarks/mamallapuram/shore_temple.glb` | 18488 | yes | 11 | 11 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/landmarks/nilgiris/tea_factory_heritage.glb` | 5496 | yes | 3 | 3 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/landmarks/pichavaram/mangrove_dock.glb` | 13308 | yes | 9 | 9 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/agriculture/farm_tools.glb` | 3576 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/agriculture/forest_sign.glb` | 2068 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/irrigation_sluice.glb` | 2104 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/paddy_bundle.glb` | 1768 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/palm_leaf_basket.glb` | 1768 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/stone_wall.glb` | 2068 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/tea_basket.glb` | 1768 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/water_pump.glb` | 2104 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/agriculture/wooden_fence.glb` | 2068 | yes | 1 | 1 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/chola_waterwheel.glb` | 3780 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/craft/artisan_tools.glb` | 3576 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/craft/bronze_art_object.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/craft/stone_carving_tools.glb` | 3576 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/craft/stone_sculpture.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/cultural/agal_lamp.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/ammi_kallu.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/brass_kudam.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/cast_net.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/clay_pot.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/coffee_dabarah.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/korai_mat.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/kuthu_vilakku.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/cultural/manai_stool.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/palm_kottan.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/sickle.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/cultural/ural_ulakkai.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/fishing/boat_dock.glb` | 2240 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/fishing/fish_crate.glb` | 2240 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/fishing/fishing_net.glb` | 2240 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/fishing/paddle.glb` | 2240 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/fishing/rope.glb` | 2240 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/food/banana_leaf_feast.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/brass_vessels.glb` | 5036 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/food/curd_rice_plate.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/dosa_plate.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/filter_coffee_tumbler.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/idli_plate.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/pongal_pot.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/sugarcane_bundle.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/sweet_pongal_earthen.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/tea_glass.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/tea_stall.glb` | 5460 | yes | 3 | 3 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/food/tender_coconut.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/food/vadai_plate.glb` | 2116 | yes | 1 | 1 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/household/brass_vessel.glb` | 5036 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/household/clay_pot.glb` | 3480 | yes | 2 | 2 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/household/heritage_furniture.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/household/water_pot.glb` | 3480 | yes | 2 | 2 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/household/wooden_bench.glb` | 6532 | yes | 4 | 4 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/household/wooden_stool.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/market/flower_cart.glb` | 8812 | yes | 5 | 5 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/props/market/street_sign.glb` | 5324 | yes | 3 | 3 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/temple/brass_lamp.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/temple/granite_column.glb` | 3800 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/props/temple/kuthu_vilakku.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/temple/stone_inscription.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/props/temple/temple_bell.glb` | 4844 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/vegetation/bushes/tea_hedge.glb` | 5260 | yes | 3 | 3 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vegetation/mangroves/mangrove_cluster.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vegetation/shola/shola_tree.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vegetation/tea/tea_rows.glb` | 2180 | yes | 1 | 1 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vegetation/trees/palmyra_palm.glb` | 7100 | yes | 4 | 4 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vegetation/trees/rhizophora_mangrove.glb` | 10612 | yes | 6 | 6 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vehicles/auto_rickshaw/chennai_auto.glb` | 8592 | yes | 5 | 5 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/vehicles/bicycle/old_bicycle.glb` | 8712 | yes | 5 | 5 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vehicles/boat/fishing_boat.glb` | 3940 | yes | 2 | 2 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vehicles/boat/wooden_boat.glb` | 5464 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/vehicles/boats/mangrove_rowboat.glb` | 11812 | yes | 7 | 7 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vehicles/bullock_cart/bullock_cart.glb` | 8852 | yes | 5 | 5 | 0 | 0 | 2 | 0 | 0 | - |
| `assets/vehicles/bus/city_bus.glb` | 10124 | yes | 6 | 6 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/vehicles/mangrove_boat.glb` | 5464 | yes | 3 | 3 | 0 | 0 | 1 | 0 | 0 | - |
| `assets/vehicles/motorcycle/old_motorcycle.glb` | 8900 | yes | 5 | 5 | 0 | 0 | 3 | 0 | 0 | - |
| `assets/wildlife/nilgiri_tahr.glb` | 12260 | yes | 8 | 8 | 0 | 0 | 2 | 0 | 0 | - |

## Missing references (full reverse map)
Total missing: **143**

### Classification of every missing path
A missing literal is only a live defect if a module that `index.html` actually loads references it.

| Class | Count | Meaning |
| --- | --- | --- |
| `A_RUNTIME_REQUIRED_MISSING` | 100 | Loaded by a shipped module, no fallback in that module. Live gameplay gap. |
| `B_RUNTIME_FALLBACK` | 35 | Loaded by a shipped module, but the module builds a procedural stand-in on failure. |
| `C_DEVTOOL_DECLARED_ONLY` | 2 | Declared only by scripts/tools/validators the page never loads. No runtime impact. |
| `D_PATH_DRIFT_EXISTS_ELSEWHERE` | 1 | The same model exists on disk at another path. Fix the reference. |
| `E_WIRED_BUT_UNCONFIRMED` | 5 | Referenced by a non-dev file that index.html does not load. |
| `F_NO_TRACEABLE_SOURCE` | 0 | No traceable source reference. |

### Class A - runtime-required, no fallback (the real defects)
| Missing path | Subsystem | Loaded by | Source |
| --- | --- | --- | --- |
| `assets/architecture/chettinad/heritage_house.glb` | DATA_REGISTRY js/data/world-asset-registry.js | js/data/world-asset-registry.js | `js/data/world-asset-registry.js:531` |
| `assets/audio/ambience/cauvery-delta/farmland_breeze.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:43` |
| `assets/audio/ambience/cauvery-delta/night_crickets.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:56` |
| `assets/audio/ambience/chennai/coastal_night_breeze.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:28` |
| `assets/audio/ambience/chennai/george_town_market.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:15` |
| `assets/audio/ambience/chettinad/courtyard_reverb.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:99` |
| `assets/audio/ambience/mamallapuram/coastal_waves.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:127` |
| `assets/audio/ambience/nilgiris/mountain_wind_shola.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:141` |
| `assets/audio/ambience/pichavaram/mangrove_water.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:71` |
| `assets/audio/ambience/pichavaram/wooden_boat_creak.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:84` |
| `assets/audio/ambience/thanjavur/temple_bronze_hammer.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:113` |
| `assets/audio/dialogue/tamil/karthik_guide_warn_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:450` |
| `assets/audio/dialogue/tamil/murugan_greeting_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:432` |
| `assets/audio/dialogue/tamil/selvam_bull_lost_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:441` |
| `assets/audio/footsteps/cloth/canvas_gear.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:249` |
| `assets/audio/footsteps/cloth/cotton_rustle.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:248` |
| `assets/audio/footsteps/cloth/silk_soft.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:250` |
| `assets/audio/footsteps/cloth/veshti_swish.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:247` |
| `assets/audio/footsteps/cloth/wool_heavy.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:251` |
| `assets/audio/footsteps/grass/crouch_grass_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:217` |
| `assets/audio/footsteps/grass/run_grass_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:215` |
| `assets/audio/footsteps/grass/sprint_grass_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:216` |
| `assets/audio/footsteps/grass/step_grass_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:214` |
| `assets/audio/footsteps/grass/step_grass_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:214` |
| `assets/audio/footsteps/mud/crouch_mud_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:210` |
| `assets/audio/footsteps/mud/run_mud_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:208` |
| `assets/audio/footsteps/mud/sprint_mud_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:209` |
| `assets/audio/footsteps/mud/step_mud_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:207` |
| `assets/audio/footsteps/mud/step_mud_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:207` |
| `assets/audio/footsteps/sand/crouch_sand_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:224` |
| `assets/audio/footsteps/sand/run_sand_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:222` |
| `assets/audio/footsteps/sand/sprint_sand_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:223` |
| `assets/audio/footsteps/sand/step_sand_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:221` |
| `assets/audio/footsteps/sand/step_sand_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:221` |
| `assets/audio/footsteps/stone/crouch_stone_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:203` |
| `assets/audio/footsteps/stone/run_stone_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:201` |
| `assets/audio/footsteps/stone/run_stone_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:201` |
| `assets/audio/footsteps/stone/sprint_stone_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:202` |
| `assets/audio/footsteps/stone/step_stone_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:200` |
| `assets/audio/footsteps/stone/step_stone_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:200` |
| `assets/audio/footsteps/water/crouch_water_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:238` |
| `assets/audio/footsteps/water/run_water_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:236` |
| `assets/audio/footsteps/water/sprint_water_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:237` |
| `assets/audio/footsteps/water/step_water_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:235` |
| `assets/audio/footsteps/water/step_water_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:235` |
| `assets/audio/footsteps/wood/crouch_wood_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:231` |
| `assets/audio/footsteps/wood/run_wood_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:229` |
| `assets/audio/footsteps/wood/sprint_wood_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:230` |
| `assets/audio/footsteps/wood/step_wood_01.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:228` |
| `assets/audio/footsteps/wood/step_wood_02.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:228` |
| `assets/audio/interaction/doors/chettinad_teak_door_close.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:333` |
| `assets/audio/interaction/doors/chettinad_teak_door_open.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:332` |
| `assets/audio/interaction/food/banana_leaf_serve.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:348` |
| `assets/audio/interaction/metal/bronze_relic_pickup.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:335` |
| `assets/audio/interaction/objects/canvas_satchel_close.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:340` |
| `assets/audio/interaction/objects/canvas_satchel_open.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:339` |
| `assets/audio/interaction/objects/mechanical_shutter_click.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:338` |
| `assets/audio/interaction/objects/samovar_chai_meter_pour.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:341` |
| `assets/audio/interaction/stone/granite_keystone_lift.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:336` |
| `assets/audio/interaction/water/brass_chembu_fill.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:337` |
| `assets/audio/interaction/wood/wood_stick_pickup.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:334` |
| `assets/audio/music/chapter/nadaswaram_triumphant.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:401` |
| `assets/audio/music/discovery/temple_chime_stinger.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:346` |
| `assets/audio/music/exploration/campfire_dawn_peace.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:415` |
| `assets/audio/music/exploration/tamil_folk_acoustic.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:357` |
| `assets/audio/music/investigation/mystery_veena_pulse.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:372` |
| `assets/audio/music/tension/low_drone_percussion.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:380` |
| `assets/audio/music/tension/storm_danger_beat.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:408` |
| `assets/audio/music/village/chola_waterwheel_theme.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:387` |
| `assets/audio/music/wetlands/peaceful_shola_nature.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:394` |
| `assets/audio/puzzles/chola_sluice_open.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:344` |
| `assets/audio/puzzles/granite_waterwheel_turn.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:343` |
| `assets/audio/traversal/climb_grab_wood.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:342` |
| `assets/audio/traversal/water_wade_splash.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:345` |
| `assets/audio/vehicles/auto-rickshaw/auto_bulb_horn.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:310` |
| `assets/audio/vehicles/auto-rickshaw/auto_two_stroke_drive.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:309` |
| `assets/audio/vehicles/auto-rickshaw/auto_two_stroke_idle.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:308` |
| `assets/audio/vehicles/boat/hull_wood_groan.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:322` |
| `assets/audio/vehicles/boat/oar_dip_water.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:321` |
| `assets/audio/vehicles/bullock-cart/bullock_brass_bell.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:316` |
| `assets/audio/vehicles/bullock-cart/wooden_cart_creak.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:315` |
| `assets/audio/weather/rain/rain_heavy.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:168` |
| `assets/audio/weather/rain/rain_light.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:159` |
| `assets/audio/weather/thunder/thunder_distant.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:177` |
| `assets/audio/weather/wind/wind_mountain_gust.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:186` |
| `assets/audio/wildlife/birds/kingfisher_high_pip.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:290` |
| `assets/audio/wildlife/birds/peacock_heavy_wings.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:285` |
| `assets/audio/wildlife/birds/peacock_shrill_mayil.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:284` |
| `assets/audio/wildlife/mammals/cow_chew_grass.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:297` |
| `assets/audio/wildlife/mammals/elephant_low_rumble.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:272` |
| `assets/audio/wildlife/mammals/elephant_trumpet.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:273` |
| `assets/audio/wildlife/mammals/gaur_deep_grunt.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:278` |
| `assets/audio/wildlife/mammals/gaur_snort.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:279` |
| `assets/audio/wildlife/mammals/kangayam_bull_bellow.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:296` |
| `assets/audio/wildlife/mammals/langur_alarm_bark.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:267` |
| `assets/audio/wildlife/mammals/langur_whoop.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:266` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_scramble.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:261` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_snort.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:259` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_whistle.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:260` |
| `assets/audio/wildlife/wetland/water_dive_splash.mp3` | DATA_REGISTRY js/data/audio-production-data.js | js/data/audio-production-data.js | `js/data/audio-production-data.js:291` |

### Class D - path drift (asset already exists)
| Referenced path | Model actually on disk |
| --- | --- |
| `assets/architecture/chennai/madras_high_court.glb` | `assets/landmarks/chennai/madras_high_court.glb` |

## `assets/manifest.json` cross-check
Declared **36**, physically present **36**, missing **0**.
_The manifest does not claim any file that is absent. It is honest about what it lists._
## Player model deep inspection (`assets/characters/player/player.glb`)
| Property | Value |
| --- | --- |
| Bytes | 43952 |
| Valid glTF 2.0 binary | yes |
| Version | 2 |
| Meshes | 13 |
| Nodes | 22 |
| Skins (skeletal rig) | 1 |
| Animations | 24 |
| Materials | 7 |
| Texture maps | 0 |
| Images (embedded) | 0 |
| Embedded image bytes | 0 |
| External image URIs | 0 |
| Demo/Xbot base mesh | no |

Materials: `M_Skin_Tamil`, `M_Veshti_Kasavu`, `M_Shirt_Indigo`, `M_Hair_Black`, `M_Eyes_DarkBrown`, `M_Sandals_Leather`, `M_Angavastram_Gold`

Animations: `Player_Idle`, `Player_Walk`, `Player_Run`, `Player_Sprint`, `Player_Jump_Start`, `Player_Jump`, `Player_Fall`, `Player_Land`, `Player_Interact`, `Player_Pickup`, `Player_Inspect`, `Player_Use_Item`, `Player_Crouch_Idle`, `Player_Crouch_Walk`, `Player_Climb`, `Player_Climb_Start`, `Player_Climb_Loop`, `Player_Climb_End`, `Player_Swim`, `Player_Sit`, `Player_Stand`, `Player_Eat`, `Player_Drink`, `Player_Photo`

> PBR is present as metallic-roughness factors on 7 materials, but the file carries **zero texture maps** (`textures[]=0, images[]=0, samplers[]=0`). Every material uses a flat `baseColorFactor` only. This is flat-shaded PBR, not textured PBR.
## Reconciliation with the superseded `ASSET_AUDIT_REPORT.json`
Old report generated `2026-09-27T07:32:51.601Z`.

| Metric | Old | New |
| --- | --- | --- |
| Referenced paths | 306 | 274 |
| Found / present | 55 | 131 |
| Missing | 251 | 143 |

| Set comparison | Count |
| --- | --- |
| Old-missing still missing | 138 |
| Old-missing now present | 100 |
| Old-missing no longer statically referenced | 13 |
| Old-found still present and referenced | 30 |
| Old-found no longer referenced | 25 |
| New-missing not in the old missing list | 5 |

> Both scans are literal-string based. A difference in totals reflects which literals each scanner matched, not a change in what the game loads. The intersection (still-missing) is the stable figure.

## All missing references
| Missing path | Category | Region | Refs | Source files |
| --- | --- | --- | --- | --- |
| `../assets/ui/menu/menu-chennai.jpg` | TEXTURE | CHENNAI | 1 | `css/main.css:83` |
| `assets/architecture/chennai/madras_high_court.glb` | ARCHITECTURE | CHENNAI | 1 | `js/tools/asset-validator.js:34` |
| `assets/architecture/chettinad/heritage_house.glb` | ARCHITECTURE | CHETTINAD | 1 | `js/data/world-asset-registry.js:531` |
| `assets/audio/${def.id}.mp3` | AUDIO_OTHER | - | 1 | `js/audio/audio-registry.js:39` |
| `assets/audio/${id}.mp3` | AUDIO_OTHER | - | 3 | `js/engine/audio-manager.js:176`<br>`js/engine/audio-spatial.js:48`<br>`js/engine/audio-spatial.js:50` |
| `assets/audio/ambience/cauvery-delta/farmland_breeze.mp3` | AUDIO_AMBIENCE | DELTA | 1 | `js/data/audio-production-data.js:43` |
| `assets/audio/ambience/cauvery-delta/night_crickets.mp3` | AUDIO_AMBIENCE | DELTA | 1 | `js/data/audio-production-data.js:56` |
| `assets/audio/ambience/chennai/coastal_night_breeze.mp3` | AUDIO_AMBIENCE | CHENNAI | 1 | `js/data/audio-production-data.js:28` |
| `assets/audio/ambience/chennai/george_town_market.mp3` | AUDIO_AMBIENCE | CHENNAI | 1 | `js/data/audio-production-data.js:15` |
| `assets/audio/ambience/chettinad/courtyard_reverb.mp3` | AUDIO_AMBIENCE | CHETTINAD | 1 | `js/data/audio-production-data.js:99` |
| `assets/audio/ambience/city/chennai_day_bed.ogg` | AUDIO_AMBIENCE | CHENNAI | 1 | `js/data/audio-data.js:267` |
| `assets/audio/ambience/coast/mamallapuram_sea_bed.ogg` | AUDIO_AMBIENCE | MAMALLAPURAM | 1 | `js/data/audio-data.js:337` |
| `assets/audio/ambience/heritage/chettinad_courtyard_bed.ogg` | AUDIO_AMBIENCE | CHETTINAD | 1 | `js/data/audio-data.js:309` |
| `assets/audio/ambience/heritage/thanjavur_craft_temple_bed.ogg` | AUDIO_AMBIENCE | THANJAVUR | 1 | `js/data/audio-data.js:323` |
| `assets/audio/ambience/mamallapuram/coastal_waves.mp3` | AUDIO_AMBIENCE | MAMALLAPURAM | 1 | `js/data/audio-production-data.js:127` |
| `assets/audio/ambience/mountain/nilgiris_tea_wind_bed.ogg` | AUDIO_AMBIENCE | NILGIRI | 1 | `js/data/audio-data.js:351` |
| `assets/audio/ambience/nilgiris/mountain_wind_shola.mp3` | AUDIO_AMBIENCE | NILGIRI | 1 | `js/data/audio-production-data.js:141` |
| `assets/audio/ambience/pichavaram/mangrove_water.mp3` | AUDIO_AMBIENCE | PICHAVARAM | 1 | `js/data/audio-production-data.js:71` |
| `assets/audio/ambience/pichavaram/wooden_boat_creak.mp3` | AUDIO_AMBIENCE | PICHAVARAM | 1 | `js/data/audio-production-data.js:84` |
| `assets/audio/ambience/thanjavur/temple_bronze_hammer.mp3` | AUDIO_AMBIENCE | THANJAVUR | 1 | `js/data/audio-production-data.js:113` |
| `assets/audio/ambience/village/delta_paddy_day_bed.ogg` | AUDIO_AMBIENCE | DELTA | 1 | `js/data/audio-data.js:281` |
| `assets/audio/ambience/wetland/pichavaram_mangrove_bed.ogg` | AUDIO_AMBIENCE | PICHAVARAM | 1 | `js/data/audio-data.js:295` |
| `assets/audio/dialogue/tamil/karthik_guide_warn_01.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:450` |
| `assets/audio/dialogue/tamil/murugan_greeting_01.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:432` |
| `assets/audio/dialogue/tamil/selvam_bull_lost_01.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:441` |
| `assets/audio/footsteps/cloth/canvas_gear.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:249` |
| `assets/audio/footsteps/cloth/cotton_rustle.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:248` |
| `assets/audio/footsteps/cloth/silk_soft.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:250` |
| `assets/audio/footsteps/cloth/veshti_swish.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:247` |
| `assets/audio/footsteps/cloth/wool_heavy.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:251` |
| `assets/audio/footsteps/grass/crouch_grass_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:217` |
| `assets/audio/footsteps/grass/run_grass_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:215` |
| `assets/audio/footsteps/grass/sprint_grass_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:216` |
| `assets/audio/footsteps/grass/step_grass_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:214` |
| `assets/audio/footsteps/grass/step_grass_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:214` |
| `assets/audio/footsteps/mud/crouch_mud_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:210` |
| `assets/audio/footsteps/mud/run_mud_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:208` |
| `assets/audio/footsteps/mud/sprint_mud_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:209` |
| `assets/audio/footsteps/mud/step_mud_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:207` |
| `assets/audio/footsteps/mud/step_mud_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:207` |
| `assets/audio/footsteps/sand/crouch_sand_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:224` |
| `assets/audio/footsteps/sand/run_sand_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:222` |
| `assets/audio/footsteps/sand/sprint_sand_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:223` |
| `assets/audio/footsteps/sand/step_sand_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:221` |
| `assets/audio/footsteps/sand/step_sand_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:221` |
| `assets/audio/footsteps/stone/crouch_stone_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:203` |
| `assets/audio/footsteps/stone/run_stone_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:201` |
| `assets/audio/footsteps/stone/run_stone_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:201` |
| `assets/audio/footsteps/stone/sprint_stone_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:202` |
| `assets/audio/footsteps/stone/step_stone_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:200` |
| `assets/audio/footsteps/stone/step_stone_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:200` |
| `assets/audio/footsteps/water/crouch_water_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:238` |
| `assets/audio/footsteps/water/run_water_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:236` |
| `assets/audio/footsteps/water/sprint_water_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:237` |
| `assets/audio/footsteps/water/step_water_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:235` |
| `assets/audio/footsteps/water/step_water_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:235` |
| `assets/audio/footsteps/wood/crouch_wood_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:231` |
| `assets/audio/footsteps/wood/run_wood_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:229` |
| `assets/audio/footsteps/wood/sprint_wood_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:230` |
| `assets/audio/footsteps/wood/step_wood_01.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:228` |
| `assets/audio/footsteps/wood/step_wood_02.mp3` | AUDIO_FOOTSTEPS | - | 1 | `js/data/audio-production-data.js:228` |
| `assets/audio/interaction/doors/chettinad_teak_door_close.mp3` | AUDIO_OTHER | CHETTINAD | 1 | `js/data/audio-production-data.js:333` |
| `assets/audio/interaction/doors/chettinad_teak_door_open.mp3` | AUDIO_OTHER | CHETTINAD | 1 | `js/data/audio-production-data.js:332` |
| `assets/audio/interaction/food/banana_leaf_serve.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:348` |
| `assets/audio/interaction/metal/bronze_relic_pickup.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:335` |
| `assets/audio/interaction/objects/canvas_satchel_close.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:340` |
| `assets/audio/interaction/objects/canvas_satchel_open.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:339` |
| `assets/audio/interaction/objects/mechanical_shutter_click.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:338` |
| `assets/audio/interaction/objects/samovar_chai_meter_pour.mp3` | AUDIO_OTHER | - | 2 | `js/data/audio-production-data.js:341`<br>`js/data/audio-production-data.js:347` |
| `assets/audio/interaction/stone/granite_keystone_lift.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:336` |
| `assets/audio/interaction/water/brass_chembu_fill.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:337` |
| `assets/audio/interaction/wood/wood_stick_pickup.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:334` |
| `assets/audio/music/chapter/nadaswaram_triumphant.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:401` |
| `assets/audio/music/discovery/temple_chime_stinger.mp3` | AUDIO_MUSIC | - | 2 | `js/data/audio-production-data.js:346`<br>`js/data/audio-production-data.js:365` |
| `assets/audio/music/exploration/campfire_dawn_peace.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:415` |
| `assets/audio/music/exploration/tamil_folk_acoustic.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:357` |
| `assets/audio/music/festival/pongal_naadaswaram_beat.ogg` | AUDIO_MUSIC | - | 1 | `js/data/audio-data.js:253` |
| `assets/audio/music/investigation/mystery_veena_pulse.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:372` |
| `assets/audio/music/region/cauvery_delta_theme.ogg` | AUDIO_MUSIC | DELTA | 1 | `js/data/audio-data.js:141` |
| `assets/audio/music/region/chennai_theme.ogg` | AUDIO_MUSIC | CHENNAI | 1 | `js/data/audio-data.js:127` |
| `assets/audio/music/region/chettinad_theme.ogg` | AUDIO_MUSIC | CHETTINAD | 1 | `js/data/audio-data.js:169` |
| `assets/audio/music/region/mamallapuram_theme.ogg` | AUDIO_MUSIC | MAMALLAPURAM | 1 | `js/data/audio-data.js:197` |
| `assets/audio/music/region/nilgiris_theme.ogg` | AUDIO_MUSIC | NILGIRI | 1 | `js/data/audio-data.js:211` |
| `assets/audio/music/region/pichavaram_theme.ogg` | AUDIO_MUSIC | PICHAVARAM | 1 | `js/data/audio-data.js:155` |
| `assets/audio/music/region/thanjavur_theme.ogg` | AUDIO_MUSIC | THANJAVUR | 1 | `js/data/audio-data.js:183` |
| `assets/audio/music/story/ancient_curiosity.ogg` | AUDIO_MUSIC | - | 1 | `js/data/audio-data.js:225` |
| `assets/audio/music/story/discovery_chime.ogg` | AUDIO_MUSIC | - | 1 | `js/data/audio-data.js:239` |
| `assets/audio/music/tension/low_drone_percussion.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:380` |
| `assets/audio/music/tension/storm_danger_beat.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:408` |
| `assets/audio/music/village/chola_waterwheel_theme.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:387` |
| `assets/audio/music/wetlands/peaceful_shola_nature.mp3` | AUDIO_MUSIC | - | 1 | `js/data/audio-production-data.js:394` |
| `assets/audio/puzzles/chola_sluice_open.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:344` |
| `assets/audio/puzzles/granite_waterwheel_turn.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:343` |
| `assets/audio/sfx/footsteps/sandals_stone_01.ogg` | AUDIO_OTHER | - | 1 | `js/data/audio-data.js:449` |
| `assets/audio/transport/auto_2stroke_idle.ogg` | AUDIO_OTHER | - | 1 | `js/data/audio-data.js:421` |
| `assets/audio/transport/wood_oar_stroke_pichavaram.ogg` | AUDIO_OTHER | PICHAVARAM | 1 | `js/data/audio-data.js:435` |
| `assets/audio/traversal/climb_grab_wood.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:342` |
| `assets/audio/traversal/water_wade_splash.mp3` | AUDIO_OTHER | - | 1 | `js/data/audio-production-data.js:345` |
| `assets/audio/vehicles/auto-rickshaw/auto_bulb_horn.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:310` |
| `assets/audio/vehicles/auto-rickshaw/auto_two_stroke_drive.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:309` |
| `assets/audio/vehicles/auto-rickshaw/auto_two_stroke_idle.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:308` |
| `assets/audio/vehicles/boat/hull_wood_groan.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:322` |
| `assets/audio/vehicles/boat/oar_dip_water.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:321` |
| `assets/audio/vehicles/bullock-cart/bullock_brass_bell.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:316` |
| `assets/audio/vehicles/bullock-cart/wooden_cart_creak.mp3` | AUDIO_VEHICLES | - | 1 | `js/data/audio-production-data.js:315` |
| `assets/audio/voice/en/murugan_intro_01.ogg` | AUDIO_VOICE | - | 1 | `js/data/audio-data.js:71` |
| `assets/audio/voice/ta/murugan_intro_01.ogg` | AUDIO_VOICE | - | 1 | `js/data/audio-data.js:57` |
| `assets/audio/voice/ta/selvam_delta_01.ogg` | AUDIO_VOICE | DELTA | 1 | `js/data/audio-data.js:113` |
| `assets/audio/voice/ta/tamizh_investigate_01.ogg` | AUDIO_VOICE | - | 1 | `js/data/audio-data.js:85` |
| `assets/audio/voice/ta/velu_pichavaram_01.ogg` | AUDIO_VOICE | PICHAVARAM | 1 | `js/data/audio-data.js:99` |
| `assets/audio/weather/rain_terracotta_tiles.ogg` | AUDIO_WEATHER | - | 1 | `js/data/audio-data.js:463` |
| `assets/audio/weather/rain/rain_heavy.mp3` | AUDIO_WEATHER | - | 1 | `js/data/audio-production-data.js:168` |
| `assets/audio/weather/rain/rain_light.mp3` | AUDIO_WEATHER | - | 1 | `js/data/audio-production-data.js:159` |
| `assets/audio/weather/thunder/thunder_distant.mp3` | AUDIO_WEATHER | - | 1 | `js/data/audio-production-data.js:177` |
| `assets/audio/weather/wind/wind_mountain_gust.mp3` | AUDIO_WEATHER | - | 1 | `js/data/audio-production-data.js:186` |
| `assets/audio/wildlife/birds/kingfisher_high_pip.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:290` |
| `assets/audio/wildlife/birds/peacock_heavy_wings.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:285` |
| `assets/audio/wildlife/birds/peacock_shrill_mayil.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:284` |
| `assets/audio/wildlife/elephant_low_rumble.ogg` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-data.js:407` |
| `assets/audio/wildlife/mammals/cow_chew_grass.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:297` |
| `assets/audio/wildlife/mammals/elephant_low_rumble.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:272` |
| `assets/audio/wildlife/mammals/elephant_trumpet.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:273` |
| `assets/audio/wildlife/mammals/gaur_deep_grunt.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:278` |
| `assets/audio/wildlife/mammals/gaur_snort.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:279` |
| `assets/audio/wildlife/mammals/kangayam_bull_bellow.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:296` |
| `assets/audio/wildlife/mammals/langur_alarm_bark.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:267` |
| `assets/audio/wildlife/mammals/langur_whoop.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:266` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_scramble.mp3` | AUDIO_WILDLIFE | NILGIRI | 1 | `js/data/audio-production-data.js:261` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_snort.mp3` | AUDIO_WILDLIFE | NILGIRI | 1 | `js/data/audio-production-data.js:259` |
| `assets/audio/wildlife/mammals/nilgiri_tahr_whistle.mp3` | AUDIO_WILDLIFE | NILGIRI | 1 | `js/data/audio-production-data.js:260` |
| `assets/audio/wildlife/nilgiri_langur_whoop.ogg` | AUDIO_WILDLIFE | NILGIRI | 1 | `js/data/audio-data.js:379` |
| `assets/audio/wildlife/nilgiri_tahr_whistle.ogg` | AUDIO_WILDLIFE | NILGIRI | 1 | `js/data/audio-data.js:365` |
| `assets/audio/wildlife/peafowl_call_01.ogg` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-data.js:393` |
| `assets/audio/wildlife/wetland/water_dive_splash.mp3` | AUDIO_WILDLIFE | - | 1 | `js/data/audio-production-data.js:291` |
| `assets/characters/npcs/${this.id}.glb` | CHARACTER | - | 1 | `js/entities/production-npc.js:73` |
| `assets/characters/player/textures/player_albedo.webp` | CHARACTER | - | 1 | `js/tools/asset-validator.js:27` |
| `assets/characters/player/textures/player_normal.webp` | CHARACTER | - | 1 | `js/tools/asset-validator.js:28` |
| `assets/characters/wildlife/${this.species}.glb` | CHARACTER | - | 1 | `js/entities/production-wildlife.js:75` |
| `assets/icons/brass_carrier.png` | TEXTURE | - | 1 | `content/items/traditional_items.json:29` |
| `assets/icons/chola_coin.png` | TEXTURE | - | 1 | `content/items/traditional_items.json:43` |
| `assets/icons/cutting_chai.png` | TEXTURE | - | 1 | `content/items/traditional_items.json:14` |
| `assets/icons/token.png` | TEXTURE | - | 1 | `content/items/traditional_items.json:57` |
| `assets/textures/placeholder.png` | TEXTURE | - | 1 | `js/content/content-loader.js:103` |

## Duplicate groups (identical content)
| SHA1 | Copies | Wasted bytes | Paths |
| --- | --- | --- | --- |
| `16ea70b32b52` | 3 | 2075910 | `assets/heist.jpg`<br>`assets/title_bg.jpg`<br>`assets/ui/menu/menu-chennai-court-incident.jpg` |
| `38f0517ab539` | 2 | 1041752 | `assets/characters/npcs/reference/turnaround_fisherman.png`<br>`assets/ui/characters/turnaround_fisherman.png` |
| `c8577de4ca0d` | 2 | 1021011 | `assets/tea_kadai.jpg`<br>`assets/ui/menu/menu-delta.jpg` |
| `37a03c0c0342` | 2 | 988379 | `assets/characters/npcs/reference/turnaround_village_elder.png`<br>`assets/ui/characters/turnaround_village_elder.png` |
| `154db3bb10ec` | 2 | 976384 | `assets/characters/npcs/reference/turnaround_female_villager.png`<br>`assets/ui/characters/turnaround_female_villager.png` |
| `fa8602d86867` | 2 | 840528 | `assets/characters/npcs/reference/tn_npc_lineup_12_characters.png`<br>`assets/ui/characters/tn_npc_lineup_12_characters.png` |
| `e896359e5fff` | 2 | 252263 | `assets/characters/npcs/reference/turnaround_tea_estate_worker.jpg`<br>`assets/ui/characters/turnaround_tea_estate_worker.jpg` |
| `45d6b074c419` | 2 | 196304 | `assets/ui/icons/whispering-wilds-icon.png`<br>`assets/ui/logo/whispering-wilds-icon.png` |
| `3458986efcca` | 22 | 44436 | `assets/props/cultural/agal_lamp.glb`<br>`assets/props/cultural/ammi_kallu.glb`<br>`assets/props/cultural/brass_kudam.glb`<br>`assets/props/cultural/cast_net.glb`<br>`assets/props/cultural/clay_pot.glb`<br>`assets/props/cultural/coffee_dabarah.glb`<br>`assets/props/cultural/korai_mat.glb`<br>`assets/props/cultural/manai_stool.glb`<br>`assets/props/cultural/palm_kottan.glb`<br>`assets/props/cultural/sickle.glb`<br>`assets/props/cultural/ural_ulakkai.glb`<br>`assets/props/food/banana_leaf_feast.glb`<br>`assets/props/food/curd_rice_plate.glb`<br>`assets/props/food/dosa_plate.glb`<br>`assets/props/food/filter_coffee_tumbler.glb`<br>`assets/props/food/idli_plate.glb`<br>`assets/props/food/pongal_pot.glb`<br>`assets/props/food/sugarcane_bundle.glb`<br>`assets/props/food/sweet_pongal_earthen.glb`<br>`assets/props/food/tea_glass.glb`<br>`assets/props/food/tender_coconut.glb`<br>`assets/props/food/vadai_plate.glb` |
| `9c34350e96a1` | 9 | 38752 | `assets/props/craft/bronze_art_object.glb`<br>`assets/props/craft/stone_sculpture.glb`<br>`assets/props/cultural/kuthu_vilakku.glb`<br>`assets/props/household/heritage_furniture.glb`<br>`assets/props/household/wooden_stool.glb`<br>`assets/props/temple/brass_lamp.glb`<br>`assets/props/temple/kuthu_vilakku.glb`<br>`assets/props/temple/stone_inscription.glb`<br>`assets/props/temple/temple_bell.glb` |
| `d4e39a290acf` | 2 | 12232 | `assets/characters/wildlife/goat.glb`<br>`assets/characters/wildlife/nilgiri-tahr.glb` |
| `0fc2125743f4` | 6 | 10900 | `assets/environment/nilgiris/forest_path.glb`<br>`assets/environment/nilgiris/grassland.glb`<br>`assets/environment/nilgiris/waterfall.glb`<br>`assets/vegetation/mangroves/mangrove_cluster.glb`<br>`assets/vegetation/shola/shola_tree.glb`<br>`assets/vegetation/tea/tea_rows.glb` |
| `d369ab119111` | 2 | 10244 | `assets/architecture/thanjavur/heritage_temple_area.glb`<br>`assets/architecture/thanjavur_gopuram.glb` |
| `bf6d194b8454` | 5 | 8960 | `assets/props/fishing/boat_dock.glb`<br>`assets/props/fishing/fish_crate.glb`<br>`assets/props/fishing/fishing_net.glb`<br>`assets/props/fishing/paddle.glb`<br>`assets/props/fishing/rope.glb` |
| `1fa686246c38` | 3 | 7568 | `assets/architecture/nilgiris/forest_station.glb`<br>`assets/architecture/nilgiris/hill_house.glb`<br>`assets/architecture/sanctuary/botanical_portal.glb` |
| `e14fbe4d0200` | 3 | 7552 | `assets/architecture/mamallapuram/heritage_structure.glb`<br>`assets/architecture/mamallapuram/stone_workshop.glb`<br>`assets/architecture/thanjavur/artisan_workshop.glb` |
| `ed71719efde6` | 3 | 7152 | `assets/props/agriculture/farm_tools.glb`<br>`assets/props/craft/artisan_tools.glb`<br>`assets/props/craft/stone_carving_tools.glb` |
| `09574dbe826a` | 2 | 5464 | `assets/vehicles/boat/wooden_boat.glb`<br>`assets/vehicles/mangrove_boat.glb` |
| `676811e2b218` | 2 | 5036 | `assets/props/food/brass_vessels.glb`<br>`assets/props/household/brass_vessel.glb` |
| `7c5dc7a75066` | 2 | 5031 | `assets/ui/icons/whispering-wilds-icon.svg`<br>`assets/ui/logo/whispering-wilds-icon.svg` |
| `347b18632df2` | 3 | 4136 | `assets/props/agriculture/forest_sign.glb`<br>`assets/props/agriculture/stone_wall.glb`<br>`assets/props/agriculture/wooden_fence.glb` |
| `eca60305f518` | 2 | 3800 | `assets/architecture/chettinad/wooden_column.glb`<br>`assets/props/temple/granite_column.glb` |
| `f1052a6dbb22` | 2 | 3648 | `assets/environment/pichavaram/canal.glb`<br>`assets/environment/pichavaram/mud_bank.glb` |
| `2c3367bc10e9` | 3 | 3536 | `assets/props/agriculture/paddy_bundle.glb`<br>`assets/props/agriculture/palm_leaf_basket.glb`<br>`assets/props/agriculture/tea_basket.glb` |
| `2eae82daed2c` | 2 | 3480 | `assets/props/household/clay_pot.glb`<br>`assets/props/household/water_pot.glb` |
| `7bd666bf23fa` | 2 | 2104 | `assets/props/agriculture/irrigation_sluice.glb`<br>`assets/props/agriculture/water_pump.glb` |
| `69822e4ba23a` | 2 | 1936 | `assets/environment/mamallapuram/coastal_rock.glb`<br>`assets/environment/mamallapuram/granite_boulder.glb` |

## Case mismatches
_none_

## Unused physical assets
| Path | Bytes |
| --- | --- |
| `assets/screenshots/test_step1_main_menu.png` | 1715925 |
| `assets/screenshots/test_step4_loading_screen.png` | 1674151 |
| `assets/screenshots/gameplay_delta.png` | 1094576 |
| `assets/screenshots/test_step5_3d_gameplay.png` | 1084437 |
| `assets/screenshots/gameplay_chennai.png` | 1071160 |
| `assets/characters/npcs/reference/turnaround_fisherman.png` | 1041752 |
| `assets/ui/characters/turnaround_fisherman.png` | 1041752 |
| `assets/ui/menu/menu-chennai-court-incident.jpg` | 1037955 |
| `assets/characters/npcs/reference/turnaround_village_elder.png` | 988379 |
| `assets/ui/characters/turnaround_village_elder.png` | 988379 |
| `assets/characters/npcs/reference/turnaround_female_villager.png` | 976384 |
| `assets/ui/characters/turnaround_female_villager.png` | 976384 |
| `assets/screenshots/gameplay_mamallapuram.png` | 913355 |
| `assets/screenshots/gameplay_nilgiris.png` | 903908 |
| `assets/characters/npcs/reference/tn_npc_lineup_12_characters.png` | 840528 |
| `assets/ui/characters/tn_npc_lineup_12_characters.png` | 840528 |
| `assets/screenshots/gameplay_chettinad.png` | 582755 |
| `assets/screenshots/gameplay_pichavaram.png` | 531143 |
| `assets/screenshots/test_step2_character_setup.png` | 298813 |
| `assets/characters/npcs/reference/turnaround_tea_estate_worker.jpg` | 252263 |
| `assets/ui/characters/turnaround_tea_estate_worker.jpg` | 252263 |
| `assets/screenshots/test_step3_prologue_modal.png` | 223764 |
| `assets/ui/logo/whispering-wilds-logo.svg` | 15511 |
| `assets/audio/audio-manifest.json` | 13851 |
| `assets/characters/wildlife/nilgiri-tahr.glb` | 12232 |
| `assets/architecture/thanjavur_gopuram.glb` | 10244 |
| `assets/audio/AUDIO_LICENSE_MANIFEST.json` | 6206 |
| `assets/vehicles/boat/wooden_boat.glb` | 5464 |
| `assets/vehicles/mangrove_boat.glb` | 5464 |
| `assets/ui/icons/whispering-wilds-icon.svg` | 5031 |
| `assets/ui/logo/whispering-wilds-icon.svg` | 5031 |
| `assets/props/chola_waterwheel.glb` | 3780 |
| `assets/vegetation/mangroves/mangrove_cluster.glb` | 2180 |
| `assets/vegetation/tea/tea_rows.glb` | 2180 |

