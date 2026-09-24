/**
 * The Whispering Wilds (Kaattu Vazhi) - Production Asset Validator Tool
 * Scans local GLB models, textures, audio catalogs, and environmental data references.
 * Generates developer diagnostic report categorized as FOUND, MISSING, or INVALID.
 */

class AssetValidator {
  constructor() {
    this.results = {
      found: [],
      missing: [],
      invalid: []
    };
  }

  /**
   * Validates registered assets against availability
   * @param {Object} options - { checkNetwork: boolean }
   */
  async validateAllAssets(options = {}) {
    this.results = { found: [], missing: [], invalid: [] };
    const checkNetwork = options.checkNetwork !== undefined ? options.checkNetwork : true;

    // 1. Core Player Model & Rig Contract
    const playerAssets = [
      { id: 'player_character_glb', path: 'assets/characters/player/player.glb', type: 'model', usedBy: 'CharacterLoader / ThreePlayer' },
      { id: 'player_albedo_tex', path: 'assets/characters/player/textures/player_albedo.webp', type: 'texture', usedBy: 'ThreePlayer Material' },
      { id: 'player_normal_tex', path: 'assets/characters/player/textures/player_normal.webp', type: 'texture', usedBy: 'ThreePlayer Material' },
      { id: 'player_manifest', path: 'assets/characters/player/CHARACTER_MANIFEST.json', type: 'data', usedBy: 'CharacterLoader' }
    ];

    // 2. Production World Architecture & Landmarks
    const worldAssets = [
      { id: 'high_court_glb', path: 'assets/architecture/chennai/madras_high_court.glb', type: 'model', usedBy: 'ProductionWorldAssets (Chennai)' },
      { id: 'tea_kadai_glb', path: 'assets/architecture/chennai/tea_kadai_stall.glb', type: 'model', usedBy: 'ProductionWorldAssets (Chennai)' },
      { id: 'chola_sluice_glb', path: 'assets/architecture/delta/irrigation_sluice.glb', type: 'model', usedBy: 'ProductionWorldAssets (Delta)' },
      { id: 'toda_mund_glb', path: 'assets/architecture/nilgiris/toda_mund_hut.glb', type: 'model', usedBy: 'ProductionWorldAssets (Nilgiris)' },
      { id: 'eco_sanctuary_glb', path: 'assets/architecture/sanctuary/botanical_portal.glb', type: 'model', usedBy: 'ProductionWorldAssets (Sanctuary)' }
    ];

    // 3. Registered Audio Catalog from AUDIO_DATA
    const audioAssets = [];
    if (window.AUDIO_DATA) {
      for (const cat of Object.keys(window.AUDIO_DATA)) {
        const group = window.AUDIO_DATA[cat];
        if (typeof group === 'object') {
          for (const key of Object.keys(group)) {
            const item = group[key];
            if (item && item.file) {
              audioAssets.push({
                id: item.id || key,
                path: item.file,
                type: 'audio',
                usedBy: `AudioManager (${cat})`
              });
            }
          }
        }
      }
    }

    const allCandidates = [...playerAssets, ...worldAssets, ...audioAssets];

    for (const asset of allCandidates) {
      if (!asset.path || typeof asset.path !== 'string') {
        this.results.invalid.push({ ...asset, reason: 'Invalid or missing file path string' });
        continue;
      }

      if (checkNetwork && typeof fetch !== 'undefined') {
        try {
          const res = await fetch(asset.path, { method: 'HEAD' });
          if (res.ok) {
            this.results.found.push({ ...asset, status: 'FOUND' });
          } else {
            this.results.missing.push({ ...asset, status: 'MISSING', httpStatus: res.status });
          }
        } catch (e) {
          this.results.missing.push({ ...asset, status: 'MISSING', error: e.message });
        }
      } else {
        // Syntax validity check
        if (asset.path.startsWith('assets/')) {
          this.results.found.push({ ...asset, status: 'REGISTERED' });
        } else {
          this.results.invalid.push({ ...asset, status: 'INVALID', reason: 'Asset path must reside within assets/' });
        }
      }
    }

    return this.results;
  }

  printReport() {
    console.log('=======================================================');
    console.log('📦 THE WHISPERING WILDS - ASSET VALIDATION REPORT');
    console.log(`✓ FOUND / REGISTERED: ${this.results.found.length}`);
    console.log(`⚠️ MISSING (CONTRACT FALLBACK ACTIVE): ${this.results.missing.length}`);
    console.log(`❌ INVALID SPECIFICATIONS: ${this.results.invalid.length}`);
    console.log('=======================================================');
    if (this.results.missing.length > 0) {
      console.warn('[AssetValidator] Missing production assets will safely use procedural/synthesized fallbacks per contract:');
      this.results.missing.forEach(m => console.warn(`  - [${m.type}] ${m.id}: ${m.path} (${m.usedBy})`));
    }
    return this.results;
  }
}

window.AssetValidator = AssetValidator;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssetValidator;
}
