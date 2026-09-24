// ============================================================================
// THE WHISPERING WILDS - LIFE SIMULATION DATA (AUTHORED REGIONAL ROUTINES)
// ============================================================================

(function() {
    const NPC_ACTIVITY_STATES = {
        IDLE: 'IDLE',
        WALKING: 'WALKING',
        ARRIVING: 'ARRIVING',
        WORKING: 'WORKING',
        TALKING: 'TALKING',
        CARRYING: 'CARRYING',
        SITTING: 'SITTING',
        EATING: 'EATING',
        RESTING: 'RESTING',
        SHOPPING: 'SHOPPING',
        TRADING: 'TRADING',
        CLEANING: 'CLEANING',
        COOKING: 'COOKING',
        REPAIRING: 'REPAIRING',
        FISHING: 'FISHING',
        FARMING: 'FARMING',
        CRAFTING: 'CRAFTING',
        OBSERVING: 'OBSERVING',
        RETURNING_HOME: 'RETURNING_HOME',
        SLEEPING: 'SLEEPING'
    };

    const ACTIVITY_POINT_TYPES = {
        TEA_COUNTER: 'tea_counter',
        FLOWER_STALL: 'flower_stall',
        MARKET_COUNTER: 'market_counter',
        FARM_FIELD: 'farm_field',
        IRRIGATION_SLUICE: 'irrigation_sluice',
        BOAT_DOCK: 'boat_dock',
        FISH_SORTING_AREA: 'fish_sorting_area',
        ARTISAN_WORKBENCH: 'artisan_workbench',
        TEA_FACTORY: 'tea_factory',
        TEMPLE_AREA: 'temple_area',
        BUS_STOP: 'bus_stop',
        BICYCLE_PARKING: 'bicycle_parking',
        HOUSE_ENTRANCE: 'house_entrance',
        WATER_POT: 'water_pot',
        KOLAM_AREA: 'kolam_area'
    };

    // Authored regional ambient line pools (NO LLM / Generative AI)
    const AMBIENT_DIALOGUE_POOLS = {
        GEORGE_TOWN: [
            { ta: 'சூடான இஞ்சி டீ ரெடி பா!', en: 'Hot ginger tea is ready!' },
            { ta: 'பூக்கள் ரொம்ப மணக்குது, மல்லிப்பூ வாங்கிக்கோங்க.', en: 'Fresh jasmine flowers here, very fragrant.' },
            { ta: 'பாரிமுனை பஸ் இப்போதான் போச்சு.', en: 'The Broadway bus just passed.' }
        ],
        CAUVERY_DELTA: [
            { ta: 'மடை திறந்து தண்ணி பாயுது, பயிர் நல்லா செழிக்கும்.', en: 'Sluice gate is open, the crop will flourish.' },
            { ta: 'மாட்டு வண்டி வர போகுது, ஒதுங்கி போங்க.', en: 'Bullock cart coming through, step aside.' }
        ],
        PICHAVARAM: [
            { ta: 'அலை குறைவா இருக்கு, படகு எடுக்க நல்ல நேரம்.', en: 'Tide is low, good time to take the boat out.' },
            { ta: 'வலை பின்னணும், கயிறு சரியா இருக்கா பாரு.', en: 'Need to mend the nets, check the rope.' }
        ],
        CHETTINAD: [
            { ta: 'முற்றத்துல நல்ல வெளிச்சம் விழுது.', en: 'The sunlight hits the courtyard beautifully.' },
            { ta: 'ஆத்தங்குடி தரைக்கல் ரொம்ப குளிர்ச்சியா இருக்கும்.', en: 'Athangudi tiles always stay cool.' }
        ],
        THANJAVUR: [
            { ta: 'வெண்கல சிலை வடிக்க மெழுகு பதம் முக்கியம்.', en: 'Wax consistency is critical for bronze casting.' },
            { ta: 'கோபுர நிழல் கீழே விழாதுன்னு சொல்வாங்க.', en: 'They say the temple tower shadow never falls on the ground.' }
        ],
        NILGIRIS: [
            { ta: 'பனி இறங்குது, சீக்கிரம் கொழுந்து பறிக்கணும்.', en: 'Mist is descending, must pluck the tender tea leaves quickly.' },
            { ta: 'காட்டு பாதை கவனமா போங்க.', en: 'Tread carefully along the mountain trail.' }
        ]
    };

    window.LIFE_SIMULATION_DATA = {
        STATES: NPC_ACTIVITY_STATES,
        ACTIVITY_TYPES: ACTIVITY_POINT_TYPES,
        AMBIENT_LINES: AMBIENT_DIALOGUE_POOLS
    };
})();
