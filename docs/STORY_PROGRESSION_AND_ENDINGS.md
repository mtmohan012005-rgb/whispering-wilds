# Story Endings, Branching Consequences, New Game+, Replayability & Final Progression
**Project**: The Whispering Wilds (*Kaattu Vazhi* / காட்டு வழி)  
**Target Platform**: PC Only  
**Architecture Spec**: Production Gameplay & Narrative Logic Layer  

---

## 1. Executive Summary

This architecture implements a production-grade narrative resolution engine, branching consequence tracker, New Game+ cycle manager, and replay system for *The Whispering Wilds*. 

The player's choices, discoveries, relationships, investigations, and completed quests meaningfully influence the final story presentation and optional outcomes across the entire beginning → middle → end progression.

### Core Architectural Mandates & Invariants Enforced:
1. **Never report: READY_FOR_RELEASE when mandatory story paths are untested**: Complete test coverage across all 4 endings, transitions, and NG+ cycles.
2. **Never invent missing ending content**: All 4 endings are fully authored with deep Tamil Nadu cultural grounding and definitive epilogues.
3. **Never expose hidden story content through the recap or ending gallery**: Secret True Ending details remain masked (`???`) with silhouette placeholders until legitimately earned.
4. **Never overwrite the only valid completed save**: Campaign completion archives an immutable copy to `whisperingWilds_save_completed_campaign`, with New Game+ launching in a dedicated slot (`whisperingWilds_save_ngplus_gen1`).
5. **Never allow New Game+ to bypass story/security validation**: Starting NG+ strictly requires verified campaign completion.
6. **ABSOLUTE PLAYER CUSTOMIZATION LIMIT: 5 PERMANENT CHANGES MAXIMUM**: `customizationChangesUsed <= 5` invariant preserved across all saves, restarts, migrations, and New Game+ cycles.

---

## 2. The Four Distinct Endings

| Ending Code | Title (English & Tamil) | Tone | Core Prerequisite Summary | Secret? |
| :--- | :--- | :--- | :--- | :---: |
| **ENDING_A** | **The Living Heritage**<br>*(தூய பசுமைத் தடம்)* | Triumphant & Grounded | Heritage Council affinity ≥ 60%, average NPC trust ≥ 50%, ≥ 5 clues recovered, Living Sanctuary verdict chosen. Sacred flora and folios returned to community stewardship. | No |
| **ENDING_B** | **The Recorded Chronicle**<br>*(வரலாற்றுப் பதிவேடு)* | Scholarly & Orderly | Archaeological Society affinity ≥ 55%, State Biosphere Reserve verdict chosen. Blueprints and artifacts accessioned into Madras High Court and Egmore Museum collections. | No |
| **ENDING_C** | **The Shadowed Sanctuary**<br>*(மறைந்த வனம்)* | Melancholic & Cautionary | Subterranean vault sealed or low trust (< 35%) and lost evidence. The mountain passes collapse; ancient botanical secrets slip into silence and myth. | No |
| **ENDING_D** | **Song of the Ancestral Soil**<br>*(காலத்தின் பாடல்)* | Transcendent & Mythic Realism | **Secret True Ending**: All 7 regional evidence items connected, all 4 exploration milestones completed, maximum trust (≥ 70%) with all 5 central NPCs, Living Sanctuary verdict chosen. Complete cultural-ecological harmony. | **Yes** *(Masked until unlocked)* |

---

## 3. The Four Branching Dimensions

### Dimension 1: Factions & Alliances
- **Tamizh Heritage & Ecological Council** (*தமிழ் மரபு மற்றும் சூழலியல் அறக்கட்டளை*): Focuses on community custody, sacred groves, and indigenous botanical medicine.
- **Madras Historical & Archaeological Society** (*மதராஸ் தொல்பொருள் ஆய்வு நிறுவனம்*): Focuses on legal warrants, academic open science, and museum display.
- **Delta Agrarian Resistance & Guild** (*டெல்டா உழவர் உரிமை பாதுகாப்புப் பேரவை*): Focuses on farmer water rights and grassroots community defense against syndicates.

