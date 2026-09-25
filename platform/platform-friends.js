/**
 * PlatformFriends - Privacy-Safe Friend Activity Integration
 * Supplementary platform friend status without exposing private player journals or notes.
 */

(function(root) {
  class PlatformFriends {
    constructor(provider) {
      this.provider = provider;
    }

    async getFriendsList() {
      if (!this.provider || typeof this.provider.getFriends !== 'function') {
        return [];
      }
      try {
        const list = await this.provider.getFriends();
        // Return only sanitized friend descriptors
        return list.map(f => ({
          name: f.name || 'Explorer Friend',
          status: f.status || 'Offline',
          richPresence: f.richPresence || ''
        }));
      } catch (e) {
        return [];
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformFriends;
  } else {
    root.PlatformFriends = PlatformFriends;
  }
})(typeof window !== 'undefined' ? window : global);
