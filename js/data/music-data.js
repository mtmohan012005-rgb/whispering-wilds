// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MUSIC CATALOG & REGIONAL THEMES
// Original and commissioned music compositions across 7 Tamil Nadu biomes,
// investigation motifs, festival celebrations, and cinematic scores.
// ============================================================================

(function () {
  'use strict';

  const MUSIC_TRACKS = {
    // 7 Regional Exploration Themes
    'music_explore_chennai': {
      id: 'music_explore_chennai',
      title: 'Dawn on Rajaji Salai (ஜார்ஜ் டவுன் விடியல்)',
      region: 'george_town',
      bpm: 78,
      volume: 0.65,
      duration: 184,
      instruments: ['Acoustic Nylon Guitar', 'Veena', 'Mridangam pulse'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_cauvery': {
      id: 'music_explore_cauvery',
      title: 'Currents of Thiruvaiyaru (காவிரியின் தாளம்)',
      region: 'cauvery_delta',
      bpm: 72,
      volume: 0.6,
      duration: 210,
      instruments: ['Pullanguzhal (Bamboo Flute)', 'Ghatam', 'Tambura'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_pichavaram': {
      id: 'music_explore_pichavaram',
      title: 'Mangrove Stilt Canals (சதுப்புநில நிழல்கள்)',
      region: 'pichavaram',
      bpm: 64,
      volume: 0.55,
      duration: 195,
      instruments: ['Water Resonance Chimes', 'Bowed Strings', 'Low Flute'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_chettinad': {
      id: 'music_explore_chettinad',
      title: 'Courtyard of Carved Teak (தேக்கு மர மாளிகை)',
      region: 'chettinad',
      bpm: 82,
      volume: 0.65,
      duration: 175,
      instruments: ['Nadaswaram subtle drone', 'Thavil soft tap', 'Violin'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_thanjavur': {
      id: 'music_explore_thanjavur',
      title: 'Song of the Stone Granite (தஞ்சை பெருங்கோவில் இசை)',
      region: 'thanjavur',
      bpm: 75,
      volume: 0.7,
      duration: 220,
      instruments: ['Classical Veena', 'Mridangam', 'Kanjira'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_mamallapuram': {
      id: 'music_explore_mamallapuram',
      title: 'Granite Facing the Bay (கடல் மல்லையின் காற்று)',
      region: 'mamallapuram',
      bpm: 70,
      volume: 0.65,
      duration: 190,
      instruments: ['Acoustic Guitar', 'Bowed Sarangi', 'Ocean Drone'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_explore_nilgiris': {
      id: 'music_explore_nilgiris',
      title: 'Whispering Shola Pines (நீலகிரி சோலைக் காடு)',
      region: 'nilgiris',
      bpm: 60,
      volume: 0.58,
      duration: 230,
      instruments: ['High Bamboo Flute', 'Harmonium drone', 'Wind bells'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },

    // Dynamic State Cues
    'music_investigation_subtle': {
      id: 'music_investigation_subtle',
      title: 'The Unsolved Blueprint (மறைக்கப்பட்ட சான்று)',
      region: 'global',
      bpm: 66,
      volume: 0.5,
      duration: 160,
      instruments: ['Pizzicato Strings', 'Subtle Tanpura', 'Clockwork Ticks'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_mystery_shola': {
      id: 'music_mystery_shola',
      title: 'Echoes in the Mist (பனி மூட்டத்தின் மர்மம்)',
      region: 'global',
      bpm: 58,
      volume: 0.55,
      duration: 180,
      instruments: ['Bowed Cello', 'Low Wind Resonance'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_festival_pongal': {
      id: 'music_festival_pongal',
      title: 'Harvest Bells & Drumbeats (பொங்கல் திருவிழா முழக்கம்)',
      region: 'global',
      bpm: 104,
      volume: 0.75,
      duration: 145,
      instruments: ['Thavil', 'Nadaswaram', 'Urumi Melam', 'Cymbals'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_cinematic_prologue': {
      id: 'music_cinematic_prologue',
      title: 'The High Court Heist (மதராஸ் களவு)',
      region: 'george_town',
      bpm: 88,
      volume: 0.9,
      duration: 120,
      instruments: ['Cinematic Orchestral Strings', 'Enfield Thump', 'Tension Percussion'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_ending_heritage': {
      id: 'music_ending_heritage',
      title: 'Song of the Living Soil (தூய பசுமைத் தடம் முடிவு இசை)',
      region: 'global',
      bpm: 72,
      volume: 0.85,
      duration: 240,
      instruments: ['Full Heritage Orchestra', 'Choral Harmony', 'Veena Solo'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    },
    'music_discovery_relic': {
      id: 'music_discovery_relic',
      title: 'Discovery Stinger (கண்டுபிடிப்பு மணி)',
      region: 'global',
      bpm: 120,
      volume: 0.8,
      duration: 3.5,
      instruments: ['Temple Brass Bell', 'Harp glissando'],
      license: 'Original Composition / Whispering Wilds Studio',
      creator: 'Tamil Nadu Heritage Audio Ensemble'
    }
  };

  const MusicData = {
    TRACKS: MUSIC_TRACKS,

    getTrack(id) {
      return MUSIC_TRACKS[id] || null;
    },

    getThemeForRegion(region) {
      const reg = (region || '').toLowerCase();
      switch (reg) {
        case 'george_town':
        case 'chennai': return 'music_explore_chennai';
        case 'cauvery_delta': return 'music_explore_cauvery';
        case 'pichavaram': return 'music_explore_pichavaram';
        case 'chettinad': return 'music_explore_chettinad';
        case 'thanjavur': return 'music_explore_thanjavur';
        case 'mamallapuram': return 'music_explore_mamallapuram';
        case 'nilgiris':
        case 'final_sanctuary': return 'music_explore_nilgiris';
        default: return 'music_explore_chennai';
      }
    },

    getRegionTheme(region) {
      const trackId = this.getThemeForRegion(region);
      const track = this.getTrack(trackId);
      if (!track) return null;
      return {
        ...track,
        instruments: Array.isArray(track.instruments) ? track.instruments.join(', ') : (track.instruments || 'Bamboo Flute, Mridangam')
      };
    },

    DISCOVERY_STINGERS: {
      minor_clue: { id: 'music_discovery_relic', duration: 3.5, subtle: true },
      major_secret: { id: 'music_discovery_relic', duration: 4.5, subtle: true }
    },

    getStinger(type = 'minor_clue') {
      return this.DISCOVERY_STINGERS[type] || this.DISCOVERY_STINGERS.minor_clue;
    },

    getMysteryTheme() {
      return {
        ...MUSIC_TRACKS['music_mystery_shola'],
        subtle: true
      };
    },

    getAllTracks() {
      return Object.values(MUSIC_TRACKS);
    }
  };

  if (typeof window !== 'undefined') {
    window.MusicData = MusicData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicData;
  }
})();
