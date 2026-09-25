// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY PROGRESSION GRAPH DATA
// Canonical progression nodes from Prologue through Chapter 7, Climax & Epilogue.
// Provides strict prerequisite graphs, transition validation, and sequence protection.
// ============================================================================

(function () {
  'use strict';

  const STORY_PROGRESSION_NODES = [
    {
      id: 'node_prologue_heist',
      chapter: 'prologue',
      chapterNumber: 0,
      title: 'The Inciting Incident at Madras High Court',
      tamilTitle: 'மதராஸ் உயர் நீதிமன்றத்தில் தொடக்கம்',
      region: 'george_town',
      prerequisites: [],
      mandatoryObjectives: [
        'witness_high_court_heist',
        'speak_with_murugan_annan',
        'photograph_enfield_tracks'
      ],
      requiredEvidence: [],
      nextNodes: ['node_ch1_investigation'],
      isCheckpoint: true
    },
    {
      id: 'node_ch1_investigation',
      chapter: 'chapter_1',
      chapterNumber: 1,
      title: 'The Missing Trail (George Town)',
      tamilTitle: 'காணாமல் போன தடம் (ஜார்ஜ் டவுன்)',
      region: 'george_town',
      prerequisites: ['node_prologue_heist'],
      mandatoryObjectives: [
        'ch1_inspect_courthouse',
        'ch1_talk_murugan',
        'ch1_find_skid_mark',
        'ch1_consult_velu'
      ],
      requiredEvidence: ['clue_torn_blueprint'],
      nextNodes: ['node_ch2_cauvery_sluice'],
      isCheckpoint: true
    },
    {
      id: 'node_ch2_cauvery_sluice',
      chapter: 'chapter_2',
      chapterNumber: 2,
      title: 'Water Beneath the Roots (Cauvery & Pichavaram)',
      tamilTitle: 'வேர்களுக்குக் கீழே பாயும் நீர்',
      region: 'cauvery_delta',
      prerequisites: ['node_ch1_investigation'],
      mandatoryObjectives: [
        'ch2_meet_selvam',
        'ch2_restore_sluice',
        'ch2_solve_waterwheel',
        'ch2_boat_creek'
      ],
      requiredEvidence: ['clue_waterwheel_glyph'],
      nextNodes: ['node_ch3_chettinad_ledgers'],
      isCheckpoint: true
    },
    {
      id: 'node_ch3_chettinad_ledgers',
      chapter: 'chapter_3',
      chapterNumber: 3,
      title: 'House of Empty Rooms (Chettinad)',
      tamilTitle: 'வெற்று அறைகளின் மாளிகை',
      region: 'chettinad',
      prerequisites: ['node_ch2_cauvery_sluice'],
      mandatoryObjectives: [
        'ch3_enter_courtyard',
        'ch3_inspect_tiles',
        'ch3_recover_letters'
      ],
      requiredEvidence: ['clue_trade_ledger'],
      nextNodes: ['node_ch4_swamimalai_bronze'],
      isCheckpoint: true
    },
    {
      id: 'node_ch4_swamimalai_bronze',
      chapter: 'chapter_4',
      chapterNumber: 4,
      title: 'The Artisan\'s Mark (Swamimalai / Thanjavur)',
      tamilTitle: 'சிற்பியின் அடையாளம்',
      region: 'thanjavur',
      prerequisites: ['node_ch3_chettinad_ledgers'],
      mandatoryObjectives: [
        'ch4_visit_foundry',
        'ch4_compare_alloys',
        'ch4_identify_maker'
      ],
      requiredEvidence: ['clue_chola_seal'],
      nextNodes: ['node_ch5_mamallapuram_shore'],
      isCheckpoint: true
    },
    {
      id: 'node_ch5_mamallapuram_shore',
      chapter: 'chapter_5',
      chapterNumber: 5,
      title: 'Stone and Sea (Mamallapuram)',
      tamilTitle: 'கல்லும் கடலும்',
      region: 'mamallapuram',
      prerequisites: ['node_ch4_swamimalai_bronze'],
      mandatoryObjectives: [
        'ch5_survey_shore',
        'ch5_inspect_boat',
        'ch5_recover_manifest'
      ],
      requiredEvidence: ['clue_sea_manifest'],
      nextNodes: ['node_ch6_nilgiris_ascent'],
      isCheckpoint: true
    },
    {
      id: 'node_ch6_nilgiris_ascent',
      chapter: 'chapter_6',
      chapterNumber: 6,
      title: 'Above the Mist (Nilgiris Montane)',
      tamilTitle: 'பனி மூட்டத்திற்கு மேலே',
      region: 'nilgiris',
      prerequisites: ['node_ch5_mamallapuram_shore'],
      mandatoryObjectives: [
        'ch6_ascend_ghats',
        'ch6_meet_forest_guide',
        'ch6_observe_tahr',
        'ch6_locate_gateway'
      ],
      requiredEvidence: ['clue_sanctuary_key'],
      nextNodes: ['node_ch7_pasumai_sanctuary'],
      isCheckpoint: true
    },
    {
      id: 'node_ch7_pasumai_sanctuary',
      chapter: 'chapter_7',
      chapterNumber: 7,
      title: 'The Living Sanctuary (Pasumai Thadam)',
      tamilTitle: 'பசுமைத் தடம் புகலிடம்',
      region: 'final_sanctuary',
      prerequisites: ['node_ch6_nilgiris_ascent'],
      mandatoryObjectives: [
        'ch7_unlock_portal',
        'ch7_assemble_evidence'
      ],
      requiredEvidence: ['clue_sanctuary_complete'],
      nextNodes: ['node_climax_confrontation'],
      isCheckpoint: true
    },
    {
      id: 'node_climax_confrontation',
      chapter: 'climax',
      chapterNumber: 8,
      title: 'The Crossroads of Heritage',
      tamilTitle: 'மரபின் திருப்புமுனை',
      region: 'final_sanctuary',
      prerequisites: ['node_ch7_pasumai_sanctuary'],
      mandatoryObjectives: [
        'ch7_confront_collector',
        'resolve_sanctuary_destiny'
      ],
      requiredEvidence: ['clue_sanctuary_complete'],
      nextNodes: ['node_final_resolution'],
      isCheckpoint: true
    },
    {
      id: 'node_final_resolution',
      chapter: 'epilogue',
      chapterNumber: 9,
      title: 'Echoes Across the Tamil Wilds',
      tamilTitle: 'தமிழகக் காடுகளில் ஒலிக்கும் முழக்கம்',
      region: 'final_sanctuary',
      prerequisites: ['node_climax_confrontation'],
      mandatoryObjectives: [
        'trigger_consequence_resolution',
        'experience_epilogue_recap'
      ],
      requiredEvidence: [],
      nextNodes: [],
      isCheckpoint: true
    }
  ];

  const StoryProgressionData = {
    STORY_PROGRESSION_NODES,

    getNode(nodeId) {
      return STORY_PROGRESSION_NODES.find(n => n.id === nodeId) || null;
    },

    getAllNodes() {
      return [...STORY_PROGRESSION_NODES];
    },

    validateTransition(currentNodeId, targetNodeId, completedNodes = []) {
      const target = this.getNode(targetNodeId);
      if (!target) {
        return { valid: false, reason: `Target node '${targetNodeId}' does not exist.` };
      }

      // Check if all prerequisites are fulfilled
      for (const prereqId of target.prerequisites) {
        if (!completedNodes.includes(prereqId)) {
          return {
            valid: false,
            reason: `Prerequisite node '${prereqId}' has not been completed.`
          };
        }
      }

      // If currentNodeId is provided, check if target is an allowed next node
      if (currentNodeId) {
        const current = this.getNode(currentNodeId);
        if (current && !current.nextNodes.includes(targetNodeId)) {
          return {
            valid: false,
            reason: `Sequence break: cannot transition directly from '${currentNodeId}' to '${targetNodeId}'.`
          };
        }
      }

      return { valid: true };
    }
  };

  if (typeof window !== 'undefined') {
    window.STORY_PROGRESSION_NODES = STORY_PROGRESSION_NODES;
    window.StoryProgressionData = StoryProgressionData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryProgressionData;
  }
})();
