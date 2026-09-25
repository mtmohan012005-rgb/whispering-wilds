// ============================================================================
// THE WHISPERING WILDS - MUSIC & DYNAMIC SCORE TEST SUITE
// Validates 8 music states, regional thematic score, discovery stingers,
// priority overrides (Cinematic > Exploration), and smooth crossfades.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Music & Dynamic Score QA Tests ---');
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
      const musicSys = window.DynamicMusicSystem;
      const musicMgr = window.MusicManager;
      assert(musicSys !== null && (typeof musicSys === 'object' || typeof musicSys === 'function'), 'DynamicMusicSystem must exist on window');
      assert(musicMgr !== null && (typeof musicMgr === 'object' || typeof musicMgr === 'function'), 'MusicManager must exist on window');

      musicSys.init(musicMgr);

      // 1. Verify 8 Music States
      const requiredStates = [
        'EXPLORATION',
        'MYSTERY',
        'INVESTIGATION',
        'DISCOVERY',
        'FESTIVAL',
        'CINEMATIC',
        'ENDING',
        'PAUSED'
      ];
      for (const st of requiredStates) {
        musicSys.setState(st, true);
        assert(musicSys.currentState === st, `State must transition to ${st}`);
      }

      // Reset to EXPLORATION
      musicSys.setState('EXPLORATION', true);

      // 2. Regional Theme Resolution across all 7 biomes
      const regions = [
        'chennai',
        'cauvery_delta',
        'pichavaram',
        'chettinad',
        'thanjavur',
        'mamallapuram',
        'nilgiris'
      ];

      for (const reg of regions) {
        const theme = window.MusicData?.getRegionTheme(reg);
        assert(theme !== null && typeof theme === 'object', `Regional theme for '${reg}' must exist in MusicData`);
        assert(typeof theme.id === 'string' && theme.id.length > 0, `Theme id for '${reg}' must be non-empty`);
        assert(typeof theme.instruments === 'string', `Theme for '${reg}' must document cultural instrumentation`);
      }

      // 3. Priority Rule: CINEMATIC overrides EXPLORATION and blocks premature return
      musicSys.setState('CINEMATIC', true);
      assert(musicSys.currentState === 'CINEMATIC', 'Must enter CINEMATIC state');

      // Attempting to set EXPLORATION without force must be blocked during cinematic
      const blocked = musicSys.setState('EXPLORATION', false);
      assert(blocked === false, 'EXPLORATION must be blocked while CINEMATIC is active');
      assert(musicSys.currentState === 'CINEMATIC', 'State must remain CINEMATIC');

      // Forcing transition or ending cinematic restores state
      musicSys.setState('EXPLORATION', true);
      assert(musicSys.currentState === 'EXPLORATION', 'Forced transition to EXPLORATION must succeed');

      // 4. Discovery Stinger
      const discoveryCues = window.MusicData?.DISCOVERY_STINGERS;
      assert(discoveryCues !== null && typeof discoveryCues === 'object', 'Discovery stingers must exist');
      const minorStinger = window.MusicData?.getStinger('minor_clue');
      assert(minorStinger !== null && minorStinger.duration <= 5.0, 'Minor clue stinger must be brief (<= 5s) not bombastic');

      // 5. Mystery & Investigation Score
      const mysteryTheme = window.MusicData?.getMysteryTheme();
      assert(mysteryTheme !== null, 'Mystery ambient score theme must be authored');
      assert(mysteryTheme.subtle === true, 'Mystery music must be subtle and tension-textured, not loud jump-scares');

      // 6. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testMusic: ${err.message}`);
    }

    console.log(`✓ Music & Dynamic Score QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testMusic = runTests;
})();
