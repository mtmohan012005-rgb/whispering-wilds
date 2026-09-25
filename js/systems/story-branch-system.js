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

    getStorySummaryMetrics() {
      // Calculate evidence count from StoryContentSystem or GameState
      let evidenceCount = 0;
      if (window.StoryContentSystem && window.StoryContentSystem.collectedEvidence) {
        evidenceCount = window.StoryContentSystem.collectedEvidence.size;
      } else if (window.GameState && window.GameState.quests && Array.isArray(window.GameState.quests.evidence)) {
        evidenceCount = window.GameState.quests.evidence.length;
      }

      // Check exploration milestones completed
      let milestonesCompletedCount = 0;
      if (this.hasFlag('milestone_inscriptions_all')) milestonesCompletedCount++;
      if (this.hasFlag('milestone_botanical_folios_complete')) milestonesCompletedCount++;
      if (this.hasFlag('milestone_all_wildlife_observed')) milestonesCompletedCount++;
      if (this.hasFlag('milestone_inner_vault_unlocked')) milestonesCompletedCount++;

      return {
        factionAffinity: { ...this.factionAffinity },
        npcAffinity: { ...this.npcAffinity },
        npcTrustAverage: this.getAverageNpcTrust(),
        evidenceCount,
        milestonesCompletedCount,
        selectedDestiny: this.selectedDestiny || 'sanctuary_living_trust',
        flags: Array.from(this.flags)
      };
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
