import csv
import os

gaps = [
    {
        "Asset_Category": "Characters_NPC",
        "Asset_Name": "Male Story NPCs (Murugan, Velu, Selvam, etc.)",
        "Target_Scene_Or_System": "All Campaign Scenes",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Characters/Procedural/Meshes/Mesh_HeadMale.asset",
        "Quality_Gap_Type": "Shared Base Mesh Geometry",
        "Severity": "High",
        "Observed_Proof": "YAML GUID inspection confirms Mesh_HeadMale.asset is shared across all 8 male NPC prefabs; visual differentiation relies on skin/clothing PBR materials and accessories.",
        "Owner_Recommended_Action": "Model distinct facial silhouettes, hair/mustache geometry, and varied body builds for story NPCs while retaining the 43-bone procedural rig.",
        "Status_Label": "IDENTIFIED_FOR_ENHANCEMENT"
    },
    {
        "Asset_Category": "Characters_Player",
        "Asset_Name": "Arun Kumar (Player Hero)",
        "Target_Scene_Or_System": "All Gameplay Scenes",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Characters/Player/player.glb",
        "Quality_Gap_Type": "Stylized Procedural Topology vs Photogrammetric Scan",
        "Severity": "Medium",
        "Observed_Proof": "Player character uses 2048x2048 PBR maps (albedo, normal, roughness, AO) on 13 modular submeshes; face and body are stylized procedural rather than high-density photogrammetric scans.",
        "Owner_Recommended_Action": "Preserve current optimized PBR assets for stable 60 FPS performance on Intel UHD/integrated GPUs; schedule ultra-dense scan pass if high-end GPU preset is prioritized.",
        "Status_Label": "OPTIMIZED_BASELINE_READY"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Toda Mund Hut vs Nilgiri Estate Cottage",
        "Target_Scene_Or_System": "07_Nilgiris_Sanctuary",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Nilgiris/nilgiri_cottage.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 1: nilgiri_cottage.glb is binary identical to cottage_estate.glb (colonial bungalow vs barrel-vaulted Toda Mund hut).",
        "Owner_Recommended_Action": "Model authentic barrel-arched Toda Mund bamboo-thatch dwelling for Nilgiris sanctuary while preserving cottage_estate.glb for tea estate bungalows.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Dravidian Temple Gateway vs Iron Colonial Gate",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Structures/temple_gate.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 4: temple_gate.glb shares geometry with gate_iron.glb.",
        "Owner_Recommended_Action": "Model sculpted granite gopuram/torana gateway for temple ruins, retaining gate_iron.glb for Chennai urban/estate boundaries.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Traditional Temple Diya / Kuthuvilakku vs Lantern",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins / 05_Chettinad_Mansion",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_lamp.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 5: temple_lamp.glb is identical to lantern_brass.glb.",
        "Owner_Recommended_Action": "Replace temple_lamp.glb with tiered brass Kuthuvilakku with flame-bowl geometry.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Vegetation",
        "Asset_Name": "Camellia Sinensis Tea Bush vs Wild Forest Fern",
        "Target_Scene_Or_System": "07_Nilgiris_Sanctuary",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Vegetation/tea_bush.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 9: tea_bush.glb shares geometry with plant_fern.glb.",
        "Owner_Recommended_Action": "Model manicured, contoured tea estate hedgerow clusters to represent Nilgiri plantation terraces.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Mamallapuram Carved Stone Relief vs Raw Granite Boulder",
        "Target_Scene_Or_System": "06_Mamallapuram_Shore",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Mamallapuram/stone_sculpted.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 10: stone_sculpted.glb shares geometry with rock_granite.glb.",
        "Owner_Recommended_Action": "Provide distinct bas-relief carving detail (Arjuna's Penance motif) on stone_sculpted.glb.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Granite Temple Epigraph Stele vs Wooden Sign Post",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_stele.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 11: temple_stele.glb shares geometry with sign_post.glb.",
        "Owner_Recommended_Action": "Model weathered stone slab with inscribed Tamil-Brahmi / Grantha stone inscriptions.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Temple Brass Kalasam / Urn vs Domestic Terracotta Pot",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_urn.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 13: temple_urn.glb shares geometry with urn_clay.glb.",
        "Owner_Recommended_Action": "Model sacred Panchaloha / brass temple finial urn for sanctum roof.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Interlocking Granite Temple Ashlar Wall vs Clay Brick Wall",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_wall.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 14: temple_wall.glb shares geometry with wall_brick.glb.",
        "Owner_Recommended_Action": "Model heavy, dry-stone interlocking Dravidian granite coursed masonry blocks.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Sacred Theertham Step-Well vs Agricultural Well",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_well.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "ASSET_DUPLICATE_DECISIONS.csv Group 15: temple_well.glb shares geometry with well_stone.glb.",
        "Owner_Recommended_Action": "Model stepped granite tank (Kalyani / Kulam) steps descending into clear water.",
        "Status_Label": "REPLACE_WITH_DISTINCT_MODEL"
    },
    {
        "Asset_Category": "Audio_Soundscape",
        "Asset_Name": "Authentic Tamil Nadu Regional Ambience & Foley",
        "Target_Scene_Or_System": "All 9 Campaign Scenes",
        "Current_Asset_Path": "unity/Assets/_Project/Audio/Clips/*.wav",
        "Quality_Gap_Type": "Procedural Synthetic Prototype Audio",
        "Severity": "High",
        "Observed_Proof": "assets/audio/AUDIO_LICENSE_MANIFEST.json explicitly records all 10 audio clips as procedural synth development placeholders; no authentic regional field recordings.",
        "Owner_Recommended_Action": "Acquire or record field ambience (Chennai street traffic, temple bells, Cauvery river, Nilgiri Shola winds/birds) with documented CC0/commercial licenses.",
        "Status_Label": "BLOCKED_EXTERNAL_ASSET"
    },
    {
        "Asset_Category": "Persistence_Cloud",
        "Asset_Name": "Live Firebase Cloud Save Synchronization",
        "Target_Scene_Or_System": "Save & Persistence System",
        "Current_Asset_Path": "server/routes/saves.js",
        "Quality_Gap_Type": "External Credentials Unset",
        "Severity": "Medium",
        "Observed_Proof": "Local save/load passes 100%; cloud endpoints return 503 because Firebase service account credentials are intentionally not committed.",
        "Owner_Recommended_Action": "Provide staging Firebase credentials via environment secrets for cloud playtesting; local save fallback fully operational.",
        "Status_Label": "BLOCKED_CREDENTIALS"
    },
    {
        "Asset_Category": "Multiplayer_Networking",
        "Asset_Name": "End-to-End Dual-Client State Synchronization",
        "Target_Scene_Or_System": "Multiplayer Subsystem",
        "Current_Asset_Path": "server/routes/multiplayer.js",
        "Quality_Gap_Type": "Unverified Dual-Client Physical Session",
        "Severity": "Low",
        "Observed_Proof": "Socket.IO endpoints, packet serialization, and room limits verified via automated tests, but physical two-player simultaneous traversal remains untested.",
        "Owner_Recommended_Action": "Keep focus on single-player native PC exploration vertical slice; mark dual-client multiplayer as optional future roadmap item.",
        "Status_Label": "NOT_TESTED_MULTI_CLIENT"
    },
    {
        "Asset_Category": "Visual_Inspection",
        "Asset_Name": "Full Campaign Human Tactile & Aesthetic Playthrough",
        "Target_Scene_Or_System": "Campaign Flow (00_Boot to 08_Ruins)",
        "Current_Asset_Path": "docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md",
        "Quality_Gap_Type": "Manual Visual/Tactile Acceptance Required",
        "Severity": "High",
        "Observed_Proof": "Automated PlayMode tests verify state transitions (43/60 checklist items), but human review of camera collision, immersion, animation blending, and lighting feel is required.",
        "Owner_Recommended_Action": "Perform structured manual playthrough session on target PC using SCENE_VISUAL_ACCEPTANCE criteria.",
        "Status_Label": "NOT_TESTED_HUMAN_TACTILE"
    }
]

out_path = os.path.join("docs", "audits", "REAL_3D_QUALITY_GAPS.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "Asset_Category",
        "Asset_Name",
        "Target_Scene_Or_System",
        "Current_Asset_Path",
        "Quality_Gap_Type",
        "Severity",
        "Observed_Proof",
        "Owner_Recommended_Action",
        "Status_Label"
    ])
    writer.writeheader()
    writer.writerows(gaps)

print(f"Generated {out_path} with {len(gaps)} categorized quality gaps.")
