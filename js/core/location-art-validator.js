// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - LOCATION ART VALIDATOR
// Authoritative mapping & runtime validation ensuring location names and
// regional artwork are NEVER mismatched across UI, menus, loading screens & HUD.
// ============================================================================

(function () {
  'use strict';

  const REGION_ART_MAP = {
    george_town: {
      id: 'chennai',
      canonicalRegion: 'GEORGE TOWN, CHENNAI',
      tamilName: 'ஜார்ஜ் டவுன் • சென்னை',
      artwork: 'assets/ui/menu/menu-chennai.jpg',
      theme: 'dense_streets_heritage_urban',
      forbiddenThemes: ['mountains', 'tea_estate', 'wilderness_camping', 'mangroves']
    },
    chennai: {
      id: 'chennai',
      canonicalRegion: 'GEORGE TOWN, CHENNAI',
      tamilName: 'ஜார்ஜ் டவுன் • சென்னை',
      artwork: 'assets/ui/menu/menu-chennai.jpg',
      theme: 'dense_streets_heritage_urban',
      forbiddenThemes: ['mountains', 'tea_estate', 'wilderness_camping', 'mangroves']
    },
    cauvery_delta: {
      id: 'delta',
      canonicalRegion: 'CAUVERY DELTA',
      tamilName: 'காவிரி டெல்டா வயல்வெளி',
      artwork: 'assets/ui/menu/menu-delta.jpg',
      theme: 'delta_agricultural_paddy',
      forbiddenThemes: ['mountains', 'tea_estate', 'mangroves']
    },
    delta: {
      id: 'delta',
      canonicalRegion: 'CAUVERY DELTA',
      tamilName: 'காவிரி டெல்டா வயல்வெளி',
      artwork: 'assets/ui/menu/menu-delta.jpg',
      theme: 'delta_agricultural_paddy',
      forbiddenThemes: ['mountains', 'tea_estate', 'mangroves']
    },
    pichavaram: {
      id: 'pichavaram',
      canonicalRegion: 'PICHAVARAM',
      tamilName: 'பிச்சாவரம் அலையாத்தி காடுகள்',
      artwork: 'assets/ui/menu/menu-pichavaram.jpg',
      theme: 'mangroves_estuary_canals',
      forbiddenThemes: ['mountains', 'tea_estate', 'dense_urban']
    },
    chettinad: {
      id: 'chettinad',
      canonicalRegion: 'CHETTINAD',
      tamilName: 'செட்டிநாடு பாரம்பரியம்',
      artwork: 'assets/ui/menu/menu-chettinad.jpg',
      theme: 'chettinad_heritage_mansions',
      forbiddenThemes: ['mountains', 'tea_estate', 'mangroves']
    },
    mamallapuram: {
      id: 'mamallapuram',
      canonicalRegion: 'MAMALLAPURAM',
      tamilName: 'மாமல்லபுரம் கடற்கரை கோவில்',
      artwork: 'assets/ui/menu/menu-mamallapuram.jpg',
      theme: 'granite_coast_shore_temple',
      forbiddenThemes: ['mountains', 'tea_estate', 'mangroves']
    },
    nilgiris: {
      id: 'nilgiris',
      canonicalRegion: 'NILGIRIS',
      tamilName: 'நீலகிரி மலைக்காடுகள்',
      artwork: 'assets/ui/menu/menu-nilgiris.jpg',
      theme: 'tea_mountains_sholas',
      forbiddenThemes: ['dense_urban', 'mangroves', 'delta']
    }
  };

  class LocationArtValidator {
    /**
     * Resolves canonical region key
     */
    static normalizeRegionKey(rawKey) {
      if (!rawKey) return 'george_town';
      const clean = String(rawKey).toLowerCase().trim().replace(/[-\s]/g, '_');
      if (clean.includes('chennai') || clean.includes('george')) return 'george_town';
      if (clean.includes('pichavaram') || clean.includes('mangrove')) return 'pichavaram';
      if (clean.includes('chettinad') || clean.includes('karaikudi')) return 'chettinad';
      if (clean.includes('mamallapuram') || clean.includes('mahabalipuram')) return 'mamallapuram';
      if (clean.includes('nilgiri') || clean.includes('ooty') || clean.includes('mountain')) return 'nilgiris';
      if (clean.includes('delta') || clean.includes('cauvery') || clean.includes('thanjavur')) return 'cauvery_delta';
      return clean;
    }

    /**
     * Gets verified artwork path for a region
     */
    static getArtworkForRegion(regionKey) {
      const norm = this.normalizeRegionKey(regionKey);
      const conf = REGION_ART_MAP[norm] || REGION_ART_MAP.george_town;
      return conf.artwork;
    }

    /**
     * Validates that artwork path matches region
     * @returns {boolean} true if valid, false if mismatch
     */
    static validate(regionKey, artworkUrl) {
      const norm = this.normalizeRegionKey(regionKey);
      const conf = REGION_ART_MAP[norm];
      if (!conf) return false;

      const cleanUrl = String(artworkUrl || '').toLowerCase();

      // Check if URL belongs to forbidden theme or other regions
      for (const [otherKey, otherConf] of Object.entries(REGION_ART_MAP)) {
        if (otherConf.id !== conf.id && cleanUrl.includes(otherConf.id)) {
          console.error(`[LocationArtValidator] REGION MISMATCH DETECTED! Region "${regionKey}" cannot use artwork "${artworkUrl}" from region "${otherKey}".`);
          return false;
        }
      }

      return cleanUrl.includes(conf.id);
    }

    /**
     * Asserts and corrects artwork if a mismatch is detected
     */
    static enforceValidArtwork(regionKey, currentArtworkUrl) {
      if (!this.validate(regionKey, currentArtworkUrl)) {
        const fallback = this.getArtworkForRegion(regionKey);
        console.warn(`[LocationArtValidator] Auto-corrected artwork for "${regionKey}": replaced with "${fallback}".`);
        return fallback;
      }
      return currentArtworkUrl;
    }

    /**
     * Returns metadata for UI display
     */
    static getRegionDisplayInfo(regionKey) {
      const norm = this.normalizeRegionKey(regionKey);
      return REGION_ART_MAP[norm] || REGION_ART_MAP.george_town;
    }
  }

  window.LocationArtValidator = LocationArtValidator;
  window.REGION_ART_MAP = REGION_ART_MAP;
})();
