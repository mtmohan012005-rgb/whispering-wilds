/**
 * js/data/animation-profile-data.js
 * The Whispering Wilds (Kaattu Vazhi) - Entity Animation Profiles
 *
 * Defines specialized behavioral animation profiles for NPCs (8 occupations),
 * Wildlife (9 species), and Transport riders across Tamil Nadu ecosystems.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ANIMATION_PROFILES = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ANIMATION_PROFILES = {
    // =========================================================================
    // NPC OCCUPATIONAL PROFILES (8 authentic Tamil Nadu vocations)
    // =========================================================================
    NPC: {
      TEA_SHOP_OWNER: {
        id: 'TEA_SHOP_OWNER',
        name: 'Tea Shop Owner (Murugan Annan)',
        locomotionSpeed: 1.1,
        walkStyle: 'brisk_counter_pacing',
        idleVariants: ['wipe_counter', 'adjust_apron', 'observe_customers', 'check_decoction'],
        workAnimations: [
          { id: 'pour_cutting_chai', duration: 3.2, loop: true, tool: 'brass_tumbler' },
          { id: 'clean_tea_stall_counter', duration: 2.8, loop: false, tool: 'duster_cloth' },
          { id: 'hand_over_tea_glass', duration: 1.6, loop: false, anchor: 'counter_service_point' }
        ],
        gestures: ['warm_head_tilt', 'right_hand_invite', 'two_finger_point'],
        facialExpressions: ['warm_welcoming', 'focused_pouring'],
        lookAtConstraints: { maxYaw: Math.PI / 2.5, maxPitch: Math.PI / 4 },
        clothingConstraints: { type: 'veshti', maxKneeFlexion: 110 }
      },

      FARMER: {
        id: 'FARMER',
        name: 'Cauvery Delta Paddy Farmer',
        locomotionSpeed: 1.25,
        walkStyle: 'mud_adapted_high_step',
        idleVariants: ['wipe_brow_angavasthram', 'look_at_sky_rain_check', 'rest_hands_on_hips'],
        workAnimations: [
          { id: 'inspect_paddy_crop', duration: 4.0, loop: true, tool: 'none' },
          { id: 'carry_field_sickle', duration: 2.5, loop: true, tool: 'sickle' },
          { id: 'adjust_irrigation_bund', duration: 3.5, loop: false, tool: 'spade' }
        ],
        gestures: ['broad_field_point', 'weather_palm_up', 'nod_affirmative'],
        facialExpressions: ['squinting_sun_glare', 'gentle_contentment'],
        lookAtConstraints: { maxYaw: Math.PI / 2.2, maxPitch: Math.PI / 3.5 },
        clothingConstraints: { type: 'knee_tucked_lungi', maxKneeFlexion: 135 }
      },

      FISHER: {
        id: 'FISHER',
        name: 'Pichavaram / Coromandel Fisher',
        locomotionSpeed: 1.2,
        walkStyle: 'swaying_jetty_balance',
        idleVariants: ['inspect_horizon', 'adjust_hat', 'coil_thin_rope'],
        workAnimations: [
          { id: 'prepare_cast_net', duration: 5.0, loop: true, tool: 'fishing_net' },
          { id: 'steer_country_boat_oar', duration: 3.8, loop: true, tool: 'wooden_oar' },
          { id: 'inspect_catch_basket', duration: 2.4, loop: false, tool: 'cane_basket' }
        ],
        gestures: ['tide_direction_point', 'two_handed_net_hold'],
        facialExpressions: ['weathered_focus', 'calm_seafarer'],
        lookAtConstraints: { maxYaw: Math.PI / 2.0, maxPitch: Math.PI / 3.0 },
        clothingConstraints: { type: 'tucked_shorts_cloth', maxKneeFlexion: 130 }
      },

      ARTISAN: {
        id: 'ARTISAN',
        name: 'Thanjavur Bronze & Stone Artisan',
        locomotionSpeed: 1.0,
        walkStyle: 'measured_steady_pace',
        idleVariants: ['inspect_fingers', 'brush_stone_dust', 'gaze_at_sculpture'],
        workAnimations: [
          { id: 'chisel_stone_inscription', duration: 4.5, loop: true, tool: 'chisel_hammer' },
          { id: 'polish_bronze_surface', duration: 3.2, loop: true, tool: 'buffing_cloth' },
          { id: 'measure_proportion_caliper', duration: 2.5, loop: false, tool: 'wood_scale' }
        ],
        gestures: ['delicate_fingertip_show', 'scale_measurement_span'],
        facialExpressions: ['intense_focus', 'discerning_critic'],
        lookAtConstraints: { maxYaw: Math.PI / 2.8, maxPitch: Math.PI / 3.2 },
        clothingConstraints: { type: 'veshti', maxKneeFlexion: 110 }
      },

      TEA_WORKER: {
        id: 'TEA_WORKER',
        name: 'Nilgiri Mountain Tea Estate Plucker',
        locomotionSpeed: 1.15,
        walkStyle: 'slope_climbing_lean',
        idleVariants: ['adjust_back_basket_strap', 'breathe_cool_mist', 'wipe_cold_fingers'],
        workAnimations: [
          { id: 'two_leaves_and_a_bud_pluck', duration: 2.2, loop: true, tool: 'basket_shears' },
          { id: 'unload_tea_leaves_weighing', duration: 3.5, loop: false, tool: 'gunny_bag' },
          { id: 'carry_dorsal_basket', duration: 2.8, loop: true, tool: 'wicker_basket' }
        ],
        gestures: ['bush_row_point', 'basket_balance_touch'],
        facialExpressions: ['brisk_resilience', 'friendly_hill_smile'],
        lookAtConstraints: { maxYaw: Math.PI / 2.4, maxPitch: Math.PI / 3.0 },
        clothingConstraints: { type: 'woolen_sweater_saree', maxKneeFlexion: 115 }
      },

      FOREST_GUIDE: {
        id: 'FOREST_GUIDE',
        name: 'Western Ghats Eco Tracker & Guide',
        locomotionSpeed: 1.4,
        walkStyle: 'silent_stalking_gait',
        idleVariants: ['listen_to_canopy_birds', 'scan_tree_line', 'touch_bark'],
        workAnimations: [
          { id: 'inspect_wildlife_footprint', duration: 3.6, loop: false, tool: 'magnifier_monocular' },
          { id: 'wave_companion_crouch', duration: 1.8, loop: false },
          { id: 'point_binoculars_ridge', duration: 4.2, loop: true, tool: 'binoculars' }
        ],
        gestures: ['shush_finger_to_lips', 'low_palm_stay_down', 'sharp_index_point'],
        facialExpressions: ['hyper_alert', 'reverent_nature'],
        lookAtConstraints: { maxYaw: Math.PI / 1.8, maxPitch: Math.PI / 2.5 },
        clothingConstraints: { type: 'safari_cargo_trousers', maxKneeFlexion: 140 }
      },

      SHOPKEEPER: {
        id: 'SHOPKEEPER',
        name: 'Madras / Chettinad Spice Merchant',
        locomotionSpeed: 1.05,
        walkStyle: 'composed_indoor_step',
        idleVariants: ['flip_ledger_page', 'adjust_spectacles', 'shake_brass_bell'],
        workAnimations: [
          { id: 'weigh_spices_balance', duration: 3.4, loop: true, tool: 'brass_scale' },
          { id: 'write_account_book', duration: 4.0, loop: true, tool: 'quill_pen' },
          { id: 'pack_cloth_bundle', duration: 2.6, loop: false, tool: 'jute_twine' }
        ],
        gestures: ['namaste_greeting', 'palms_open_inquiry', 'counting_fingers'],
        facialExpressions: ['shrewd_friendly', 'warm_merchant'],
        lookAtConstraints: { maxYaw: Math.PI / 2.5, maxPitch: Math.PI / 3.5 },
        clothingConstraints: { type: 'silk_border_veshti', maxKneeFlexion: 110 }
      },

      TEMPLE_WORKER: {
        id: 'TEMPLE_WORKER',
        name: 'Heritage Temple Steward',
        locomotionSpeed: 1.1,
        walkStyle: 'reverent_barefoot_stride',
        idleVariants: ['fold_hands_prayer', 'adjust_pooja_garland', 'gaze_at_gopuram'],
        workAnimations: [
          { id: 'draw_threshold_kolam', duration: 4.8, loop: true, tool: 'rice_flour_cup' },
          { id: 'light_brass_oil_lamp', duration: 3.0, loop: false, tool: 'brass_wick_lighter' },
          { id: 'ring_temple_bell', duration: 2.2, loop: false, tool: 'bell_rope' }
        ],
        gestures: ['anjali_mudra_reverence', 'graceful_flour_sprinkle'],
        facialExpressions: ['peaceful_devoted', 'gentle_presence'],
        lookAtConstraints: { maxYaw: Math.PI / 2.6, maxPitch: Math.PI / 3.0 },
        clothingConstraints: { type: 'traditional_dhoti', maxKneeFlexion: 120 }
      }
    },

    // =========================================================================
    // WILDLIFE SPECIES PROFILES (9 native Tamil Nadu species)
    // =========================================================================
    WILDLIFE: {
      nilgiri_tahr: {
        species: 'nilgiri_tahr',
        tamilName: 'வரையாடு',
        locomotionType: 'quadruped_ungulate',
        skeletonType: 'tahr_quadruped_rig',
        walkSpeed: 1.8,
        runSpeed: 6.2,
        boundingSpeed: 7.5,
        states: ['idle', 'graze', 'alert_head_up', 'flee_rock_climb', 'rest_ridge'],
        footingType: 'split_hoof_rock_conformity',
        ikBones: ['LeftForeHoof', 'RightForeHoof', 'LeftHindHoof', 'RightHindHoof'],
        lookAtLimit: { maxYaw: Math.PI / 1.5, maxPitch: Math.PI / 2.8 }
      },

      nilgiri_langur: {
        species: 'nilgiri_langur',
        tamilName: 'கரிங்குரங்கு',
        locomotionType: 'arboreal_quadruped_bipedal',
        skeletonType: 'primate_long_tail_rig',
        walkSpeed: 1.5,
        runSpeed: 4.8,
        boundingSpeed: 6.5,
        states: ['branch_sit', 'quadruped_walk', 'canopy_leap', 'grooming', 'alarm_call'],
        tailCounterBalance: true,
        ikBones: ['LeftHand', 'RightHand', 'LeftFoot', 'RightFoot'],
        lookAtLimit: { maxYaw: Math.PI / 1.3, maxPitch: Math.PI / 2.2 }
      },

      elephant: {
        species: 'elephant',
        tamilName: 'யானை',
        locomotionType: 'heavy_pachyderm_quadruped',
        skeletonType: 'elephant_heavy_rig',
        walkSpeed: 1.6,
        runSpeed: 4.2,
        boundingSpeed: 4.2,
        states: ['heavy_stride', 'ear_fan_cool', 'trunk_browse_canopy', 'mud_spray', 'trumpet_alert'],
        groundAlignmentDamping: 0.85,
        ikBones: ['LeftFrontFoot', 'RightFrontFoot', 'LeftRearFoot', 'RightRearFoot'],
        lookAtLimit: { maxYaw: Math.PI / 3.0, maxPitch: Math.PI / 4.0 }
      },

      gaur: {
        species: 'gaur',
        tamilName: 'காட்டு மாடு',
        locomotionType: 'heavy_bovine_quadruped',
        skeletonType: 'gaur_muscular_rig',
        walkSpeed: 1.4,
        runSpeed: 5.5,
        boundingSpeed: 6.0,
        states: ['steady_walk', 'graze_meadow', 'horn_shake_warning', 'charge_brace', 'rest_shade'],
        groundAlignmentDamping: 0.7,
        ikBones: ['LeftForeHoof', 'RightForeHoof', 'LeftHindHoof', 'RightHindHoof'],
        lookAtLimit: { maxYaw: Math.PI / 2.5, maxPitch: Math.PI / 3.5 }
      },

      egret: {
        species: 'egret',
        tamilName: 'வெள்ளை கொக்கு',
        locomotionType: 'avian_wader',
        skeletonType: 'bird_long_neck_rig',
        walkSpeed: 0.8,
        runSpeed: 1.5,
        boundingSpeed: 5.0, // flight
        states: ['wade_shallow', 'freeze_strike', 'neck_retract', 'wing_flap_takeoff', 'soar_glide'],
        isAvian: true,
        ikBones: ['LeftClaw', 'RightClaw'],
        lookAtLimit: { maxYaw: Math.PI / 1.2, maxPitch: Math.PI / 2.0 }
      },

      kingfisher: {
        species: 'kingfisher',
        tamilName: 'மீன்கொத்தி',
        locomotionType: 'avian_percher_diver',
        skeletonType: 'small_bird_rig',
        walkSpeed: 0.3,
        runSpeed: 0.5,
        boundingSpeed: 8.0, // dive
        states: ['perch_branch', 'rapid_head_bob', 'vertical_dive', 'water_break_flutter', 'perch_swallow'],
        isAvian: true,
        ikBones: ['LeftPerchClaw', 'RightPerchClaw'],
        lookAtLimit: { maxYaw: Math.PI / 1.1, maxPitch: Math.PI / 1.8 }
      },

      peafowl: {
        species: 'peafowl',
        tamilName: 'மயில்',
        locomotionType: 'avian_ground_strutter',
        skeletonType: 'peafowl_plumage_rig',
        walkSpeed: 1.2,
        runSpeed: 3.5,
        boundingSpeed: 4.5,
        states: ['ground_strut', 'neck_peck', 'plumage_fan_display', 'short_boost_flight', 'roost_wall'],
        isAvian: true,
        ikBones: ['LeftClaw', 'RightClaw'],
        lookAtLimit: { maxYaw: Math.PI / 1.4, maxPitch: Math.PI / 2.2 }
      },

      cattle: {
        species: 'cattle',
        tamilName: 'நாட்டுப் பசு / காளை',
        locomotionType: 'rural_bovine_quadruped',
        skeletonType: 'cattle_hump_rig',
        walkSpeed: 1.1,
        runSpeed: 3.8,
        boundingSpeed: 4.2,
        states: ['slow_amble', 'cud_chew_idle', 'tail_swat_flies', 'graze_verge', 'lie_down'],
        groundAlignmentDamping: 0.8,
        ikBones: ['LeftForeHoof', 'RightForeHoof', 'LeftHindHoof', 'RightHindHoof'],
        lookAtLimit: { maxYaw: Math.PI / 2.5, maxPitch: Math.PI / 3.5 }
      },

      goat: {
        species: 'goat',
        tamilName: 'வெள்ளாடு',
        locomotionType: 'small_ungulate_quadruped',
        skeletonType: 'goat_agile_rig',
        walkSpeed: 1.3,
        runSpeed: 4.8,
        boundingSpeed: 5.5,
        states: ['brisk_trot', 'browse_shrub_upright', 'head_butt_play', 'climb_low_wall'],
        groundAlignmentDamping: 0.65,
        ikBones: ['LeftForeHoof', 'RightForeHoof', 'LeftHindHoof', 'RightHindHoof'],
        lookAtLimit: { maxYaw: Math.PI / 1.6, maxPitch: Math.PI / 2.5 }
      }
    },

    // =========================================================================
    // TRANSPORT RIDERS
    // =========================================================================
    TRANSPORT: {
      BICYCLE_RIDER: {
        id: 'BICYCLE_RIDER',
        mountDuration: 1.4,
        dismountDuration: 1.2,
        states: ['MOUNT', 'IDLE_STRADDLE', 'PEDAL_NORMAL', 'PEDAL_FAST', 'COAST', 'BRAKE', 'DISMOUNT'],
        pedalCadenceHz: 1.2,
        steerAngleLimitRad: Math.PI / 6,
        footAlignmentTargets: ['LeftPedalAnchor', 'RightPedalAnchor'],
        handAlignmentTargets: ['LeftHandlebarGrip', 'RightHandlebarGrip']
      },

      BOAT_PASSENGER: {
        id: 'BOAT_PASSENGER',
        boardDuration: 1.6,
        dismountDuration: 1.5,
        states: ['BOARD', 'SEATED_IDLE', 'ROWING_OAR', 'LOOK_AROUND_WATER', 'STAND_BALANCE', 'DISMOUNT'],
        waterSwayDamping: 0.75,
        oarStrokeRateHz: 0.55,
        handAlignmentTargets: ['LeftOarGrip', 'RightOarGrip']
      },

      BUS_PASSENGER: {
        id: 'BUS_PASSENGER',
        states: ['BOARD_STEPS', 'HOLD_OVERHEAD_HANDLE', 'SEATED_WINDOW', 'STAND_SWAY', 'EXIT_STEPS'],
        handAlignmentTargets: ['OverheadBusRailing']
      }
    }
  };

  return ANIMATION_PROFILES;
});
