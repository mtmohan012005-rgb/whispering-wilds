# Visual Evidence Index — The Whispering Wilds (காட்டு வழி • தடம்)

**Tested Build Commit:** `5056deb833a1254f0e41bf134151663a08cca5f8`  
**Latest Merged Main HEAD:** `2e72017`  
**Engine & Target:** Unity 6 (`6000.6.3f1`), High Definition Render Pipeline (`HDRP 17.7.0`), Windows x64 Direct3D 11 (`-force-d3d11`)  
**Resolution & Color Space:** 1920×1080 @ 60 FPS, Linear Color Space, Tonemapping: ACES  
**Evidence Source:** In-Engine Game View Camera Captures generated via `EditorVisualCapture.cs` during authenticated Unity build validation.

---

## 1. Playable Scene Verification Captures (All 9 Canonical Scenes)

Every scene in the build settings (`EditorBuildSettings.asset`) has been visually captured at normal gameplay camera perspective under native HDRP lighting:

| Scene Index | Scene Asset Path | Visual Evidence Path | Resolution | Size (Bytes) | SHA-256 Checksum | Observed Visual & Regional Fidelity |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **00** | `Assets/_Project/Scenes/00_Boot.unity` | [`00-boot.png`](00-boot.png) | 1920×1080 | 148,918 | `4F1E28B05ECE8042A1094982F1734CAFBB84CCC3FF4F8CE2F791B8CEB1C60351` | Title UI, dynamic bilingual Tamil/English title banner, audio volume sliders, New Game modal, and cinematic camera. |
| **01** | `Assets/_Project/Scenes/01_StateMap_TamilNadu.unity` | [`01-statemap-tamilnadu.png`](01-statemap-tamilnadu.png) | 1920×1080 | 49,425 | `78B9DF4745CF31C37BA8E03CC487EBC6222689B8A471E5C932E51CD3E1488EF9` | 3D state map of Tamil Nadu with accurate regional markers, district boundaries, tooltip raycasting, and camera framing. |
| **02** | `Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity` | [`02-chennai-georgetown.png`](02-chennai-georgetown.png) | 1920×1080 | 1,768,019 | `1F52E7E42AD2425394254669F949CD432375182A88F6500C16C4A31CECF76AAF` | Dense George Town colonial/vernacular streetscape, bilingual Tamil street boards, NPC Murugan, collision bounds, and sunlight shadow maps. |
| **03** | `Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity` | [`03-pichavaram-wetlands.png`](03-pichavaram-wetlands.png) | 1920×1080 | 546,112 | `E452ED8A122713095E5A9CD0952CDA88175F70D0C5EA1C7D1F05DF3BAB3907AE` | Mangrove channels, aerial stilt roots, reflective mudflats, wetland foliage, boat landing interactable, and NPC Selvam. |
| **04** | `Assets/_Project/Scenes/04_Thanjavur_Delta.unity` | [`04-thanjavur-delta.png`](04-thanjavur-delta.png) | 1920×1080 | 447,614 | `64B5236499E3FF12154B5F35F1C0C759B5A8F76D321793CC984AFB9E29B36A53` | Cauvery delta agricultural landscape, lush paddy field terrain, irrigation sluice channels, and Farmer NPC with traditional thalappa. |
| **05** | `Assets/_Project/Scenes/05_Chettinad_Mansion.unity` | [`05-chettinad-mansion.png`](05-chettinad-mansion.png) | 1920×1080 | 304,511 | `96E398E887F1728FF789E14508B0140ECC529B9EDE15B16ADB896DDEFA2B2D95` | Valavu courtyard mansion interior, Athangudi floor tiles, carved Burma teak pillars, Kuthuvilakku brass lamps, and NPC Meenakshi. |
| **06** | `Assets/_Project/Scenes/06_Mamallapuram_Shore.unity` | [`06-mamallapuram-shore.png`](06-mamallapuram-shore.png) | 1920×1080 | 246,622 | `8250F9B13A4F18E6F39DDEF4D3651EFBC2E7F561F31A931BD2F371F1ED2C7DAE` | Coromandel coastal granite shoreline, Arjuna's Penance bas-relief stone cliff, ocean water plane, sea breeze fog, and Artisan NPC. |
| **07** | `Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity` | [`07-nilgiris-sanctuary.png`](07-nilgiris-sanctuary.png) | 1920×1080 | 480,745 | `1DA07F44BC346BB28547397176E0375A0C68382EA2BBE8474B0BF8A35792C0DB` | High-altitude Western Ghats shola-grassland, contoured Camellia tea hedgerows, authentic Toda Mund barrel-vault dwelling, and TeaWorker NPC. |
| **08** | `Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity` | [`08-ancient-temple.png`](08-ancient-temple.png) | 1920×1080 | 583,450 | `056C40877162E69FDC6E3C0A70F185FCD9207112B0222312ED5F526C4198F498` | Dravidian granite temple gopuram gateway, stepped theertham tank (Kalyani), Tamil-Brahmi Kalvettu epigraph stele, ashlar walls, and sanctum puzzle. |

