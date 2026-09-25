// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY BRANCH & CONSEQUENCE DATA
// Governs controlled story branching across 4 core dimensions:
// 1. Alliance choices (Heritage Council, Archaeological Society, Grassroots Resistance)
// 2. Key quest outcomes (Sluice, Ledgers, Bronze, Contraband, Sanctuary Destiny)
// 3. Central NPC relationships (Murugan, Velu, Selvam, Sundaram, Mani)
// 4. Exploration milestones (Inscriptions, Botanical Folios, Wildlife, Hidden Vault)
// ============================================================================

(function () {
  'use strict';

  // Major Factions / Alliances
  const FACTIONS = {
    HERITAGE_COUNCIL: {
      id: 'heritage_council',
      name: 'Tamizh Heritage & Ecological Council',
      tamilName: 'தமிழ் மரபு மற்றும் சூழலியல் அறக்கட்டளை',
      philosophy: 'Community stewardship, sacred preservation, indigenous botany protection'
    },
    ARCHAEOLOGICAL_SOCIETY: {
      id: 'archaeological_society',
      name: 'Madras Historical & Archaeological Society',
      tamilName: 'மதராஸ் தொல்பொருள் ஆய்வு நிறுவனம்',
      philosophy: 'Institutional cataloging, academic open-science, museum archiving'
    },
    LOCAL_RESISTANCE: {
      id: 'local_resistance',
      name: 'Delta Agrarian Resistance & Guild',
      tamilName: 'டெல்டா உழவர் உரிமை பாதுகாப்புப் பேரவை',
      philosophy: 'Direct protection of farmers, water rights, grassroots local defense'
    }
  };

  // Central NPCs with relationship thresholds
  const CENTRAL_NPCS = {
    murugan: {
      id: 'murugan',
      name: 'Murugan Annan',
      tamilName: 'முருகன் அண்ணன்',
      role: 'Roadside Tea Master & Urban Information Anchor',
      region: 'george_town',
      baseAffinity: 20
    },
    velu: {
      id: 'velu',
      name: 'Auto Driver Velu',
      tamilName: 'ஆட்டோ வேலு',
      role: 'Madras Auto Guild Leader & Route Scout',
      region: 'george_town',
      baseAffinity: 20
    },
    selvam: {
      id: 'selvam',
      name: 'Farmer Selvam',
      tamilName: 'விவசாயி செல்வம்',
      role: 'Cauvery Basin Paddy Steward & Water Rights Guardian',
      region: 'cauvery_delta',
      baseAffinity: 15
    },
    sundaram: {
      id: 'sundaram',
      name: 'Sthapathi Sundaram',
      tamilName: 'சிற்பி சுந்தரம்',
      role: 'Swamimalai Master Bronze Artisan & Metallurgical Scholar',
      region: 'thanjavur',
      baseAffinity: 15
    },
    mani: {
      id: 'mani',
      name: 'Forest Guide Mani',
      tamilName: 'வன வழிகாட்டி மணி',
      role: 'Nilgiris Indigenous Tracker & Shola Ecosystem Protector',
      region: 'nilgiris',
      baseAffinity: 15
    }
  };

  // Authored Decision Branches with Downstream Consequences
  const STORY_BRANCHES = [
    {
      id: 'branch_ch2_sluice_verdict',
      chapter: 'chapter_2',
      nodeId: 'node_ch2_cauvery_sluice',
      title: 'The Cauvery Sluice Flow Verdict',
      tamilTitle: 'காவிரி மதகு நீர் பகிர்வு முடிவு',
      description: 'After resolving the ancient Chola waterwheel mechanism, how should the restored water be diverted?',
      choices: [
        {
          id: 'sluice_community_paddy',
          label: 'Direct all irrigation waters to village paddy fields',
          tamilLabel: 'ஊர் பாசனத்திற்கு முழு நீரை திருப்பிவிடு',
          consequenceText: 'Farmer Selvam is deeply grateful. Delta crops flourish, but the ancient temple moat remains partially dry.',
          affinityChanges: { selvam: +35, murugan: +10 },
          factionAlignment: { local_resistance: +30, heritage_council: +10, archaeological_society: -10 },
          flagsGranted: ['flag_sluice_favored_farmers']
        },
        {
          id: 'sluice_balanced_heritage',
          label: 'Re-establish the 800-year-old balanced Chola weir division',
          tamilLabel: 'பழங்கால சோழர் சமநிலை முறைப்படி நீரை பகிர்',
          consequenceText: 'Both farmland and mangrove canals receive optimal equilibrium flow. Ecological balance is celebrated.',
          affinityChanges: { selvam: +25, sundaram: +20 },
          factionAlignment: { heritage_council: +35, archaeological_society: +20, local_resistance: +20 },
          flagsGranted: ['flag_sluice_balanced_flow']
        },
        {
          id: 'sluice_divert_mangrove_defense',
          label: 'Flush freshwater to strengthen Pichavaram mangrove stilt roots',
          tamilLabel: 'பிச்சாவரம் சதுப்புநிலக் காடுகளைப் பாதுகாக்க நீரைத் திருப்பு',
          consequenceText: 'Estuary biodiversity spikes. Rare waterbirds return in record numbers; farmers face minor rationing.',
          affinityChanges: { selvam: -10, mani: +30 },
          factionAlignment: { heritage_council: +20, archaeological_society: +25, local_resistance: -15 },
          flagsGranted: ['flag_sluice_favored_mangrove']
        }
      ]
    },
    {
      id: 'branch_ch3_ledger_disposition',
      chapter: 'chapter_3',
      nodeId: 'node_ch3_chettinad_ledgers',
      title: 'Chettinad Duplicate Ledgers Disposition',
      tamilTitle: 'செட்டிநாட்டு கணக்கு ஏடுகளின் தீர்ப்பு',
      description: 'The recovered duplicate mercantile trade ledgers prove systematic heritage looting by a foreign syndicate.',
      choices: [
        {
          id: 'ledger_community_elders',
          label: 'Hand over ledgers to the Kanadukathan Nattukottai Village Trust',
          tamilLabel: 'செட்டிநாட்டு பாரம்பரிய அறக்கட்டளையிடம் ஒப்படை',
          consequenceText: 'Ancestral elders regain autonomy. Local merchant families unite to finance defensive heritage patrols.',
          affinityChanges: { velu: +25, murugan: +20 },
          factionAlignment: { heritage_council: +35, local_resistance: +25 },
          flagsGranted: ['flag_ledger_community_custody']
        },
        {
          id: 'ledger_state_archive',
          label: 'Deposit documents with Madras High Court Chief Magistrate',
          tamilLabel: 'மதராஸ் உயர் நீதிமன்றத்தில் சட்டபூர்வமாக தாக்கல் செய்',
          consequenceText: 'Legal warrants are issued against international artifact brokers. Formal judicial trials begin.',
          affinityChanges: { velu: +10, sundaram: +15 },
          factionAlignment: { archaeological_society: +40, heritage_council: +10 },
          flagsGranted: ['flag_ledger_state_prosecution']
        }
      ]
    },
    {
      id: 'branch_ch4_bronze_destination',
      chapter: 'chapter_4',
      nodeId: 'node_ch4_swamimalai_bronze',
      title: 'The Sacred Chola Alloy Destination',
      tamilTitle: 'புனித சோழ வெண்கல முத்திரையின் இருப்பிடம்',
      description: 'The antique panchaloha bronze master mold decoded at Swamimalai must be safely preserved.',
      choices: [
        {
          id: 'bronze_swamimalai_temple',
          label: 'Consecrate and enshrine mold in the Swamimalai artisan temple',
          tamilLabel: 'சுவாமிமலை கோவில் கருவூலத்தில் பாதுகாப்பாக வை',
          consequenceText: 'Sthapathi Sundaram blesses the expedition. Lost-wax apprentices study the heirloom casting technique.',
          affinityChanges: { sundaram: +40, selvam: +15 },
          factionAlignment: { heritage_council: +40, archaeological_society: -10 },
          flagsGranted: ['flag_bronze_temple_consecrated']
        },
        {
          id: 'bronze_egmore_museum',
          label: 'Transfer mold to the Government Museum in Egmore, Chennai',
          tamilLabel: 'எழும்பூர் அரசு அருங்காட்சியகத்திற்கு வழங்கு',
          consequenceText: 'Academics and tourists worldwide can view the metallurgy, but artisans lose direct daily access.',
          affinityChanges: { sundaram: -10, velu: +15 },
          factionAlignment: { archaeological_society: +40, heritage_council: -10 },
          flagsGranted: ['flag_bronze_museum_donated']
        }
      ]
    },
    {
      id: 'branch_ch5_coastal_manifest',
      chapter: 'chapter_5',
      nodeId: 'node_ch5_mamallapuram_shore',
      title: 'Mamallapuram Smuggling Manifest Confrontation',
      tamilTitle: 'மாமல்லபுரம் கடத்தல் சரக்கு அறிக்கை நடவடிக்கை',
      description: 'Intercepted sea manifests reveal the syndicate\'s impending nighttime beach shipment.',
      choices: [
        {
          id: 'manifest_empower_fisherfolk',
          label: 'Alert the local Mamallapuram Catamaran Fisherfolk Guild',
          tamilLabel: 'மாமல்லபுரம் நாட்டுப்படகு மீனவர் சங்கத்திற்கு தகவல் தெரிவி',
          consequenceText: 'Hundreds of fishing catamarans light torches, encircling the syndicate launch and saving the relics.',
          affinityChanges: { velu: +30, selvam: +20 },
          factionAlignment: { local_resistance: +40, heritage_council: +20 },
          flagsGranted: ['flag_fisherfolk_mobilized']
        },
        {
          id: 'manifest_maritime_police',
          label: 'Coordinate tactical raid with Tamil Nadu Coastal Security Group',
          tamilLabel: 'கடலோர காவல் படையுடன் இணைந்து திட்டமிட்டு முற்றுகையிடு',
          consequenceText: 'Official coast guard cutters intercept the syndicate launch in deep waters with formal arrests.',
          affinityChanges: { murugan: +15, velu: -5 },
          factionAlignment: { archaeological_society: +35, local_resistance: -10 },
          flagsGranted: ['flag_coastguard_intercept']
        }
      ]
    },
    {
      id: 'branch_ch7_sanctuary_destiny',
      chapter: 'climax',
      nodeId: 'node_climax_confrontation',
      title: 'The Ultimate Destiny of Pasumai Thadam',
      tamilTitle: 'பசுமைத் தடம் புகலிடத்தின் இறுதித் தீர்மானம்',
      description: 'At the heart of the ancient high-altitude sanctuary, how will Tamil Nadu\'s sacred flora and historical archives be kept?',
      choices: [
        {
          id: 'sanctuary_living_trust',
          label: 'Establish an Indigenous Living Sanctuary Guard (Village Stewardship)',
          tamilLabel: 'மக்களின் நேரடி கட்டுப்பாட்டில் உள்ள புனித புகலிடமாக நிலைநிறுத்து',
          consequenceText: 'Traditional botanists, farmers, and indigenous trackers tend the seeds. The sanctuary lives through culture.',
          affinityChanges: { selvam: +30, mani: +35, sundaram: +20, murugan: +20 },
          factionAlignment: { heritage_council: +50, local_resistance: +30, archaeological_society: -10 },
          flagsGranted: ['flag_destiny_living_sanctuary']
        },
        {
          id: 'sanctuary_state_biosphere',
          label: 'Deed sanctuary to State Forest Department as a Biosphere Reserve',
          tamilLabel: 'அரசு வனத்துறையின் கட்டுப்பாட்டில் உள்ள பல்லுயிர் காப்பகமாக மாற்று',
          consequenceText: 'Legal boundaries and armed forest rangers guard the perimeters, creating an institutional reserve.',
          affinityChanges: { mani: +15, sundaram: +10, selvam: -10 },
          factionAlignment: { archaeological_society: +50, heritage_council: +10, local_resistance: -20 },
          flagsGranted: ['flag_destiny_state_biosphere']
        },
        {
          id: 'sanctuary_sealed_vault',
          label: 'Seal the subterranean gateway forever to prevent all future exploitation',
          tamilLabel: 'எதிர்காலச் சுரண்டலைத் தடுக்க நிலத்தடி நுழைவாயிலை நிரந்தரமாக மூடு',
          consequenceText: 'The knowledge returns to earth and myth. No human hand may harvest or exploit the living legacy.',
          affinityChanges: { mani: -20, selvam: -20, sundaram: -20, murugan: -20 },
          factionAlignment: { heritage_council: -30, archaeological_society: -40, local_resistance: -20 },
          flagsGranted: ['flag_destiny_sealed_vault']
        }
      ]
    }
  ];

  // Exploration Milestones affecting ending determination
  const EXPLORATION_MILESTONES = [
    {
      id: 'milestone_inscriptions_all',
      title: 'Epigraphist of Tamil Soil',
      tamilTitle: 'கல்வெட்டு ஆய்வாளர்',
      description: 'Discover and decipher all historical stone inscriptions across 6 regions',
      requiredCount: 6
    },
    {
      id: 'milestone_botanical_folios_complete',
      title: 'Lost Herbarium of the Nilgiris',
      tamilTitle: 'நீலகிரியின் அரிய மூலிகைப் பதிவுகள்',
      description: 'Assemble all 7 ancient palm-leaf botanical folios',
      requiredCount: 7
    },
    {
      id: 'milestone_all_wildlife_observed',
      title: 'Voice of the Forest (Kaattu Kural)',
      tamilTitle: 'காட்டுக்குரல் • வனத்தின் தோழன்',
      description: 'Observe all 9 indigenous wildlife species in their natural habitats without scaring them',
      requiredCount: 9
    },
    {
      id: 'milestone_inner_vault_unlocked',
      title: 'Secret of the Banyan Heart',
      tamilTitle: 'ஆலமர இதயத்தின் மர்மம்',
      description: 'Unlock the secret subterranean seed chamber behind the sacred banyan root wall',
      requiredCount: 1
    }
  ];

  const StoryBranchData = {
    FACTIONS,
    CENTRAL_NPCS,
    STORY_BRANCHES,
    EXPLORATION_MILESTONES,

    getBranch(branchId) {
      return STORY_BRANCHES.find(b => b.id === branchId) || null;
    },

    getAllBranches() {
      return [...STORY_BRANCHES];
    },

    getBranchesForChapter(chapterId) {
      return STORY_BRANCHES.filter(b => b.chapter === chapterId);
    }
  };

  if (typeof window !== 'undefined') {
    window.FACTIONS = FACTIONS;
    window.CENTRAL_NPCS = CENTRAL_NPCS;
    window.STORY_BRANCHES = STORY_BRANCHES;
    window.EXPLORATION_MILESTONES = EXPLORATION_MILESTONES;
    window.StoryBranchData = StoryBranchData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryBranchData;
  }
})();