### Dimension 2: Key Quest Decision Branches
1. **Cauvery Sluice Flow Verdict** (Ch. 2): Farmer Paddy Priority vs 800-Year Balanced Chola Weir vs Mangrove Stilt Root Defense.
2. **Chettinad Trade Ledgers** (Ch. 3): Nattukottai Village Trust vs High Court Chief Magistrate Prosecution.
3. **Sacred Chola Bronze Mold** (Ch. 4): Swamimalai Artisan Temple Consecration vs Egmore Government Museum Donation.
4. **Mamallapuram Smuggling Manifest** (Ch. 5): Catamaran Fisherfolk Torchlight Encirclement vs Maritime Police Tactical Intercept.
5. **Sanctuary Destiny** (Climax): Indigenous Living Sanctuary Guard vs State Biosphere Reserve vs Subterranean Sealed Vault.

### Dimension 3: Central NPC Relationships
- **Murugan Annan** (Roadside Tea Master, George Town)
- **Auto Driver Velu** (Madras Auto Guild Leader)
- **Farmer Selvam** (Cauvery Basin Paddy Steward)
- **Sthapathi Sundaram** (Swamimalai Master Bronze Artisan)
- **Forest Guide Mani** (Nilgiris Indigenous Tracker)
- Relationship Tiers: `STRANGER` (0–24) → `ACQUAINTANCE` (25–49) → `TRUSTED_ALLY` (50–79) → `LIFELONG_KIN` (80–100).

### Dimension 4: Exploration Milestones
- **Epigraphist of Tamil Soil**: Discover and decipher 6 stone inscriptions.
- **Lost Herbarium of the Nilgiris**: Collect all 7 ancient palm-leaf botanical folios.
- **Voice of the Forest (Kaattu Kural)**: Document all 9 native wildlife species.
- **Secret of the Banyan Heart**: Unlock the subterranean seed vault.

---

## 4. New Game+ Architecture

### Carryovers (Preserved)
- Player Level & Maximum Survival Vitals (Health, Stamina, Hydration, Warmth)
- Master Discovery Codex & Wildlife Observation Journal
- All Earned Trophies, Achievements & Cosmetic Titles
- Traditional Wardrobe Garments
- Customization History (**Strict ≤ 5 Ceiling Preserved**)

### Resets (Narrative Replayability)
- 7-Chapter Quest Arc and Investigation Leads (enabling alternate branch choices)
- Physical Evidence and Trade Ledgers
- Regional Locks and Environmental Puzzle Mechanisms

### NG+ Exclusive Modifiers
- **Fierce Tamil Monsoon** (*கடும் பருவமழை*): Unpredictable violent squalls, rapid wetness chilling (+25% XP).
- **Master Detective** (*புலனாய்வு முறை*): Disables HUD clue halos and objective waypoints (+35% XP).
- **Arduous Wilderness Trek** (*கடும் நடைப்பயணம்*): Faster hydration and stamina depletion under tropical sun (+20% XP).

---

## 5. UI & Replay Components

- `js/ui/ending-ui.js`: Cinematic ending modal with bilingual titles, narrative epilogue scroll, and legacy perks.
- `js/ui/story-recap-ui.js`: Decision timeline, NPC affinity meters, and faction standing chronicle.
- `js/ui/new-game-plus-ui.js`: Modifier selection, carryover breakdown, and safe launch modal.
- `js/ui/replay-summary-ui.js`: Post-campaign free-roam scenario launcher and playtime statistics.
- `css/story-progression.css`: Glassmorphic styling matching the game's dark aesthetic.

---

## 6. Verification Test Suites

All 5 core story verification suites reside under `tests/story/`:
1. `tests/story/test-story-progression.js`: Verifies graph node transitions, prerequisites, and sequence protection.
2. `tests/story/test-story-branches.js`: Verifies choice recording, NPC affinity updates, faction standing, and flags.
3. `tests/story/test-endings.js`: Verifies evaluation logic for all 4 endings, spoiler prevention, and gallery masking.
4. `tests/story/test-new-game-plus.js`: Verifies completion security guard, safe archive preservation, and `customizationChangesUsed <= 5`.
5. `tests/story/test-replay-system.js`: Verifies free-roam activation, chapter scenario execution, and recap generation.
