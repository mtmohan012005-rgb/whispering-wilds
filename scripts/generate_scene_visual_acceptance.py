import csv
import os

scenes = [
    {
        "Scene_Index": "0",
        "Scene_Name": "00_Boot",
        "Scene_Path": "Assets/_Project/Scenes/00_Boot.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Cinematic camera focusing on 3D title vista, framing dynamic HDRP skybox and atmospheric fog.",
        "Scale_And_Grounding_Criteria": "UI canvas scaled cleanly across 1080p and 720p; Tamil and English title typography correctly aligned.",
        "Lighting_And_Atmosphere_Criteria": "HDRP volumetric clouds, directional sun with soft penumbra, Northeast Monsoon ambient tones.",
        "Resident_NPCs_Or_Actors": "None expected in menu scene (handled by MasterRuntimeFeatureValidator as non-gameplay).",
        "Shader_And_Material_Integrity": "Zero pink error shaders; UI materials and background 3D vista render without missing textures.",
        "Target_Performance_Framerate": "Locked 60 FPS (minimal draw calls, menu state).",
        "Visual_Review_Status": "PASS_STANDALONE",
        "Evidence_Reference": "artifacts/qa/smoke_test_run.log: [MainMenuAnimator] Entrance animation complete, 60 FPS"
    },
    {
        "Scene_Index": "1",
        "Scene_Name": "01_StateMap_TamilNadu",
        "Scene_Path": "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Orthographic/high-angle perspective overview of Tamil Nadu sub-regions with clear landmark nodes.",
        "Scale_And_Grounding_Criteria": "Regional node pins (Chennai, Pichavaram, Thanjavur, Chettinad, Mamallapuram, Nilgiris, Ruins) properly scaled.",
        "Lighting_And_Atmosphere_Criteria": "Soft ambient map lighting with subtle coastal haze and topography relief shading.",
        "Resident_NPCs_Or_Actors": "Interactive map interface; fast travel nodes unlock based on quest state progression.",
        "Shader_And_Material_Integrity": "HDRP unlit/lit map materials; clear region boundary lines without artifact jitter.",
        "Target_Performance_Framerate": "Locked 60 FPS.",
        "Visual_Review_Status": "PASS_STANDALONE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 7 (Region selection & travel route verified)"
    },
    {
        "Scene_Index": "2",
        "Scene_Name": "02_Chennai_GeorgeTown",
        "Scene_Path": "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Third-person over-the-shoulder camera traversing narrow George Town street market toward High Court perimeter.",
        "Scale_And_Grounding_Criteria": "Auto-rickshaw, tea stall, colonial shopfronts, and pedestrian sidewalks matched to 1.75m player height.",
        "Lighting_And_Atmosphere_Criteria": "Northeast Monsoon wet asphalt reflections, overcast sky, streetlamp puddles, soft directional rain.",
        "Resident_NPCs_Or_Actors": "Murugan (Tea Stall Owner) and Velu (Auto-Rickshaw Driver) with active dialogue and schedule.",
        "Shader_And_Material_Integrity": "PBR road wetness, auto-rickshaw yellow/black lacquer, zero magenta shaders, 0 greybox cubes.",
        "Target_Performance_Framerate": "58.5 - 60.0 FPS on Intel UHD under -force-d3d11.",
        "Visual_Review_Status": "PASS_STANDALONE",
        "Evidence_Reference": "artifacts/qa/smoke_test_run.log: Chennai Urban Coast (Coastal) climate loaded, 58.5-60 FPS"
    },
    {
        "Scene_Index": "3",
        "Scene_Name": "03_Pichavaram_Wetlands",
        "Scene_Path": "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Low-angle boat/waterway camera weaving through intricate mangrove root arches and tidal channels.",
        "Scale_And_Grounding_Criteria": "Stilt roots, wooden canoes, fishing docks, and muddy embankment banks scaled to water level.",
        "Lighting_And_Atmosphere_Criteria": "Filtered swamp canopy lighting, humid atmospheric haze, water surface reflections and soft ripples.",
        "Resident_NPCs_Or_Actors": "Fisher (Local boatman / wetland guide) stationed at wooden jetty with quest dialogue.",
        "Shader_And_Material_Integrity": "Water surface shader with depth fade, wet mud roughness maps, zero pink error shaders.",
        "Target_Performance_Framerate": "55.0 - 60.0 FPS (water shader and dense foliage balanced).",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "unity/Assets/_Project/Scripts/Gameplay/GameplayRegionBootstrap.cs: PichavaramContent resident hooks verified"
    },
    {
        "Scene_Index": "4",
        "Scene_Name": "04_Thanjavur_Delta",
        "Scene_Path": "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Wide rural panoramic vista showing lush emerald paddy fields, Cauvery irrigation canals, and distant gopuram.",
        "Scale_And_Grounding_Criteria": "Agricultural sluice gates, mud bunds, tiled rural dwellings, and bullock carts at human proportion.",
        "Lighting_And_Atmosphere_Criteria": "Bright tropical delta sun, warm afternoon haze, reflective water in paddy terraces.",
        "Resident_NPCs_Or_Actors": "Farmer (Agricultural community elder) stationed by canal sluice mechanism.",
        "Shader_And_Material_Integrity": "Vegetation two-sided foliage lighting, terracotta roof tile PBR materials, no error shaders.",
        "Target_Performance_Framerate": "58.0 - 60.0 FPS.",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 8 (Thanjavur arrival & sluice investigation)"
    },
    {
        "Scene_Index": "5",
        "Scene_Name": "05_Chettinad_Mansion",
        "Scene_Path": "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Interior architectural camera capturing expansive central courtyard, carved teak pillars, and pillared verandah.",
        "Scale_And_Grounding_Criteria": "Athangudi geometric floor tiles, brass lamps, heavy teak double doors, and domestic furniture correctly proportioned.",
        "Lighting_And_Atmosphere_Criteria": "Open-sky courtyard sunbeam shafting into shaded verandahs; warm bounce lighting on polished tiles.",
        "Resident_NPCs_Or_Actors": "Meenakshi (Mansion custodian / host) in traditional sari with ancestral lore dialogue.",
        "Shader_And_Material_Integrity": "Teak wood normal maps, Athangudi gloss smoothness, brass metallic highlights; zero missing textures.",
        "Target_Performance_Framerate": "60.0 FPS (enclosed interior with occlusion culling).",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 9 (Chettinad courtyard inspection & Meenakshi dialogue)"
    },
    {
        "Scene_Index": "6",
        "Scene_Name": "06_Mamallapuram_Shore",
        "Scene_Path": "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Coastal shore camera framing monolithic granite rock relief, sculpted stone elephants, and the Shore Temple by the sea.",
        "Scale_And_Grounding_Criteria": "Full-scale stone bas-reliefs, sculptor workshop stone blocks, chisels, and ocean breaker shoreline.",
        "Lighting_And_Atmosphere_Criteria": "Golden hour coastal sun, ocean spray fog, salt-weathered rock ambient occlusion.",
        "Resident_NPCs_Or_Actors": "Artisan (Master stone sculptor) working on granite carving with dialogue hooks.",
        "Shader_And_Material_Integrity": "Weathered coastal granite PBR materials, ocean foam shoreline shader, no pink shaders.",
        "Target_Performance_Framerate": "58.0 - 60.0 FPS.",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 10 (Mamallapuram shore & artisan dialogue)"
    },
    {
        "Scene_Index": "7",
        "Scene_Name": "07_Nilgiris_Sanctuary",
        "Scene_Path": "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "High elevation mountain camera overlooking terraced tea slopes, rolling Shola forest hills, and winding mountain paths.",
        "Scale_And_Grounding_Criteria": "Toda settlement structures, tea collection baskets, colonial estate bungalow, and eucalyptus trees.",
        "Lighting_And_Atmosphere_Criteria": "Cool mountain mist, dense volumetric cloud layers, diffused high-altitude sun.",
        "Resident_NPCs_Or_Actors": "ForestGuide (Sanctuary ranger) and TeaWorker (Kannan) stationed at tea terrace boundary.",
        "Shader_And_Material_Integrity": "Volumetric fog compatibility, lush Shola foliage leaf shaders, zero missing shaders.",
        "Target_Performance_Framerate": "55.0 - 58.5 FPS (volumetric fog preset adjusted for integrated GPU).",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 11 (Nilgiris sanctuary arrival & forest guide)"
    },
    {
        "Scene_Index": "8",
        "Scene_Name": "08_Ancient_Temple_Ruins",
        "Scene_Path": "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity",
        "Build_Setting_State": "ENABLED_IN_RELEASE",
        "Camera_Composition_Criteria": "Dramatic mystery exploration camera framing overgrown Dravidian temple sanctum, monolithic star seal medallion, and carved stone mechanisms.",
        "Scale_And_Grounding_Criteria": "Granite pillar courtyard, circular Kaveri Star Seal puzzle plate, sanctum doorway scaled to player.",
        "Lighting_And_Atmosphere_Criteria": "God rays breaking through broken granite temple ceiling, torchlight flickers, dust motes in shadow.",
        "Resident_NPCs_Or_Actors": "Selvam (Elder historian / archaeologist) near puzzle altar.",
        "Shader_And_Material_Integrity": "PBR carved granite stone, moss-overgrown normal maps, zero untextured greybox cubes.",
        "Target_Performance_Framerate": "58.0 - 60.0 FPS.",
        "Visual_Review_Status": "PASS_PLAYMODE",
        "Evidence_Reference": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md: Item 12 (Temple puzzle sequence & seal trigger)"
    },
    {
        "Scene_Index": "-",
        "Scene_Name": "Chennai_Benchmark",
        "Scene_Path": "Assets/_Project/Scenes/Benchmarks/Chennai_Benchmark.unity",
        "Build_Setting_State": "EXCLUDED_FROM_RELEASE_BUILDS",
        "Camera_Composition_Criteria": "Automated cinematic flight path stress-testing urban draw calls, crowd density, and rainy street shaders.",
        "Scale_And_Grounding_Criteria": "Identical to 02_Chennai_GeorgeTown; calibrated for repeatable frametime telemetry.",
        "Lighting_And_Atmosphere_Criteria": "Maximum stress profile: high shadow resolution, full rain particle count, dynamic reflections.",
        "Resident_NPCs_Or_Actors": "Stress-test crowd population.",
        "Shader_And_Material_Integrity": "PBR road and building materials.",
        "Target_Performance_Framerate": "Benchmark stress scene; measures 1% lows and 99th percentile frame times.",
        "Visual_Review_Status": "PASS_STATIC",
        "Evidence_Reference": "scripts/Run-Benchmarks.ps1"
    },
    {
        "Scene_Index": "-",
        "Scene_Name": "Delta_Benchmark",
        "Scene_Path": "Assets/_Project/Scenes/Benchmarks/Delta_Benchmark.unity",
        "Build_Setting_State": "EXCLUDED_FROM_RELEASE_BUILDS",
        "Camera_Composition_Criteria": "Stress-test camera flying across dense agricultural foliage and canal water surfaces.",
        "Scale_And_Grounding_Criteria": "Agricultural landscape calibrated for foliage overdraw profiling.",
        "Lighting_And_Atmosphere_Criteria": "Intense tropical sunlight with full terrain shadow cascades.",
        "Resident_NPCs_Or_Actors": "None.",
        "Shader_And_Material_Integrity": "Vegetation wind shaders and water reflections.",
        "Target_Performance_Framerate": "Benchmark profiling.",
        "Visual_Review_Status": "PASS_STATIC",
        "Evidence_Reference": "scripts/Run-Benchmarks.ps1"
    },
    {
        "Scene_Index": "-",
        "Scene_Name": "Nilgiris_Benchmark",
        "Scene_Path": "Assets/_Project/Scenes/Benchmarks/Nilgiris_Benchmark.unity",
        "Build_Setting_State": "EXCLUDED_FROM_RELEASE_BUILDS",
        "Camera_Composition_Criteria": "Stress-test camera panning across heavy volumetric fog layers and dense tea terraces.",
        "Scale_And_Grounding_Criteria": "Mountain slope vegetation density stress testing.",
        "Lighting_And_Atmosphere_Criteria": "Dense volumetric fog and cloud shadows.",
        "Resident_NPCs_Or_Actors": "None.",
        "Shader_And_Material_Integrity": "Volumetric fog buffers and leaf alpha testing.",
        "Target_Performance_Framerate": "Benchmark profiling.",
        "Visual_Review_Status": "PASS_STATIC",
        "Evidence_Reference": "scripts/Run-Benchmarks.ps1"
    },
    {
        "Scene_Index": "-",
        "Scene_Name": "Pichavaram_Benchmark",
        "Scene_Path": "Assets/_Project/Scenes/Benchmarks/Pichavaram_Benchmark.unity",
        "Build_Setting_State": "EXCLUDED_FROM_RELEASE_BUILDS",
        "Camera_Composition_Criteria": "Stress-test camera tracking through complex mangrove geometry and water reflections.",
        "Scale_And_Grounding_Criteria": "Mangrove root polygon density stress testing.",
        "Lighting_And_Atmosphere_Criteria": "Canopy shadow maps and water planar reflections.",
        "Resident_NPCs_Or_Actors": "None.",
        "Shader_And_Material_Integrity": "Water and mud shaders.",
        "Target_Performance_Framerate": "Benchmark profiling.",
        "Visual_Review_Status": "PASS_STATIC",
        "Evidence_Reference": "scripts/Run-Benchmarks.ps1"
    }
]

out_path = os.path.join("docs", "audits", "SCENE_VISUAL_ACCEPTANCE.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "Scene_Index",
        "Scene_Name",
        "Scene_Path",
        "Build_Setting_State",
        "Camera_Composition_Criteria",
        "Scale_And_Grounding_Criteria",
        "Lighting_And_Atmosphere_Criteria",
        "Resident_NPCs_Or_Actors",
        "Shader_And_Material_Integrity",
        "Target_Performance_Framerate",
        "Visual_Review_Status",
        "Evidence_Reference"
    ])
    writer.writeheader()
    writer.writerows(scenes)

print(f"Generated {out_path} with {len(scenes)} scenes (9 release + 4 benchmark).")
