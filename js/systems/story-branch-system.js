// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY BRANCH & CONSEQUENCE SYSTEM
// Tracks player choices across all 4 key dimensions:
// 1. Alliances (Heritage Council, Archaeological Society, Local Resistance)
// 2. Quest Outcomes (Sluice, Ledgers, Bronze, Contraband, Sanctuary Destiny)
// 3. NPC Relationships (Murugan, Velu, Selvam, Sundaram, Mani)
// 4. Consequence Flags & Downstream World Reactivity
// ============================================================================

(function () {
  'use strict';

  class StoryBranchSystem {
    constructor() {
      this.choices = {}; // branchId -> choiceId
      this.choiceHistory = []; // { branchId, choiceId, timestamp, consequenceText }
      this.factionAffinity = {
        heritage_council: 30,
        archaeological_society: 30,
        local_resistance: 30
      };
      this.npcAffinity = {
        murugan: 20,
        velu: 20,
        selvam: 15,
        sundaram: 15,
        mani: 15
      };
      this.flags = new Set();
      this.selectedDestiny = null;
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData) {
        if (savedData.choices && typeof savedData.choices === 'object') {
          this.choices = { ...savedData.choices };
        }
        if (Array.isArray(savedData.choiceHistory)) {
          this.choiceHistory = [...savedData.choiceHistory];
        }
        if (savedData.factionAffinity) {
          this.factionAffinity = { ...this.factionAffinity, ...savedData.factionAffinity };
        }
        if (savedData.npcAffinity) {
          this.npcAffinity = { ...this.npcAffinity, ...savedData.npcAffinity };
        }
        if (Array.isArray(savedData.flags)) {
          this.flags = new Set(savedData.flags);
        }
        if (savedData.selectedDestiny) {
          this.selectedDestiny = savedData.selectedDestiny;
        }
      }

      this.initialized = true;
      this.syncWithGameState();

      if (window.SystemRegistry) {
        window.SystemRegistry.register('StoryBranchSystem', this, {
          version: '1.0.0',
          dependencies: ['GameState']
        });
      }

      return this;
    }

    recordChoice(branchId, choiceId) {
      const dataModule = window.StoryBranchData;
      if (!dataModule) return { success: false, reason: 'StoryBranchData not loaded.' };

      const branch = dataModule.getBranch(branchId);
      if (!branch) return { success: false, reason: `Branch '${branchId}' not found.` };

      const choice = branch.choices.find(c => c.id === choiceId);
      if (!choice) return { success: false, reason: `Choice '${choiceId}' not found in branch.` };

      // Record choice
      this.choices[branchId] = choiceId;
      if (branchId === 'branch_ch7_sanctuary_destiny') {
        this.selectedDestiny = choiceId;
      }

      // Apply NPC affinity changes
      if (choice.affinityChanges) {
        for (const [npcId, delta] of Object.entries(choice.affinityChanges)) {
          if (this.npcAffinity[npcId] !== undefined) {
            this.npcAffinity[npcId] = Math.max(0, Math.min(100, this.npcAffinity[npcId] + delta));
          }
        }
      }

      // Apply Faction alignment changes
      if (choice.factionAlignment) {
        for (const [factionId, delta] of Object.entries(choice.factionAlignment)) {
          if (this.factionAffinity[factionId] !== undefined) {
            this.factionAffinity[factionId] = Math.max(0, Math.min(100, this.factionAffinity[factionId] + delta));
          }
        }
      }

      // Grant flags
      if (Array.isArray(choice.flagsGranted)) {
        for (const flag of choice.flagsGranted) {
          this.flags.add(flag);
        }
      }

      const record = {
        branchId,
        choiceId,
        label: choice.label,
        tamilLabel: choice.tamilLabel,
        consequenceText: choice.consequenceText,
        timestamp: Date.now()
      };
      this.choiceHistory.push(record);

      this.syncWithGameState();

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('story_branch_chosen', {
          detail: record
        }));
      }

      return {
        success: true,
        consequenceText: choice.consequenceText,
        factionAffinity: { ...this.factionAffinity },
        npcAffinity: { ...this.npcAffinity }
      };
    }

    getChoice(branchId) {
      return this.choices[branchId] || null;
    }

    hasFlag(flag) {
      return this.flags.has(flag);
    }

    getFactionAffinity(factionId) {
      return this.factionAffinity[factionId] ?? 0;
    }

    getNpcAffinity(npcId) {
      return this.npcAffinity[npcId] ?? 0;
    }

    getNpcRelationshipTier(npcId) {
      const score = this.getNpcAffinity(npcId);
      if (score >= 80) return { tier: 'LIFELONG_KIN', label: 'Lifelong Kin (நெருங்கிய சொந்தம்)' };
      if (score >= 50) return { tier: 'TRUSTED_ALLY', label: 'Trusted Ally (நம்பகமான தோழர்)' };
      if (score >= 25) return { tier: 'ACQUAINTANCE', label: 'Acquaintance (அறிமுகம்)' };
      return { tier: 'STRANGER', label: 'Stranger (அன்னியர்)' };
    }

    getAverageNpcTrust() {
      const scores = Object.values(this.npcAffinity);
      if (scores.length === 0) return 0;
      const sum = scores.reduce((acc, val) => acc + val, 0);
      return Math.round(sum / scores.length);
    }

    // -------------------------------------------------------------------------
    // 3-TIER CAMPAIGN PROGRESSION ARCHITECTURE
    // -------------------------------------------------------------------------

    /**
     * Returns current active campaign tier:
     * Tier 1: Urban Investigation (Chennai & George Town)
     * Tier 2: Agricultural Heritage & Moral Dilemmas (Villupuram & Pichavaram)
     * Tier 3: Ecological Preservation & Sanctuary Destiny (Nilgiris & Western Ghats)
     */
    getCampaignTier() {
      if (this.hasFlag('milestone_inner_vault_unlocked') || this.selectedDestiny || this.hasFlag('flag_sanctuary_decision_reached')) {
        return { tier: 3, id: 'ECOLOGICAL_SANCTUARY', name: 'Tier 3: Ecological Sanctuary Destiny (மேற்குத் தொடர்ச்சி மலை)' };
      }
      if (this.hasFlag('flag_selvam_water_diverted') || this.hasFlag('flag_heritage_sluice_intact') || this.hasFlag('flag_selvam_ally') || this.hasFlag('complete_report_selvam')) {
        return { tier: 2, id: 'AGRICULTURAL_HERITAGE', name: 'Tier 2: Agricultural Heritage & Delta Stewardship (விழுப்புரம் & பிச்சாவரம்)' };
      }
      return { tier: 1, id: 'INVESTIGATION_URBAN', name: 'Tier 1: Urban Clues & Missing Trail (சென்னை & ஜார்ஜ் டவுன்)' };
    }

    /**
     * Calculates dynamic merchant pricing multipliers based on player moral choices & NPC trust
     * @param {string} merchantId - e.g. 'murugan', 'tea', 'velu', 'transport', 'selvam', 'farmer'
     * @returns {number} Price multiplier (e.g. 0.70 for 30% discount, 1.25 for markup)
     */
    getMerchantPriceMultiplier(merchantId = 'general') {
      const id = (merchantId || '').toLowerCase();

      // Tea Stall / Murugan pricing
      if (id.includes('tea') || id.includes('murugan')) {
        if (this.hasFlag('flag_murugan_trusted_ally') || this.getNpcAffinity('murugan') >= 45) {
          return 0.70; // 30% friendship discount
        }
        if (this.hasFlag('flag_murugan_police_report')) {
          return 1.15; // Distrust surcharge
        }
      }

      // Auto Driver Velu / Transport pricing
      if (id.includes('auto') || id.includes('velu') || id.includes('transport')) {
        if (this.hasFlag('flag_velu_route_revealed') || this.getNpcAffinity('velu') >= 45) {
          return 0.75; // 25% driver guild discount
        }
        if (this.hasFlag('flag_velu_strict_fare')) {
          return 1.0;
        }
      }

      // Farmer Selvam / Village produce pricing
      if (id.includes('selvam') || id.includes('farmer') || id.includes('produce') || id.includes('market')) {
        if (this.hasFlag('flag_selvam_water_diverted') || this.getNpcAffinity('selvam') >= 45) {
          return 0.65; // 35% village benefactor discount
        }
      }

      // General fallback based on average regional trust
      const avgTrust = this.getAverageNpcTrust();
      if (avgTrust >= 60) return 0.85;
      if (avgTrust >= 40) return 0.95;
      if (avgTrust < 20) return 1.15;
      return 1.0;
    }

    /**
     * Checks dynamic region unlock availability based on discoveries and moral outcomes
     * @param {string} regionId - e.g. 'george_town', 'villupuram', 'pichavaram', 'nilgiris', 'thanjavur'
     */
    isRegionUnlocked(regionId) {
      const r = (regionId || '').toLowerCase().replace(/-/g, '_');
      if (r === 'george_town' || r === 'chennai') return true;

      if (r === 'villupuram') {
        return this.hasFlag('flag_velu_route_revealed') ||
               this.hasFlag('enfield_intel_acquired') ||
               this.getNpcAffinity('velu') >= 25 ||
               this.getCampaignTier().tier >= 2;
      }

      if (r === 'pichavaram') {
        return this.hasFlag('flag_selvam_ally') ||
               this.hasFlag('flag_selvam_water_diverted') ||
               this.hasFlag('complete_report_selvam') ||
               this.hasFlag('has_chola_sluice_seal') ||
               this.getCampaignTier().tier >= 2;
      }

      if (r === 'nilgiris' || r === 'western_ghats') {
        return this.getCampaignTier().tier >= 3 ||
               this.hasFlag('flag_sanctuary_decision_reached') ||
               this.hasFlag('flag_heritage_sluice_intact') ||
               this.hasFlag('flag_selvam_water_diverted');
      }

      if (r === 'thanjavur' || r === 'madurai') {
        return this.hasFlag('has_chola_sluice_seal') ||
               this.getFactionAffinity('heritage_council') >= 40 ||
               this.getFactionAffinity('archaeological_society') >= 40;
      }

      return true;
    }

    /**
     * Applies interactive dialogue choice outcomes directly into story state
     */
    applyDialogueOutcome(npcId, choiceData) {
      if (!choiceData) return;

      if (choiceData.affinityChanges) {
        for (const [npc, delta] of Object.entries(choiceData.affinityChanges)) {
          if (this.npcAffinity[npc] !== undefined) {
            this.npcAffinity[npc] = Math.max(0, Math.min(100, this.npcAffinity[npc] + delta));
          }
        }
      }

      if (choiceData.flagsGranted && Array.isArray(choiceData.flagsGranted)) {
        choiceData.flagsGranted.forEach(f => this.flags.add(f));
      }

      if (choiceData.flag) {
        this.flags.add(choiceData.flag);
      }

      this.syncWithGameState();

      if (window.quests && typeof window.quests.showQuestNotification === 'function' && choiceData.consequenceSummary) {
        window.quests.showQuestNotification(choiceData.consequenceSummary);
      }
    }

    syncWithGameState() {
      if (!window.GameState) return;

      if (!window.GameState.progression) {
        window.GameState.progression = {};
      }

      window.GameState.progression.branching = {
        choices: { ...this.choices },
        choiceHistory: [...this.choiceHistory],
        factionAffinity: { ...this.factionAffinity },
        npcAffinity: { ...this.npcAffinity },
        flags: Array.from(this.flags),
        selectedDestiny: this.selectedDestiny
      };

      // Strict enforcement of 5-change customization ceiling
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }
    }

    serialize() {
      return {
        choices: { ...this.choices },
        choiceHistory: [...this.choiceHistory],
        factionAffinity: { ...this.factionAffinity },
        npcAffinity: { ...this.npcAffinity },
        flags: Array.from(this.flags),
        selectedDestiny: this.selectedDestiny
      };
    }

    deserialize(data) {
      if (!data) return;
      if (data.choices) this.choices = { ...data.choices };
      if (Array.isArray(data.choiceHistory)) this.choiceHistory = [...data.choiceHistory];
      if (data.factionAffinity) this.factionAffinity = { ...data.factionAffinity };
      if (data.npcAffinity) this.npcAffinity = { ...data.npcAffinity };
      if (Array.isArray(data.flags)) this.flags = new Set(data.flags);
      if (data.selectedDestiny) this.selectedDestiny = data.selectedDestiny;
      this.syncWithGameState();
    }
  }

  const instance = new StoryBranchSystem();

  if (typeof window !== 'undefined') {
    window.StoryBranchSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryBranchSystem, instance };
  }
})();
