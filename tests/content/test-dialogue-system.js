// ============================================================================
// THE WHISPERING WILDS - DIALOGUE SYSTEM TEST SUITE
// Validates data-driven bilingual branching dialogue, tone-based choices,
// relationship tracking, and quest initiation hooks.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Dialogue System QA Tests ---');
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
      const ds = window.DataDialogueSystem;
      const reg = window.ContentRegistry;
      assert(ds !== null && typeof ds === 'object', 'DataDialogueSystem must exist on window');

      // 1. Author a test dialogue entirely from data
      const testDialogueDef = {
        id: 'dialogue_test_boatman',
        version: '1.0.0',
        speaker: 'npc_sundaram',
        region: 'pichavaram',
        startNode: 'start',
        nodes: {
          start: {
            speaker: 'npc_sundaram',
            textEn: 'The tides in the mangrove channels are rising. Do you wish to cross toward the shrine?',
            textTa: 'சதுப்புநிலக் கால்வாய்களில் அலைகள் ஏறுகின்றன. கோவிலை நோக்கி கடக்க விருப்பமா?',
            choices: [
              {
                id: 'choice_respectful',
                tone: 'culturally_respectful',
                textEn: 'I respect your tidal wisdom, Anna. Please row across when safe.',
                textTa: 'உங்களின் நீர் அறிவு மீது நம்பிக்கை உண்டு அண்ணா. பாதுகாப்பான நேரம் பார்த்து படகை செலுத்துங்கள்.',
                nextNode: 'agreed',
                consequences: { relationshipDelta: 8 }
              },
              {
                id: 'choice_curious',
                tone: 'curious',
                textEn: 'What ancient ruins lie beneath the mangrove roots?',
                textTa: 'சதுப்புநில வேர்களுக்கு அடியில் என்ன பழங்கால இடிபாடுகள் புதைந்துள்ளன?',
                nextNode: 'lore_branch'
              }
            ]
          },
          agreed: {
            speaker: 'npc_sundaram',
            textEn: 'A respectful traveler is always welcome on my wooden boat.',
            textTa: 'மரியாதையுள்ள பயணியை என் மரப்படகில் ஏற்றுவது பெருமை.',
            choices: [
              { id: 'exit_done', textEn: 'Nandri! [Exit]', textTa: 'நன்றி! [விடைபெறு]', nextNode: 'exit' }
            ]
          },
          lore_branch: {
            speaker: 'npc_sundaram',
            textEn: 'Sunken Chola sluices from the reign of Rajendra I.',
            textTa: 'முதலாம் இராஜேந்திர சோழன் காலத்து மூழ்கிய பாசன மதகுகள்.',
            choices: [
              { id: 'exit_lore', textEn: 'Thank you for sharing.', textTa: 'பகிர்ந்தமைக்கு நன்றி.', nextNode: 'exit' }
            ]
          }
        }
      };

      reg.register('dialogue', testDialogueDef);
      ds.init();

      // 2. Start dialogue
      const startRes = ds.startDialogue('dialogue_test_boatman');
      assert(startRes.success === true, 'Dialogue must start cleanly');
      assert(startRes.node !== null, 'Initial node must be populated');
      assert(startRes.node.textTa.includes('அலைகள்'), 'Tamil text must be populated in initial node');
      assert(startRes.node.textEn.includes('tides'), 'English text must be populated in initial node');

      // 3. Choice options verification
      assert(Array.isArray(startRes.node.choices) && startRes.node.choices.length === 2, 'Node must expose 2 choices');
      assert(startRes.node.choices[0].tone === 'culturally_respectful', 'First choice tone must be culturally_respectful');

      // 4. Select choice with consequences
      const initialRel = ds.getRelationship('npc_sundaram');
      const choiceRes = ds.selectChoice('choice_respectful');
      assert(choiceRes.success === true, 'Selecting choice must succeed');
      assert(choiceRes.node.id === 'agreed', 'Dialogue must transition to agreed node');

      // Relationship change check (+8 from consequence + 5 bonus from culturally_respectful)
      const newRel = ds.getRelationship('npc_sundaram');
      assert(newRel > initialRel, 'NPC relationship must increase after culturally respectful choice');

      // 5. Exit dialogue
      const exitRes = ds.selectChoice('exit_done');
      assert(exitRes.success === true && exitRes.isFinished === true, 'Dialogue must cleanly complete upon reaching exit');
      assert(ds.activeDialogue === null, 'Active dialogue must be cleared after conclusion');

      // Clean up test dialogue
      reg.stores.get('dialogue').delete('dialogue_test_boatman');
      reg.idIndex.delete('dialogue_test_boatman');

    } catch (err) {
      failed++;
      errors.push(`Unhandled dialogue test error: ${err.message}`);
    }

    return {
      suite: 'DialogueSystem',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testDialogueSystem = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
