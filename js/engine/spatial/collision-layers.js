/**
 * The Whispering Wilds - Collision Layer Definitions
 * Centralised collision group registry. All collision logic reads from here.
 * Avoids arbitrary collision decisions scattered across individual files.
 */

const CollisionLayers = Object.freeze({
  NONE:          0x0000,
  PLAYER:        0x0001,
  NPC:           0x0002,
  WILDLIFE:      0x0004,
  WORLD:         0x0008,
  VEHICLE:       0x0010,
  BOAT:          0x0020,
  INTERACTABLE:  0x0040,
  TRIGGER:       0x0080,
  WATER:         0x0100,
  CLIMBABLE:     0x0200,
  TRAVERSABLE:   0x0400,
  NO_NAVIGATION: 0x0800,
  QUEST:         0x1000,
  CINEMATIC:     0x2000,
  TERRAIN:       0x4000,
  ALL:           0xFFFF
});

/**
 * Collision mask table: which layers each layer collides with.
 * Key = layer bit, Value = bitmask of layers it collides with.
 */
const CollisionMasks = Object.freeze({
  [CollisionLayers.PLAYER]:       CollisionLayers.WORLD | CollisionLayers.VEHICLE | CollisionLayers.BOAT |
                                   CollisionLayers.WATER | CollisionLayers.TERRAIN | CollisionLayers.INTERACTABLE |
                                   CollisionLayers.TRIGGER | CollisionLayers.QUEST,

  [CollisionLayers.NPC]:          CollisionLayers.WORLD | CollisionLayers.TERRAIN | CollisionLayers.VEHICLE |
                                   CollisionLayers.TRIGGER | CollisionLayers.QUEST,

  [CollisionLayers.WILDLIFE]:     CollisionLayers.WORLD | CollisionLayers.TERRAIN | CollisionLayers.WATER |
                                   CollisionLayers.TRIGGER,

  [CollisionLayers.WORLD]:        CollisionLayers.PLAYER | CollisionLayers.NPC | CollisionLayers.WILDLIFE |
                                   CollisionLayers.VEHICLE | CollisionLayers.BOAT,

  [CollisionLayers.VEHICLE]:      CollisionLayers.WORLD | CollisionLayers.PLAYER | CollisionLayers.TERRAIN,

  [CollisionLayers.BOAT]:         CollisionLayers.WATER | CollisionLayers.WORLD | CollisionLayers.PLAYER,

  [CollisionLayers.WATER]:        CollisionLayers.PLAYER | CollisionLayers.WILDLIFE | CollisionLayers.BOAT,

  [CollisionLayers.TERRAIN]:      CollisionLayers.PLAYER | CollisionLayers.NPC | CollisionLayers.WILDLIFE |
                                   CollisionLayers.VEHICLE,

  [CollisionLayers.TRIGGER]:      CollisionLayers.PLAYER,

  [CollisionLayers.INTERACTABLE]: CollisionLayers.PLAYER,

  [CollisionLayers.CLIMBABLE]:    CollisionLayers.PLAYER,

  [CollisionLayers.QUEST]:        CollisionLayers.PLAYER | CollisionLayers.NPC,

  [CollisionLayers.CINEMATIC]:    CollisionLayers.NONE,
});

/**
 * Returns true if layerA should collide with layerB.
 * @param {number} layerA
 * @param {number} layerB
 * @returns {boolean}
 */
function layersCollide(layerA, layerB) {
  const maskA = CollisionMasks[layerA] || CollisionLayers.NONE;
  return (maskA & layerB) !== 0;
}

/**
 * Given a layer bit, return its human-readable name.
 * @param {number} layer
 * @returns {string}
 */
function layerName(layer) {
  for (const [name, bit] of Object.entries(CollisionLayers)) {
    if (bit === layer) return name;
  }
  return `UNKNOWN(${layer})`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CollisionLayers, CollisionMasks, layersCollide, layerName };
} else if (typeof window !== 'undefined') {
  window.CollisionLayers = CollisionLayers;
  window.CollisionMasks = CollisionMasks;
  window.layersCollide = layersCollide;
  window.layerName = layerName;
}
