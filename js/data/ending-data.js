// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENDING DEFINITION DATA
// Authoritative definitions for the 4 distinct campaign endings:
// 1. ENDING_A: "The Living Heritage" (தூய பசுமைத் தடம்) - Good Ending
// 2. ENDING_B: "The Recorded Chronicle" (வரலாற்றுப் பதிவேடு) - Neutral Ending
// 3. ENDING_C: "The Shadowed Sanctuary" (மறைந்த வனம்) - Tragic Ending
// 4. ENDING_D: "Song of the Ancestral Soil" (காலத்தின் பாடல்) - Secret True Ending
//
// Rules enforced:
// - Never expose hidden/secret ending details in gallery until unlocked
// - Fully authored epilogue narratives (no placeholder text)
// - Objective mathematical criteria based on Alliances, Quests, NPCs, Exploration
// ============================================================================

(function () {
  'use strict';

  const ENDINGS = [
    {
      id: 'ending_heritage_preserved',
      code: 'ENDING_A',
      title: 'The Living Heritage',
      tamilTitle: 'தூய பசுமைத் தடம்',
      tone: 'Triumphant & Grounded',
      isSecret: false,
      badgeIcon: '🌿',
      summary: 'Tamil Nadu\'s ancient botanical wisdom and sacred groves are preserved in living community stewardship.',
      epilogueParagraphs: [
        'The rain ceases over the Western Ghats as dawn breaks across the Shola ridge. In the ancient courtyard of Pasumai Thadam, the recovered folios and heirloom seeds are returned not to cold museum vaults, but into the hands of traditional agrarians, Ayurvedic herbalists, and village youth.',
        'At George Town, Murugan Annan sets out fresh brass tumblers of steaming tea, greeting travelers with stories of the restored waterways. Farmer Selvam reports the Cauvery channels singing with clean current, while Sthapathi Sundaram trains a new generation in authentic Chola metallurgy.',
        'The syndicate\'s operatives are quietly unmasked through community solidarity and legal vigilance. The land breathes, ancient and alive, its whispering trails watched over by the people who call it home.'
      ],
      criteriaSummary: 'High Heritage Council alliance, balanced or farmer-favored sluice, sacred bronze preserved, strong bonds with Selvam & Sundaram.',
      evaluationFn: (metrics) => {
        return (
          metrics.factionAffinity.heritage_council >= 60 &&
          metrics.npcTrustAverage >= 50 &&
          metrics.evidenceCount >= 5 &&
          metrics.selectedDestiny === 'sanctuary_living_trust'
        );
      },
      rewards: {
        title: 'Guardian of the Whispering Wilds (தடத்தின் காவலர்)',
        reputationBonus: 500,
        unlockedCosmetic: 'heritage_angavastram',
        ngPlusPerk: 'perk_herbal_affinity'
      }
    },
    {
      id: 'ending_recorded_chronicle',
      code: 'ENDING_B',
      title: 'The Recorded Chronicle',
      tamilTitle: 'வரலாற்றுப் பதிவேடு',
      tone: 'Scholarly & Orderly',
      isSecret: false,
      badgeIcon: '🏛️',
      summary: 'The artifacts and botanical folios are safeguarded in high-security state archives and national museums.',
      epilogueParagraphs: [
        'The high bronze gates of the Madras High Court and the Egmore Museum stand polished under afternoon sunlight. Under armed police escort and scientific cataloging, the stolen records, antique alloys, and ancient trade ledgers are formally accessioned into state collections.',
        'Scholars from across the globe arrive in Chennai to inspect high-resolution digital scans of the Chola waterways and botanical treatises. Articles are published, symposiums convened, and medals struck in honor of the archaeological recovery.',
        'Yet high in the misty Nilgiris, the stone gateway to Pasumai Thadam remains barricaded behind institutional chain-link fencing and warning placards. The knowledge is safe from thieves, preserved behind tempered glass, even if the wild earth misses the hands of those who used to sing to it.'
      ],
      criteriaSummary: 'High Archaeological Society alliance, state prosecution of ledgers, museum donation of bronze, formal state biosphere verdict.',
      evaluationFn: (metrics) => {
        return (
          metrics.factionAffinity.archaeological_society >= 55 &&
          metrics.selectedDestiny === 'sanctuary_state_biosphere'
        );
      },
      rewards: {
        title: 'Master Archivist of the Realm (பேரறிஞர்)',
        reputationBonus: 400,
        unlockedCosmetic: 'scholar_spectacles',
        ngPlusPerk: 'perk_scholarly_intuition'
      }
    },
    {
      id: 'ending_shadowed_sanctuary',
      code: 'ENDING_C',
      title: 'The Shadowed Sanctuary',
      tamilTitle: 'மறைந்த வனம்',
      tone: 'Melancholic & Cautionary',
      isSecret: false,
      badgeIcon: '🌫️',
      summary: 'With severed alliances and sealed gateways, the ancient knowledge is locked away into timeless silence.',
      epilogueParagraphs: [
        'Heavy mist rolls down from Doddabetta peak, blanketing the craggy ridges in deep grey quiet. The ancient granite lintel of Pasumai Thadam has collapsed inward, its subterranean entrance sealed beneath tons of fallen mountain shale and dense wild bramble.',
        'In the delta, water channels run sluggishly through contested boundaries. The syndicate fled into the shadows, leaving behind empty rooms and fractured trust. Murugan Annan sits quietly on his wooden bench, staring into the Madras drizzle, wondering whatever happened to the lost blueprints.',
        'The sacred herbs still bloom in high, inaccessible crevices where no boot can tread. Perhaps it is better this way; untouched, untamed, and unexploited, the wilderness keeps its own counsel, waiting for a wiser century.'
      ],
      criteriaSummary: 'Low NPC trust, failed alliances, or choosing to permanently seal the subterranean sanctuary vault.',
      evaluationFn: (metrics) => {
        return (
          metrics.selectedDestiny === 'sanctuary_sealed_vault' ||
          (metrics.npcTrustAverage < 35 && metrics.evidenceCount < 4)
        );
      },
      rewards: {
        title: 'The Silent Wanderer (மௌனப் பயணி)',
        reputationBonus: 250,
        unlockedCosmetic: 'weathered_pilgrim_shawl',
        ngPlusPerk: 'perk_silent_step'
      }
    },
    {
      id: 'ending_ancestral_soil',
      code: 'ENDING_D',
      title: 'Song of the Ancestral Soil',
      tamilTitle: 'காலத்தின் பாடல்',
      tone: 'Transcendent & Mythic Realism',
      isSecret: true, // MUST remain masked until player satisfies all prerequisites
      badgeIcon: '✨',
      summary: 'The complete unbroken symbiosis of Tamil culture, ancient engineering, and living biodiversity is fully awakened.',
      epilogueParagraphs: [
        'At the dawn of the harvest season, the seven sacred bells of the Western Ghats sanctuary chime together with the distant bells of the Thanjavur Brihadisvara tower. All seven regional clues, from the George Town blueprint to the Nilgiris palm-leaf treatises, unite to form a living map of ecological equilibrium.',
        'Every river sluice, mangrove tidal canal, and sacred banyan grove pulses with renewal. Murugan, Velu, Selvam, Sundaram, and Mani stand together beneath the great banyan canopy, welcomed as the Five Stewards of the Soil.',
        'The syndicate does not merely retreat; their illicit trade network collapses completely as local communities across all six biomes take pride in their heritage. The soil of Tamil Nadu speaks in thousands of whispers, no longer fearful of the axe, but singing with the voices of those who know how to listen.'
      ],
      criteriaSummary: 'Secret: All 7 evidence items collected, all 4 exploration milestones completed, maximum NPC trust (>70 with all 5 central NPCs), Living Sanctuary destiny chosen.',
      evaluationFn: (metrics) => {
        return (
          metrics.evidenceCount >= 7 &&
          metrics.milestonesCompletedCount >= 4 &&
          metrics.npcTrustAverage >= 70 &&
          metrics.selectedDestiny === 'sanctuary_living_trust' &&
          metrics.factionAffinity.heritage_council >= 70
        );
      },
      rewards: {
        title: 'Child of the Tamil Soil (மண்ணின் மைந்தன்)',
        reputationBonus: 1000,
        unlockedCosmetic: 'golden_chola_angavastram',
        ngPlusPerk: 'perk_ancestral_harmony'
      }
    }
  ];

  const EndingData = {
    ENDINGS,

    getEnding(endingId) {
      return ENDINGS.find(e => e.id === endingId) || null;
    },

    getAllEndings(includeSecret = false, unlockedEndingIds = []) {
      if (includeSecret) return [...ENDINGS];
      return ENDINGS.map(ending => {
        if (ending.isSecret && !unlockedEndingIds.includes(ending.id)) {
          // Mask secret ending to prevent spoilers
          return {
            id: ending.id,
            code: ending.code,
            title: '??? Locked Secret Ending ???',
            tamilTitle: '??? இரகசிய முடிவு ???',
            tone: 'Unknown',
            isSecret: true,
            isLocked: true,
            badgeIcon: '🔒',
            summary: 'Discover all 7 regional evidence items, achieve max trust with all central NPCs, and complete 100% exploration milestones to uncover this mythic conclusion.',
            epilogueParagraphs: ['[REDACTED UNTIL EARNED]'],
            criteriaSummary: 'Requires comprehensive mastery of all exploration, social, and cultural paths.'
          };
        }
        return { ...ending, isLocked: false };
      });
    },

    evaluateEnding(playerMetrics) {
      // Prioritize True Secret Ending first
      const secretEnding = ENDINGS.find(e => e.id === 'ending_ancestral_soil');
      if (secretEnding && secretEnding.evaluationFn(playerMetrics)) {
        return secretEnding;
      }

      // Check Good Ending
      const goodEnding = ENDINGS.find(e => e.id === 'ending_heritage_preserved');
      if (goodEnding && goodEnding.evaluationFn(playerMetrics)) {
        return goodEnding;
      }

      // Check Neutral Ending
      const neutralEnding = ENDINGS.find(e => e.id === 'ending_recorded_chronicle');
      if (neutralEnding && neutralEnding.evaluationFn(playerMetrics)) {
        return neutralEnding;
      }

      // Default to Tragic Ending if criteria not met
      const tragicEnding = ENDINGS.find(e => e.id === 'ending_shadowed_sanctuary');
      return tragicEnding || ENDINGS[2];
    }
  };

  if (typeof window !== 'undefined') {
    window.ENDINGS = ENDINGS;
    window.EndingData = EndingData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndingData;
  }
})();
