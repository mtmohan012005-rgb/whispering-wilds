// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTION DATA & TAXONOMY
// Authoritative definitions for interaction categories, priorities & localization
// ============================================================================

(function() {
  'use strict';

  // 1. Authoritative Interaction Categories
  const INTERACTION_CATEGORIES = {
    INSPECT: 'INSPECT',
    OPEN: 'OPEN',
    CLOSE: 'CLOSE',
    PUSH: 'PUSH',
    PULL: 'PULL',
    ACTIVATE: 'ACTIVATE',
    CLIMB: 'CLIMB',
    CROSS: 'CROSS',
    COLLECT: 'COLLECT',
    PLACE: 'PLACE',
    LIGHT: 'LIGHT',
    EXTINGUISH: 'EXTINGUISH',
    WATER_INTERACT: 'WATER_INTERACT',
    HARVEST: 'HARVEST',
    READ: 'READ',
    LISTEN: 'LISTEN'
  };

  // 2. Strict Interaction Priority Tiers (Lower number = Higher Priority)
  // Ensures decorative objects never steal interaction focus from story/quest items
  const INTERACTION_PRIORITY = {
    CRITICAL_STORY: 1,
    ACTIVE_QUEST: 2,
    INVESTIGATION_EVIDENCE: 3,
    USABLE_TRANSPORT: 4,
    NORMAL_PROP: 5,
    AMBIENT_PROP: 6
  };

  // 3. Bilingual Interaction Action Verbs (English & Authentic Tamil)
  const INTERACTION_VERBS = {
    [INTERACTION_CATEGORIES.INSPECT]: {
      en: 'Inspect',
      ta: 'ஆராய்க',
      icon: '🔍',
      verb: 'inspect'
    },
    [INTERACTION_CATEGORIES.OPEN]: {
      en: 'Open',
      ta: 'திற',
      icon: '🚪',
      verb: 'open'
    },
    [INTERACTION_CATEGORIES.CLOSE]: {
      en: 'Close',
      ta: 'மூடு',
      icon: '🚪',
      verb: 'close'
    },
    [INTERACTION_CATEGORIES.PUSH]: {
      en: 'Push',
      ta: 'தள்ளு',
      icon: '✋',
      verb: 'push'
    },
    [INTERACTION_CATEGORIES.PULL]: {
      en: 'Pull',
      ta: 'இழு',
      icon: '✊',
      verb: 'pull'
    },
    [INTERACTION_CATEGORIES.ACTIVATE]: {
      en: 'Activate',
      ta: 'செயல்படுத்து',
      icon: '⚙️',
      verb: 'activate'
    },
    [INTERACTION_CATEGORIES.CLIMB]: {
      en: 'Climb',
      ta: 'ஏறு',
      icon: '🧗',
      verb: 'climb'
    },
    [INTERACTION_CATEGORIES.CROSS]: {
      en: 'Cross',
      ta: 'கடந்து செல்',
      icon: '🌉',
      verb: 'cross'
    },
    [INTERACTION_CATEGORIES.COLLECT]: {
      en: 'Take',
      ta: 'எடு',
      icon: '🧺',
      verb: 'collect'
    },
    [INTERACTION_CATEGORIES.PLACE]: {
      en: 'Place',
      ta: 'வை',
      icon: '📦',
      verb: 'place'
    },
    [INTERACTION_CATEGORIES.LIGHT]: {
      en: 'Light Lamp',
      ta: 'விளக்கேற்று',
      icon: '🪔',
      verb: 'light'
    },
    [INTERACTION_CATEGORIES.EXTINGUISH]: {
      en: 'Extinguish',
      ta: 'அணை',
      icon: '💨',
      verb: 'extinguish'
    },
    [INTERACTION_CATEGORIES.WATER_INTERACT]: {
      en: 'Draw Water',
      ta: 'நீர் எடு',
      icon: '💧',
      verb: 'draw_water'
    },
    [INTERACTION_CATEGORIES.HARVEST]: {
      en: 'Harvest',
      ta: 'அறுவடை செய்',
      icon: '🌾',
      verb: 'harvest'
    },
    [INTERACTION_CATEGORIES.READ]: {
      en: 'Read Manuscript',
      ta: 'வாசி',
      icon: '📜',
      verb: 'read'
    },
    [INTERACTION_CATEGORIES.LISTEN]: {
      en: 'Listen',
      ta: 'செவிமடு',
      icon: '👂',
      verb: 'listen'
    }
  };

  // 4. Interaction Anchor Profiles (Hand & Transform Alignment)
  const INTERACTION_ANCHORS = {
    DOOR_HANDLE: {
      reachOffset: { x: 0.45, y: 1.05, z: 0.1 },
      playerStandDistance: 0.85,
      animation: 'INTERACT_REACH'
    },
    GATE_LATCH: {
      reachOffset: { x: 0.0, y: 1.15, z: 0.15 },
      playerStandDistance: 0.95,
      animation: 'INTERACT_REACH'
    },
    WELL_PULLEY: {
      reachOffset: { x: 0.0, y: 1.2, z: 0.4 },
      playerStandDistance: 0.9,
      animation: 'INTERACT_USE'
    },
    PUMP_HANDLE: {
      reachOffset: { x: 0.35, y: 0.85, z: 0.0 },
      playerStandDistance: 0.8,
      animation: 'INTERACT_USE'
    },
    LAMP_WICK: {
      reachOffset: { x: 0.0, y: 0.95, z: 0.2 },
      playerStandDistance: 0.65,
      animation: 'INTERACT_REACH'
    },
    CHEST_LID: {
      reachOffset: { x: 0.0, y: 0.65, z: 0.25 },
      playerStandDistance: 0.75,
      animation: 'INTERACT_USE'
    },
    CRATE_FACE: {
      reachOffset: { x: 0.0, y: 0.6, z: 0.3 },
      playerStandDistance: 0.6,
      animation: 'INTERACT_REACH'
    }
  };

  // Global Export
  window.INTERACTION_CATEGORIES = INTERACTION_CATEGORIES;
  window.INTERACTION_PRIORITY = INTERACTION_PRIORITY;
  window.INTERACTION_VERBS = INTERACTION_VERBS;
  window.INTERACTION_ANCHORS = INTERACTION_ANCHORS;

  console.log('[InteractionData] Loaded authoritative interaction categories & priority mappings.');
})();
