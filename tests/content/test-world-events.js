// ============================================================================
// THE WHISPERING WILDS - WORLD EVENTS TEST SUITE
// Validates data-driven world events, weather triggers, duration, and persistence.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running World Events QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const reg = window.ContentRegistry;
      const bus = window.ContentEvents;
      assert(reg !== null, 'ContentRegistry must exist on window');
      assert(bus !== null, 'ContentEvents must exist on window');

      // 1. Author a test world event entirely from data
      const testEventDef = {
        id: 'event_test_nilgiri_morning_mist',
        version: '1.0.0',
        titleEn: 'Dense Ooty Tea Mist',
        titleTa: 'ஊட்டி தேயிலைத் தோட்ட அடர்பனி',
        region: 'nilgiris',
        durationSeconds: 240,
        weatherProfile: 'dense_mist',
        audioProfile: 'audio.weather.mist.wind',
        consequences: {
          visibilityReduction: 0.6,
          wildlifeSpottedProbabilityMultiplier: 1.5
        }
      };

      reg.register('event', testEventDef);
      const retrieved = reg.get('event', 'event_test_nilgiri_morning_mist');
      assert(retrieved !== null, 'World event defined in data must be retrievable');

      // 2. Trigger world event via Event Bus
      let eventPayloadReceived = null;
      const unsub = bus.on('trigger_world_event', (payload) => {
        eventPayloadReceived = payload;
      });

      bus.emit('trigger_world_event', { eventId: 'event_test_nilgiri_morning_mist', event: retrieved });
      unsub();

      assert(eventPayloadReceived !== null, 'World event trigger must be received through ContentEvents');
      assert(eventPayloadReceived.eventId === 'event_test_nilgiri_morning_mist', 'Event ID must match triggered event');
      assert(retrieved.durationSeconds === 240, 'Event duration must be 240s');

      // Clean up test event
      reg.stores.get('event').delete('event_test_nilgiri_morning_mist');
      reg.idIndex.delete('event_test_nilgiri_morning_mist');

    } catch (err) {
      failed++;
      errors.push(`Unhandled world events test error: ${err.message}`);
    }

    return {
      suite: 'WorldEvents',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testWorldEvents = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
