/**
 * The Whispering Wilds (Kaattu Vazhi) - Asset Versioning
 * Used for deterministic cache-busting of dynamic and immutable game assets.
 */
(function() {
  const ASSET_VERSION = "1.0.0";
  window.ASSET_VERSION = ASSET_VERSION;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ASSET_VERSION };
  }
})();
