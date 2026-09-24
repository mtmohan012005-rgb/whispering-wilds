/**
 * The Whispering Wilds (Kaattu Vazhi) - Story Scene Data
 * Authoritative data-driven definitions for story scenes, cutscenes,
 * environmental discoveries, and investigative dialogues.
 */

window.STORY_SCENE_DATA = [
  // 1. Inciting Incident / George Town Arrival
  {
    id: "scene_george_town_arrival",
    type: "LOCATION_INTRO",
    title: "Arrival at George Town",
    tamilTitle: "ஜார்ஜ் டவுன் வருகை",
    region: "GEORGE_TOWN",
    duration: 10.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "LANDSCAPE", target: { x: 220, y: 15, z: 630 } },
      { time: 4.5, shot: "WIDE", target: "player" },
      { time: 8.0, shot: "MEDIUM", target: "player" }
    ],
    dialogueSequence: [
      {
        speaker: "Arun (Explorer)",
        tamilText: "மெட்ராஸ் உயர்நீதிமன்றத்திலிருந்து காணாமல் போன ஆவணங்கள்... தடம் இங்கிருந்துதான் தொடங்குகிறது.",
        englishText: "The missing high court manuscripts... the trail begins right here in Madras.",
        voiceTamil: "voice_arun_intro_ta",
        voiceEnglish: "voice_arun_intro_en",
        duration: 5.0,
        facialExpression: "FOCUSED",
        animation: "talking"
      }
    ],
    journalEntry: {
      id: "journal_george_town_arrival",
      title: "George Town Arrival",
      tamilTitle: "ஜார்ஜ் டவுன் வருகை",
      content: "Arrived near the historic High Court gates. The parchment fragment points southward along the Coromandel coast."
    },
    unlocks: {
      storyFlags: ["arrived_george_town"],
      regions: ["george_town"]
    }
  },

  // 2. Murugan Annan First Meeting
  {
    id: "scene_murugan_first_meeting",
    type: "DIALOGUE_SCENE",
    title: "Tea Stall Clues",
    tamilTitle: "டீக்கடைத் தடயம்",
    region: "GEORGE_TOWN",
    participants: ["player", "murugan"],
    duration: 14.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "TWO_SHOT", target: "murugan" },
      { time: 4.0, shot: "OVER_SHOULDER", target: "murugan" },
      { time: 8.0, shot: "CLOSE", target: "murugan" },
      { time: 11.0, shot: "MEDIUM", target: "player" }
    ],
    dialogueSequence: [
      {
        speaker: "Murugan Annan",
        tamilText: "தம்பி, சூடா கட்டிங் டீ குடிச்சிட்டு பேசு. அந்த பிரிட்டிஷ் காலத்து மார்க் போட்ட புல்லட் வண்டி நேத்து ராத்திரி டெல்டா பக்கம் போச்சு.",
        englishText: "Have some hot cutting chai first, brother. That vintage Royal Enfield with the surveyor's mark sped south toward the Delta last night.",
        facialExpression: "CONCERNED",
        animation: "talking",
        duration: 6.0
      },
      {
        speaker: "Arun",
        tamilText: "டெல்டா பக்கமா? அப்போ காவேரி படுகையில் பழைய சோழர் மதகு பக்கம் போயிருக்கணும்!",
        englishText: "Towards the Delta? They must be heading towards the ancient Chola sluice gates!",
        facialExpression: "ALERT",
        animation: "thinking",
        duration: 5.0
      }
    ],
    choices: [
      { text: "Ask about the rider's appearance", tamilText: "ஓட்டுநரின் அடையாளத்தைக் கேள்", action: "ask_rider" },
      { text: "Head straight for Cauvery Delta", tamilText: "நேராக டெல்டா நோக்கிப் புறப்படு", action: "proceed_delta" }
    ],
    journalEntry: {
      id: "journal_murugan_lead",
      title: "Murugan's Lead",
      tamilTitle: "முருகன் அண்ணன் சொன்ன வழி",
      content: "Murugan Annan confirmed seeing the suspect's Royal Enfield headed south towards the Cauvery Delta."
    },
    unlocks: {
      storyFlags: ["met_murugan", "learned_enfield_trail"],
      quests: ["main_pichavaram_water"]
    }
  },

  // 3. Selvam's Missing Bull Clue
  {
    id: "scene_selvam_missing_bull",
    type: "INVESTIGATION_SCENE",
    title: "The Vanished Kangayam Bull",
    tamilTitle: "காணாமல் போன காங்கேயம் காளை",
    region: "CAUVERY_DELTA",
    participants: ["player", "selvam"],
    duration: 12.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "MEDIUM", target: "selvam" },
      { time: 4.0, shot: "OBJECT_FOCUS", target: { x: 340, y: 8, z: 520 } },
      { time: 8.0, shot: "TWO_SHOT", target: "selvam" }
    ],
    dialogueSequence: [
      {
        speaker: "Farmer Selvam",
        tamilText: "என் காங்கேயம் காளை சும்மா போகல தம்பி. அந்த ஆத்து மதகு சத்தம் கேட்டதும் மிரண்டு போயிருக்கு!",
        englishText: "My Kangayam bull didn't just wander off. It bolted right when the stone waterwheel began grinding at night!",
        facialExpression: "CONCERNED",
        animation: "talking",
        duration: 6.0
      }
    ],
    journalEntry: {
      id: "journal_selvam_bull",
      title: "The Waterwheel Echo",
      tamilTitle: "மதகின் ஒலி",
      content: "Farmer Selvam noted that ancient stone gears were activated near the river ford."
    },
    unlocks: {
      storyFlags: ["heard_selvam_story", "waterwheel_investigation_unlocked"]
    }
  },

  // 4. Chola Waterwheel Puzzle Result
  {
    id: "scene_waterwheel_solved",
    type: "PUZZLE_RESULT",
    title: "Chola Sluice Gate Opens",
    tamilTitle: "சோழர் மதகு திறப்பு",
    region: "CAUVERY_DELTA",
    duration: 9.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "MEDIUM", target: "waterwheel" },
      { time: 3.0, shot: "LOW_ANGLE", target: "sluice_gate" },
      { time: 6.0, shot: "WIDE", target: "sunken_path" }
    ],
    dialogueSequence: [
      {
        speaker: "Arun",
        tamilText: "நீர் வழி பாதை திறந்துவிட்டது! கல் மதகுக்கு அடியில் செப்பேடு பெட்டகம் தெரிகிறது.",
        englishText: "The subterranean channel is open! An ancient copper-plate reliquary is revealed beneath the gate.",
        facialExpression: "SURPRISED",
        animation: "pointing",
        duration: 5.0
      }
    ],
    journalEntry: {
      id: "journal_waterwheel_drain",
      title: "Chola Reliquary Revealed",
      tamilTitle: "சோழர் செப்பேடு கண்டறியப்பட்டது",
      content: "Aligning the three radial stone sluices drained the basin, revealing the submerged path toward Pichavaram."
    },
    unlocks: {
      storyFlags: ["solved_waterwheel", "sunken_route_open"],
      regions: ["pichavaram"]
    }
  },

  // 5. Pichavaram Mangrove Canal Entrance
  {
    id: "scene_pichavaram_intro",
    type: "REGION_UNLOCK",
    title: "Pichavaram Mangrove Maze",
    tamilTitle: "பிச்சாவரம் அலையாத்திக் காடு",
    region: "PICHAVARAM",
    duration: 8.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "LANDSCAPE", target: { x: 500, y: 12, z: 400 } },
      { time: 4.0, shot: "WIDE", target: "player" }
    ],
    dialogueSequence: [
      {
        speaker: "Arun",
        tamilText: "ஆயிரக்கணக்கான கால்வாய்கள்... இங்கே படகு இல்லாமல் போக முடியாது.",
        englishText: "A labyrinth of tidal waterways... navigation requires a traditional wooden rowboat.",
        facialExpression: "CURIOUS",
        animation: "looking_around",
        duration: 4.5
      }
    ],
    unlocks: {
      storyFlags: ["entered_pichavaram"]
    }
  },

  // 6. Nilgiri Tahr Wildlife Discovery
  {
    id: "scene_nilgiris_tahr_discovery",
    type: "WILDLIFE_DISCOVERY",
    title: "The Mountain Sentinel",
    tamilTitle: "வரையாடு தரிசனம்",
    region: "WESTERN_GHATS",
    duration: 8.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "OBJECT_FOCUS", target: "nilgiri_tahr" },
      { time: 4.0, shot: "MEDIUM", target: "player" }
    ],
    dialogueSequence: [
      {
        speaker: "Arun",
        tamilText: "வரையாடு! செங்குத்துப் பாறைகளில் அநாயாசமாக நடக்கிறது. தமிழ்நாடு மாநில விலங்கு.",
        englishText: "The Nilgiri Tahr! Moving effortlessly across steep cliffs. The state animal of Tamil Nadu.",
        facialExpression: "HAPPY",
        animation: "listening",
        duration: 5.0
      }
    ],
    journalEntry: {
      id: "journal_tahr_discovery",
      title: "Nilgiri Tahr Observed",
      tamilTitle: "வரையாடு பதிவு",
      content: "Documented the endangered Nilgiri Tahr grazing near the mist-covered ridge."
    },
    unlocks: {
      storyFlags: ["observed_nilgiri_tahr"]
    }
  },

  // 7. Botanical Sanctuary Resolution & Ending
  {
    id: "scene_sanctuary_ending",
    type: "ENDING_SCENE",
    title: "The Living Heritage of Tamil Nadu",
    tamilTitle: "காட்டு வழி - நிறைவு",
    region: "PASUMAI_THADAM",
    duration: 15.0,
    oneShot: true,
    cameraSequence: [
      { time: 0.0, shot: "LANDSCAPE", target: { x: 0, y: 35, z: 0 } },
      { time: 5.0, shot: "WIDE", target: "player" },
      { time: 10.0, shot: "MEDIUM", target: "player" }
    ],
    dialogueSequence: [
      {
        speaker: "Arun",
        tamilText: "பழங்காலச் சோழர் செப்பேடுகளும், இந்த புனிதக் காடுகளும் காப்பாற்றப்பட்டுவிட்டன. இது முடிவல்ல, நமது மண்ணைப் போற்றும் தொடக்கம்.",
        englishText: "The ancient Chola records and sacred groves are preserved. This is not the end, but the beginning of honoring our living earth.",
        facialExpression: "HAPPY",
        animation: "talking",
        duration: 7.0
      }
    ],
    journalEntry: {
      id: "journal_sanctuary_ending",
      title: "Expedition Completed",
      tamilTitle: "பயணம் நிறைவுற்றது",
      content: "All missing manuscripts recovered and returned. The ecological corridor of the Western Ghats stands protected."
    },
    unlocks: {
      storyFlags: ["expedition_complete", "game_ending_reached"]
    }
  }
];
