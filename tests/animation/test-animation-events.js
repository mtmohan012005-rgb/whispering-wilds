/**
 * tests/animation/test-animation-events.js
 * Verifies animation event threshold crossing detection, event listeners,
 * wrap-around cycle resets, and decoupled routing to subsystems.
 */

(function () {
  'use strict';

  function runTestAnimationEvents() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const AnimationEvents = window.AnimationEvents;
    assert('AnimationEvents class is available', !!AnimationEvents);

    const emitter = new AnimationEvents();

    const receivedEvents = [];
    emitter.addEventListener('FOOTSTEP', (e) => {
      receivedEvents.push(e);
    });

    const mockClipEvents = [
      { time: 0.25, name: 'FOOTSTEP', foot: 'left' },
      { time: 0.75, name: 'FOOTSTEP', foot: 'right' },
      { time: 1.15, name: 'INTERACTION_COMPLETE' }
    ];

    // Frame 1: advance from 0.0 to 0.1s -> no events crossed
    emitter.update(mockClipEvents, 0.1, 1.2);
    assert('No events crossed between 0.0 and 0.1s', receivedEvents.length === 0);

    // Frame 2: advance from 0.1 to 0.3s -> crosses 0.25s left footstep
    emitter.update(mockClipEvents, 0.3, 1.2);
    assert('Crossed left footstep event at 0.25s', receivedEvents.length === 1 && receivedEvents[0].foot === 'left');

    // Frame 3: advance from 0.3 to 0.8s -> crosses 0.75s right footstep
    emitter.update(mockClipEvents, 0.8, 1.2);
    assert('Crossed right footstep event at 0.75s', receivedEvents.length === 2 && receivedEvents[1].foot === 'right');

    // Advance past 1.15s event
    emitter.update(mockClipEvents, 1.18, 1.2);

    // Frame 4: loop wrap-around from 1.18s back to 0.05s
    emitter.update(mockClipEvents, 0.05, 1.2);
    assert('Trigger cache resets cleanly upon loop wrap-around', emitter.triggeredThisCycle.size === 0);

    return results;
  }

  window.runTestAnimationEvents = runTestAnimationEvents;
})();
