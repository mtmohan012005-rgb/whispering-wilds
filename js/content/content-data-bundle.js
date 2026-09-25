// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT DATA BUNDLE
// Centralized pre-compiled content catalog guaranteeing offline & testing stability.
// Bundles authored quests, dialogues, NPCs, locations, events, wildlife,
// items, culture activities, shops, and achievements.
// ============================================================================

(function () {
  'use strict';

  const CONTENT_DATA_BUNDLE = {
    // -------------------------------------------------------------------------
    // 1. QUESTS
    // -------------------------------------------------------------------------
    quest: [
      {
        id: 'quest_cutting_chai_route',
        version: '1.0.0',
        title: 'The Cutting Chai Express',
        titleTa: 'கட்டிங் டீ விரைவுப் பாதை',
        description: 'Deliver steaming hot ginger tea from Murugan Annan to Dr. Selvam before it cools down.',
        descriptionTa: 'முருகன் அண்ணன் கடையில் இருந்து சூடான இஞ்சி டீயை ஆறிப்போவதற்குள் டாக்டர் செல்வத்திடம் கொண்டு போய் சேர்க்கவும்.',
        region: 'george_town',
        category: 'side',
        difficulty: 'easy',
        recommendedProgression: 1,
        giverNpcId: 'npc_murugan',
        isDefaultUnlocked: true,
        prerequisites: {
          requiredQuests: [],
          requiredRegion: 'george_town'
        },
        objectives: [
          {
            id: 'obj_talk_murugan',
            type: 'talk_npc',
            target: 'npc_murugan',
            descriptionEn: 'Speak with Murugan Annan at his tea stall',
            descriptionTa: 'டீக்கடையில் முருகன் அண்ணனுடன் பேசவும்'
          },
          {
            id: 'obj_collect_tea_carrier',
            type: 'collect_item',
            target: 'item_brass_tea_carrier',
            descriptionEn: 'Pick up the brass tea carrier with 5 hot glasses',
            descriptionTa: '5 சூடான கிளாஸ் கொண்ட பித்தளை டீ கேரியரை எடுக்கவும்'
          },
          {
            id: 'obj_deliver_to_selvam',
            type: 'deliver_item',
            target: 'item_brass_tea_carrier',
            recipientNpcId: 'npc_selvam',
            descriptionEn: 'Deliver the tea to Dr. Selvam at George Town Archives',
            descriptionTa: 'ஜார்ஜ் டவுன் காப்பகத்தில் உள்ள டாக்டர் செல்வத்திடம் டீயை வழங்கவும்'
          },
          {
            id: 'obj_return_to_murugan',
            type: 'return_to_npc',
            target: 'npc_murugan',
            descriptionEn: 'Return to Murugan Annan to collect your reward',
            descriptionTa: 'வெகுமதியைப் பெற மீண்டும் முருகன் அண்ணனிடம் செல்லவும்'
          }
        ],
        rewards: {
          xp: 120,
          coins: 35,
          items: ['item_murugan_special_chai_token'],
          reputation: { chennai: 10 }
        }
      },
      {
        id: 'quest_lost_chola_seal',
        version: '1.0.0',
        title: 'Shadows of the Tiger Seal',
        titleTa: 'புலி முத்திரையின் நிழல்கள்',
        description: 'Investigate the midnight theft of the 10th-century Chola royal bronze seal from the High Court vault.',
        descriptionTa: 'உயர்நீதிமன்றப் பாரம்பரிய பெட்டகத்திலிருந்து பத்தாம் நூற்றாண்டு சோழர் அரச வெண்கல முத்திரை களவு போனதை துப்பறியவும்.',
        region: 'george_town',
        category: 'main',
        difficulty: 'medium',
        recommendedProgression: 2,
        giverNpcId: 'npc_selvam',
        isDefaultUnlocked: false,
        prerequisites: {
          requiredQuests: ['quest_cutting_chai_route'],
          requiredRegion: 'george_town'
        },
        objectives: [
          {
            id: 'obj_reach_high_court',
            type: 'reach_location',
            target: 'loc_george_town_high_court',
            descriptionEn: 'Reach the High Court heritage compound',
            descriptionTa: 'உயர்நீதிமன்றப் பாரம்பரிய வளாகத்தை அடையவும்'
          },
          {
            id: 'obj_inspect_broken_lock',
            type: 'inspect_clue',
            target: 'clue_broken_brass_padlock',
            descriptionEn: 'Inspect the severed ancient brass padlock',
            descriptionTa: 'உடைக்கப்பட்ட பழங்கால பித்தளை பூட்டை ஆய்வு செய்யவும்'
          },
          {
            id: 'obj_talk_velu_auto',
            type: 'talk_npc',
            target: 'npc_velu',
            descriptionEn: 'Question Velu about the midnight getaway auto',
            descriptionTa: 'நள்ளிரவு தப்பிச் சென்ற ஆட்டோ பற்றி வேலுவிடம் விசாரிக்கவும்'
          },
          {
            id: 'obj_photograph_tyre_marks',
            type: 'photograph_subject',
            target: 'sub_auto_mud_tyre_tracks',
            descriptionEn: 'Photograph the distinct tyre track imprint in the mud',
            descriptionTa: 'சேற்றில் பதிந்த டயர் தடத்தை புகைப்பட ஆவணம் எடுக்கவும்'
          }
        ],
        rewards: {
          xp: 350,
          coins: 100,
          items: ['item_ancient_chola_coin'],
          reputation: { chennai: 25 }
        }
      }
    ],

    // -------------------------------------------------------------------------
    // 2. DIALOGUE
    // -------------------------------------------------------------------------
    dialogue: [
      {
        id: 'dialogue_murugan_intro',
        version: '1.0.0',
        speaker: 'npc_murugan',
        voiceId: 'audio.voice.murugan.intro_01',
        region: 'george_town',
        startNode: 'greeting',
        nodes: {
          greeting: {
            speaker: 'npc_murugan',
            textEn: 'Vanakkam, thambi! Welcome to George Town. Fresh ginger tea is brewing. What brings you here?',
            textTa: 'வணக்கம் தம்பி! ஜார்ஜ் டவுனுக்கு நல்வரவு. சுடச்சுட இஞ்சி டீ தயாராகுது. என்ன வேணும் தம்பி?',
            choices: [
              {
                id: 'c_tea',
                tone: 'friendly',
                textEn: 'A cutting chai, Anna.',
                textTa: 'ஒரு கட்டிங் டீ போடுங்க அண்ணா.',
                nextNode: 'serve_tea'
              },
              {
                id: 'c_heist',
                tone: 'investigative',
                textEn: 'Have you heard anything about the High Court heist?',
                textTa: 'உயர்நீதிமன்ற திருட்டு பத்தி ஏதாச்சும் கேள்விப்பட்டீங்களா?',
                nextNode: 'talk_heist'
              }
            ]
          },
          serve_tea: {
            speaker: 'npc_murugan',
            textEn: 'Here you go! Poured from a meter high. Enjoy!',
            textTa: 'இந்தாங்க! ஒரு மீட்டர் உயரத்துல ஆற்றிய டீ. குடிச்சு பாருங்க!',
            choices: [
              {
                id: 'c_done',
                tone: 'culturally_respectful',
                textEn: 'Nandri Anna! [Exit]',
                textTa: 'நன்றி அண்ணா! [விடைபெறு]',
                nextNode: 'exit'
              }
            ]
          },
          talk_heist: {
            speaker: 'npc_murugan',
            textEn: 'Velu saw a black auto speeding toward the harbour around 3 AM. Go talk to him near the stand.',
            textTa: 'அதிகாலை மூணு மணிக்கு ஒரு கருப்பு ஆட்டோ துறைமுகம் பக்கம் பறந்ததை வேலு பாத்தானாம். அவன்கிட்ட கேளுங்க.',
            choices: [
              {
                id: 'c_thanks',
                tone: 'investigative',
                textEn: 'Thank you for the lead, Anna.',
                textTa: 'தகவலுக்கு நன்றி அண்ணா.',
                nextNode: 'exit'
              }
            ]
          }
        }
      },
      {
        id: 'dialogue_velu_intro',
        version: '1.0.0',
        speaker: 'npc_velu',
        voiceId: 'audio.voice.velu.intro_01',
        region: 'george_town',
        startNode: 'greeting',
        nodes: {
          greeting: {
            speaker: 'npc_velu',
            textEn: 'Meter mela oru rooba illa! Straight by the meter. Where do you want to go, boss?',
            textTa: 'மீட்டருக்கு மேல ஒரு ரூபாய் கூட வாங்க மாட்டேன்! எங்க போகணும் தலைவா?',
            choices: [
              {
                id: 'c_ask_heist_auto',
                tone: 'investigative',
                textEn: 'Did you see an unregistered auto pass by around 3 AM?',
                textTa: 'ராத்திரி மூணு மணிக்கு நம்பர் பிளேட் இல்லாத ஆட்டோ ஏதாச்சும் போனதை பாத்தீங்களா?',
                nextNode: 'heist_clue'
              },
              {
                id: 'c_ride',
                tone: 'friendly',
                textEn: 'Just checking the stand, Velu Anna.',
                textTa: 'சும்மா ஆட்டோ ஸ்டாண்ட் பக்கம் வந்தேன் வேலு அண்ணா.',
                nextNode: 'exit'
              }
            ]
          },
          heist_clue: {
            speaker: 'npc_velu',
            textEn: 'Yes! It had customized mud tyres with zig-zag treads and smelled like sea diesel. The tracks are still fresh in the alleyway mud!',
            textTa: 'ஆமா தலைவா! ஜிப்-ஜாக் டயர் போட்ட ஆட்டோ, டீசல் வாடை வீசுச்சு. சந்து முக்கு சேத்துல இப்போதும் தடம் அப்படியே இருக்கு!',
            choices: [
              {
                id: 'c_investigate_mud',
                tone: 'investigative',
                textEn: 'I will go photograph the tyre tracks immediately.',
                textTa: 'நான் உடனே போய் அந்த டயர் தடத்தை படம் எடுக்கிறேன்.',
                nextNode: 'exit'
              }
            ]
          }
        }
      },
      {
        id: 'dialogue_selvam_intro',
        version: '1.0.0',
        speaker: 'npc_selvam',
        voiceId: 'audio.voice.selvam.intro_01',
        region: 'george_town',
        startNode: 'greeting',
        nodes: {
          greeting: {
            speaker: 'npc_selvam',
            textEn: 'Greetings, seeker of history. The ancient inscriptions on palm leaves hold centuries of wisdom.',
            textTa: 'வணக்கம், வரலாற்று ஆர்வலரே. ஓலைச்சுவடிகளில் பொதிந்துள்ள கல்வெட்டுக்கள் நூற்றாண்டுகளின் ஞானத்தை சுமக்கின்றன.',
            choices: [
              {
                id: 'c_epigraphy',
                tone: 'curious',
                textEn: 'Can you teach me how to read Chola copper plates?',
                textTa: 'சோழர் செப்பேடுகளைப் படிக்க எனக்கு வழிகாட்ட முடியுமா?',
                nextNode: 'explain_epigraphy'
              }
            ]
          },
          explain_epigraphy: {
            speaker: 'npc_selvam',
            textEn: 'Start by observing the signature emblem: the roaring royal tiger alongside two twin fish.',
            textTa: 'முதன்முதலில் அரச முத்திரையைக் கவனியுங்கள்: சீறும் புலியின் இருபுறமும் இரட்டை கயல் மீன்கள் பொறிக்கப்பட்டிருக்கும்.',
            choices: [
              {
                id: 'c_exit',
                tone: 'culturally_respectful',
                textEn: 'Fascinating. Thank you, Dr. Selvam.',
                textTa: 'அற்புதமான விளக்கம். நன்றி டாக்டர் செல்வம்.',
                nextNode: 'exit'
              }
            ]
          }
        }
      }
    ],

    // -------------------------------------------------------------------------
    // 3. NPCS
    // -------------------------------------------------------------------------
    npc: [
      {
        id: 'npc_murugan',
        name: 'Murugan Annan',
        nameTa: 'முருகன் அண்ணன்',
        role: 'Tea Master & Local Informant',
        region: 'george_town',
        homeLocationId: 'loc_george_town_residence',
        workplaceLocationId: 'loc_george_town_tea_stall',
        dialogueId: 'dialogue_murugan_intro',
        voiceId: 'audio.voice.murugan.intro_01',
        schedule: [
          { time: '05:30', activity: 'open_stall', location: 'workplace' },
          { time: '12:00', activity: 'lunch', location: 'workplace' },
          { time: '21:00', activity: 'close_stall', location: 'workplace' }
        ]
      },
      {
        id: 'npc_velu',
        name: 'Auto Driver Velu',
        nameTa: 'ஆட்டோ டிரைவர் வேலு',
        role: 'Auto Driver & Navigator',
        region: 'george_town',
        homeLocationId: 'loc_george_town_residence',
        workplaceLocationId: 'loc_george_town_auto_stand',
        dialogueId: 'dialogue_velu_intro',
        voiceId: 'audio.voice.velu.intro_01',
        schedule: [
          { time: '06:00', activity: 'start_auto', location: 'workplace' },
          { time: '21:00', activity: 'park_auto', location: 'workplace' }
        ]
      },
      {
        id: 'npc_selvam',
        name: 'Dr. Selvam',
        nameTa: 'டாக்டர் செல்வம்',
        role: 'Epigraphist & Historian',
        region: 'george_town',
        homeLocationId: 'loc_george_town_residence',
        workplaceLocationId: 'loc_george_town_archives',
        dialogueId: 'dialogue_selvam_intro',
        voiceId: 'audio.voice.selvam.intro_01',
        schedule: [
          { time: '08:00', activity: 'study_archives', location: 'workplace' },
          { time: '18:00', activity: 'return_home', location: 'home' }
        ]
      },
      {
        id: 'npc_sundaram',
        name: 'Sundaram Boatman',
        nameTa: 'சுந்தரம் படகோட்டி',
        role: 'Mangrove Navigator',
        region: 'pichavaram',
        homeLocationId: 'loc_pichavaram_residence',
        workplaceLocationId: 'loc_pichavaram_jetty',
        dialogueId: 'dialogue_velu_intro',
        schedule: [
          { time: '05:30', activity: 'check_tides', location: 'workplace' },
          { time: '18:30', activity: 'moor_boat', location: 'workplace' }
        ]
      },
      {
        id: 'npc_meenakshi',
        name: 'Meenakshi Aachi',
        nameTa: 'மீனாட்சி ஆச்சி',
        role: 'Master Chef & Antique Preserver',
        region: 'chettinad',
        homeLocationId: 'loc_chettinad_mansion',
        workplaceLocationId: 'loc_chettinad_kitchen',
        dialogueId: 'dialogue_murugan_intro',
        schedule: [
          { time: '05:00', activity: 'morning_spices', location: 'workplace' },
          { time: '20:00', activity: 'retire_mansion', location: 'home' }
        ]
      }
    ],

    // -------------------------------------------------------------------------
    // 4. LOCATIONS
    // -------------------------------------------------------------------------
    location: [
      {
        id: 'loc_george_town_hub',
        name: 'George Town Bazaar',
        nameTa: 'ஜார்ஜ் டவுன் கடைவீதி',
        region: 'george_town',
        coordinates: { x: 13.0827, y: 80.2707, z: 2.4 }
      },
      {
        id: 'loc_george_town_tea_stall',
        name: 'Murugan Tea Stall',
        nameTa: 'முருகன் டீக்கடை',
        region: 'george_town',
        coordinates: { x: 13.083, y: 80.271, z: 2.4 }
      },
      {
        id: 'loc_george_town_auto_stand',
        name: 'Banyan Tree Auto Stand',
        nameTa: 'ஆலமரத்தடி ஆட்டோ ஸ்டாண்ட்',
        region: 'george_town',
        coordinates: { x: 13.082, y: 80.270, z: 2.4 }
      },
      {
        id: 'loc_george_town_archives',
        name: 'Heritage Epigraphy Archives',
        nameTa: 'பாரம்பரிய கல்வெட்டு காப்பகம்',
        region: 'george_town',
        coordinates: { x: 13.084, y: 80.272, z: 2.5 }
      },
      {
        id: 'loc_george_town_high_court',
        name: 'Madras High Court Heritage Compound',
        nameTa: 'மெட்ராஸ் உயர்நீதிமன்ற பாரம்பரிய வளாகம்',
        region: 'george_town',
        coordinates: { x: 13.086, y: 80.274, z: 2.6 }
      },
      {
        id: 'loc_george_town_residence',
        name: 'North Chennai Quarters',
        nameTa: 'வடசென்னை குடியிருப்பு',
        region: 'george_town',
        coordinates: { x: 13.081, y: 80.269, z: 2.4 }
      },
      {
        id: 'loc_pichavaram_jetty',
        name: 'Pichavaram Mangrove Jetty',
        nameTa: 'பிச்சாவரம் சதுப்புநில படகுத்துறை',
        region: 'pichavaram',
        coordinates: { x: 11.428, y: 79.782, z: 1.0 }
      },
      {
        id: 'loc_pichavaram_residence',
        name: 'Killai Coastal Village',
        nameTa: 'கிள்ளை கடலோரக் கிராமம்',
        region: 'pichavaram',
        coordinates: { x: 11.420, y: 79.775, z: 1.2 }
      },
      {
        id: 'loc_chettinad_mansion',
        name: 'Kanadukathan Heritage Mansion',
        nameTa: 'கானாடுகாத்தான் பாரம்பரிய அரண்மனை',
        region: 'chettinad',
        coordinates: { x: 10.174, y: 78.789, z: 8.0 }
      },
      {
        id: 'loc_chettinad_kitchen',
        name: 'Athangudi Feast Kitchen',
        nameTa: 'ஆத்தங்குடி சமையல் கூடம்',
        region: 'chettinad',
        coordinates: { x: 10.175, y: 78.790, z: 8.0 }
      },
      {
        id: 'loc_cauvery_delta_fields',
        name: 'Thiruvaiyaru Paddy Fields',
        nameTa: 'திருவையாறு நெல்வயல்',
        region: 'cauvery_delta',
        coordinates: { x: 10.880, y: 79.106, z: 6.0 }
      },
      {
        id: 'loc_thanjavur_temple',
        name: 'Brihadisvara Temple Complex',
        nameTa: 'தஞ்சைப் பெருவுடையார் கோவில் வளாகம்',
        region: 'thanjavur',
        coordinates: { x: 10.782, y: 79.131, z: 12.0 }
      },
      {
        id: 'loc_mamallapuram_shore',
        name: 'Mamallapuram Shore Temple',
        nameTa: 'மாமல்லபுரம் கடற்கரைக் கோவில்',
        region: 'mamallapuram',
        coordinates: { x: 12.616, y: 80.198, z: 4.5 }
      },
      {
        id: 'loc_nilgiris_mist',
        name: 'Doddabetta Mist Ridge',
        nameTa: 'தொட்டபெட்டா பனிமுகடு',
        region: 'nilgiris',
        coordinates: { x: 11.401, y: 76.736, z: 32.0 }
      }
    ],

    // -------------------------------------------------------------------------
    // 5. ITEMS
    // -------------------------------------------------------------------------
    item: [
      {
        id: 'item_cutting_chai',
        nameEn: 'Madras Cutting Chai',
        nameTa: 'மதராஸ் கட்டிங் டீ',
        category: 'food',
        weight: 0.15,
        value: 12
      },
      {
        id: 'item_brass_tea_carrier',
        nameEn: 'Brass Tea Carrier',
        nameTa: 'பித்தளை டீ கேரியர்',
        category: 'quest',
        weight: 1.2,
        value: 45
      },
      {
        id: 'item_ancient_chola_coin',
        nameEn: 'Chola Tiger Bronze Coin',
        nameTa: 'சோழர் கால புலி வெண்கல நாணயம்',
        category: 'collectibles',
        weight: 0.05,
        value: 250
      },
      {
        id: 'item_murugan_special_chai_token',
        nameEn: 'Murugan Kadai Silver Token',
        nameTa: 'முருகன் கடை வெள்ளி டோக்கன்',
        category: 'collectibles',
        weight: 0.02,
        value: 50
      }
    ],

    // -------------------------------------------------------------------------
    // 6. CULTURE
    // -------------------------------------------------------------------------
    culture: [
      {
        id: 'culture_kolam_drawing',
        titleEn: 'Morning Threshold Sikku Kolam',
        titleTa: 'விடியற்காலை வாசற்படி சிக்குக் கோலம்',
        region: 'george_town',
        steps: [
          { id: 's1', instructionEn: 'Clean threshold', instructionTa: 'வாசற்படியை தூய்மைப்படுத்துக' },
          { id: 's2', instructionEn: 'Lay dots', instructionTa: 'புள்ளிகள் வைக்கவும்' },
          { id: 's3', instructionEn: 'Draw curves', instructionTa: 'வளைவுகளை வரையவும்' }
        ],
        rewards: { culturalKnowledge: 50 }
      }
    ],

    // -------------------------------------------------------------------------
    // 7. SHOPS
    // -------------------------------------------------------------------------
    shop: [
      {
        id: 'shop_murugan_tea_kadai',
        nameEn: "Murugan Annan's Tea Kadai",
        nameTa: 'முருகன் அண்ணனின் டீக்கடை',
        ownerNpcId: 'npc_murugan',
        region: 'george_town',
        openingHours: ['dawn', 'morning', 'afternoon', 'evening'],
        inventory: [
          { id: 'item_cutting_chai', stock: 50, priceMultiplier: 1.0 },
          { id: 'item_brass_tea_carrier', stock: 2, priceMultiplier: 1.0 }
        ]
      }
    ],

    // -------------------------------------------------------------------------
    // 8. EVENTS
    // -------------------------------------------------------------------------
    event: [
      {
        id: 'event_sudden_rain',
        titleEn: 'Bay of Bengal Cloudburst',
        titleTa: 'வங்கக்கடல் திடீர் மழைப் பொழிவு',
        region: 'george_town',
        durationSeconds: 180,
        weatherProfile: 'thunderstorm'
      }
    ],

    // -------------------------------------------------------------------------
    // 9. WILDLIFE
    // -------------------------------------------------------------------------
    wildlife: [
      {
        id: 'wildlife_nilgiri_tahr',
        species: 'nilgiri_tahr',
        nameTa: 'வரையாடு',
        nameEn: 'Nilgiri Tahr',
        biome: 'nilgiris',
        rarity: 'rare',
        activeTime: ['dawn', 'morning']
      }
    ],

    // -------------------------------------------------------------------------
    // 10. ACHIEVEMENTS
    // -------------------------------------------------------------------------
    achievement: [
      {
        id: 'ach_cutting_chai_connoisseur',
        titleEn: 'Kadai Regular',
        titleTa: 'டீக்கடை வாடிக்கையாளர்',
        descriptionEn: 'Drink your first freshly poured cutting chai at Murugan tea kadai.',
        descriptionTa: 'முருகன் டீக்கடையில் முதல் கட்டிங் டீயை பருகினீர்கள்.',
        unlockCondition: 'drink_cutting_chai',
        region: 'george_town'
      }
    ]
  };

  if (typeof window !== 'undefined') {
    window.CONTENT_DATA_BUNDLE = CONTENT_DATA_BUNDLE;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTENT_DATA_BUNDLE;
  }
})();
