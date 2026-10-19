# QUEST_COVERAGE_AUDIT — STEP 28 §P/Q

Status: **PARTIAL** — P1/P2 code wiring shipped; region authoring for Thanjavur/Nilgiris + finale still open.

## Quest inventory (registered, stable ids)
| Quest | Region | Status |
|---|---|---|
| `quest_first_day_george_town` | chennai | **open** (seeded via `AcceptOpeningQuests`, New Game) |
| `quest_tea_ledger_discrepancy` | chennai | **open** (seeded via `AcceptOpeningQuests`, New Game) |
| `CHETTINAD_01` "The House That Remembers" | chettinad | **RESOLVED (P1)** — now accepted on arrival |
| `MAMALLAPURAM_01` "Echoes Along the Shore" | mamallapuram | **RESOLVED (P1)** — now accepted on arrival |
| `PICHAVARAM_01` "The Night Current" | pichavaram | **WIRED (P2)** — registered + accepted on arrival + dialogue pushed to Mani |
| `_DELTA_*` (Thanjavur) | thanjavur | **NOT AUTHORED** — region has zero quest/clue anchors |
| `_NILGIRIS_*` (Sanctuary) | nilgiris | **NOT AUTHORED** — region has zero quest/clue anchors |
| `FINAL_01` finale + `gameCompleted` (save v5) | everywhere | **NOT IMPLEMENTED** |

## P1 — region quests were registered but never accepted (FIXED)
Before this audit the destination quests lived only in `GameDataCatalog`; nothing called
`QuestManager.AcceptQuest` for them, so a player arriving in Chettinad/Mamallapuram had no journal
quest and no objective flow. Fix:
- `GameplayContentRegistry.GetRegionQuestId(regionId)` maps region → signature quest.
- `QuestManager.AcceptRegionArrivalQuest(regionId)` — idempotent accept (active/completed quests untouched, unknown regions skipped).
- `GameplayRegionBootstrap.Start` calls it for every region scene (after `ConsumeNewGameRequest`).

## P2 — Pichavaram content was inert (WIRED)
`PichavaramContent.cs` was fully authored (11-stage quest, 3 clues, 3 items, discovery, Mani's
4-beat dialogue) but referenced nowhere. Fix:
- `GameplayContentRegistry.EnsureAllInitialized` + `EnsureRegionInitialized("pichavaram")` now register it.
- `GameplayRegionBootstrap.BuildDialogueForRegion` pushes Mani's graph in the 03 scene.
- `AcceptRegionArrivalQuest("pichavaram")` starts `PICHAVARAM_01` on arrival.

## Remaining (authoring must land before RELEASE_CANDIDATE_READY)
- Thanjavur (04) + Nilgiris (07): signature quests, evidence, NPC dialogue.
- Finale `FINAL_01` + `gameCompleted` flag (save schema v4 → v5).
- Scene-side placement of the Pichavaram interactables named in the quest
  (`object_pichavaram_dock_edge/_stern_cutting/_root_cache/_net_log_seat`, creek-mouth/bank
  locations) so the authored chain is completable in the 03 build-out.

## QA gating
`MamallapuramRouteVerifier` (build-time route audit) + `RuntimeAutomatedSmokeTest` assert quest
ids resolve and route targets are reachable on the baked NavMesh — no regression gap introduced by P1/P2.