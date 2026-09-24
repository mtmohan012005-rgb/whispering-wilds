// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DESTRUCTION & BREAKABLE PROPS DATA
// Strict authored breakable items registry with heritage & sacred element protection
// ============================================================================

(function() {
  'use strict';

  // Strict Heritage & Cultural Protection List
  // These categories CANNOT be damaged, broken, or pushed by any player or physics interaction
  const IMMUTABLE_HERITAGE_TAGS = [
    'sacred_temple_shrine',
    'chola_heritage_monument',
    'brihadisvara_stone_sculpture',
    'ancient_banyan_tree',
    'historic_waterwheel_stone',
    'temple_gopuram_gate',
    'madras_high_court_facade',
    'mamallapuram_rock_relief',
    'living_ancient_flora'
  ];

  // Authored Lightweight Breakable Props
  const BREAKABLE_PROPS = {
    'old_clay_pot_01': {
      id: 'old_clay_pot_01',
      name: { en: 'Weathered Clay Pot', ta: 'பழைய மண் பானை' },
      health: 1,
      breakable: true,
      persistent: false, // Ambient breakable resets on region reload
      breakSound: 'pot_shatter_clay',
      debrisParticleConfig: {
        count: 14,
        color: 0x8b5a2b, // Terracotta brown
        speed: 1.8,
        lifeTimeMs: 1200
      },
      replacementAsset: 'clay_shards_01',
      dropItem: null
    },
    'flimsy_crate_01': {
      id: 'flimsy_crate_01',
      name: { en: 'Rotten Timber Crate', ta: 'மக்கிய மரப்பெட்டி' },
      health: 1,
      breakable: true,
      persistent: true, // Quest-critical obstacle state persists
      breakSound: 'wood_crate_break',
      debrisParticleConfig: {
        count: 18,
        color: 0x6e4a2c,
        speed: 2.2,
        lifeTimeMs: 1500
      },
      replacementAsset: 'broken_wood_planks_01',
      dropItem: { itemId: 'wood', count: 1, weight: 0.5 }
    },
    'dry_branch_01': {
      id: 'dry_branch_01',
      name: { en: 'Brittle Fallen Sal Branch', ta: 'உலர்ந்த மரக்கிளை' },
      health: 1,
      breakable: true,
      persistent: false,
      breakSound: 'branch_snap_dry',
      debrisParticleConfig: {
        count: 10,
        color: 0x5a3d28,
        speed: 1.5,
        lifeTimeMs: 1000
      },
      replacementAsset: 'snapped_twigs_01',
      dropItem: { itemId: 'wood', count: 1, weight: 0.2 }
    },
    'weak_bamboo_fence_01': {
      id: 'weak_bamboo_fence_01',
      name: { en: 'Decayed Bamboo Fence Section', ta: 'சிதைந்த மூங்கில் வேலி' },
      health: 1,
      breakable: true,
      persistent: true,
      breakSound: 'bamboo_crack_snap',
      debrisParticleConfig: {
        count: 16,
        color: 0x9b874e,
        speed: 2.0,
        lifeTimeMs: 1400
      },
      replacementAsset: 'collapsed_bamboo_01',
      dropItem: null
    },
    'reed_cluster_dry_01': {
      id: 'reed_cluster_dry_01',
      name: { en: 'Parched Mangrove Reed Cluster', ta: 'உலர்ந்த சதுப்புநில நாணல் புதர்' },
      health: 1,
      breakable: true,
      persistent: false,
      breakSound: 'reeds_rustle_break',
      debrisParticleConfig: {
        count: 12,
        color: 0x7c7348,
        speed: 1.2,
        lifeTimeMs: 900
      },
      replacementAsset: 'trampled_reeds_01',
      dropItem: null
    }
  };

  // Global Export
  window.IMMUTABLE_HERITAGE_TAGS = IMMUTABLE_HERITAGE_TAGS;
  window.BREAKABLE_PROPS = BREAKABLE_PROPS;

  console.log('[DestructionData] Registered', Object.keys(BREAKABLE_PROPS).length, 'authored breakable props with strict heritage safeguards.');
})();
