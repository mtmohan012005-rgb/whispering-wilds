# Save & Reload Relationship Persistence Specification & Verification
**Subsystem:** SaveSystem / SaveManager / NPCMemoryStore / EndingController  
**Baseline Commit:** `7c4a0746185e81589f986605d09447cb79a19ec3`  
**Branch:** `fix/phase-0-step-6-1`

---

## 1. Interaction Sequence in Chennai George Town (`02_Chennai_GeorgeTown`)

### Interaction 1: Murugan (Tea Kadai)
- **Dialogue Choice:** *"Show me the day's takings"* (`choice_murugan_ask_ledger`)
- **Effects:**
  - `EndingController.AdjustTrust("murugan", 10)` ➔ Murugan Trust = `10`
  - `NPCMemoryStore.RecordMemory("murugan", "asked_about_ledger")`
  - `NPCMemoryStore.RecordChoiceApplied("choice_murugan_ask_ledger")`
  - Clue Revealed: `clue_tea_ledger`
- **Field Journal Verification (`J` ➔ People Met):**
  - Tier formula: $0 \le \text{trust} < 20 \implies \text{Stranger}$
  - **English:** `• Murugan — Stranger (10)`
  - **Tamil:** `• முருகன் — அந்நியர் (10)`

### Interaction 2: Velu (Rickshaw Stand / Spices)
- **Dialogue Choice:** *"Show me the tally"* (`choice_velu_investigate_records`)
- **Effects:**
  - `EndingController.AdjustTrust("velu", 10)` ➔ Velu Trust = `10`
  - `NPCMemoryStore.RecordMemory("velu", "helped_with_records")`
  - `NPCMemoryStore.RecordChoiceApplied("choice_velu_investigate_records")`
  - Clue Revealed: `clue_rickshaw_tally`
- **Field Journal Verification (`J` ➔ People Met):**
  - Tier formula: $0 \le \text{trust} < 20 \implies \text{Stranger}$
  - **English:** `• Velu — Stranger (10)`
  - **Tamil:** `• வேலு — அந்நியர் (10)`

---

## 2. Before / After Save Snapshot Comparison

| Field / State Property | Before Choices (New Game) | Post-Interactions (Pre-Save) | Loaded Campaign (Post-Reload) | Parity Status |
| :--- | :---: | :---: | :---: | :---: |
| **`schemaVersion`** | 5 | 5 | 5 | **MATCH** |
| **`murugan` Trust** | 0 | 10 | 10 | **MATCH** |
| **`velu` Trust** | 0 | 10 | 10 | **MATCH** |
| **`murugan` Tier (EN)** | Stranger | Stranger | Stranger | **MATCH** |
| **`murugan` Tier (TA)** | அந்நியர் | அந்நியர் | அந்நியர் | **MATCH** |
| **`velu` Tier (EN)** | Stranger | Stranger | Stranger | **MATCH** |
| **`velu` Tier (TA)** | அந்நியர் | அந்நியர் | அந்நியர் | **MATCH** |
| **Memory (`murugan`)** | None | `asked_about_ledger` | `asked_about_ledger` | **MATCH** |
| **Memory (`velu`)** | None | `helped_with_records` | `helped_with_records` | **MATCH** |
| **Applied Choice IDs** | Empty | `choice_murugan_ask_ledger`<br>`choice_velu_investigate_records` | `choice_murugan_ask_ledger`<br>`choice_velu_investigate_records` | **MATCH** |
| **Choice Re-Execution Guard** | Blocked = False | Blocked = True | Blocked = True (No exploit) | **MATCH** |
| **Currency** | 150 | 150 | 150 | **MATCH** |

---

## 3. Schema v5 Serialized JSON Representation
When saved via `SaveSystem.SaveGame()`, the payload serializes as:

```json
{
  "schemaVersion": 5,
  "currentRegionId": "chennai",
  "currency": 150,
  "tutorialCompleted": true,
  "npcTrustScores": [
    { "npcId": "murugan", "trustScore": 10 },
    { "npcId": "velu", "trustScore": 10 }
  ],
  "npcMemories": [
    {
      "npcId": "murugan",
      "flags": ["asked_about_ledger"]
    },
    {
      "npcId": "velu",
      "flags": ["helped_with_records"]
    }
  ],
  "appliedChoiceIds": [
    "choice_murugan_ask_ledger",
    "choice_velu_investigate_records"
  ],
  "factionAffinities": []
}
```

---

## 4. Anti-Exploit Consequence Guard
If dialogue with Murugan or Velu is re-opened:
- `NPCMemoryStore.IsChoiceApplied(choice.choiceId)` returns `true`.
- The trust delta (+10) and memory recording are strictly skipped.
- Duplicate awards are blocked at both dialogue engine and controller level.