---

## 2. Character Realism & Contact Sheet Evidence

- **Master Character Contact Sheet:** [`characters-contact-sheet.png`](characters-contact-sheet.png)  
  - **Resolution:** 1920×1080 (1,520,908 bytes, SHA-256: `30CE276973AED58C0601E89F841ADD5A4303026A9E2A6AC68A4917145A5D6B7B`)  
  - **Characters Rendered:**
    1. **Arun Kumar (Player Hero):** Dhoti & shirt, 13 modular submeshes, 43 bone bindings, CharacterController locomotion.
    2. **Murugan (Chennai Merchant):** White veshti, blue folded shirt, distinct groomed Madurai-style moustache.
    3. **Velu (Madurai Guide):** Green veshti, traditional red headband (thalappa), distinct handlebar moustache.
    4. **Selvam (Delta Historian):** Khaki trousers, field jacket, reading spectacles, full trimmed beard and kudumi topknot.
    5. **Meenakshi (Chettinad Scholar):** Maroon silk Kanchipuram sari with gold zari border, traditional hair bun (kondai) with fresh jasmine flowers (malligai poo).
    6. **Artisan (Mamallapuram Sculptor):** Traditional lungi, chisel belt harness, sculptor's topknot and goatee.
    7. **Farmer (Thanjavur Delta Cultivator):** Rolled dhoti, cotton towel turban, farmer's weathered silhouette.
    8. **Fisher (Pichavaram Wetland Fisherman):** Weathered sea cap, rolled lungi, oar prop.
    9. **ForestGuide (Nilgiris Sanctuary Ranger):** Olive ranger field hat, khaki forest warden uniform, shoulder satchel.
    10. **TeaWorker (Nilgiris Plantation Plucker):** Plucking basket harness, head muffler/scarf, apron skirt.

---

## 3. Cultural Realism Asset Replacements (Before / After Comparison Captures)

All 9 generic placeholder 3D models were replaced with culturally grounded Dravidian and Tamil Nadu regional models in `environment-fixes-before-after/`:

