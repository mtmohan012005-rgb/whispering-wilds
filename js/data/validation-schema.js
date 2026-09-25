/**
 * js/data/validation-schema.js
 * Central validation schemas and range limits for The Whispering Wilds.
 * Enforces strict limits, including the absolute 5 customization changes ceiling.
 */

(function () {
  'use strict';

  const APPROVED_REGIONS = [
    'george_town',
    'cauvery_delta',
    'pichavaram',
    'chettinad',
    'thanjavur',
    'mamallapuram',
    'nilgiris',
    'final_sanctuary'
  ];

  const QUEST_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

  const ValidationSchema = {
    APPROVED_REGIONS,
    QUEST_STATUSES,

    PLAYER_BOUNDS: {
      MIN_X: -5000,
      MAX_X: 5000,
      MIN_Y: -50, // World floor protection
      MAX_Y: 2000,
      MIN_Z: -5000,
      MAX_Z: 5000,
      MIN_HEALTH: 0,
      MAX_HEALTH: 100,
      MIN_ENERGY: 0,
      MAX_ENERGY: 100,
      MIN_CURRENCY: 0,
      MAX_CUSTOMIZATION_CHANGES: 5 // ABSOLUTE LIMIT
    },

    INVENTORY_LIMITS: {
      MAX_WEIGHT_KG: 20.0,
      MAX_ITEM_STACK: 999,
      MIN_QUANTITY: 1
    },

    RELATIONSHIP_LIMITS: {
      MIN_TRUST: 0,
      MAX_TRUST: 100,
      MIN_FAMILIARITY: 0,
      MAX_FAMILIARITY: 100
    },

    TRANSPORT_LIMITS: {
      MIN_FARE: 0,
      MAX_FARE: 1000
    },

    PAYLOAD_LIMITS: {
      MAX_SAVE_BYTES: 5 * 1024 * 1024, // 5MB limit against payload injection
      CURRENT_SAVE_SCHEMA_VERSION: 3
    }
  };

  window.ValidationSchema = ValidationSchema;
})();
