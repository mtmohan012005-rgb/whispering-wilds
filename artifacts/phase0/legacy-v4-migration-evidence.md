# Legacy Schema v4 JSON Migration & State Isolation Verification
**Subsystem:** SaveSystem / SaveMigrator / SaveManager  
**Target Schema:** Forward migration from Schema v4 to Schema v5  
**Baseline Commit:** `7c4a0746185e81589f986605d09447cb79a19ec3`  
**Branch:** `fix/phase-0-step-6-1`

---

## 1. The Defect (P1 State Leakage)
In legacy save loading, when loading an older campaign save (Schema v4 or earlier) that had no `npcTrustScores`, `npcMemories`, `appliedChoiceIds`, or `factionAffinities` recorded:
- The previous `SaveManager.ApplySaveDataToGame()` iterated over `save.npcTrustScores` without clearing the in-memory dictionary in `EndingController`.
- When loading an empty collection, prior active session scores (e.g., Murugan: 75, Velu: 40) remained active in memory, contaminating the loaded game.

---

## 2. The Architectural Fix
1. **Atomic Reset in `EndingController.RestoreRelationships`**:
   - `npcTrustScores.Clear()` is invoked before applying loaded values.
   - All faction affinities (`heritageCouncilAffinity`, `archaeologicalSocietyAffinity`, `agrarianGuildAffinity`) are reset to `0` baseline before applying loaded values.
   - Non-relationship state (`sanctuaryVerdict`, `explorationMilestones`, `cachedEnding`) is strictly preserved.
2. **Safe Forward Migration in `SaveMigrator.TryMigrate`**:
   - Schema v4 payloads are detected (`data.schemaVersion < 5`).
   - Missing relationship collections are safely instantiated as empty lists rather than left null:
     - `npcTrustScores = new List<SavedNPCTrust>();`
     - `npcMemories = new List<SavedNPCMemory>();`
     - `appliedChoiceIds = new List<string>();`
     - `factionAffinities = new List<SavedFactionAffinity>();`
   - `schemaVersion` is bumped to `5`.
3. **Memory & Choice Reset in `NPCMemoryStore`**:
   - `NPCMemoryStore.RestoreMemories(save.npcMemories)` replaces all NPC memory tables.
   - `NPCMemoryStore.RestoreAppliedChoices(save.appliedChoiceIds)` replaces the applied choice hashset.

---

## 3. Real Schema v4 JSON Test Payload
The integration test `SaveMigrator_AndSaveManager_V4JsonMigrationAndRestoration_ClearsStaleRelationships` feeds this exact raw JSON payload:

```json
{
  "schemaVersion": 4,
  "currentRegionId": "chennai",
  "posX": 12.5,
  "posY": 0.0,
  "posZ": -5.2,
  "rotY": 90.0,
  "currency": 150,
  "tutorialCompleted": true,
  "unlockedRegionIds": ["chennai", "pichavaram"],
  "solvedPuzzleIds": [],
  "recordedDiscoveryIds": []
}
```

---

## 4. Test Verification Flow
```
[Pre-Seed Stale State]
Murugan Trust: 75, Velu Trust: 40, Heritage Affinity: 35
Memory: 'stale_memory_flag', Choice: 'choice_murugan_ask_ledger'
        │
        ▼
[Parse Raw Schema v4 JSON]
JsonUtility.FromJson<GameSaveData>(v4Json)
Assert schemaVersion == 4, v5 collections == null
        │
        ▼
[SaveMigrator.TryMigrate]
Forward-migrate schemaVersion -> 5
Assert empty non-null collections initialized
        │
        ▼
[SaveManager.ApplySaveDataToGame]
EndingController.RestoreRelationships()
NPCMemoryStore.RestoreMemories() / RestoreAppliedChoices()
        │
        ▼
[Assert Zero State Leakage]
Murugan Trust: 0 (PASS)
Velu Trust: 0 (PASS)
Heritage Affinity: 0 (PASS)
HasMemory('stale_memory_flag'): false (PASS)
IsChoiceApplied('choice_murugan_ask_ledger'): false (PASS)
Campaign Position & Currency (150): Preserved (PASS)
```

---

## 5. Result
The migration and restoration pipeline completely eliminates state leakage, ensuring that older saves always load with clean, isolated relationship defaults.
