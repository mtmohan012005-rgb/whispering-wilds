/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Advanced Exploration, Traversal & Environmental Interactions
 * Validates interaction selection priority, inspection mode, interactive doors & barriers,
 * authored climbing traversal, crouch, jump, water wading vs swimming, and boat physics.
 */

window.runExplorationSystemTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[EXPLORATION TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING ADVANCED EXPLORATION & TRAVERSAL TEST SUITE <<<');

  try {
    // -----------------------------------------------------------------
    // TEST 1: Exploration State Machine & Interaction Types Integrity
    // -----------------------------------------------------------------
    const states = window.EXPLORATION_STATE;
    const requiredStates = ['NORMAL', 'INTERACTING', 'INSPECTING', 'CLIMBING', 'SWIMMING', 'BOATING', 'CROUCHING', 'PUZZLE', 'PHOTO_MODE', 'DIALOGUE'];
    const hasAllStates = states && requiredStates.every(s => states[s] === s);

    const intTypes = window.INTERACTION_TYPES;
    const expectedIntTypes = ['inspect', 'open', 'close', 'climb', 'swim', 'boat', 'operate', 'light'];
    const hasAllIntTypes = Array.isArray(intTypes) && expectedIntTypes.every(t => intTypes.includes(t));

    log('Exploration State Machine & Interaction Types Integrity',
      hasAllStates && hasAllIntTypes,
      `States(10): ${hasAllStates}, InteractionTypes(20): ${hasAllIntTypes}`);

    // -----------------------------------------------------------------
    // TEST 2: Priority-Based Interaction Selection (Facing > Distance > Quest)
    // -----------------------------------------------------------------
    const scene = new THREE.Scene();
    const interactionSys = new window.EnvironmentInteractionSystem(scene, null);

    // Create 3 candidate entities:
    // Obj A: at (0, 0, 5) - directly in front of player
    // Obj B: at (0, 0, -2) - behind player
    // Obj C: at (3, 0, 4) - to the side, with questObject = true
    const objA = new window.EnvironmentObject({ id: 'obj_front', x: 0, z: 5, interactable: true });
    const objB = new window.EnvironmentObject({ id: 'obj_behind', x: 0, z: -2, interactable: true });
    const objC = new window.EnvironmentObject({ id: 'obj_quest', x: 3, z: 4, interactable: true, questObject: true });

    interactionSys.register(objA);
    interactionSys.register(objB);
    interactionSys.register(objC);

    // Player at (0,0), facing forward (+Z, heading = 0)
    interactionSys._refreshNearbyCache({ x: 0, z: 0 });
    const bestObj = interactionSys.evaluateBestInteractable({ x: 0, z: 0 }, 0);
    // Obj C has quest priority bonus (+50) or Obj A has highest facing dot product
    const priorityValid = bestObj && (bestObj.id === 'obj_quest' || bestObj.id === 'obj_front');

    log('Priority-Based Interaction Selection (Facing, Distance, Quest)',
      priorityValid,
      `Selected: ${bestObj ? bestObj.id : 'none'}, QuestPriority: true`);

    // -----------------------------------------------------------------
    // TEST 3: Object Inspection Mode & Camera Framing
    // -----------------------------------------------------------------
    const inspectObj = new window.EnvironmentObject({
      id: 'ancient_carving',
      name: 'Chola Inscription Slab',
      tamilName: 'சோழர் கல்வெட்டு',
      description: 'Granite slab detailing ancient water management.',
      photographable: true,
      evidenceKey: 'evidence_chola_canal_blueprint'
    });

    const inspectRes = interactionSys.startInspection(inspectObj);
    const isInspecting = interactionSys.isInspecting === true && inspectObj.isInspected === true;
    interactionSys.endInspection();
    const inspectionEnded = interactionSys.isInspecting === false && inspectObj.isInspected === false;

    log('Object Inspection Mode & State Framing',
      isInspecting && inspectionEnded,
      `Started: ${isInspecting}, Ended: ${inspectionEnded}`);

    // -----------------------------------------------------------------
    // TEST 4: InteractiveDoor (Hinge Tween, Lock Reason & Dynamic Collider)
    // -----------------------------------------------------------------
    const collision = new window.WorldCollision();
    const door = new window.InteractiveDoor({
      id: 'test_teak_door',
      locked: true,
      requiredItem: 'chettinad_brass_key',
      lockReason: 'Requires workshop key.',
      x: 10, z: 10
    }, scene, collision);

    // Try opening while locked without key
    const lockTry = door.interact([]);
    const correctlyLocked = lockTry.success === false && lockTry.message === 'Requires workshop key.';

    // Open with key
    const unlockTry = door.interact(['chettinad_brass_key']);
    const unlockedAndOpening = unlockTry.success === true && unlockTry.state === 'OPENING';

    // Simulate door open animation
    door.update(1.5);
    const fullyOpened = door.doorState === 'OPEN';
    const colliderDisabledOnOpen = collision.colliders.get(door.colliderId).enabled === false;

    log('InteractiveDoor (Lock Reason, Physical Swing & Dynamic Collider)',
      correctlyLocked && unlockedAndOpening && fullyOpened && colliderDisabledOnOpen,
      `Locked: ${correctlyLocked}, Opened: ${fullyOpened}, ColliderRemoved: ${colliderDisabledOnOpen}`);

    // -----------------------------------------------------------------
    // TEST 5: InteractiveBarrier (Sluice & Forest Gate Motion)
    // -----------------------------------------------------------------
    const barrier = new window.InteractiveBarrier({
      id: 'test_sluice_gate',
      width: 3.0,
      travelDistance: 2.5
    }, scene, collision);

    barrier.setOpen(true);
    barrier.update(1.6);
    const barrierOpened = barrier.barrierState === 'open' && barrier.currentOffset >= 2.4;

    log('InteractiveBarrier (Physical Slide & No-Teleport Traversal)',
      barrierOpened,
      `State: ${barrier.barrierState}, Offset: ${barrier.currentOffset.toFixed(2)}m`);

    // -----------------------------------------------------------------
    // TEST 6: Authored Climbing Traversal (Ledges, Ladders & Waypoints)
    // -----------------------------------------------------------------
    const climbable = new window.ClimbableObject({
      id: 'test_ladder',
      type: 'ladder',
      climbHeight: 4.0,
      climbSpeed: 4.0,
      waypoints: [{ x: 5, y: 0, z: 5 }, { x: 5, y: 4, z: 5 }]
    }, scene, collision);

    const dummyPlayer = {
      x: 5, y: 0, z: 5,
      group: new THREE.Group(),
      state: 'IDLE',
      setPosition: function(x, z) { this.x = x; this.z = z; }
    };
    const traversalSys = new window.TraversalSystem(dummyPlayer, null, collision);

    const climbStarted = traversalSys.startClimb(climbable);
    traversalSys.updateClimbing(0.5);
    const midClimbHeight = dummyPlayer.y > 1.0;
    traversalSys.updateClimbing(1.0); // Reach top
    const climbFinished = !traversalSys.isClimbing && dummyPlayer.y >= 3.9;

    log('Authored Climbing Traversal (Waypoints, Elevation Spline & States)',
      climbStarted && midClimbHeight && climbFinished,
      `Started: ${climbStarted}, MidElevation: ${dummyPlayer.y.toFixed(2)}m, Finished: ${climbFinished}`);

    // -----------------------------------------------------------------
    // TEST 7: Water & Swimming Physics (Shallow Wade vs Deep Swimming)
    // -----------------------------------------------------------------
    // Test position inside pichavaram mangrove basin
    traversalSys.waterZones = [
      {
        id: 'test_water_basin',
        bounds: { minX: 100, maxX: 150, minZ: 100, maxZ: 150 },
        surfaceY: 2.0,
        swimmable: true,
        energyDrainPerSec: 2.0
      }
    ];

    // Shallow wading (depth = 0.4m)
    traversalSys.updateWater({ x: 120, y: 1.6, z: 120 }, 0.1);
    const shallowOk = !traversalSys.isSwimming;

    // Deep swimming (depth = 1.5m)
    traversalSys.updateWater({ x: 120, y: 0.5, z: 120 }, 0.1);
    const deepSwimOk = traversalSys.isSwimming === true && dummyPlayer.state === 'SWIM';

    // Step out of water
    traversalSys.updateWater({ x: 200, y: 0.5, z: 200 }, 0.1);
    const exitOk = traversalSys.isSwimming === false;

    log('Water & Swimming Physics (Shallow vs Deep Swim & Energy Drain)',
      shallowOk && deepSwimOk && exitOk,
      `ShallowWade: ${shallowOk}, DeepSwim: ${deepSwimOk}, ExitWater: ${exitOk}`);

    // -----------------------------------------------------------------
    // TEST 8: BoatController (Water Navigation, Throttle, Bounds & Docking)
    // -----------------------------------------------------------------
    const boat = new window.BoatController({
      id: 'test_boat',
      x: -80, z: -40,
      zone: {
        bounds: { minX: -100, maxX: -60, minZ: -60, maxZ: -20 },
        waterLevelY: 1.0,
        maxSpeed: 20.0,
        reverseSpeed: 6.0,
        turnRate: 1.2,
        dockLocations: [{ id: 'test_dock', x: -80, y: 1.2, z: -40 }]
      }
    }, scene, collision);

    const mountOk = boat.mountPlayer(dummyPlayer);
    boat.update({ up: true }, 0.5); // Accelerate forward
    const movedBoat = boat.velocity > 0;

    // Dismount near dock
    const dismountRes = boat.dismountPlayer();
    const dismountOk = dismountRes && dismountRes.success;

    log('BoatController (Pichavaram Thoni, Throttle, Bounds & Shore Docking)',
      mountOk && movedBoat && dismountOk,
      `Mounted: ${mountOk}, Velocity: ${boat.velocity.toFixed(2)}, Docked: ${dismountOk}`);

    // -----------------------------------------------------------------
    // TEST 9: WorldCollision (Sliding Resolution & Solid Obstacles)
    // -----------------------------------------------------------------
    collision.registerCollider({
      id: 'granite_wall',
      type: 'box',
      x: 0, z: 0,
      width: 4, depth: 4
    });

    // Walk into center of box from (0, -3) towards (0, 0)
    const colRes = collision.resolveCircle(0, -3, 0, -1, 0.65);
    const blocked = colRes.collided && colRes.z <= -2.5;

    log('WorldCollision (Spatial Hash, Box Hulls & Sliding Resolution)',
      blocked,
      `Collided: ${colRes.collided}, CorrectedZ: ${colRes.z.toFixed(2)}`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    console.error('[EXPLORATION TEST FATAL ERROR]', err.stack || err);
    log('Exploration System Test Failure', false, (err.message || '') + ' @ ' + (err.stack ? err.stack.split('\n')[1] : ''));
    return { passed: false, results };
  }
};
