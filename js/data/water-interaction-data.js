// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WATER INTERACTION DATA REGISTRY
// Authoritative definitions for water zones, depths, ripples & particle budgets
// ============================================================================

(function() {
  'use strict';

  // 1. Water Depth Classifications & Movement Dampening
  const WATER_DEPTH = {
    DRY: {
      id: 'DRY',
      maxDepthMeters: 0.0,
      movementSpeedMultiplier: 1.0,
      canSprint: true,
      allowsVehicles: true,
      audioFootstep: 'ground'
    },
    SHALLOW: {
      id: 'SHALLOW',
      maxDepthMeters: 0.32,
      movementSpeedMultiplier: 0.88,
      canSprint: true,
      allowsVehicles: false,
      audioFootstep: 'water_shallow_step',
      generatesRipples: true,
      generatesSplashes: true
    },
    WAIST: {
      id: 'WAIST',
      maxDepthMeters: 0.90,
      movementSpeedMultiplier: 0.60,
      canSprint: false,
      allowsVehicles: false,
      audioFootstep: 'water_wade_heavy',
      generatesRipples: true,
      generatesSplashes: true
    },
    DEEP: {
      id: 'DEEP',
      maxDepthMeters: 99.0,
      movementSpeedMultiplier: 0.0,
      canSprint: false,
      allowsVehicles: false,
      audioFootstep: 'water_deep_splash',
      blocksMovement: true, // Deep water acts as a safe natural world boundary
      generatesRipples: true,
      generatesSplashes: true
    }
  };

  // 2. Authored Regional Water Bodies & Interaction Zones
  const WATER_ZONES = [
    {
      id: 'water_pichavaram_canals',
      name: { en: 'Pichavaram Mangrove Tidal Canals', ta: 'பிச்சாவரம் அலையாத்தி கால்வாய்' },
      region: 'pichavaram',
      waterLevelY: 0.0,
      bounds: { minX: 2500, maxX: 4200, minZ: -120, maxZ: 120 },
      shallowBankWidth: 4.5,
      deepCenterThreshold: 0.85,
      flowVector: { x: 0.15, z: 0.02 },
      waterColor: 0x224433, // Mangrove brackish olive-teal
      foamColor: 0xddeedd
    },
    {
      id: 'water_cauvery_delta_stream',
      name: { en: 'Cauvery River Irrigation Channel', ta: 'காவிரி பாசன வாய்க்கால்' },
      region: 'cauvery_delta',
      waterLevelY: 0.2,
      bounds: { minX: 1800, maxX: 2600, minZ: -45, maxZ: 45 },
      shallowBankWidth: 3.0,
      deepCenterThreshold: 0.65,
      flowVector: { x: 0.35, z: 0.0 },
      waterColor: 0x336655,
      foamColor: 0xffffff
    },
    {
      id: 'water_mamallapuram_surf',
      name: { en: 'Bay of Bengal Shoreline Surf', ta: 'மாமல்லபுரம் கடற்கரை அலைகள்' },
      region: 'mamallapuram',
      waterLevelY: -0.1,
      bounds: { minX: 5200, maxX: 6400, minZ: -300, maxZ: 300 },
      shallowBankWidth: 12.0,
      deepCenterThreshold: 1.2,
      flowVector: { x: -0.1, z: 0.4 },
      waterColor: 0x1a4855,
      foamColor: 0xf5fbfb
    },
    {
      id: 'water_thanjavur_theppakulam',
      name: { en: 'Brihadisvara Temple Theppakulam (Tank)', ta: 'பிரகதீஸ்வரர் கோயில் தெப்பக்குளம்' },
      region: 'thanjavur',
      waterLevelY: -1.2,
      bounds: { minX: 1100, maxX: 1350, minZ: -125, maxZ: 125 },
      shallowBankWidth: 1.5, // Stepped ghats
      deepCenterThreshold: 1.5,
      flowVector: { x: 0.0, z: 0.0 }, // Still holy water
      waterColor: 0x1b3b32,
      foamColor: 0xeeeeee
    },
    {
      id: 'water_nilgiris_mountain_stream',
      name: { en: 'Pykara Mountain Torrent Stream', ta: 'பைக்காரா மலை அருவி நீரோடை' },
      region: 'nilgiris',
      waterLevelY: 18.4,
      bounds: { minX: 4700, maxX: 5600, minZ: -30, maxZ: 30 },
      shallowBankWidth: 2.0,
      deepCenterThreshold: 0.55,
      flowVector: { x: 0.65, z: 0.2 },
      waterColor: 0x1d4d5e,
      foamColor: 0xffffff
    }
  ];

  // 3. Pooled Particle Budgets (Memory-friendly limits, zero runtime heap allocations)
  const WATER_PARTICLE_BUDGETS = {
    MAX_FOOTSTEP_SPLASHES: 48,
    MAX_RIPPLE_RINGS: 64,
    MAX_BOAT_WAKE_TRAILS: 96,
    MAX_RAIN_SURFACE_RIPPLES: 128,
    RIPPLE_LIFETIME_MS: 1600,
    SPLASH_LIFETIME_MS: 750
  };

  // Global Export
  window.WATER_DEPTH = WATER_DEPTH;
  window.WATER_ZONES = WATER_ZONES;
  window.WATER_PARTICLE_BUDGETS = WATER_PARTICLE_BUDGETS;

  console.log('[WaterInteractionData] Loaded water depth classifications & regional water body profiles.');
})();
