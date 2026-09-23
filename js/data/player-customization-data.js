/**
 * The Whispering Wilds (Kaattu Vazhi) - Player Customization Production Data
 * Culturally authentic Tamil Nadu explorer customization options, presets,
 * and authoritative limits.
 */

window.PLAYER_CUSTOMIZATION_CONFIG = {
  MAX_CHANGES: 5,

  outfits: {
    everyday_veshti: {
      id: "everyday_veshti",
      name: "Traditional Everyday Veshti (வேட்டி & சட்டை)",
      tamilName: "பாரம்பரிய பருத்தி வேஷ்டி & வெள்ளை சட்டை",
      category: "outfit",
      clothing: "Lightweight white cotton shirt, handloom dhoti/veshti with gold border, shoulder cotton thundu",
      footwearId: "kolhapuri_sandals",
      stats: { heatResistance: 15, coldResistance: 0, mobility: "High" },
      culturalContext: "Quintessential South Indian attire for daily town life, temple corridors, and mild coastal weather.",
      icon: "🥻"
    },
    village_workwear: {
      id: "village_workwear",
      name: "Village Farmland Workwear (விவசாய கள உடை)",
      tamilName: "விழுப்புரம் உழவர் கள உடை",
      category: "outfit",
      clothing: "Faded blue cotton work shirt, knee-tucked checkered lungi/dhoti, reinforced head towel",
      footwearId: "rubber_field_chappals",
      stats: { heatResistance: 20, coldResistance: 5, mobility: "Very High", gatheringBonus: "+15% Comfort" },
      culturalContext: "Durable red-soil agrarian attire optimized for paddy fields, canal crossings, and intense afternoon sun.",
      icon: "🌾"
    },
    urban_explorer: {
      id: "urban_explorer",
      name: "Urban Chennai Explorer (சாகச பயண உடை)",
      tamilName: "சென்னை நகர்ப்புற கள உடை",
      category: "outfit",
      clothing: "Olive breathable utility T-shirt, durable multi-pocket cargo trousers, canvas expedition jacket",
      footwearId: "trekking_boots",
      stats: { heatResistance: 10, coldResistance: 15, durability: "High", backpackCapacity: "+20%" },
      culturalContext: "Modern Tamil Nadu field exploration gear for George Town alleys, jungle paths, and archaeological treks.",
      icon: "🥾"
    },
    festival_veshti: {
      id: "festival_veshti",
      name: "Kanchipuram Festival Silk Veshti (பட்டு வேஷ்டி)",
      tamilName: "காஞ்சிபுரம் திருவிழா பட்டு வேஷ்டி",
      category: "outfit",
      clothing: "Raw cream silk jubba/kurta with pure woven golden zari border veshti and angavasthram",
      footwearId: "heritage_sandals",
      stats: { heatResistance: 5, coldResistance: 10, charisma: "+25% Merchant Barter" },
      culturalContext: "Ceremonial heirloom attire worn during Pongal, Margazhi temple festivals, and Chettinad gatherings.",
      icon: "✨"
    },
    nilgiri_warmwear: {
      id: "nilgiri_warmwear",
      name: "Nilgiri Mountain Woolen Suit (நீலகிரி குளிர் கம்பளி)",
      tamilName: "நீலகிரி குளிர் கம்பளி சூட்",
      category: "outfit",
      clothing: "Hand-knit thick Ooty mountain sheep wool sweater, stormproof hooded poncho, insulated trekking trousers",
      footwearId: "insulated_spiked_boots",
      stats: { heatResistance: -10, coldResistance: 50, frostbiteImmunity: true },
      culturalContext: "Essential heavy cold-climate wear required to ascend high-altitude Shola cloud forests and Toda passes.",
      icon: "🧥"
    }
  },

  hairstyles: {
    short_traditional_part: {
      id: "short_traditional_part",
      name: "Classic Side Part (பாரம்பரிய வெட்டு)",
      tamilName: "பாரம்பரிய பக்கவாட்டு முடிவெட்டு",
      description: "Neat, classic Tamil barber shop cut with side parting and light hair oil sheen."
    },
    explorer_crop: {
      id: "explorer_crop",
      name: "Field Explorer Crop (களப் பயணியர் வெட்டு)",
      tamilName: "களப் பயண குறுகிய முடி",
      description: "Tidy, practical textured crew cut suited for dusty travel and humidity."
    },
    wavy_coastal: {
      id: "wavy_coastal",
      name: "Coastal Natural Waves (கடலோர அலை முடி)",
      tamilName: "கடலோர இயற்கை அலை முடி",
      description: "Thick natural waves shaped by coastal Madras sea breezes."
    },
    temple_topknot_crew: {
      id: "temple_topknot_crew",
      name: "Heritage Kudumi Topknot (பாரம்பரிய குடுமி)",
      tamilName: "பாரம்பரிய உச்சி குடுமி",
      description: "Historical South Indian gathered topknot knot with closely trimmed sides."
    },
    highland_messy: {
      id: "highland_messy",
      name: "Nilgiri Mountain Windswept (மலைக்காற்று முடி)",
      tamilName: "நீலகிரி மலைக்காற்று முடி",
      description: "Thick windswept curls designed to retain warmth beneath woolen caps."
    }
  },

  accessories: {
    none: {
      id: "none",
      name: "None (எதுவுமில்லை)",
      tamilName: "எதுவுமில்லை",
      description: "No additional accessory equipped."
    },
    jhola_bag: {
      id: "jhola_bag",
      name: "Khadi Cotton Jhola Bag (காதி ஜோல்னா பை)",
      tamilName: "பாரம்பரிய காதி பருத்தி ஜோல்னா பை",
      description: "Sturdy shoulder sling bag commonly used by writers, surveyors, and field naturalists."
    },
    rudraksha_wristlet: {
      id: "rudraksha_wristlet",
      name: "Pancha-Mukhi Rudraksha Wristlet (ருத்ராட்ச காப்பு)",
      tamilName: "பஞ்சமுகி ருத்ராட்ச காப்பு",
      description: "Carved wooden bead bracelet symbolizing focus, stamina, and spiritual grounding."
    },
    brass_pocket_watch: {
      id: "brass_pocket_watch",
      name: "Chettinad Brass Hunter Watch (செட்டிநாடு பித்தளை கடிகாரம்)",
      tamilName: "செட்டிநாடு பித்தளை பாக்கெட் கடிகாரம்",
      description: "Antique mechanical timepiece inherited from Madras trading merchants."
    },
    toda_amulet: {
      id: "toda_amulet",
      name: "Sacred Toda Horn Charm (தோடா புனித தாயத்து)",
      tamilName: "தோடா புனித எருமை கொம்பு தாயத்து",
      description: "Sacred mountain talisman blessed by tribal elders in the Nilgiri hills."
    }
  },

  footwear: {
    kolhapuri_sandals: {
      id: "kolhapuri_sandals",
      name: "Handcrafted Kolhapuri Sandals (தோல் செருப்பு)",
      tamilName: "பாரம்பரிய தோல் செருப்பு",
      description: "Supple tanned leather straps offering natural breathability."
    },
    rubber_field_chappals: {
      id: "rubber_field_chappals",
      name: "Heavy-Duty Field Rubber Chappals (வயல் ரப்பர் செருப்பு)",
      tamilName: "கள ரப்பர் செருப்பு",
      description: "Waterproof, thorn-resistant rubber footwear designed for mud bunds."
    },
    trekking_boots: {
      id: "trekking_boots",
      name: "All-Terrain Vibram Trekking Boots (நடைக்காலணி)",
      tamilName: "சாகச நடைக்காலணி",
      description: "High-ankle support boots with aggressive lug pattern for granite and gravel."
    },
    heritage_sandals: {
      id: "heritage_sandals",
      name: "Polished Heritage Zari Sandals (பட்டு செருப்பு)",
      tamilName: "பாரம்பரிய விழாக்கால செருப்பு",
      description: "Refined ceremonial leather sandals featuring brass buckles."
    },
    insulated_spiked_boots: {
      id: "insulated_spiked_boots",
      name: "Insulated Mountain Spiked Boots (பனிக்குளிர் காலணி)",
      tamilName: "நீலகிரி பனிக்குளிர் காலணி",
      description: "Fleece-lined mountain boots with spiked soles preventing slips on wet moss."
    }
  },

  appearancePresets: {
    everyday_explorer: {
      id: "everyday_explorer",
      name: "Preset A: Everyday Explorer (அன்றாட பயணி)",
      tamilName: "அன்றாட பயணி",
      description: "Traditional white cotton veshti, neat side part, khadi jhola bag, and leather sandals.",
      outfitId: "everyday_veshti",
      hairstyleId: "short_traditional_part",
      accessoryId: "jhola_bag",
      footwearId: "kolhapuri_sandals"
    },
    village_field_worker: {
      id: "village_field_worker",
      name: "Preset B: Village Field Worker (கள உழவர்)",
      tamilName: "கிராமப்புற கள உழைப்பாளர்",
      description: "Farmland workwear, short crew crop, rudraksha wristlet, and durable rubber field chappals.",
      outfitId: "village_workwear",
      hairstyleId: "explorer_crop",
      accessoryId: "rudraksha_wristlet",
      footwearId: "rubber_field_chappals"
    },
    urban_chennai_explorer: {
      id: "urban_chennai_explorer",
      name: "Preset C: Urban Chennai Explorer (நகர்ப்புற சாகசக்காரர்)",
      tamilName: "சென்னை நகர்ப்புற சாகசக்காரர்",
      description: "Cargo expedition jacket, wavy coastal hair, brass pocket watch, and rugged trekking boots.",
      outfitId: "urban_explorer",
      hairstyleId: "wavy_coastal",
      accessoryId: "brass_pocket_watch",
      footwearId: "trekking_boots"
    },
    festival_formal: {
      id: "festival_formal",
      name: "Preset D: Festival & Formal (திருவிழா சிறப்பு உடை)",
      tamilName: "பாரம்பரிய திருவிழா சிறப்பு உடை",
      description: "Kanchipuram gold-bordered silk veshti, heritage topknot cut, and polished zari sandals.",
      outfitId: "festival_veshti",
      hairstyleId: "temple_topknot_crew",
      accessoryId: "brass_pocket_watch",
      footwearId: "heritage_sandals"
    },
    nilgiri_outdoor: {
      id: "nilgiri_outdoor",
      name: "Preset E: Nilgiri Outdoor (நீலகிரி மலையேற்ற உடை)",
      tamilName: "நீலகிரி மலையேற்ற உடை",
      description: "Heavy Ooty woolen thermal suit, highland windswept curls, sacred Toda amulet, and spiked boots.",
      outfitId: "nilgiri_warmwear",
      hairstyleId: "highland_messy",
      accessoryId: "toda_amulet",
      footwearId: "insulated_spiked_boots"
    }
  }
};
