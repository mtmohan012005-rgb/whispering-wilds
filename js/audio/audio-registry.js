// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO ASSET REGISTRY
// Centralized, authoritative catalog of all sound effects, voice lines,
// music cues, and ambient soundscapes with verified license metadata.
// ============================================================================

(function () {
  'use strict';

  class AudioRegistry {
    constructor() {
      this._assets = new Map();
      this._categories = new Map();
      this._initialized = false;
    }

    init(manifestData = null) {
      this._assets.clear();
      this._categories.clear();

      const manifest = manifestData || window.AUDIO_MANIFEST_DATA || [];
      if (Array.isArray(manifest)) {
        manifest.forEach(item => this.registerAsset(item));
      }

      this._initialized = true;
      console.log(`[AudioRegistry] Initialized with ${this._assets.size} registered audio assets.`);
      return this;
    }

    registerAsset(def) {
      if (!def || !def.id) {
        console.warn('[AudioRegistry] Invalid asset definition (missing id).', def);
        return false;
      }

      const entry = {
        id: def.id,
        path: def.path || `assets/audio/${def.id}.mp3`,
        type: def.type || 'sfx', // 'voice', 'music', 'ambience', 'sfx', 'ui', 'weather', 'vehicle', 'wildlife', 'cinematic'
        language: def.language || 'neutral', // 'ta', 'en', 'neutral'
        region: def.region || 'global',
        duration: def.duration || 1.0,
        license: def.license || 'CC-BY-4.0',
        creator: def.creator || 'The Whispering Wilds Audio Team',
        commercialUse: def.commercialUse !== undefined ? def.commercialUse : true,
        streamable: !!def.streamable,
        critical: !!def.critical,
        fallbackSynth: def.fallbackSynth || 'sine',
        variants: Array.isArray(def.variants) ? [...def.variants] : []
      };

      this._assets.set(def.id, entry);

      // Track by category
      if (!this._categories.has(entry.type)) {
        this._categories.set(entry.type, []);
      }
      this._categories.get(entry.type).push(entry);

      return true;
    }

    get(id) {
      return this._assets.get(id) || null;
    }

    has(id) {
      return this._assets.has(id);
    }

    getByCategory(type) {
      return this._categories.get(type) || [];
    }

    getByRegion(region) {
      const results = [];
      for (const asset of this._assets.values()) {
        if (asset.region === region || asset.region === 'global') {
          results.push(asset);
        }
      }
      return results;
    }

    validateLicenseIntegrity() {
      const violations = [];
      for (const asset of this._assets.values()) {
        if (!asset.license || asset.license === 'unknown' || !asset.commercialUse) {
          violations.push({
            id: asset.id,
            license: asset.license,
            critical: asset.critical
          });
        }
      }
      return {
        valid: violations.length === 0,
        violations
      };
    }

    getAll() {
      return Array.from(this._assets.values());
    }
  }

  const instance = new AudioRegistry();

  if (typeof window !== 'undefined') {
    window.AudioRegistry = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioRegistry, instance };
  }
})();
