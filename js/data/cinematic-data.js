/**
 * The Whispering Wilds (Kaattu Vazhi) - Cinematic Data & Presets
 * Standard camera shot types, transitions, chapter title configurations,
 * and emotional mood lighting adjustments.
 */

window.CINEMATIC_DATA = {
  shotTypes: {
    WIDE: {
      distance: 28,
      height: 14,
      pitch: -0.32,
      fov: 65,
      transitionDuration: 1.2
    },
    MEDIUM: {
      distance: 12,
      height: 4.5,
      pitch: -0.15,
      fov: 55,
      transitionDuration: 0.9
    },
    CLOSE: {
      distance: 4.5,
      height: 2.1,
      pitch: -0.05,
      fov: 42,
      transitionDuration: 0.75
    },
    OVER_SHOULDER: {
      distance: 3.2,
      height: 1.8,
      lateralOffset: 0.85,
      pitch: -0.08,
      fov: 48,
      transitionDuration: 0.8
    },
    TWO_SHOT: {
      distance: 8.5,
      height: 2.8,
      pitch: -0.12,
      fov: 52,
      transitionDuration: 1.0
    },
    LOW_ANGLE: {
      distance: 7.0,
      height: 0.6,
      pitch: 0.35,
      fov: 60,
      transitionDuration: 1.1
    },
    HIGH_ANGLE: {
      distance: 16.0,
      height: 18.0,
      pitch: -0.75,
      fov: 58,
      transitionDuration: 1.2
    },
    FOLLOW: {
      distance: 10.0,
      height: 3.5,
      pitch: -0.18,
      fov: 55,
      smoothFollow: true
    },
    OBJECT_FOCUS: {
      distance: 2.5,
      height: 1.2,
      pitch: -0.25,
      fov: 38,
      transitionDuration: 0.7
    },
    LANDSCAPE: {
      distance: 55.0,
      height: 32.0,
      pitch: -0.45,
      fov: 70,
      transitionDuration: 2.0
    }
  },

  chapterTitles: {
    CHAPTER_1: {
      number: "CHAPTER I",
      tamilNumber: "அத்தியாயம் ஒன்று",
      title: "THE MISSING TRAIL",
      tamilTitle: "மறைந்த தடம்",
      region: "George Town, Madras"
    },
    CHAPTER_2: {
      number: "CHAPTER II",
      tamilNumber: "அத்தியாயம் இரண்டு",
      title: "WATER BENEATH THE ROOTS",
      tamilTitle: "வேரடி நீர்",
      region: "Cauvery Delta"
    },
    CHAPTER_3: {
      number: "CHAPTER III",
      tamilNumber: "அத்தியாயம் மூன்று",
      title: "THE MECHANISM IN THE STONE",
      tamilTitle: "கல்லில் சுழன்ற பொறி",
      region: "Grand Anicut Sluice"
    },
    CHAPTER_4: {
      number: "CHAPTER IV",
      tamilNumber: "அத்தியாயம் நான்கு",
      title: "CANOPY OF TIDES",
      tamilTitle: "அலைமுகக் காடு",
      region: "Pichavaram Mangroves"
    },
    CHAPTER_5: {
      number: "CHAPTER V",
      tamilNumber: "அத்தியாயம் ஐந்து",
      title: "HOUSE OF EMPTY ROOMS",
      tamilTitle: "வெற்று மாளிகையின் நிழல்",
      region: "Chettinad Heritage"
    },
    CHAPTER_6: {
      number: "CHAPTER VI",
      tamilNumber: "அத்தியாயம் ஆறு",
      title: "THE ARTISAN'S MARK",
      tamilTitle: "சிற்பியின் முத்திரை",
      region: "Thanjavur Royal Enclave"
    },
    CHAPTER_7: {
      number: "CHAPTER VII",
      tamilNumber: "அத்தியாயம் ஏழு",
      title: "ABOVE THE MIST",
      tamilTitle: "பனிக்கு மேல்",
      region: "Nilgiri Heights"
    },
    CHAPTER_8: {
      number: "CHAPTER VIII",
      tamilNumber: "அத்தியாயம் எட்டு",
      title: "THE SANCTUARY",
      tamilTitle: "பசுமைத் தடம்",
      region: "Pasumai Thadam Botanical Reserve"
    }
  }
};
