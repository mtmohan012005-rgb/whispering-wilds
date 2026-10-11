# NPC INTERACTION QA REPORT — STEP 31

**Date:** 2026-10-11
**Scope:** Player-NPC interaction pipeline verification
**Repository:** whispering-wilds, branch `ai/unity-graphics-world-upgrade`

## 1. Interaction Pipeline Architecture

### 1.1 Component Chain

```
PlayerInputHandler (E key)
    → PlayerInteractor.ScanForInteractables() (2.5m sphere)
        → NPCCharacter (implements IInteractable)
            → NPCCharacter.Interact()
                → NPCCharacter.OnDialogueStarted event
                    → DialogueUI.OpenDialogue()
                        → Shows bilingual dialogue
                        → Player selects choice
                            → DialogueUI.CloseDialogue()
                                → NPCCharacter.ResumeScheduledActivity()
```

### 1.2 Key Scripts

| Script | Role | File |
|---|---|---|
| PlayerInputHandler | Captures E key, exposes InteractTriggered | Scripts/Player/PlayerInputHandler.cs |
| PlayerInteractor | Scans for IInteractable, triggers Interact() | Scripts/Player/PlayerInteractor.cs |
| NPCCharacter | Implements IInteractable, manages dialogue | Scripts/NPC/NPCCharacter.cs |
| DialogueUI | Renders dialogue panel, handles choices | Scripts/UI/DialogueUI.cs |
| LocalizationManager | Provides language selection | Scripts/Localization/LocalizationManager.cs |

## 2. Interaction Range and Detection

### 2.1 PlayerInteractor Configuration

- **interactionRadius:** 2.5m
- **Detection method:** Physics.OverlapSphere at player position + 0.8m up
- **LayerMask:** All layers (interactableLayers = ~0)
- **QueryTriggerInteraction:** Collide

### 2.2 NPC Collider Setup

**Chennai NPCs (BuildChennaiPopulation):**
- CapsuleCollider: height 1.8f, radius 0.4f, center (0, 0.9, 0)
- isTrigger: false

**Other region NPCs (AssembleAllRegions — STEP 31 fix):**
- CapsuleCollider: height 1.8f, radius 0.4f, center (0, 0.9, 0)
- isTrigger: false

**Status:** All NPCs now have interaction colliders.

## 3. Dialogue System

### 3.1 DialogueNode Structure

```csharp
DialogueNode {
    nodeIndex: int
    speakerTextEn: string
    speakerTextTa: string
    requiredClueId: string (optional)
    choices: List<DialogueChoice>
}

DialogueChoice {
    choiceTextEn: string
    choiceTextTa: string
    nextNodeIndex: int (-1 = end conversation)
    requiredClueId: string (optional)
    revealClueId: string (optional)
}
```

### 3.2 Dialogue Content per NPC

| NPC | Nodes | Choices | Bilingual | Status |
|---|---|---|---|---|
| Murugan | 1+ | Multiple | ✓ | IMPLEMENTED |
| Velu | 1+ | Multiple | ✓ | IMPLEMENTED |
| Meenakshi | 1+ | Multiple | ✓ | IMPLEMENTED |
| Selvam | 1+ | Multiple | ✓ | IMPLEMENTED |
| Chennai residents | 1 | 1 (closing) | ✓ | IMPLEMENTED |
| Mani (Pichavaram) | 1 | 1 (closing) | ✓ | IMPLEMENTED (STEP 31) |
| Arumugam (Delta) | 1 | 1 (closing) | ✓ | IMPLEMENTED (STEP 31) |
| Sundaram (Mamallapuram) | 1 | 1 (closing) | ✓ | IMPLEMENTED (STEP 31) |
| Raman (Nilgiris) | 1 | 1 (closing) | ✓ | IMPLEMENTED (STEP 31) |

### 3.3 Dialogue Lifecycle

1. Player approaches NPC within 2.5m
2. PlayerInteractor detects NPCCharacter via CapsuleCollider
3. Interaction prompt appears: "[E] Talk to {NPC name}"
4. Player presses E
5. NPCCharacter.Interact():
   - Stops navigation
   - Faces player
   - Transitions to Talking state
   - Resolves entry node (clue-gated if applicable)
   - Fires OnDialogueStarted event
