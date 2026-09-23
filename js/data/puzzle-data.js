/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Reusable Puzzle Engine Data & Cultural Environmental Puzzle Specifications
 * Supports mechanical, sequence, alignment, environmental, observation, and logic puzzles.
 */

window.PUZZLE_DEFINITIONS = {
  // 1. Cauvery Delta: Chola Waterwheel & 3-Sluice Hydro-Mechanism (Section 16, 20)
  cauvery_waterwheel: {
    id: 'cauvery_waterwheel',
    type: 'mechanical',
    title: 'சோழர் கால நீர் சுழல் சக்கரம் (Chola Hydro-Mechanism)',
    region: 'CAUVERY_DELTA',
    description: 'A millennium-old carved granite waterwheel regulating the distributaries. Rotate the wheel and configure sluices A, B, and C so water is channeled into the dry sunken canal to reveal the submerged path.',
    initialState: {
      wheelRotation: 0,       // 0, 90, 180, 270 degrees
      sluiceAState: 'CLOSED', // 'OPEN' | 'CLOSED'
      sluiceBState: 'CLOSED',
      sluiceCState: 'CLOSED',
      waterFlow: 'IDLE',      // 'IDLE' | 'DIVERTED' | 'CORRECT_CHANNEL' | 'OVERFLOW'
      waterLevel: 100,        // 0 to 100 (sunken route opens when drained to <= 10)
      pathState: 'SUBMERGED'  // 'SUBMERGED' | 'DRAINING' | 'OPEN'
    },
    // Solution requires: Wheel aligned to 180° (Tiger rune), Sluice A OPEN, Sluice B CLOSED, Sluice C OPEN
    solution: {
      wheelRotation: 180,
      sluiceAState: 'OPEN',
      sluiceBState: 'CLOSED',
      sluiceCState: 'OPEN'
    },
    actions: {
      turn_wheel: {
        label: 'Turn Granite Waterwheel (90°)',
        action: (state) => {
          state.wheelRotation = (state.wheelRotation + 90) % 360;
          return state;
        }
      },
      toggle_sluice_a: {
        label: 'Operate Sluice A (North Canal)',
        action: (state) => {
          state.sluiceAState = state.sluiceAState === 'OPEN' ? 'CLOSED' : 'OPEN';
          return state;
        }
      },
      toggle_sluice_b: {
        label: 'Operate Sluice B (Overflow Spillway)',
        action: (state) => {
          state.sluiceBState = state.sluiceBState === 'OPEN' ? 'CLOSED' : 'OPEN';
          return state;
        }
      },
      toggle_sluice_c: {
        label: 'Operate Sluice C (Sunken Ancient Route)',
        action: (state) => {
          state.sluiceCState = state.sluiceCState === 'OPEN' ? 'CLOSED' : 'OPEN';
          return state;
        }
      }
    },
    evaluate: (state) => {
      // Logic:
      // If wheel is at 180° and A is OPEN and C is OPEN and B is CLOSED:
      // Water correctly drains from the sunken canal.
      if (state.wheelRotation === 180 && state.sluiceAState === 'OPEN' && state.sluiceCState === 'OPEN' && state.sluiceBState === 'CLOSED') {
        state.waterFlow = 'CORRECT_CHANNEL';
        state.waterLevel = 0;
        state.pathState = 'OPEN';
        return true;
      }
      // If Sluice B is OPEN, water diverts to overflow
      if (state.sluiceBState === 'OPEN') {
        state.waterFlow = 'DIVERTED';
        state.waterLevel = 60;
        state.pathState = 'SUBMERGED';
        return false;
      }
      // If wheel is turned but sluices mismatch
      if (state.wheelRotation !== 0) {
        state.waterFlow = 'DIVERTED';
        state.waterLevel = 90;
        state.pathState = 'SUBMERGED';
        return false;
      }
      state.waterFlow = 'IDLE';
      state.waterLevel = 100;
      state.pathState = 'SUBMERGED';
      return false;
    },
    onSolved: {
      questId: 'main_pichavaram_water',
      objectiveId: 'operate_waterwheel_mechanism',
      journalEntry: 'chola_hydro_mechanism_solved',
      revealEnvironmentId: 'ancient_canal_sunken_walkway',
      rewardXP: 250,
      soundEffect: 'water_drain_chola'
    }
  },

  // 2. Pichavaram Mangrove Canal Route Navigation (Section 20)
  pichavaram_boat_route: {
    id: 'pichavaram_boat_route',
    type: 'navigation',
    title: 'பிச்சாவரம் சதுப்புநில வழிப்பாதை (Mangrove Canal Navigation)',
    region: 'PICHAVARAM',
    description: 'Navigate through the dense stilt root mangrove channels following traditional tidal beacon posts to reach the sunken temple dock.',
    initialState: {
      dockReached: false,
      beaconsVisited: [],
      currentChannel: 'outer_estuary'
    },
    requiredBeaconOrder: ['beacon_north_roots', 'beacon_narrow_creek', 'beacon_shrine_inlet'],
    evaluate: (state) => {
      if (!Array.isArray(state.beaconsVisited)) return false;
      if (state.beaconsVisited.length < 3) return false;
      const match = state.beaconsVisited.slice(0, 3).every((b, idx) => b === ['beacon_north_roots', 'beacon_narrow_creek', 'beacon_shrine_inlet'][idx]);
      if (match) {
        state.dockReached = true;
        return true;
      }
      return false;
    },
    onSolved: {
      questId: 'main_pichavaram_water',
      objectiveId: 'navigate_mangroves_by_boat',
      journalEntry: 'pichavaram_waterway_mastered',
      revealEnvironmentId: 'sunken_shrine_dock_landing',
      rewardXP: 200,
      soundEffect: 'boat_paddle_splash'
    }
  },

  // 3. Chettinad Heritage Mansion Triple Brass Bolt Sequence (Section 20)
  chettinad_courtyard_mechanism: {
    id: 'chettinad_courtyard_mechanism',
    type: 'sequence',
    title: 'செட்டிநாடு கனக முடுக்கு கதவு பூட்டு (Chettinad Brass Bolt Alignment)',
    region: 'CHETTINAD',
    description: 'An ornate heavy teak door locked by three counterweighted brass sliding bolts (Lion, Peacock, Elephant). Slide them in accordance with the courtyard fresco poem.',
    initialState: {
      boltLion: 'ENGAGED',     // 'ENGAGED' | 'DISENGAGED'
      boltPeacock: 'ENGAGED',
      boltElephant: 'ENGAGED',
      history: []
    },
    actions: {
      slide_peacock: {
        label: 'Slide Peacock Brass Bolt (மயில் தாழ்ப்பாள்)',
        action: (state) => {
          state.boltPeacock = state.boltPeacock === 'ENGAGED' ? 'DISENGAGED' : 'ENGAGED';
          state.history.push('peacock');
          return state;
        }
      },
      slide_elephant: {
        label: 'Slide Elephant Brass Bolt (யானை தாழ்ப்பாள்)',
        action: (state) => {
          state.boltElephant = state.boltElephant === 'ENGAGED' ? 'DISENGAGED' : 'ENGAGED';
          state.history.push('elephant');
          return state;
        }
      },
      slide_lion: {
        label: 'Slide Lion Brass Bolt (சிம்ம தாழ்ப்பாள்)',
        action: (state) => {
          state.boltLion = state.boltLion === 'ENGAGED' ? 'DISENGAGED' : 'ENGAGED';
          state.history.push('lion');
          return state;
        }
      }
    },
    // Required order: Peacock -> Elephant -> Lion
    evaluate: (state) => {
      const h = state.history;
      if (h.length >= 3) {
        const last3 = h.slice(-3);
        if (last3[0] === 'peacock' && last3[1] === 'elephant' && last3[2] === 'lion') {
          if (state.boltPeacock === 'DISENGAGED' && state.boltElephant === 'DISENGAGED' && state.boltLion === 'DISENGAGED') {
            return true;
          }
        }
      }
      return false;
    },
    onSolved: {
      questId: 'main_chettinad_heritage',
      objectiveId: 'unlock_mansion_inner_courtyard',
      journalEntry: 'chettinad_courtyard_unlocked',
      revealEnvironmentId: 'chettinad_master_teak_door',
      rewardXP: 180,
      soundEffect: 'heavy_brass_unlock'
    }
  },

  // 4. Thanjavur Artisan Lost-Wax Casting Order (Section 20)
  thanjavur_artisan_order: {
    id: 'thanjavur_artisan_order',
    type: 'logic',
    title: 'சுவாமிமலை ஐம்பொன் வார்ப்பு வரிசை (Lost-Wax Bronze Casting Order)',
    region: 'THANJAVUR',
    description: 'Arrange the four master sculptor steps in authentic traditional order: Madhuchishtavidhana (wax sculpting), clay coating, furnace heating, and molten bronze alloy pour.',
    initialState: {
      slots: [null, null, null, null],
      availableSteps: ['alloy_pour', 'wax_sculpt', 'clay_encasing', 'furnace_firing']
    },
    correctSequence: ['wax_sculpt', 'clay_encasing', 'furnace_firing', 'alloy_pour'],
    evaluate: (state) => {
      if (!Array.isArray(state.slots) || state.slots.length !== 4) return false;
      const isCorrect = state.slots.every((step, i) => step === ['wax_sculpt', 'clay_encasing', 'furnace_firing', 'alloy_pour'][i]);
      return isCorrect;
    },
    onSolved: {
      questId: 'main_thanjavur_craft',
      objectiveId: 'reconstruct_ancient_casting_records',
      journalEntry: 'swamimalai_bronze_records',
      revealEnvironmentId: 'artisan_secret_coffer',
      rewardXP: 190,
      soundEffect: 'metal_turn'
    }
  },

  // 5. Mamallapuram Shore Megalith Shadow Alignment (Section 20)
  mamallapuram_stone_alignment: {
    id: 'mamallapuram_stone_alignment',
    type: 'alignment',
    title: 'மாமல்லபுரம் கடற்கரை நிழல் சீரமைப்பு (Shore Megalith Shadow Alignment)',
    region: 'MAMALLAPURAM',
    description: 'Rotate the three granite prism pedestals so the cast shadows intersect with the carved bull (Nandi) relief on the sea-facing rock.',
    initialState: {
      prism1Rot: 0,  // 0, 45, 90, 135, 180, 225, 270, 315
      prism2Rot: 0,
      prism3Rot: 0
    },
    solution: {
      prism1Rot: 90,
      prism2Rot: 225,
      prism3Rot: 135
    },
    evaluate: (state) => {
      return state.prism1Rot === 90 && state.prism2Rot === 225 && state.prism3Rot === 135;
    },
    onSolved: {
      questId: 'main_mamallapuram_shore',
      objectiveId: 'align_shore_megaliths',
      journalEntry: 'mamallapuram_astronomy_carving',
      revealEnvironmentId: 'coastal_sea_cave_chamber',
      rewardXP: 220,
      soundEffect: 'stone_move'
    }
  },

  // 6. Nilgiris Toda Trail Observation Puzzle (Section 19, 20)
  nilgiris_trail_observation: {
    id: 'nilgiris_trail_observation',
    type: 'observation',
    title: 'தோடர் குல அடையாளக் குறியீடு (Toda Trail Rune Observation)',
    region: 'NILGIRIS',
    description: 'Observe the three weathered Toda boundary stones along the Shola ridge. Only one stone carries the sacred crescent-horned buffalo emblem pointing toward the hidden botanical gateway.',
    initialState: {
      inspectedStones: [],
      selectedStone: null
    },
    correctStoneId: 'toda_stone_crescent_horn',
    evaluate: (state) => {
      return state.selectedStone === 'toda_stone_crescent_horn';
    },
    onSolved: {
      questId: 'main_nilgiris_mist',
      objectiveId: 'locate_botanical_sanctuary_trail',
      journalEntry: 'toda_ancient_waymarker',
      revealEnvironmentId: 'shola_hidden_sanctuary_arch',
      rewardXP: 300,
      soundEffect: 'wind_whisper_chime'
    }
  }
};
