// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DIALOGUE & CULTURAL FLAVOR
// Authentic Madras Tamil / Tanglish banter, Tea Stall conversations & Clue Notes
// ============================================================================

window.DIALOGUE_DATA = {
  tea_kadai: {
    npcName: "Murugan Annan (முருகன் அண்ணன்)",
    role: "Tea Master & Local Informant",
    avatar: "👨🏽‍🍳",
    greeting: "Thambi, oru hot tea kudi, then pesalam! Sudden downpour-la nananjiteenga pola? First-u indha hot cutting chai-ah kudinga! (தம்பி, ஒரு ஹாட் டீ குடி, தென் பேசலாம்!)",
    options: [
      {
        id: "veshti_buy",
        label: "🥻 Buy / Trade: Traditional Cotton Veshti (₹50) (+10 Heat Res)",
        cost: 50,
        response: "Aaha! Pure handloom cotton veshti thambi! Perfect for hot coastal Chennai weather.",
        action: "buy_veshti"
      },
      {
        id: "tea",
        label: "☕ Order Hot Cutting Chai (₹12) (+35 Thirst, +25 Energy, +15 Warmth)",
        cost: 12,
        response: "Indhanga thala! Strong-ah cardamom pottu adicha one-meter ginger tea! Sound ketrukume 'Dhabba-dhabba' nu! Super energy boost!",
        effect: { thirst: 35, energy: 25, temp: 15, hunger: 5 }
      },
      {
        id: "vadai",
        label: "🍩 Buy Crispy Medu Vadai (₹15) (+40 Hunger)",
        cost: 15,
        response: "Ipothaan satti-la irundhu eduthen! Hot-ah chutney thottu saapudunga. Long walk porean-nu sonneenga, pasikkum!",
        effect: { hunger: 40, energy: 10 }
      },
      {
        id: "sukku_kaapi",
        label: "☕ Brewed Sukku Kaapi (₹15) (+30 Thirst, +40 Warmth)",
        cost: 15,
        response: "Dry ginger and coriander seed decoction! Cold rain-la nananjavangalukku idhudhaan best medicine. Instant warmth!",
        effect: { thirst: 30, temp: 25, energy: 20 }
      },
      {
        id: "parotta",
        label: "🥘 Hot Virudhunagar Parotta & Salna (₹30) (+65 Hunger)",
        cost: 30,
        response: "Flaky layered hot parotta with piping spicy chalna! Semma spicy boost for high stamina!",
        effect: { hunger: 65, energy: 30 }
      },
      {
        id: "enfield_intel",
        label: "🏍️ 'Did you see an old Royal Enfield bullet speeding past in the rain?'",
        response: "Aiyo thala! 15 minutes munnaadi oruthan vintage Bullet-la bayangarama speed-ah cross pannan! Helmet podala, leather jacket potrundhaan. Aavan bike silencer sound 'Dug-dug-dug' nu Pichavaram highway pakkam poga ketudhu! Red mud-la tyre mark apdiye iruku paarunga!"
      },
      {
        id: "directions",
        label: "🗺️ 'How do I reach the Pichavaram canals from here?'",
        response: "Simple thala! Namma shop-ku right side-la oru palmyra forest vara pogum. Anga Selvam oda Jallikattu bull nikudhu. Adha cross panni straight-ah pona, Chola boat jetty kedaikum. Rain adhigamaana canal water level yeridum, paathu ponga!"
      },
      {
        id: "farewell",
        label: "👋 'Nandri Annan! I must hit the trail.'",
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
        response: "Aaha! Namma auto stand pakkam thaan splasha water adichutu ponan thala! Bullet 350 standard, vintage cast-iron engine. High Court back gate vazhiya bypass highway thirumbinaan. Pichavaram mangroves pakkam hide aaga plan pola!"
      },
      {
        id: "advice",
        label: "🗺️ 'Any advice for surviving the red clay and delta trails?'",
        response: "Red soil-la nadandhaa tyre mark clear-ah theriyum sir. Aana rain start aana ellam wash out aayidum! Lantern light on pannikonga, Pichavaram boat jetty-la Chola mechanism irukum, adha align panna dhaan Western Ghats vazhi open aagum!"
      }
    ]
  },

  farmer_selvam: {
    npcName: "Murugan / Farmer Selvam (விவசாயி செல்வம்)",
    role: "Villupuram Farmer & Bull Breeder",
    avatar: "👳🏽‍♂️",
    greeting: "Veyil romba adikkuthu, paathu nadanthu po! (வெயில் ரொம்ப அடிக்குது, பாத்து நடந்து போ!) Aiyya saamy, en kombu kaalai-ah paatheengala?",
    options: [
      {
        id: "bull_spotted",
        label: "🐂 'I saw a majestic bull resting near the palmyra grove!'",
        response: "Appadiya! Nandri saamy! Adhu Kangayam breed, bayangara veera maadu. Camera-la photo eduthu kaatunga, namburen!",
        requiresPhoto: 'jallikattu_bull'
      },
      {
        id: "comfort",
        label: "🌾 'Don't worry Selvam, I am mapping the plains with my explorer camera.'",
        response: "Romba nandri aiyya. Neenga High Court archivist thaaney? Andha Enfield kaaran unga bag-ah thookitu odunadha paathen. Avan pocket-la irundhu oru copper seal keela vizhundhuchu, indhanga eduthukonga! (Handed: Ancient Chola Sluice Seal)"
      }
    ]
  },

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
        response: "Indhanga thambi! Genuine Nilgiri mountain wool. Freezing fog and frost will not penetrate your skin!",
        action: "buy_woolen"
      },
      {
        id: "cargo_buy",
        label: "👖 Buy / Trade: Explorer Cargo Pants & Jacket (₹150) (+15 Cold Res)",
        cost: 150,
        response: "Durable reinforced field wear! Perfect for rough muddy trails.",
        action: "buy_cargo"
      },
      {
        id: "mist_lore",
        label: "🏔️ 'How do I survive the freezing mountain fog and find the Eco-Sanctuary?'",
        response: "Follow the ancient stone cairns past the Toda buffalo mund. Stay warm near the stone factory fireplace, and wear your woolen gear!"
      }
    ]
  },

  mentor_journal_prologue: {
    title: "Mentor Dr. Ramanathan's Inherited Field Journal",
    date: "October 14, 1924 / Transcribed Chennai",
    text: `To my dearest student,\n\nIf you are reading this outside the Madras High Court, the syndicate has tracked us down. The red-brick foundations of George Town sit atop an underground aqueduct network connecting the Cooum to the wetlands.\n\nBeneath the Western Ghats lies 'Pasumai Thadam'—an ancient subterranean eco-sanctuary engineered during the reign of Rajendra Chola I. It holds living seeds of botanical marvels thought extinct.\n\nDo not let the syndicate seize the master blueprint. Use your camera, document the landmarks, decode the Chola waterwheels, and follow the footprints through the wilderness.\n\nBeware the rider in the shadows.\n— Dr. R.`
  },

  clues: [
    {
      id: "clue_enfield_tread",
      title: "Royal Enfield 350 Rear Tyre Skid",
      biome: "Chennai Plains",
      photoId: "enfield_tracks_site",
      type: "physical_evidence",
      lore: "Distinct chevron tread pattern exclusive to 1960s Madras Motors Enfield. Heading southeast towards Pichavaram delta.",
      pinned: false
    },
    {
      id: "clue_torn_blueprint",
      title: "Torn Chola Hydro-Sanctuary Blueprint",
      biome: "Madras High Court",
      photoId: "high_court_gates",
      type: "document",
      lore: "The recovered top half of mentor's blueprint. Illustrates a dual lotus gear mechanism that controls tidal gates.",
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
      id: "clue_eco_portal",
      title: "Nilgiri Eco-Sanctuary Subterranean Seal",
      biome: "Western Ghats",
      photoId: "eco_sanctuary_portal",
      type: "final_portal",
      lore: "The threshold of the untouched ancient Tamil underground biosphere.",
      pinned: false
    }
  ]
};