6. DialogueUI.OpenDialogue():
   - Shows dialogue panel
   - Displays speaker name and text in selected language
   - Renders choice buttons
7. Player selects choice:
   - If nextNodeIndex >= 0: advances to next node
   - If nextNodeIndex < 0: closes dialogue
8. DialogueUI.CloseDialogue():
   - Hides dialogue panel
   - Records conversation in NPCInteractionLog
   - NPC resumes scheduled activity

## 4. Localization Verification

### 4.1 Language Support

| Feature | English | Tamil | Status |
|---|---|---|---|
| NPC display name | ✓ | ✓ | PASS |
| Interaction prompt | ✓ | ✓ | PASS |
| Dialogue text | ✓ | ✓ | PASS |
| Choice text | ✓ | ✓ | PASS |
| Dialogue UI labels | ✓ | ✓ | PASS |

### 4.2 LocalizationManager Integration

- NPCCharacter.InteractionPrompt uses `LocalizationManager.GetForDisplay("talk.{npcId}")`
- Falls back to `talk.default` template with localized display name
- DialogueNode stores both `speakerTextEn` and `speakerTextTa`
- DialogueUI selects text based on `LocalizationManager.CurrentLanguage`

## 5. Interaction State Management

### 5.1 NPCState Transitions

| Trigger | From | To | Animation |
|---|---|---|---|
| Player interacts | Any (except Sleeping) | Talking | Talk |
| Dialogue closes | Talking | Scheduled | Resume |
| Timeout (25s) | Talking | Scheduled | Resume |
| Night schedule | Any | Sleeping | Sleep |

### 5.2 CanInteract Conditions

```csharp
public bool CanInteract(PlayerInteractor interactor) =>
    stateMachine.CurrentState != NPCState.Sleeping;
```

NPCs cannot be interacted with while sleeping.

## 6. Fix Applied in STEP 31

### 6.1 Problem

AssembleAllRegions NPCs (Pichavaram, Delta, Mamallapuram, Nilgiris) had:
- No CapsuleCollider → invisible to PlayerInteractor
- No dialogue nodes → nothing to show even if interaction triggered
- No occupation/profession → generic "Resident" label

### 6.2 Solution

Added `SetupNPC()` method that configures:
- CapsuleCollider for interaction detection
- NPCCharacter with full bilingual profile
- Dialogue node with greeting and closing choice
- Proper occupation and profession

## 7. Verification Status

| Check | Status | Evidence |
|---|---|---|
| PlayerInteractor detects NPCs | **PASS** | CapsuleCollider on all NPCs |
| NPCCharacter implements IInteractable | **PASS** | Code inspection |
| DialogueUI subscribes to OnDialogueStarted | **PASS** | SubscribeToSceneNPCs() |
| Bilingual dialogue content | **PASS** | All NPCs have En/Ta text |
| Interaction prompt localization | **PASS** | LocalizationManager integration |
| CanInteract respects Sleeping state | **PASS** | Code inspection |
| Dialogue closes and resumes NPC | **PASS** | CloseDialogue() → ResumeScheduledActivity() |
| Conversation recorded in NPCInteractionLog | **PASS** | RegisterConversationWithPlayer() |

## 8. Runtime Verification

**Status: NOT_RUNTIME_VERIFIED**

Requires Unity editor to verify:
1. Interaction prompt appears when approaching NPC
2. Pressing E opens dialogue
3. Dialogue text displays in correct language
4. Choice buttons work and advance/close dialogue
5. NPC faces player during interaction
6. NPC resumes activity after dialogue closes
7. Sleeping NPCs cannot be interacted with

## 9. Known Limitations

1. **Simple dialogue:** Most NPCs have one greeting node. Complex branching exists only for Chennai main characters.
2. **No voice acting:** Text-only dialogue.
3. **No lip-sync:** Body animation only during Talk state.
4. **No quest integration in dialogue:** Dialogue choices don't trigger quests (except via clue system for investigation-related NPCs).
