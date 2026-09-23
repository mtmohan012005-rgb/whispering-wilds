/**
 * The Whispering Wilds (Kaattu Vazhi) - Narrative Dialogue System
 * Authentic bilingual Tamil & English dialogue trees for all 8 chapters,
 * NPC quest hooks, investigation clues, and cultural knowledge.
 */

window.DIALOGUE_DATA = {
  // =========================================================================
  // CHAPTER 1: GEORGE TOWN / CHENNAI
  // =========================================================================
  tea_kadai: {
    npcName: "Murugan Annan (முருகன் அண்ணன்)",
    role: "Tea Master & Local Informant",
    avatar: "👨🏽‍🍳",
    greeting: "Thambi, oru hot tea kudi, then pesalam! Sudden downpour-la nananjiteenga pola? First-u indha hot cutting chai-ah kudinga! (தம்பி, ஒரு ஹாட் டீ குடி, தென் பேசலாம்!)",
    options: [
      {
        id: "enfield_intel",
        label: "🏍️ 'Did you see an old Royal Enfield bullet speeding past in the rain?'",
        tamilDialogue: "15 நிமிஷம் முன்னாடி ஒருத்தன் புல்லட்ல பயங்கர ஸ்பீடா போனான்! பைக் சத்தம் பிச்சாவரம் ஹைவே பக்கம் போச்சு!",
        englishSubtitle: "About 15 minutes ago, someone sped past on a vintage Bullet! The engine roared towards the Pichavaram highway!",
        response: "Aiyo thala! 15 minutes munnaadi oruthan vintage Bullet-la bayangarama speed-ah cross pannan! Helmet podala, leather jacket potrundhaan. Aavan bike silencer sound 'Dug-dug-dug' nu Pichavaram highway pakkam poga ketudhu! Red mud-la tyre mark apdiye iruku paarunga!"
      },
      {
        id: "tea",
        label: "☕ Order Hot Cutting Chai (₹12) (+35 Thirst, +25 Energy, +15 Warmth)",
        cost: 12,
        tamilDialogue: "இந்தாங்க தம்பி! ஏலக்காய் தட்டிப் போட்ட ஒரு மீட்டர் இஞ்சி டீ!",
        englishSubtitle: "Here you go! Fresh one-meter ginger and cardamom tea for instant energy!",
        response: "Indhanga thala! Strong-ah cardamom pottu adicha one-meter ginger tea! Sound ketrukume 'Dhabba-dhabba' nu! Super energy boost!",
        effect: { thirst: 35, energy: 25, temp: 15, hunger: 5 }
      },
      {
        id: "directions",
        label: "🗺️ 'How do I reach the Pichavaram canals from here?'",
        tamilDialogue: "நம்ம கடைக்கு வலது பக்கம் போனா விவசாயி செல்வம் தோட்டம் வரும். அத தாண்டி போனா போட் ஜெட்டி!",
        englishSubtitle: "Head right past our shop to Farmer Selvam's groves. Cross that to reach the mangrove boat jetty!",
        response: "Simple thala! Namma shop-ku right side-la oru palmyra forest vara pogum. Anga Selvam oda Jallikattu bull nikudhu. Adha cross panni straight-ah pona, Chola boat jetty kedaikum. Rain adhigamaana canal water level yeridum, paathu ponga!"
      },
      {
        id: "farewell",
        label: "👋 'Nandri Annan! I must hit the trail.'",
        tamilDialogue: "சரி தம்பி! கவனமா போங்க, காட்டு வழி இருட்டாயிடும்.",
        englishSubtitle: "Alright friend! Travel safely, the wilderness paths get dark quickly.",
        response: "Seri thala! Safe-ah ponga. Night aana lantern on pannikonga, Kaattu vazhi full-ah wild animals and sudden fog!"
      }
    ]
  },

  chennai_auto: {
    npcName: "Auto Driver Velu (ஆட்டோ வேலு)",
    role: "Madras Auto Veteran",
    avatar: "🛺",
    greeting: "Enna sir, George Town High Court-la irundhu vara pola iruku? Meter mela oru 20 rooba kudunga, city full-ah round adikalam! (என்ன சார், மீட்டர் மேல இருபது ரூபா போட்டுக் குடுங்க!)",
    options: [
      {
        id: "enfield_ask",
        label: "🏍️ 'Did you spot an old Royal Enfield rider speeding through the puddle?'",
        tamilDialogue: "ஆமா சார், நம்ம ஆட்டோ ஸ்டாண்ட் பக்கத்துல தண்ணி அடிச்சிட்டு போனான்! புல்லட் 350 பழைய மாடல்.",
        englishSubtitle: "Yes sir, he splashed right past our auto stand! Vintage cast-iron 350 engine heading for the bypass.",
        response: "Aaha! Namma auto stand pakkam thaan splash-ah water adichutu ponan thala! Bullet 350 standard, vintage cast-iron engine. High Court back gate vazhiya bypass highway thirumbinaan. Pichavaram mangroves pakkam hide aaga plan pola!"
      },
      {
        id: "advice",
        label: "🗺️ 'Any advice for surviving the red clay and delta trails?'",
        tamilDialogue: "செம்மண் நிலத்துல டயர் தடம் தெரியும். மழை வந்தா அழிஞ்சிடும், வேகமா போங்க!",
        englishSubtitle: "The red clay holds tyre tracks clearly, but heavy rain washes them away. Move quickly!",
        response: "Red soil-la nadandhaa tyre mark clear-ah theriyum sir. Aana rain start aana ellam wash out aayidum! Lantern light on pannikonga, Pichavaram boat jetty-la Chola mechanism irukum, adha align panna dhaan Western Ghats vazhi open aagum!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 2: VILLUPURAM / FARMER STORY
  // =========================================================================
  farmer_selvam: {
    npcName: "Murugan / Farmer Selvam (விவசாயி செல்வம்)",
    role: "Villupuram Farmer & Bull Breeder",
    avatar: "👳🏽‍♂️",
    greeting: "Veyil romba adikkuthu, paathu nadanthu po! (வெயில் ரொம்ப அடிக்குது, பாத்து நடந்து போ!) Aiyya saamy, en kombu kaalai-ah paatheengala?",
    options: [
      {
        id: "report_bull_photo",
        label: "📸 'Here is the photo of your Kangayam bull resting safely by the palmyra grove!'",
        tamilDialogue: "ஐயா சாமி! என் வீரக் காளையை கண்டுபிடிச்சுட்டீங்களா! ரொம்ப நன்றிங்க ஐயா!",
        englishSubtitle: "Ayya! You found my champion bull! Thank you from the bottom of my heart!",
        response: "Aaha! En Kangayam kaalai! Romba nandri saamy! Neenga High Court archivist thaaney? Andha Enfield kaaran unga bag-ah thookitu odunadha paathen. Avan pocket-la irundhu oru copper seal keela vizhundhuchu, indhanga eduthukonga! (Handed: Ancient Chola Sluice Seal & ₹100 Reward)",
        action: "complete_report_selvam",
        requiresPhoto: "jallikattu_bull"
      },
      {
        id: "bull_spotted",
        label: "🐂 'I am searching for your bull along the red soil tracks.'",
        tamilDialogue: "செம்மண் பாதையில காளை குளம்பு தடம் இருக்கும். பார்த்து போங்க தம்பி.",
        englishSubtitle: "You will find hoof tracks along the red clay path. Please walk carefully.",
        response: "Appadiya! Nandri saamy! Adhu Kangayam breed, bayangara veera maadu. Camera-la photo eduthu kaatunga, namburen!"
      },
      {
        id: "chola_lore",
        label: "📜 'Do you know anything about the ancient water canals nearby?'",
        tamilDialogue: "சோழர் காலத்துல கட்டின மதகு வாய்க்கால் இங்க இருக்குது. பிச்சாவரம் வழியா கடலுக்கு போகுது.",
        englishSubtitle: "An ancient Chola sluice canal runs through here, carrying floodwaters into the Pichavaram mangroves.",
        response: "Enga thaatha solvaaru, indha semman bhoomikku keezha Chola peruvazhi aqueduct irukku nu. Pichavaram boatman Kathir-kitta keta adhu pathi theriyum!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 3: PICHAVARAM MANGROVES
  // =========================================================================
  boatman_kathir: {
    npcName: "Boatman Kathir (படகோட்டி கதிர்)",
    role: "Pichavaram Mangrove Navigator",
    avatar: "🛶",
    greeting: "Vanakkam thala! (வணக்கம் தலை!) Pichavaram mangrove canals are swollen with monsoon water. Only Chola tidal waterwheels can drain the passage.",
    options: [
      {
        id: "boat_passage",
        label: "🛶 'I need passage through the mangrove root tunnels.'",
        tamilDialogue: "மழை நீர் அதிகமா இருக்குது. கல்லு நீர் சக்கரத்தை திருப்பினா தான் கால்வாய் வழியா போக முடியும்.",
        englishSubtitle: "Water levels are too high. Only rotating the granite Chola waterwheel will open the sunken route.",
        response: "Indha mangrove roots romba tight-ah irukkum. Ancient waterwheel dial irukku anga. Lotus rune 90-degree laiyum, Tiger rune 270-degree laiyum align pannaa sluice gate open aagum!"
      },
      {
        id: "courier_spotted",
        label: "🏍️ 'Did the Enfield rider pass through these waterways?'",
        tamilDialogue: "அவன் பைக்கை ரோட்டோரமா நிறுத்திட்டு, செட்டிநாடு பக்கம் படகுல தப்பிச்சான்!",
        englishSubtitle: "He ditched his motorcycle near the road and escaped toward Chettinad on a country boat!",
        response: "Aama thala! Avan bike-ah road mud-la vittutu, oru country boat-la Chettinad heritage belt pakkam odinaan. Avan pocket-la irundhu oru key vizhundhadha kanden!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 4: CHETTINAD
  // =========================================================================
  caretaker_meenakshi: {
    npcName: "Meenakshi Aachi (மீனாட்சி ஆச்சி)",
    role: "Chettinad Heritage Caretaker",
    avatar: "👵🏽",
    greeting: "Vanga thambi! (வாங்க தம்பி!) This mansion has stood for over a century. Burma teak pillars and secret floor vaults hold old shipping trade letters.",
    options: [
      {
        id: "mansion_vault",
        label: "🗝️ 'Where is the secret floor vault (Pattalayam) located?'",
        tamilDialogue: "நடு முற்றம் திண்ணைக்கு கீழ ஒரு ரகசிய இரும்பு பெட்டி இருக்கு. பித்தளை சாவிய வச்சு திறங்க.",
        englishSubtitle: "Beneath the central courtyard tiles lies a concealed vault. Use the brass key to unseal it.",
        response: "Aathangudi tiles keezha oru brass floor ring irukku thambi. Andha vault-la 1894 Chola water survey letters irukku. Photograph eduthu save pannikonga!"
      },
      {
        id: "artisan_clue",
        label: "🏛️ 'Where were these ancient metal seals forged?'",
        tamilDialogue: "தஞ்சாவூர் சுவாமிமலையில் தான் சோழர் காலத்து வெண்கல சிற்பிகள் இதை செஞ்சாங்க.",
        englishSubtitle: "In Swamimalai near Thanjavur, where master bronze founders have cast royal seals for a thousand years.",
        response: "Indha copper seal Swamimalai bronze foundry-la panna maadhiri irukku. Thanjavur sculptor Sembian-ah paatha full mystery solve aagum!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 5: THANJAVUR
  // =========================================================================
  artisan_sembian: {
    npcName: "Master Sembian (சிற்பி செம்பியன்)",
    role: "Swamimalai Bronze Foundry Master",
    avatar: "⚒️",
    greeting: "Kadavul arul! (கடவுள் அருள்!) Lost-wax bronze casting requires patience and precision. Show me the seal you recovered from the delta.",
    options: [
      {
        id: "analyze_seal",
        label: "🔍 'Examine this copper seal from the courier.'",
        tamilDialogue: "இது சோழர் காலத்து தாமரை கியர்! மாமல்லபுரத்து பல்லவர் கல் முத்திரையோட சேர்ந்தா தான் திறக்கும்.",
        englishSubtitle: "This is a royal Chola Lotus gear! It must unite with the Pallava coastal keystone to open the mountain portal.",
        response: "Aaha! Genuine 11th century Rajendra Chola metallurgical hallmark! The teeth of this gear match the mountain vault. Take this recast bronze Lotus gear!"
      },
      {
        id: "lost_wax_lore",
        label: "🔥 'Tell me about the lost-wax casting technique.'",
        tamilDialogue: "தேனீ மெழுகு மற்றும் காவிரியின் களிமண் கொண்டு உருவாகும் கலை இது.",
        englishSubtitle: "An ancient craft of pure beeswax and fine Cauvery river clay, untouched by time.",
        response: "Beeswax model panni, Cauvery river silt clay poosi, molten bronze oothuna apdiye perfect gear kedaikkum. Nilgiris sanctuary lock-ku idhu essential!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 6: MAMALLAPURAM
  // =========================================================================
  sculptor_govindan: {
    npcName: "Sculptor Govindan (சிற்பி கோவிந்தன்)",
    role: "Mamallapuram Granite Carver",
    avatar: "🗿",
    greeting: "Alai satham ketkudha? (அலை சத்தம் கேட்குதா?) The wind and sea spray have shaped these granite monoliths for centuries.",
    options: [
      {
        id: "stone_keystone",
        label: "🗿 'Where can I find the sea-carved keystone depicted in the reliefs?'",
        tamilDialogue: "கடற்கரை குகை பாறைகளுக்கு நடுவே பல்லவர் காலத்து கல் சாவி பதிஞ்சிருக்கு.",
        englishSubtitle: "Nestled between the coastal boulder caves lies the ancient Pallava granite keystone.",
        response: "Andha granite wave relief paarunga thambi. Mountain mists-la irundhu ocean varaikkum water circulation-ah depict pannirpaanga. The keystone is hidden inside the coastal boulder shrine!"
      }
    ]
  },

  // =========================================================================
  // CHAPTER 7: NILGIRIS
  // =========================================================================
  hill_guide_karthik: {
    npcName: "Karthik (மலையேற்ற வழிகாட்டி)",
    role: "Nilgiri Mountain Guide",
    avatar: "🧗🏽‍♂️",
    greeting: "Ooty malai mists la thappi porathu kashtam thambi! (ஊட்டி மலை மூடுபனில தப்பிப் போறது கஷ்டம் தம்பி!) Need heavy woolen thermal gear before heading up into the shola ridges!",
    options: [
      {
        id: "woolen_buy",
        label: "🧥 Buy / Trade: Nilgiri Woolen Thermal Suit (₹350) (+50 Cold Res)",
        cost: 350,
        tamilDialogue: "இந்தாங்க தம்பி! ஒரிஜினல் நீலகிரி ஆட்டு கம்பளி. பனி உங்களை ஒன்னும் பண்ணாது!",
        englishSubtitle: "Here is authentic Nilgiri sheep wool attire. Freezing frost will not touch your skin!",
        response: "Indhanga thambi! Genuine Nilgiri mountain wool. Freezing fog and frost will not penetrate your skin!",
        action: "buy_woolen"
      },
      {
        id: "mist_lore",
        label: "🏔️ 'How do I survive the freezing mountain fog and find the Eco-Sanctuary?'",
        tamilDialogue: "தோடர் எருமை மந்தை தாண்டி, பாறை முகட்டுல நில்லுங்க. வரையாடு வழிகாட்டும்!",
        englishSubtitle: "Pass the sacred Toda mund and watch the cliff ridge. The Nilgiri Tahr will guide your way!",
        response: "Follow the ancient stone cairns past the Toda buffalo mund. Stay warm near the stone factory fireplace, wear your woolen gear, and photograph the Nilgiri Tahr!"
      }
    ]
  },

  mentor_journal_prologue: {
    title: "Mentor Dr. Ramanathan's Inherited Field Journal",
    date: "October 14, 1924 / Transcribed Chennai",
    text: `To my dearest student,\n\nIf you are reading this outside the Madras High Court, the syndicate has tracked us down. The red-brick foundations of George Town sit atop an underground aqueduct network connecting the Cooum to the wetlands.\n\nBeneath the Western Ghats lies 'Pasumai Thadam'—an ancient subterranean eco-sanctuary engineered during the reign of Rajendra Chola I. It holds living seeds of botanical marvels thought extinct.\n\nDo not let the syndicate seize the master blueprint. Use your camera, document the landmarks, decode the Chola waterwheels, and follow the footprints through the wilderness.\n\nBeware the rider in the shadows.\n— Dr. R.`
  },

  // Investigation Clues list
  clues: [
    {
      id: "clue_torn_blueprint",
      title: "Torn Chola Hydro-Sanctuary Blueprint",
      biome: "Madras High Court",
      photoId: "high_court_gates",
      type: "document",
      lore: "The recovered top half of mentor's blueprint. Illustrates a dual lotus gear mechanism that controls tidal gates.",
      pinned: true
    },
    {
      id: "clue_enfield_tread",
      title: "Royal Enfield 350 Rear Tyre Skid",
      biome: "Chennai Plains",
      photoId: "enfield_tracks_site",
      type: "physical_evidence",
      lore: "Distinct chevron tread pattern exclusive to 1960s Madras Motors Enfield. Heading southeast towards Pichavaram delta.",
      pinned: true
    },
    {
      id: "clue_chola_seal",
      title: "Ancient Chola Sluice Seal",
      biome: "Villupuram Farmlands",
      photoId: "cattle_gate",
      type: "physical_evidence",
      lore: "Cast copper seal dropped by the rider near Selvam's bull pen. Inscribed with Chola tiger emblem.",
      pinned: false
    },
    {
      id: "clue_waterwheel_glyph",
      title: "Chola Lotus-Tiger Granite Dial",
      biome: "Pichavaram Delta",
      photoId: "chola_waterwheel",
      type: "puzzle_key",
      lore: "Aligning the tiger crest with the sun rune drains the mountain passage.",
      pinned: false
    },
    {
      id: "clue_chettinad_letter",
      title: "1894 Chettiar Trade Dispatch",
      biome: "Chettinad Heritage",
      photoId: "hidden_iron_safe",
      type: "document",
      lore: "Archived diplomatic records detailing the subterranean water chambers of the Western Ghats.",
      pinned: false
    },
    {
      id: "clue_artisan_stamp",
      title: "Swamimalai Royal Bronze Hallmark",
      biome: "Thanjavur Delta",
      photoId: "bronze_casting_forge",
      type: "physical_evidence",
      lore: "Royal foundry hallmark indicating the recast bronze gear needed for the mountain sanctuary gates.",
      pinned: false
    },
    {
      id: "clue_eco_portal",
      title: "Nilgiri Eco-Sanctuary Subterranean Seal",
      biome: "Western Ghats",
      photoId: "eco_sanctuary_portal",
      type: "final_portal",
      lore: "The threshold of the untouched ancient Tamil underground biosphere of Pasumai Thadam.",
      pinned: false
    }
  ]
};

// Authoritative Farmer Selvam Dialogue Structure for Quest Progression
window.FARMER_SELVAM_DIALOGUE = {
  ...window.DIALOGUE_DATA.farmer_selvam,
  find_bull: {
    greeting: "Ayya! Have you seen my Kangayam bull?",
    options: [
      { id: "complete_report_selvam", action: "complete_report_selvam", next: "complete", label: "📸 Report Bull Found" }
    ]
  }
};

// Reusable Delta Waterwheel & Sluice Mechanism Global State
window.deltaWaterwheelPuzzleState = {
  waterwheelDial1: 0,
  waterwheelDial2: 0,
  sluiceGateA: false,
  sluiceGateB: false,
  deltaWaterLevel: 1.0,
  deltaPathRevealed: false
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DIALOGUE_DATA: window.DIALOGUE_DATA,
    FARMER_SELVAM_DIALOGUE: window.FARMER_SELVAM_DIALOGUE,
    deltaWaterwheelPuzzleState: window.deltaWaterwheelPuzzleState
  };
}
