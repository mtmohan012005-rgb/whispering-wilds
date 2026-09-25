// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REPLAY & TIMELINE DATA
// Configuration for chapter replay scenarios, playthrough timeline recording,
// and statistical recaps.
// ============================================================================

(function () {
  'use strict';

  const CHAPTER_REPLAY_SCENARIOS = [
    {
      id: 'scenario_ch1_george_town',
      chapterId: 'chapter_1',
      title: 'Chapter I: The Missing Trail',
      tamilTitle: 'காணாமல் போன தடம்',
      region: 'george_town',
      startingCoords: { x: 220, y: 0, z: 630 },
      recommendedTime: 21.0, // Night rain
      description: 'Replay the initial high court investigation and street interviews in George Town.'
    },
    {
      id: 'scenario_ch2_cauvery',
      chapterId: 'chapter_2',
      title: 'Chapter II: Water Beneath the Roots',
      tamilTitle: 'வேர்களுக்குக் கீழே பாயும் நீர்',
      region: 'cauvery_delta',
      startingCoords: { x: 450, y: 0, z: 1200 },
      recommendedTime: 10.0, // Morning sun
      description: 'Re-experience the Cauvery delta sluice puzzle and Pichavaram mangrove waterways.'
    },
    {
      id: 'scenario_ch3_chettinad',
      chapterId: 'chapter_3',
      title: 'Chapter III: House of Empty Rooms',
      tamilTitle: 'வெற்று அறைகளின் மாளிகை',
      region: 'chettinad',
      startingCoords: { x: 600, y: 0, z: 1800 },
      recommendedTime: 14.5, // Afternoon heat
      description: 'Infiltrate Kanadukathan mansion and recover the mercantile trade ledgers.'
    },
    {
      id: 'scenario_ch4_swamimalai',
      chapterId: 'chapter_4',
      title: 'Chapter IV: The Artisan\'s Mark',
      tamilTitle: 'சிற்பியின் அடையாளம்',
      region: 'thanjavur',
      startingCoords: { x: 800, y: 0, z: 2400 },
      recommendedTime: 11.0, // Mid-day
      description: 'Inspect the bronze foundries of Swamimalai and decode the lost-wax alloy seal.'
    },
    {
      id: 'scenario_ch5_mamallapuram',
      chapterId: 'chapter_5',
      title: 'Chapter V: Stone and Sea',
      tamilTitle: 'கல்லும் கடலும்',
      region: 'mamallapuram',
      startingCoords: { x: 1100, y: 0, z: 800 },
      recommendedTime: 18.0, // Golden hour
      description: 'Intercept coastal smugglers around the 7th-century Shore Temple granite boulders.'
    },
    {
      id: 'scenario_ch6_nilgiris',
      chapterId: 'chapter_6',
      title: 'Chapter VI: Above the Mist',
      tamilTitle: 'பனி மூட்டத்திற்கு மேலே',
      region: 'nilgiris',
      startingCoords: { x: 1400, y: 0, z: 3200 },
      recommendedTime: 6.5, // Misty dawn
      description: 'Ascend misty tea trails in the Western Ghats and discover the ancient gateway.'
    },
    {
      id: 'scenario_ch7_sanctuary',
      chapterId: 'chapter_7',
      title: 'Chapter VII & Climax: The Sanctuary & Crossroads',
      tamilTitle: 'பசுமைத் தடம் புகலிடம் & திருப்புமுனை',
      region: 'final_sanctuary',
      startingCoords: { x: 1800, y: 0, z: 4000 },
      recommendedTime: 8.0,
      description: 'Assemble all 7 regional evidence items, confront the collector, and decide the sanctuary\'s destiny.'
    }
  ];

  const PLAYTHROUGH_STATS_TEMPLATE = {
    playthroughId: '',
    startTime: 0,
    endTime: 0,
    totalPlaytimeMinutes: 0,
    endingAchieved: '',
    branchChoices: {},
    factionStandings: {},
    npcRelationships: {},
    evidenceCollected: [],
    milestonesAchieved: [],
    teaKadaiCupsDrank: 0,
    autoKilometersRidden: 0,
    wildlifeSpeciesObserved: 0,
    secretsDiscovered: 0,
    totalDistanceWalkedMeters: 0,
    customizationChangesUsed: 0
  };

  const ReplayData = {
    CHAPTER_REPLAY_SCENARIOS,
    PLAYTHROUGH_STATS_TEMPLATE,

    getScenario(scenarioId) {
      return CHAPTER_REPLAY_SCENARIOS.find(s => s.id === scenarioId) || null;
    },

    getAllScenarios() {
      return [...CHAPTER_REPLAY_SCENARIOS];
    }
  };

  if (typeof window !== 'undefined') {
    window.CHAPTER_REPLAY_SCENARIOS = CHAPTER_REPLAY_SCENARIOS;
    window.ReplayData = ReplayData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReplayData;
  }
})();
