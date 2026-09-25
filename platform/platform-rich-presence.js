/**
 * PlatformRichPresence - Authored Rich Presence Formatter & Debounced Dispatcher
 * Publishes safe regional activity status without leaking private spoilers or hidden clues.
 */

(function(root) {
  class PlatformRichPresence {
    constructor(provider) {
      this.provider = provider;
      this.currentPresenceKey = null;
      this.lastSentTimestamp = 0;
      this.debounceMs = 5000; // 5-second debounce
      this.pendingTimeout = null;
    }

    formatPresence(regionId = 'chennai', activity = 'exploring', options = {}) {
      const regionNames = {
        chennai: 'Chennai',
        mamallapuram: 'Mamallapuram',
        pichavaram: 'Pichavaram Mangroves',
        thanjavur: 'Thanjavur Delta',
        chettinad: 'Chettinad',
        madurai: 'Madurai',
        nilgiris: 'Nilgiris Highlands',
        rameswaram: 'Rameswaram Coast'
      };

      const regionName = regionNames[regionId] || 'Tamil Nadu';

      switch (activity) {
        case 'boat':
          return `Sailing Catamaran at ${regionName}`;
        case 'festival':
          return `Celebrating Festival in ${regionName}`;
        case 'investigation':
          return `Investigating History in ${regionName}`;
        case 'photo':
          return `Capturing Wildlife at ${regionName}`;
        case 'camping':
          return `Resting at Campfire in ${regionName}`;
        case 'exploring':
        default:
          return `Exploring ${regionName}`;
      }
    }

    setPresence(regionId, activity, options = {}) {
      const presenceString = this.formatPresence(regionId, activity, options);
      if (presenceString === this.currentPresenceKey) return;

      this.currentPresenceKey = presenceString;
      const now = Date.now();

      if (now - this.lastSentTimestamp < this.debounceMs) {
        if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
        this.pendingTimeout = setTimeout(() => {
          this._dispatch(presenceString);
        }, this.debounceMs - (now - this.lastSentTimestamp));
      } else {
        this._dispatch(presenceString);
      }
    }

    _dispatch(presenceString) {
      this.lastSentTimestamp = Date.now();
      if (this.provider && typeof this.provider.setRichPresence === 'function') {
        try {
          this.provider.setRichPresence(presenceString);
        } catch (e) {}
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformRichPresence;
  } else {
    root.PlatformRichPresence = PlatformRichPresence;
  }
})(typeof window !== 'undefined' ? window : global);