| Replacement ID | Cultural Asset Replaced | Generic Placeholder Removed | Visual Proof Image | Size (Bytes) | SHA-256 Checksum | Cultural & Architectural Justification |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **01** | Authentic Toda Mund Barrel-Vault Hut | Generic European Estate Cottage | [`environment-fixes-before-after/01-toda-mund-hut-vs-colonial-cottage.png`](environment-fixes-before-after/01-toda-mund-hut-vs-colonial-cottage.png) | 299,428 | `4CAA1BDDDCE19B07E6187580F0552ECD25AACD887E1E8BBDA7C6A90E421A7F37` | Replaces a generic alpine cottage with an indigenous Toda bamboo-thatch barrel-vault dwelling featuring a low crawl entrance and sacred buffalo horn crest. |
| **02** | Dravidian Granite Temple Gateway (Gopuram-Torana) | Victorian Iron Gate | [`environment-fixes-before-after/02-dravidian-temple-gateway-vs-iron-gate.png`](environment-fixes-before-after/02-dravidian-temple-gateway-vs-iron-gate.png) | 22,809 | `6CE90E6565E6D8D4D4B3E598C603D7E8A96AD9C148186E2F5CFF0D7940B9AC1E` | Replaces modern wrought iron with monolithic Adhisthana granite plinth, rearing Yali piers, Kudu arch, and 3 miniature sala roof shrines with brass kalasams. |
| **03** | Traditional Brass Kuthuvilakku (Diya) | Generic Oil Lantern | [`environment-fixes-before-after/03-kuthuvilakku-brass-diya-vs-lantern.png`](environment-fixes-before-after/03-kuthuvilakku-brass-diya-vs-lantern.png) | 253,662 | `26A198EC14A3A10FF3060A381A9F164D7D803B0D39324046846FE93D22B94AEB` | Replaces hurricane lantern with a tiered brass temple Kuthuvilakku featuring lotus base (Aadhanam), 5-wick circular flared basin, and crowning Annam finial bird. |
| **04** | Camellia Sinensis Contoured Tea Hedgerow | Generic Wild Fern | [`environment-fixes-before-after/04-camellia-tea-hedgerow-vs-wild-fern.png`](environment-fixes-before-after/04-camellia-tea-hedgerow-vs-wild-fern.png) | 135,639 | `9A9D77E1D5328DAC063490A028DD94F54070A80BF9A1E632C214DC9DEB1E8A5B` | Replaces untamed garden ferns with manicured, contour-planted plantation tea bushes showing woody gnarled lower stems and flat tender plucking tables. |
| **05** | Arjuna's Penance Bas-Relief Monolith | Raw Granite Boulder | [`environment-fixes-before-after/05-mamallapuram-stone-relief-vs-boulder.png`](environment-fixes-before-after/05-mamallapuram-stone-relief-vs-boulder.png) | 49,813 | `CD9B75D2B2FCD9ECA0B58896D77F9FA07EA3222D1B0B968F77EFD757EC7CB826` | Replaces smooth uncarved rock with high-relief Pallava stone carving depicting the sacred Ganges descent, elephant herds, nagas, and yogic ascetics. |
| **06** | Granite Temple Kalvettu Inscription Stele | Wooden Signpost | [`environment-fixes-before-after/06-temple-kalvettu-stele-vs-signpost.png`](environment-fixes-before-after/06-temple-kalvettu-stele-vs-signpost.png) | 175,526 | `C47680B7529E9E5897CE0882392E7768C05363E6EE011E76A3D719CC14564915` | Replaces western trail signs with authentic weathered granite stele featuring chiseled socket plinth, arched crest with royal emblem, and 12 incised Tamil-Brahmi bands. |
| **07** | Sacred Panchaloha Brass Kalasam / Stupi | Domestic Terracotta Pot | [`environment-fixes-before-after/07-temple-kalasam-urn-vs-clay-pot.png`](environment-fixes-before-after/07-temple-kalasam-urn-vs-clay-pot.png) | 224,874 | `3C943A0A546C8618AD5BC15BE61F42187E426D4139F0F325A74025881FD6A2D6` | Replaces generic kitchen pots with sacred five-metal alloy temple finial urn featuring lotus base, bulbous Kumbha vessel, flanged neck, and needle pinnacle. |
| **08** | Interlocking Dravidian Granite Ashlar Wall | Red Clay Brick Wall | [`environment-fixes-before-after/08-interlocking-ashlar-wall-vs-brick-wall.png`](environment-fixes-before-after/08-interlocking-ashlar-wall-vs-brick-wall.png) | 247,004 | `312DD6563F232B374692362D67556FAC29A3CE2040AD8CB6A28AF1F702BB0A34` | Replaces modern mortar brickwork with heavy dry-stone interlocking granite masonry courses, projecting base plinth, and heavy Kapota coping capstones. |
| **09** | Sacred Stepped Theertham Tank (Kalyani) | Rural Water Well | [`environment-fixes-before-after/09-stepped-theertham-tank-vs-stone-well.png`](environment-fixes-before-after/09-stepped-theertham-tank-vs-stone-well.png) | 324,704 | `CEAF6913BA28C0E145AA7810AEF76896ABD5654142C106F27533F1A9349C3AD5` | Replaces circular irrigation well with square stepped sacred water tank (Kalyani) featuring 4 lamp pillars, 4 concentric granite step tiers, and submerged water mirror. |
