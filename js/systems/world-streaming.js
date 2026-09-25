/**
 * The Whispering Wilds (Kaattu Vazhi) - Legacy World Streaming Adapter
 * Authoritative WorldStreamingSystem is in world-streaming-system.js.
 */

(function () {
  'use strict';
  if (typeof window !== 'undefined' && window.WorldStreamingSystem) {
    window.LegacyWorldStreamingSystem = window.WorldStreamingSystem;
  }
})();
