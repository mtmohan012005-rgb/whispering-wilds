/**
 * js/data/interaction-animation-data.js
 * The Whispering Wilds (Kaattu Vazhi) - Interaction Animation Registry Data
 *
 * Defines anchor points, hand IK targets, durations, cancellation rules,
 * and audio/gameplay sync markers for environmental interactions.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.INTERACTION_ANIMATION_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INTERACTION_ANIMATION_DATA = {
    // Environmental & Puzzle Interaction Profiles
    INTERACTIONS: {
      open_door: {
        interactionType: 'open_door',
        animation: 'Player_Interact',
        anchor: 'door_handle',
        duration: 1.2,
        cancellable: false,
        alignmentDistance: 0.85,
        ik: {
          rightHand: true,
          leftHand: false,
          maxCorrectionMeters: 0.35
        },
        events: [
          { time: 0.5, name: 'HAND_CONTACT', target: 'door_handle' },
          { time: 0.65, name: 'DOOR_LATCH_OPEN' },
          { time: 1.15, name: 'INTERACTION_COMPLETE' }
        ]
      },

      open_gate: {
        interactionType: 'open_gate',
        animation: 'Player_Interact',
        anchor: 'gate_latch',
        duration: 1.4,
        cancellable: false,
        alignmentDistance: 0.9,
        ik: {
          rightHand: true,
          leftHand: false,
          maxCorrectionMeters: 0.4
        },
        events: [
          { time: 0.55, name: 'HAND_CONTACT', target: 'gate_latch' },
          { time: 0.8, name: 'GATE_UNLATCHED' },
          { time: 1.35, name: 'INTERACTION_COMPLETE' }
        ]
      },

      operate_well_pump: {
        interactionType: 'operate_well_pump',
        animation: 'Player_Interact',
        anchor: 'well_pump_handle',
        duration: 2.2,
        cancellable: false,
        alignmentDistance: 0.8,
        ik: {
          rightHand: true,
          leftHand: false,
          maxCorrectionMeters: 0.35
        },
        events: [
          { time: 0.4, name: 'HAND_CONTACT', target: 'well_pump_handle' },
          { time: 0.9, name: 'PUMP_STROKE_DOWN' },
          { time: 1.4, name: 'WATER_FLOW_START' },
          { time: 2.1, name: 'INTERACTION_COMPLETE' }
        ]
      },

      inspect_artifact: {
        interactionType: 'inspect_artifact',
        animation: 'Player_Inspect',
        anchor: 'chest_height_hold',
        duration: 2.2,
        cancellable: true, // Can cancel inspection at any time
        alignmentDistance: 0.0, // Performed in place
        ik: {
          rightHand: true,
          leftHand: true,
          maxCorrectionMeters: 0.25
        },
        events: [
          { time: 0.3, name: 'ITEM_RAISED' },
          { time: 2.1, name: 'INTERACTION_COMPLETE' }
        ]
      },

      pickup_ground_item: {
        interactionType: 'pickup_ground_item',
        animation: 'Player_Pickup',
        anchor: 'ground_target',
        duration: 1.4,
        cancellable: false,
        alignmentDistance: 0.7,
        ik: {
          rightHand: true,
          leftHand: false,
          maxCorrectionMeters: 0.45
        },
        events: [
          { time: 0.65, name: 'GRAB', target: 'inventory_item' },
          { time: 1.35, name: 'INTERACTION_COMPLETE' }
        ]
      },

      push_object: {
        interactionType: 'push_object',
        animation: 'Player_Push',
        anchor: 'push_contact_plane',
        duration: 1.3,
        cancellable: true,
        alignmentDistance: 0.6,
        ik: {
          rightHand: true,
          leftHand: true,
          maxCorrectionMeters: 0.3
        },
        events: [
          { time: 0.25, name: 'HAND_CONTACT', target: 'push_plane' }
        ]
      },

      pull_object: {
        interactionType: 'pull_object',
        animation: 'Player_Pull',
        anchor: 'pull_handle_anchor',
        duration: 1.3,
        cancellable: true,
        alignmentDistance: 0.65,
        ik: {
          rightHand: true,
          leftHand: true,
          maxCorrectionMeters: 0.3
        },
        events: [
          { time: 0.25, name: 'GRAB', target: 'pull_handle' }
        ]
      },

      light_temple_lamp: {
        interactionType: 'light_temple_lamp',
        animation: 'Player_Interact',
        anchor: 'oil_lamp_wick',
        duration: 1.8,
        cancellable: false,
        alignmentDistance: 0.75,
        ik: {
          rightHand: true,
          leftHand: false,
          maxCorrectionMeters: 0.3
        },
        events: [
          { time: 0.7, name: 'LAMP_IGNITED' },
          { time: 1.7, name: 'INTERACTION_COMPLETE' }
        ]
      },

      mount_bicycle: {
        interactionType: 'mount_bicycle',
        animation: 'Player_Bicycle_Mount',
        anchor: 'bicycle_seat',
        duration: 1.4,
        cancellable: false,
        alignmentDistance: 0.5,
        ik: {
          rightHand: true,
          leftHand: true,
          feetGrounding: true
        },
        events: [
          { time: 0.9, name: 'MOUNT', vehicle: 'bicycle' },
          { time: 1.35, name: 'INTERACTION_COMPLETE' }
        ]
      },

      board_boat: {
        interactionType: 'board_boat',
        animation: 'Player_Boat_Board',
        anchor: 'boat_seat',
        duration: 1.6,
        cancellable: false,
        alignmentDistance: 0.6,
        ik: {
          rightHand: false,
          leftHand: false,
          feetGrounding: true
        },
        events: [
          { time: 1.1, name: 'MOUNT', vehicle: 'boat' },
          { time: 1.55, name: 'INTERACTION_COMPLETE' }
        ]
      }
    }
  };

  return INTERACTION_ANIMATION_DATA;
});
