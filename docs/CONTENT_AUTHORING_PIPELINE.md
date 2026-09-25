# The Whispering Wilds (Kaattu Vazhi) — Content Authoring Pipeline

## 1. Architecture Overview

The Whispering Wilds content system decouples all gameplay data from code (`main.js`). All quests, dialogues, NPCs, locations, items, shops, cultural activities, world events, wildlife, and achievements are data-driven JSON records managed by `ContentRegistry`.

```
content/
├── manifests/          # Database versioning & global schema manifests
├── characters/         # Casting profiles & dialogue portraits
├── npc/                # Autonomous NPC definitions & daily schedules
├── quests/             # 8-state data-driven quest definitions
├── dialogue/           # Bilingual branching conversations (Tamil + English)
├── locations/          # Regional coordinates, photo spots, ambience profiles
├── events/             # Dynamic weather, festivals & community gatherings
├── wildlife/           # Animal behavior, rarity & tracking cues
├── items/              # Traditional cultural items & survival provisions
├── crafting/           # Crafting recipes by ID
├── shops/              # Single-deduction merchants & stock tables
├── achievements/       # Discoveries & codex unlocks
├── collectibles/       # Manuscripts & ancient coins
├── lore/               # Historical notes & inscriptions
├── culture/            # Reusable authored cultural activities
├── audio/              # Content-to-Audio bus bindings
├── cinematics/         # Cutscene director cues
├── localization/       # Human-verified Tamil & English dictionaries
└── validation/         # Pre-flight schema validation rules
```

---

## 2. Core JavaScript Content Engine

1. **`ContentRegistry` (`js/content/content-registry.js`)**:
   - Central authority for content items.
   - Enforces unique IDs across all domains (no identification by display name).
   - Tracks version numbers, dependencies, and regional tags.
   - Deep-freezes registered definitions in production to prevent runtime mutations.

2. **`ContentEvents` (`js/content/content-events.js`)**:
   - Event-driven objective and world communication bus.
   - Decouples systems: quests never directly call inventory or rendering code.
   - Standard event emitters: `reachLocation`, `interactObject`, `talkNPC`, `collectItem`, `inspectClue`, `photographSubject`, `surviveWeather`, `completeCulturalActivity`, `discoverWildlife`, `deliverItem`, `solvePuzzle`.

3. **`QuestStateMachine` (`js/content/quest-machine.js`)**:
   - 8 Authoritative States: `LOCKED`, `AVAILABLE`, `ACTIVE`, `PAUSED`, `OPTIONAL`, `FAILED`, `COMPLETED`, `ABANDONED`.
   - Anti-Skip Protection: Accidental interaction cannot skip unactivated objectives.
   - Idempotent Rewards: Reward hashes guarantee coins, XP, and items are awarded strictly once.

4. **`DataDialogueSystem` (`js/content/dialogue-system.js`)**:
   - Bilingual nodes (`textEn`, `textTa`) with voice ID bindings.
   - 8 Nuanced Choice Tones: `friendly`, `curious`, `cautious`, `investigative`, `humorous`, `culturally_respectful`, `quest_focused`, `optional_info`.
   - Believable consequences: NPC relationship changes (-100 to 100), faction reputation, quest branches, and clue unlocks.

5. **`CulturalActivitySystem` (`js/content/cultural-activity-system.js`)**:
   - Step-by-step participatory cultural loops (e.g. Kolam threshold art, Clay pot Pongal boiling).
   - Includes authentic Tamil cultural explanations, audio cues, and knowledge progression.

6. **`ContentShopSystem` (`js/content/content-shop-system.js`)**:
   - Atomic single deduction authority: Prevents double deductions and race conditions.
   - Regional mismatch guards: Prevents purchasing from distant regional merchants.
   - Dynamic reputation discounts and stock decrement.

7. **`ContentValidator` (`js/content/content-validator.js`)**:
   - Automated pre-flight validation reporting exact status:
     ```
     CONTENT VALIDATION
     ------------------
     Errors: 0
     Warnings: 0
     Missing Assets: 0
     Missing Localization: 0
     Broken References: 0
     ```

8. **`ContentSaveMigration` (`js/content/content-save-migration.js`)**:
   - Version metadata: `gameVersion`, `contentVersion`, `schemaVersion`.
   - Strictly enforces the permanent player customization ceiling: `customizationChangesUsed <= 5`.

9. **`DevContentPanel` (`js/content/content-panel-dev.js`)**:
   - Developer inspection dashboard toggled via \` or Ctrl+Shift+D.
   - Automatically disabled in production builds (`FORCE_PRODUCTION_BUILD`).

---

## 3. Authoring Guidelines

### Quests (`content/quests/*.json`)
```json
{
  "id": "quest_cutting_chai_route",
  "version": "1.0.0",
  "title": "The Cutting Chai Express",
  "titleTa": "கட்டிங் டீ விரைவுப் பாதை",
  "region": "george_town",
  "category": "side",
  "difficulty": "easy",
  "giverNpcId": "npc_murugan",
  "objectives": [
    { "id": "obj_1", "type": "talk_npc", "target": "npc_murugan" },
    { "id": "obj_2", "type": "collect_item", "target": "item_brass_tea_carrier" }
  ],
  "rewards": {
    "xp": 120,
    "coins": 35,
    "items": ["item_murugan_special_chai_token"]
  }
}
```

### Dialogue (`content/dialogue/*.json`)
```json
{
  "id": "dialogue_murugan_intro",
  "speaker": "npc_murugan",
  "nodes": {
    "greeting": {
      "textEn": "Vanakkam! What brings an explorer here?",
      "textTa": "வணக்கம்! என்ன விசேஷம், இந்த பக்கமா வந்திருக்கீங்க?",
      "choices": [
        {
          "id": "c1",
          "tone": "friendly",
          "textEn": "A cutting chai first, Murugan Anna.",
          "textTa": "முதல்ல ஒரு கட்டிங் டீ போடுங்க அண்ணா.",
          "nextNode": "serve_tea"
        }
      ]
    }
  }
}
```

---

## 4. Acceptance Criteria Verification

| Requirement | System | Verification Status |
|-------------|--------|---------------------|
| 1. Quest from Data | `QuestStateMachine` | Verified via `testQuestSystem` |
| 2. NPC without editing `main.js` | `ContentRegistry` | Verified via `testNpcContent` |
| 3. Dialogue branch from Data | `DataDialogueSystem` | Verified via `testDialogueSystem` |
| 4. Location from Data | `ContentRegistry` | Verified via `testLocationContent` |
| 5. Cultural activity from Data | `CulturalActivitySystem` | Verified via `testCulturalActivities` |
| 6. World event from Data | `ContentEvents` | Verified via `testWorldEvents` |
| 7. Achievement from Data | `ContentRegistry` | Verified via `testContentPipeline` |
| 8. Automated validation | `ContentValidator` | 0 errors, 0 broken references |
| 9. Save and reload state | `ContentSaveMigration` | Verified via `testSaveMigration` |
| 10. No duplicate rewards | `QuestStateMachine` | Idempotent hash lock verified |
| 11. Bilingual Tamil + English | Data schemas | Human-reviewed Tamil strings verified |
| 12. Missing optional assets safe | `ContentLoader` | Graceful fallback verified |
| 13. Production hides dev panel | `DevContentPanel` | Production lock verified |
| 14. Multiplayer untrusted rewards | Client security check | Authoritative signature verified |
| 15. Absolute 5-customization limit | Invariant Guard | `customizationChangesUsed <= 5` verified |
