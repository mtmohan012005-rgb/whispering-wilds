/**
 * js/data/animation-data.js
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Animation Database
 *
 * Defines metadata, motion database specs, contact markers, root-motion rules,
 * and speed calibrations across all standard authored clips.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ANIMATION_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ANIMATION_DATA = {
    version: '1.0.0',
    timeStandard: 'seconds',
    targetModel: 'assets/characters/player/player.glb',

    // Standard locomotion speeds (meters per second)
    SPEEDS: {
      IDLE: 0.0,
      CROUCH_WALK: 0.9,
      WALK: 1.5,
      FAST_WALK: 2.2,
      RUN: 3.5,
      SPRINT: 5.5,
      BACKWARD: 1.2,
      STRAFE: 1.4
    },

    // Curated locomotion database for Motion Matching & Blend Trees
    CLIPS: {
      // ----------------- Idle & Locomotion -----------------
      Player_Idle: {
        clipId: 'Player_Idle',
        state: 'IDLE',
        category: 'locomotion',
        duration: 3.2,
        speed: 0.0,
        direction: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'relaxed_tamil_explorer',
        contactPhases: {
          leftFootPlant: [[0.0, 3.2]],
          rightFootPlant: [[0.0, 3.2]]
        },
        events: [
          { time: 1.6, name: 'IDLE_BREATH_PEAK' }
        ]
      },

      Player_Start: {
        clipId: 'Player_Start',
        state: 'START',
        category: 'locomotion',
        duration: 0.45,
        speed: 0.8,
        direction: 0.0,
        looping: false,
        rootMotion: true,
        priority: 2,
        style: 'forward_acceleration',
        contactPhases: {
          leftFootPlant: [[0.0, 0.22]],
          rightFootPlant: [[0.2, 0.45]]
        },
        events: [
          { time: 0.22, name: 'FOOTSTEP', foot: 'left', surfaceCheck: true }
        ]
      },

      Player_Walk: {
        clipId: 'Player_Walk',
        state: 'WALK',
        category: 'locomotion',
        duration: 1.05,
        speed: 1.5,
        direction: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'heel_toe_explorer',
        contactPhases: {
          leftFootPlant: [[0.0, 0.48]],
          rightFootPlant: [[0.52, 1.0]]
        },
        events: [
          { time: 0.26, name: 'FOOTSTEP', foot: 'left', intensity: 0.6 },
          { time: 0.78, name: 'FOOTSTEP', foot: 'right', intensity: 0.6 }
        ]
      },

      Player_Fast_Walk: {
        clipId: 'Player_Fast_Walk',
        state: 'FAST_WALK',
        category: 'locomotion',
        duration: 0.88,
        speed: 2.2,
        direction: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'purposeful_stride',
        contactPhases: {
          leftFootPlant: [[0.0, 0.4]],
          rightFootPlant: [[0.44, 0.84]]
        },
        events: [
          { time: 0.2, name: 'FOOTSTEP', foot: 'left', intensity: 0.75 },
          { time: 0.64, name: 'FOOTSTEP', foot: 'right', intensity: 0.75 }
        ]
      },

      Player_Run: {
        clipId: 'Player_Run',
        state: 'RUN',
        category: 'locomotion',
        duration: 0.72,
        speed: 3.5,
        direction: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'athletic_cadence',
        contactPhases: {
          leftFootPlant: [[0.05, 0.32]],
          rightFootPlant: [[0.41, 0.68]]
        },
        events: [
          { time: 0.16, name: 'FOOTSTEP', foot: 'left', intensity: 0.9 },
          { time: 0.52, name: 'FOOTSTEP', foot: 'right', intensity: 0.9 }
        ]
      },

      Player_Sprint: {
        clipId: 'Player_Sprint',
        state: 'SPRINT',
        category: 'locomotion',
        duration: 0.58,
        speed: 5.5,
        direction: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'forward_lean_drive',
        contactPhases: {
          leftFootPlant: [[0.03, 0.24]],
          rightFootPlant: [[0.32, 0.53]]
        },
        events: [
          { time: 0.12, name: 'FOOTSTEP', foot: 'left', intensity: 1.0 },
          { time: 0.41, name: 'FOOTSTEP', foot: 'right', intensity: 1.0 }
        ]
      },

      Player_Stop: {
        clipId: 'Player_Stop',
        state: 'STOP',
        category: 'locomotion',
        duration: 0.4,
        speed: 0.4,
        direction: 0.0,
        looping: false,
        rootMotion: true,
        priority: 2,
        style: 'deceleration_brace',
        contactPhases: {
          leftFootPlant: [[0.1, 0.4]],
          rightFootPlant: [[0.0, 0.35]]
        },
        events: [
          { time: 0.15, name: 'FOOTSTEP', foot: 'right', intensity: 0.7 }
        ]
      },

      Player_Turn_Left: {
        clipId: 'Player_Turn_Left',
        state: 'TURN_LEFT',
        category: 'locomotion',
        duration: 0.65,
        speed: 0.0,
        turnAngle: -Math.PI / 2, // -90 deg
        looping: false,
        rootMotion: true,
        priority: 2,
        style: 'pivot_left_heel',
        contactPhases: {
          leftFootPlant: [[0.0, 0.3]],
          rightFootPlant: [[0.35, 0.65]]
        },
        events: [
          { time: 0.15, name: 'FOOTSTEP', foot: 'left', intensity: 0.5 },
          { time: 0.45, name: 'FOOTSTEP', foot: 'right', intensity: 0.5 }
        ]
      },

      Player_Turn_Right: {
        clipId: 'Player_Turn_Right',
        state: 'TURN_RIGHT',
        category: 'locomotion',
        duration: 0.65,
        speed: 0.0,
        turnAngle: Math.PI / 2, // +90 deg
        looping: false,
        rootMotion: true,
        priority: 2,
        style: 'pivot_right_heel',
        contactPhases: {
          leftFootPlant: [[0.35, 0.65]],
          rightFootPlant: [[0.0, 0.3]]
        },
        events: [
          { time: 0.15, name: 'FOOTSTEP', foot: 'right', intensity: 0.5 },
          { time: 0.45, name: 'FOOTSTEP', foot: 'left', intensity: 0.5 }
        ]
      },

      Player_Strafe_Left: {
        clipId: 'Player_Strafe_Left',
        state: 'STRAFE_LEFT',
        category: 'locomotion',
        duration: 0.95,
        speed: 1.4,
        direction: -Math.PI / 2,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'lateral_sidestep',
        contactPhases: {
          leftFootPlant: [[0.0, 0.45]],
          rightFootPlant: [[0.48, 0.92]]
        },
        events: [
          { time: 0.22, name: 'FOOTSTEP', foot: 'left', intensity: 0.5 },
          { time: 0.7, name: 'FOOTSTEP', foot: 'right', intensity: 0.5 }
        ]
      },

      Player_Strafe_Right: {
        clipId: 'Player_Strafe_Right',
        state: 'STRAFE_RIGHT',
        category: 'locomotion',
        duration: 0.95,
        speed: 1.4,
        direction: Math.PI / 2,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'lateral_sidestep',
        contactPhases: {
          leftFootPlant: [[0.48, 0.92]],
          rightFootPlant: [[0.0, 0.45]]
        },
        events: [
          { time: 0.22, name: 'FOOTSTEP', foot: 'right', intensity: 0.5 },
          { time: 0.7, name: 'FOOTSTEP', foot: 'left', intensity: 0.5 }
        ]
      },

      Player_Backward: {
        clipId: 'Player_Backward',
        state: 'BACKWARD',
        category: 'locomotion',
        duration: 1.1,
        speed: 1.2,
        direction: Math.PI,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'retreat_careful',
        contactPhases: {
          leftFootPlant: [[0.0, 0.5]],
          rightFootPlant: [[0.55, 1.05]]
        },
        events: [
          { time: 0.25, name: 'FOOTSTEP', foot: 'left', intensity: 0.45 },
          { time: 0.8, name: 'FOOTSTEP', foot: 'right', intensity: 0.45 }
        ]
      },

      // ----------------- Jump & Aerial -----------------
      Player_Jump_Start: {
        clipId: 'Player_Jump_Start',
        state: 'JUMP',
        category: 'action',
        duration: 0.25,
        speed: 2.0,
        looping: false,
        rootMotion: false,
        priority: 3,
        style: 'takeoff_crouch_push',
        contactPhases: { leftFootPlant: [], rightFootPlant: [] },
        events: [
          { time: 0.22, name: 'TAKEOFF' }
        ]
      },

      Player_Jump: {
        clipId: 'Player_Jump',
        state: 'FALL',
        category: 'action',
        duration: 0.5,
        speed: 2.0,
        looping: true,
        rootMotion: false,
        priority: 3,
        style: 'airborne_balance',
        contactPhases: { leftFootPlant: [], rightFootPlant: [] },
        events: []
      },

      Player_Fall: {
        clipId: 'Player_Fall',
        state: 'FALL',
        category: 'action',
        duration: 0.6,
        speed: 0.0,
        looping: true,
        rootMotion: false,
        priority: 3,
        style: 'descent_drag',
        contactPhases: { leftFootPlant: [], rightFootPlant: [] },
        events: []
      },

      Player_Land: {
        clipId: 'Player_Land',
        state: 'LAND',
        category: 'action',
        duration: 0.35,
        speed: 0.5,
        looping: false,
        rootMotion: false,
        priority: 3,
        style: 'impact_absorption',
        contactPhases: {
          leftFootPlant: [[0.05, 0.35]],
          rightFootPlant: [[0.05, 0.35]]
        },
        events: [
          { time: 0.06, name: 'LAND', intensity: 1.0 }
        ]
      },

      // ----------------- Crouch -----------------
      Player_Crouch_Idle: {
        clipId: 'Player_Crouch_Idle',
        state: 'CROUCH',
        category: 'locomotion',
        duration: 2.4,
        speed: 0.0,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'stalk_low_profile',
        contactPhases: {
          leftFootPlant: [[0.0, 2.4]],
          rightFootPlant: [[0.0, 2.4]]
        },
        events: []
      },

      Player_Crouch_Walk: {
        clipId: 'Player_Crouch_Walk',
        state: 'CROUCH',
        category: 'locomotion',
        duration: 1.25,
        speed: 0.9,
        looping: true,
        rootMotion: false,
        priority: 1,
        style: 'quiet_prowl',
        contactPhases: {
          leftFootPlant: [[0.0, 0.55]],
          rightFootPlant: [[0.6, 1.2]]
        },
        events: [
          { time: 0.28, name: 'FOOTSTEP', foot: 'left', intensity: 0.3 },
          { time: 0.88, name: 'FOOTSTEP', foot: 'right', intensity: 0.3 }
        ]
      },

      // ----------------- Interactions & Actions -----------------
      Player_Interact: {
        clipId: 'Player_Interact',
        state: 'INTERACT',
        category: 'action',
        duration: 1.2,
        speed: 0.0,
        looping: false,
        rootMotion: false,
        priority: 3,
        style: 'reach_forward',
        contactPhases: { leftFootPlant: [[0.0, 1.2]], rightFootPlant: [[0.0, 1.2]] },
        events: [
          { time: 0.5, name: 'CONTACT' },
          { time: 1.15, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Pickup: {
        clipId: 'Player_Pickup',
        state: 'INTERACT',
        category: 'action',
        duration: 1.4,
        speed: 0.0,
        looping: false,
        rootMotion: false,
        priority: 3,
        style: 'ground_grasp',
        contactPhases: { leftFootPlant: [[0.0, 1.4]], rightFootPlant: [[0.0, 1.4]] },
        events: [
          { time: 0.65, name: 'GRAB' },
          { time: 1.35, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Inspect: {
        clipId: 'Player_Inspect',
        state: 'INSPECT',
        category: 'action',
        duration: 2.2,
        speed: 0.0,
        looping: false,
        rootMotion: false,
        priority: 2,
        style: 'chest_level_rotate',
        contactPhases: { leftFootPlant: [[0.0, 2.2]], rightFootPlant: [[0.0, 2.2]] },
        events: [
          { time: 2.1, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Climb: {
        clipId: 'Player_Climb',
        state: 'CLIMB',
        category: 'action',
        duration: 1.2,
        speed: 0.8,
        looping: true,
        rootMotion: true,
        priority: 3,
        style: 'hand_over_hand_ladder',
        contactPhases: { leftFootPlant: [[0.2, 0.5]], rightFootPlant: [[0.8, 1.1]] },
        events: [
          { time: 0.3, name: 'CONTACT', target: 'ladder_rung' },
          { time: 0.9, name: 'CONTACT', target: 'ladder_rung' }
        ]
      },

      Player_Mantle: {
        clipId: 'Player_Mantle',
        state: 'CLIMB',
        category: 'action',
        duration: 1.1,
        speed: 1.0,
        looping: false,
        rootMotion: true,
        priority: 3,
        style: 'ledge_vault_up',
        contactPhases: { leftFootPlant: [[0.8, 1.1]], rightFootPlant: [[0.85, 1.1]] },
        events: [
          { time: 0.4, name: 'GRAB', target: 'ledge' },
          { time: 0.85, name: 'LAND', intensity: 0.6 },
          { time: 1.05, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Push: {
        clipId: 'Player_Push',
        state: 'PUSH',
        category: 'action',
        duration: 1.3,
        speed: 0.6,
        looping: true,
        rootMotion: false,
        priority: 3,
        style: 'brace_and_shove',
        contactPhases: { leftFootPlant: [[0.0, 0.6]], rightFootPlant: [[0.65, 1.25]] },
        events: [
          { time: 0.3, name: 'CONTACT', target: 'pushable_object' }
        ]
      },

      Player_Pull: {
        clipId: 'Player_Pull',
        state: 'PULL',
        category: 'action',
        duration: 1.3,
        speed: 0.5,
        looping: true,
        rootMotion: false,
        priority: 3,
        style: 'weight_drag_backward',
        contactPhases: { leftFootPlant: [[0.0, 0.6]], rightFootPlant: [[0.65, 1.25]] },
        events: [
          { time: 0.3, name: 'GRAB', target: 'pullable_object' }
        ]
      },

      // ----------------- Transport -----------------
      Player_Bicycle_Mount: {
        clipId: 'Player_Bicycle_Mount',
        state: 'BICYCLE',
        category: 'action',
        duration: 1.4,
        speed: 0.0,
        looping: false,
        rootMotion: true,
        priority: 3,
        style: 'leg_swing_over_frame',
        events: [
          { time: 0.9, name: 'MOUNT', vehicle: 'bicycle' },
          { time: 1.35, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Bicycle_Pedal: {
        clipId: 'Player_Bicycle_Pedal',
        state: 'BICYCLE',
        category: 'locomotion',
        duration: 1.0,
        speed: 4.5,
        looping: true,
        rootMotion: false,
        priority: 2,
        style: 'seated_cadence_pedaling',
        events: [
          { time: 0.25, name: 'PEDAL_DOWN', foot: 'right' },
          { time: 0.75, name: 'PEDAL_DOWN', foot: 'left' }
        ]
      },

      Player_Bicycle_Dismount: {
        clipId: 'Player_Bicycle_Dismount',
        state: 'BICYCLE',
        category: 'action',
        duration: 1.2,
        speed: 0.0,
        looping: false,
        rootMotion: true,
        priority: 3,
        style: 'frame_step_down',
        events: [
          { time: 0.4, name: 'DISMOUNT', vehicle: 'bicycle' },
          { time: 1.15, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Boat_Board: {
        clipId: 'Player_Boat_Board',
        state: 'BOAT',
        category: 'action',
        duration: 1.6,
        speed: 0.0,
        looping: false,
        rootMotion: true,
        priority: 3,
        style: 'gunwale_step_balance',
        events: [
          { time: 1.1, name: 'MOUNT', vehicle: 'boat' },
          { time: 1.55, name: 'INTERACTION_COMPLETE' }
        ]
      },

      Player_Boat_Row: {
        clipId: 'Player_Boat_Row',
        state: 'BOAT',
        category: 'locomotion',
        duration: 1.8,
        speed: 2.2,
        looping: true,
        rootMotion: false,
        priority: 2,
        style: 'oar_stroke_pichavaram',
        events: [
          { time: 0.6, name: 'OAR_ENTRY' },
          { time: 1.2, name: 'OAR_EXIT' }
        ]
      },

      Player_Boat_Dismount: {
        clipId: 'Player_Boat_Dismount',
        state: 'BOAT',
        category: 'action',
        duration: 1.5,
        speed: 0.0,
        looping: false,
        rootMotion: true,
        priority: 3,
        style: 'jetty_step_out',
        events: [
          { time: 0.7, name: 'DISMOUNT', vehicle: 'boat' },
          { time: 1.45, name: 'INTERACTION_COMPLETE' }
        ]
      },

      // ----------------- Upper Body & Photo / Dialogue -----------------
      Player_Photo_Pose: {
        clipId: 'Player_Photo_Pose',
        state: 'PHOTO_MODE',
        category: 'layered',
        duration: 1.8,
        speed: 0.0,
        looping: true,
        rootMotion: false,
        priority: 2,
        style: 'camera_viewfinder_hold',
        events: []
      },

      Player_Talk: {
        clipId: 'Player_Talk',
        state: 'TALK',
        category: 'layered',
        duration: 2.5,
        speed: 0.0,
        looping: true,
        rootMotion: false,
        priority: 2,
        style: 'conversational_head_and_hand',
        events: []
      },

      Player_Cinematic: {
        clipId: 'Player_Cinematic',
        state: 'CINEMATIC',
        category: 'action',
        duration: 4.0,
        speed: 0.0,
        looping: false,
        rootMotion: true,
        priority: 4,
        style: 'authored_cutscene',
        events: [
          { time: 3.95, name: 'INTERACTION_COMPLETE' }
        ]
      }
    }
  };

  return ANIMATION_DATA;
});
