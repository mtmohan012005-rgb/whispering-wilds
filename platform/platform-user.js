/**
 * PlatformUser - Standardized Platform User Identity Representation
 * Privacy-first: exposes only sanitized public display names and safe provider IDs.
 * Never stores or leaks passwords, auth tokens, or private credentials.
 */

(function(root) {
  class PlatformUser {
    constructor(options = {}) {
      this.provider = options.provider || 'generic';
      this.platformId = options.platformId || 'local_user';
      this.displayName = options.displayName || 'Tamil Nadu Explorer';
      this.isGuest = options.isGuest !== false;
      this.avatarUrl = options.avatarUrl || null;
      this.linkedGameProfileId = options.linkedGameProfileId || null;
    }

    getSanitizedSummary() {
      return {
        provider: this.provider,
        displayName: this.displayName,
        isGuest: this.isGuest,
        avatarUrl: this.avatarUrl,
        hasLinkedProfile: !!this.linkedGameProfileId
      };
    }

    toString() {
      return `[PlatformUser: ${this.displayName} (${this.provider})]`;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformUser;
  } else {
    root.PlatformUser = PlatformUser;
  }
})(typeof window !== 'undefined' ? window : global);
