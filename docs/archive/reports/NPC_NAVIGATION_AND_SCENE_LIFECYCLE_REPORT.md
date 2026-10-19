# NPC NAVIGATION AND SCENE LIFECYCLE REPORT — STEP 31

**Date:** 2026-10-11
**Scope:** NPC navigation, scene transitions, and lifecycle management
**Repository:** whispering-wilds, branch `ai/unity-graphics-world-upgrade`

## 1. Navigation System

### 1.1 NPCNavigationController

| Feature | Implementation | Status |
|---|---|---|
| NavMeshAgent creation | In Start(), after Awake (avoids registration timing) | **PASS** |
| NavMesh validation | SamplePosition at spawn, skips agent if no NavMesh | **PASS** |
| Stuck detection | Position check every 2.5s, 0.15m movement threshold | **PASS** |
| Stuck recovery | Random offset retry, max 2 attempts | **PASS** |
| Path rate limiting | 0.5s cooldown between path requests | **PASS** |
| Scene boundary enforcement | Configurable Bounds, optional enforcement | **PASS** |
| Safe fallback | Transitions to Resting if path fails (no teleport) | **PASS** |
| Console spam prevention | Static flag for NavMesh missing warning | **PASS** |

### 1.2 Agent Configuration

- **Walk speed:** 1.6 m/s
- **Run speed:** 3.8 m/s
- **Stopping distance:** 0.8 m
- **Acceleration:** 6.0 m/s²
- **Obstacle avoidance:** HighQualityObstacleAvoidance
- **Auto braking:** Enabled

### 1.3 NavMesh Assets

| Scene | NavMesh Path | Status |
|---|---|---|
| 02_Chennai_GeorgeTown | NavMeshData/02_Chennai_GeorgeTown/02_Chennai_GeorgeTown.asset | **EXISTS** |
| 03_Pichavaram_Wetlands | Baked by EcologyNavMeshBaker | **DEPENDS ON BUILD** |
| 04_Thanjavur_Delta | Baked by EcologyNavMeshBaker | **DEPENDS ON BUILD** |
| 05_Chettinad_Mansion | Baked by EcologyNavMeshBaker | **DEPENDS ON BUILD** |
| 06_Mamallapuram_Shore | Baked by EcologyNavMeshBaker | **DEPENDS ON BUILD** |
| 07_Nilgiris_Sanctuary | Baked by EcologyNavMeshBaker | **DEPENDS ON BUILD** |

**Note:** Chennai NavMesh is verified to exist. Other regions require the build pipeline to bake NavMesh.

## 2. Scene Lifecycle

### 2.1 Manager Persistence

| Manager | DontDestroyOnLoad | Scene Refresh | Status |
|---|---|---|---|
| NPCScheduleManager | ✓ | N/A (persistent) | **PASS** |
| NPCPerformanceTierManager | ✓ | RefreshNPCList on scene loaded | **PASS** |
| LocalizationManager | ✓ | N/A (persistent) | **PASS** |
| DialogueUI | ✓ | Unsubscribe + resubscribe on scene load | **PASS** |

### 2.2 NPC PerformanceTierManager Scene Handling

```csharp
private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
{
    RefreshNPCList();
}
```

On every scene load, the tier manager rescans for NPCs. This ensures:
- NPCs from the new scene are picked up
- NPCs from the old scene are no longer ticked
- No dangling references to destroyed NPCs

### 2.3 DialogueUI Scene Handling

```csharp
private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
{
    UnsubscribeFromSceneNPCs();
    SubscribeToSceneNPCs();
}
```

On every scene load, DialogueUI unsubscribes from old NPCs and subscribes to new ones. This prevents:
- Double-subscription on re-entry
- Events firing on destroyed NPCs
- Stale dialogue state

### 2.4 NPC Registration/Unregistration

```csharp
// NPCCharacter.Start()
if (NPCScheduleManager.Instance != null)
    NPCScheduleManager.Instance.RegisterNPC(this);

// NPCCharacter.OnDestroy()
if (NPCScheduleManager.Instance != null)
    NPCScheduleManager.Instance.UnregisterNPC(this);
```

NPCs self-register on Start and self-unregister on OnDestroy. This ensures:
- No orphaned references in the schedule manager
- Clean cleanup when scenes unload
- Safe re-entry to scenes

## 3. Schedule System

### 3.1 Chennai NPCs (BuildChennaiPopulation)

Each Chennai NPC has a 9-slot structured schedule:
1. Morning work (6:00 AM)
2. Social time (8:00 AM)
3. Morning work (9:50 AM)
4. Lunch (1:00 PM)
5. Afternoon work (2:30 PM)
6. Social time (5:00 PM)
7. Prayer (7:00 PM)
8. Return home (9:00 PM)
9. Sleep (10:00 PM)

