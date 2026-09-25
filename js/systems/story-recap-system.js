// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY RECAP SYSTEM
// Synthesizes player choices, narrative branches, NPC bonds, and final outcomes
// into a structured, spoiler-free campaign recap chronicle.
//
// Rules strictly enforced:
// - Never expose unvisited hidden story content or unearned endings
// - Strictly respects player choices across all 7 chapters
// - Customization ceiling <= 5 preserved
// ============================================================================

(function () {
  'use strict';

  class StoryRecapSystem {
    constructor() {
      this.recapData = null;
      this.initialized = false;
    }

    init(savedData = null) {
      if (savedData && savedData.recapData) {
        this.recapData = { ...savedData.recapData };
      }

      this.initialized = true;

      if (window.SystemRegistry) {
        window.SystemRegistry.register('StoryRecapSystem', this, {
          version: '1.0.0',
          dependencies: ['GameState', 'StoryBranchSystem', 'EndingSystem']
        });
      }

      return this;
    }

    generateRecap() {
      const branchSystem = window.StoryBranchSystem;
      const endingSystem = window.EndingSystem;
      const progressionSystem = window.StoryProgressionSystem;
      const contentSystem = window.StoryContentSystem;

      // 1. Ending Information (spoiler-protected: only shows what was achieved)
      const currentEnding = endingSystem?.getCurrentEnding();
      const endingSummary = currentEnding ? {
        id: currentEnding.id,
        code: currentEnding.code,
        title: currentEnding.title,
        tamilTitle: currentEnding.tamilTitle,
        badgeIcon: currentEnding.badgeIcon,
        summary: currentEnding.summary,
        tone: currentEnding.tone
      } : {
        title: 'Journey in Progress',
        tamilTitle: 'பயணம் தொடர்கிறது',
        badgeIcon: '🧭',
        summary: 'The campaign has not yet reached its final climax.',
        tone: 'Active'
      };

      // 2. Authored Decision Timeline (Only includes branches the player actually visited)
      const timeline = [];
      const branchData = window.StoryBranchData;
      if (branchSystem && branchData) {
        for (const branch of branchData.getAllBranches()) {
          const chosenId = branchSystem.getChoice(branch.id);
          if (chosenId) {
            const choice = branch.choices.find(c => c.id === chosenId);
            timeline.push({
              branchId: branch.id,
              chapter: branch.chapter,
              title: branch.title,
              tamilTitle: branch.tamilTitle,
              chosenOption: choice ? choice.label : 'Option selected',
              chosenTamilOption: choice ? choice.tamilLabel : '',
              consequence: choice ? choice.consequenceText : ''
            });
          }
        }
      }

      // 3. Central NPC Bonds (Truthful to current affinity without inventing stats)
      const npcBonds = [];
      if (branchSystem && branchData?.CENTRAL_NPCS) {
        for (const [key, npc] of Object.entries(branchData.CENTRAL_NPCS)) {
          const affinity = branchSystem.getNpcAffinity(key);
          const tier = branchSystem.getNpcRelationshipTier(key);
          npcBonds.push({
            id: npc.id,
            name: npc.name,
            tamilName: npc.tamilName,
            role: npc.role,
            region: npc.region,
            affinity,
            tierLabel: tier.label
          });
        }
      }

      // 4. Faction Standings
      const factionStandings = [];
      if (branchSystem && branchData?.FACTIONS) {
        for (const [key, faction] of Object.entries(branchData.FACTIONS)) {
          const score = branchSystem.getFactionAffinity(faction.id);
          factionStandings.push({
            id: faction.id,
            name: faction.name,
            tamilName: faction.tamilName,
            score,
            status: score >= 60 ? 'Allied (கூட்டாளி)' : (score >= 40 ? 'Friendly (நட்பு)' : 'Neutral (நடுநிலை)')
          });
        }
      }

      // 5. Evidence & Historical Milestones
      const evidenceCount = contentSystem?.collectedEvidence ? contentSystem.collectedEvidence.size : 0;
      const completedNodesCount = progressionSystem?.completedNodes ? progressionSystem.completedNodes.length : 0;

      this.recapData = {
        generatedAt: Date.now(),
        ending: endingSummary,
        timeline,
        npcBonds,
        factionStandings,
        evidenceCount,
        completedNodesCount,
        customizationChangesUsed: window.GameState?.player?.customizationChangesUsed ?? 0
      };

      this.syncWithGameState();
      return this.recapData;
    }

    getRecapData() {
      if (!this.recapData) {
        return this.generateRecap();
      }
      return this.recapData;
    }

    syncWithGameState() {
      if (!window.GameState) return;

      if (!window.GameState.progression) {
        window.GameState.progression = {};
      }

      window.GameState.progression.recap = this.recapData ? { ...this.recapData } : null;

      // Strict customization guard: 5 changes ceiling
      if (window.GameState.player && window.GameState.player.customizationChangesUsed > 5) {
        window.GameState.player.customizationChangesUsed = 5;
      }
    }

    serialize() {
      return {
        recapData: this.recapData ? { ...this.recapData } : null
      };
    }

    deserialize(data) {
      if (data?.recapData) {
        this.recapData = { ...data.recapData };
      }
      this.syncWithGameState();
    }
  }

  const instance = new StoryRecapSystem();

  if (typeof window !== 'undefined') {
    window.StoryRecapSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryRecapSystem, instance };
  }
})();
