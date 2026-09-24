/**
 * The Whispering Wilds (Kaattu Vazhi) - Semantic Release Version
 * Single source of truth for the client game version.
 */
(function() {
  const GAME_VERSION = "1.0.0";
  window.GAME_VERSION = GAME_VERSION;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_VERSION };
  }
})();