Times are offset per NPC (startHourOffset) so the district doesn't move as a single block.

### 3.2 Other Region NPCs (AssembleAllRegions)

Use NPCCharacter's default occupation-based schedule:
- 22:00-05:00: Sleeping
- 05:00: Returning home
- 06:00-12:00: Working
- 12:00-14:00: Eating
- 18:00-21:00: Socializing
- 21:00: Returning home

### 3.3 Schedule Anchors

| Scene | Work Anchor | Home Anchor | Social Anchor | Status |
|---|---|---|---|---|
| Chennai | ✓ (per NPC) | ✓ (per NPC) | ✓ (shared) | **PASS** |
| Pichavaram | ✗ | ✗ | ✗ | **DEFAULT** |
| Delta | ✗ | ✗ | ✗ | **DEFAULT** |
| Mamallapuram | ✗ | ✗ | ✗ | **DEFAULT** |
| Nilgiris | ✗ | ✗ | ✗ | **DEFAULT** |

**Note:** Non-Chennai NPCs use transform.position as fallback destination when anchors are null.

## 4. Scene Transition Safety

### 4.1 No Duplicate NPCs

BuildChennaiPopulation checks for existing NPCs by name:
```csharp
var existing = GameObject.Find(name);
if (existing != null && hasCharacter)
{
    // Update in place, don't duplicate
}
```

### 4.2 No Dangling References

- NPCCharacter.OnDestroy() unsubscribes from all events
- NPCScheduleManager removes null entries during broadcast
- NPCPerformanceTierManager refreshes list on scene load
- DialogueUI unsubscribes on scene load

### 4.3 No Duplicate Managers

All singleton managers use the standard pattern:
```csharp
if (Instance != null && Instance != this)
{
    Destroy(this); // Destroy only the component, not the GameObject
    return;
}
Instance = this;
DontDestroyOnLoad(gameObject);
```

## 5. Performance Tier Management

### 5.1 Distance-Based Tiers

| Tier | Distance | AI Tick | Animator | Interaction |
|---|---|---|---|---|
| Near | < 20m | 10 Hz | AlwaysAnimate | Enabled |
| Medium | 20-50m | 2.5 Hz | CullUpdateTransforms | Enabled |
| Far | 50-120m | 0.5 Hz | CullCompletely | Disabled |
| Hibernating | > 120m | 0.1 Hz | Disabled | Disabled |

### 5.2 Hysteresis

4m hysteresis buffer prevents rapid tier flip-flopping when NPCs are near tier boundaries.

### 5.3 Batch Budget

- **maxDistanceEvalsPerFrame:** 8
- **maxActiveNPCBudget:** 32
- Staggered updates across frames prevent CPU spikes

## 6. Issues Found

### 6.1 Non-Chennai NPCs Lack Schedule Anchors

NPCs in Pichavaram, Delta, Mamallapuram, and Nilgiris have no work/home/social anchors. They use the default fallback (current position) for all schedule destinations. This means they won't navigate to specific locations during their daily routine.

**Impact:** Low. NPCs will idle at their spawn position during work/social/sleep states.

**Fix:** Add anchor transforms in AssembleAllRegions for each region.

### 6.2 NavMesh Baking for Non-Chennai Scenes

Only Chennai's NavMesh is verified to exist. Other regions depend on EcologyNavMeshBaker during the build pipeline.

**Impact:** Medium. Without NavMesh, NPCs cannot navigate.

**Fix:** Run EcologyNavMeshBaker.BakeAllRegions() after scene generation.

## 7. Verification Status

| Check | Status | Evidence |
|---|---|---|
| NPCNavigationController creates agent in Start | **PASS** | Code inspection |
| NavMesh validation at spawn | **PASS** | SamplePosition check |
| Stuck detection and recovery | **PASS** | Code inspection |
| Safe fallback on path failure | **PASS** | Transitions to Resting |
| Chennai NavMesh exists | **PASS** | File system check |
| Manager persistence across scenes | **PASS** | DontDestroyOnLoad |
| NPC list refresh on scene load | **PASS** | HandleSceneLoaded |
| DialogueUI resubscribe on scene load | **PASS** | HandleSceneLoaded |
| NPC self-unregister on destroy | **PASS** | OnDestroy |
| No duplicate managers | **PASS** | Singleton pattern |
| Performance tier management | **PASS** | NPCPerformanceTierManager |
| Hysteresis prevents tier flipping | **PASS** | 4m buffer |

## 8. Runtime Verification

**Status: NOT_RUNTIME_VERIFIED**

Requires Unity editor to verify:
1. NPCs navigate to schedule destinations
2. NPCs recover from stuck situations
3. Scene transitions don't break NPC references
4. Re-entering a scene restores NPCs correctly
5. Performance tiers adjust based on distance
6. NavMesh exists in all scenes
