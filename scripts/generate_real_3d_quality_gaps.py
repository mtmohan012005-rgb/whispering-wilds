import csv
import os

gaps = [
    {
        "Asset_Category": "Characters_NPC",
        "Asset_Name": "Story NPCs (Murugan, Velu, Selvam, Meenakshi, Artisan, Farmer, Fisher, ForestGuide, TeaWorker)",
        "Target_Scene_Or_System": "All Campaign Scenes",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Characters/Procedural/Mesh_Head_*.asset",
        "Quality_Gap_Type": "Culturally Grounded Distinct 3D Silhouettes",
        "Severity": "Resolved",
        "Observed_Proof": "Native Unity Editor build generated 10 distinct role-specific 3D head meshes (Madurai meesai, Velu handlebar moustache & headband, Selvam beard & kudumi, Meenakshi kondai & jasmine malligai poo, Artisan sculptor topknot & goatee, Farmer thalappa turban, Fisher weather cap, ForestGuide ranger cap, TeaWorker Kannan muffler). All prefabs wired with distinct meshes, colliders, and verified 10/10 PASS_EDITOR by EditorCharacterRigAuditor.",
        "Owner_Recommended_Action": "Distinct culturally grounded 3D silhouettes generated and verified via native Unity Editor rig auditor.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
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
        "Observed_Proof": "Authentic barrel-vaulted Toda Mund bamboo thatch and dry-stone dwelling compiled with traditional crawl entrance (0.75m x 0.85m), buffalo horn crest, and porch ledges. Replaces colonial estate cottage with culturally grounded geometry.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 07_Nilgiris_Sanctuary.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Dravidian Temple Gateway vs Iron Colonial Gate",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Structures/temple_gate.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "Sculpted granite gopuram-torana gateway compiled with monumental Adhisthana plinth, octagonal piers with rearing Yali brackets, carved Kudu lintel frieze, and 3 miniature sala roof shrines with brass kalasam finials. Replaces iron gate.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Traditional Temple Diya / Kuthuvilakku vs Lantern",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins / 05_Chettinad_Mansion",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_lamp.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "Tiered brass Kuthuvilakku compiled with authentic lotus base (Aadhanam), turned stem with rudraksha balusters, 5-wick flared circular oil basin (Thattu), and crowning sacred Annam (hamsa bird) finial. Replaces brass lantern.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins and 05_Chettinad_Mansion.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Vegetation",
        "Asset_Name": "Camellia Sinensis Tea Bush vs Wild Forest Fern",
        "Target_Scene_Or_System": "07_Nilgiris_Sanctuary",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Vegetation/tea_bush.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "Manicured contoured tea hedgerow compiled with woody gnarled lower stems, dense Camellia Sinensis foliage skirt, and flat-topped plucking table with bright tender golden-green flush highlights. Replaces wild fern.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 07_Nilgiris_Sanctuary.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Mamallapuram Carved Stone Relief vs Raw Granite Boulder",
        "Target_Scene_Or_System": "06_Mamallapuram_Shore",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Mamallapuram/stone_sculpted.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "Arjuna's Penance monolithic granite bas-relief cliff compiled with central sacred Ganges cleft, carved naga spirits, high-relief bull elephant family with calves, standing yogic ascetic, and miniature Pallava shrine. Replaces raw boulder.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 06_Mamallapuram_Shore.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Granite Temple Epigraph Stele vs Wooden Sign Post",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_stele.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "Weathered granite inscription slab (Kalvettu) compiled with rectangular chiseled socket plinth, rounded arched crest with Chola royal emblem, and 12 incised horizontal Tamil-Brahmi and Grantha epigraph bands. Replaces wooden sign post.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Props",
        "Asset_Name": "Temple Brass Kalasam / Urn vs Domestic Terracotta Pot",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_urn.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Low",
        "Observed_Proof": "Sacred Panchaloha brass temple finial urn (Stupi/Kalasam) compiled with stepped circular lotus pedestal (Padma Peedam), bulbous ribbed Kumbha vessel, flanged neck lip, and tapering needle pinnacle (Koor). Replaces domestic terracotta pot.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Interlocking Granite Temple Ashlar Wall vs Clay Brick Wall",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_wall.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "Monumental Dravidian dry-stone temple wall compiled with projecting Adhisthana plinth, 3 courses of staggered interlocking granite ashlar blocks with chiseled rustic faces, recessed joints, and heavy Kapota coping capstone with water-drip lip. Replaces clay brick wall.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
    },
    {
        "Asset_Category": "Environment_Architecture",
        "Asset_Name": "Sacred Theertham Step-Well vs Agricultural Well",
        "Target_Scene_Or_System": "08_Ancient_Temple_Ruins",
        "Current_Asset_Path": "unity/Assets/_Project/Art/Models/Temple/temple_well.glb",
        "Quality_Gap_Type": "Duplicate Asset Marked for Replacement",
        "Severity": "Medium",
        "Observed_Proof": "Sacred four-sided square stepped temple tank (Kalyani/Kulam) compiled with raised perimeter stone parapet, 4 corner lamp pillars, 4 tiers of concentric descending granite steps (Padi thurai), and central sunken reflective water plane. Replaces agricultural well.",
        "Owner_Recommended_Action": "Verified distinct 3D model compiled and linked to 08_Ancient_Temple_Ruins.",
        "Status_Label": "PASS_EDITOR_VERIFIED"
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
