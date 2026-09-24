/**
 * The Whispering Wilds (Kaattu Vazhi) - Quest Progression Engine
 * Authoritative 9-state machine, prerequisite validation, structured rewards,
 * anti-duplication guards, and event-driven updates.
 */

window.QUEST_STATE = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  ACTIVE: 'ACTIVE',
  OBJECTIVE: 'OBJECTIVE',
  INVESTIGATING: 'INVESTIGATING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ABANDONED: 'ABANDONED',
  REWARDED: 'REWARDED'
};

class QuestProgressionSystem {
  constructor(questsData, worldUnlockSystem, investigationSystem) {
    this.worldUnlocks = worldUnlockSystem || (window.worldUnlockSystem ? window.worldUnlockSystem : null);
    this.investigation = investigationSystem || (window.investigationSystem ? window.investigationSystem : null);

    // Deep clone authoritative definitions
    const sourceData = questsData || (window.QUEST_PRODUCTION_DATA || []);
    this.quests = JSON.parse(JSON.stringify(sourceData)).map(q => {
      if (q.status) q.status = q.status.toUpperCase();
      return q;
    });

    // Anti-duplication set for rewards
    this.claimedRewards = new Set();

    // Event listeners
    this.eventListeners = {};

    // Initial check of unlocked / available quests
    this.evaluateAvailableQuests();
  }

  getQuest(questId) {
    return this.quests.find(q => q.id === questId) || null;
  }

  isQuestCompleted(questId) {
    const q = this.getQuest(questId);
    return !!(q && (q.status === window.QUEST_STATE.COMPLETED || q.status === window.QUEST_STATE.REWARDED));
  }

  isObjectiveDone(questId, objId) {
    const q = this.getQuest(questId);
    if (!q) return false;
    const obj = q.objectives.find(o => o.id === objId);
    return !!(obj && obj.completed);
  }

  /**
   * Evaluates prerequisites to transition LOCKED quests to AVAILABLE or ACTIVE
   */
  evaluateAvailableQuests() {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.LOCKED) {
        const canActivate = quest.prerequisites.every(preId => this.isQuestCompleted(preId));
        if (canActivate) {
          quest.status = window.QUEST_STATE.AVAILABLE;
          // Auto-activate main storyline chapter quests
          if (quest.id.startsWith('main_')) {
            quest.status = window.QUEST_STATE.ACTIVE;
            this.showNotification(`📖 NEW CHAPTER UNLOCKED: ${quest.title}`);
          }
        }
      }
    });
  }

  /**
   * Validates if an objective can be completed based on prerequisites and current status
   */
  isObjectiveValid(questId, objId) {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    // Quest must be active or in progress
    if (quest.status !== window.QUEST_STATE.ACTIVE &&
        quest.status !== window.QUEST_STATE.OBJECTIVE &&
        quest.status !== window.QUEST_STATE.INVESTIGATING) {
      return false;
    }

    const obj = quest.objectives.find(o => o.id === objId);
    if (!obj || obj.completed) return false;

    // Sequential objective checks if previous must be completed
    const objIndex = quest.objectives.indexOf(obj);
    if (objIndex > 0) {
      const prevObj = quest.objectives[objIndex - 1];
      if (!prevObj.completed) {
        console.warn(`[QuestProgression] Cannot complete "${obj.id}": Previous objective "${prevObj.id}" is not finished.`);
        return false;
      }
    }

    return true;
  }

  /**
   * Complete a specific quest objective with validation and reward checks
   */
  completeObjective(questId, objId, context = {}) {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    // Prerequisite check: Quest must not be locked
    if (quest.status === window.QUEST_STATE.LOCKED) {
      console.warn(`[QuestProgression] Cannot complete objective: Quest "${questId}" is LOCKED.`);
      return false;
    }

    // Activate quest if available
    if (quest.status === window.QUEST_STATE.AVAILABLE) {
      quest.status = window.QUEST_STATE.ACTIVE;
    }

    const obj = quest.objectives.find(o => o.id === objId);
    if (!obj || obj.completed) return false;

    // Validate sequential progression
    if (!this.isObjectiveValid(questId, objId)) {
      return false;
    }

    obj.completed = true;
    obj.currentAmount = obj.requiredAmount;
    quest.status = window.QUEST_STATE.OBJECTIVE;

    const audio = context.audio || window.gameAudio;
    if (audio && typeof audio.playDiscoveryJingle === 'function') {
      audio.playDiscoveryJingle();
    }

    this.showNotification(`✓ Objective Complete: ${obj.text}`);
    this.dispatchEvent('onObjectiveCompleted', { questId, objId, obj });

    // Check if all objectives are completed
    const allDone = quest.objectives.every(o => o.completed);
    if (allDone) {
      this.completeQuest(questId, context);
    }

    return true;
  }

  completeQuest(questId, context = {}) {
    const quest = this.getQuest(questId);
    if (!quest || quest.status === window.QUEST_STATE.COMPLETED || quest.status === window.QUEST_STATE.REWARDED) {
      return false;
    }

    quest.status = window.QUEST_STATE.COMPLETED;
    const audio = context.audio || window.gameAudio;
    if (audio && typeof audio.playDiscoveryJingle === 'function') {
      audio.playDiscoveryJingle();
    }

    this.showNotification(`🌟 QUEST COMPLETE: ${quest.title}!`);

    // Grant structured rewards
    this.grantQuestReward(questId, context);

    // Evaluate unlocks for next chapters
    this.evaluateAvailableQuests();

    // Check if any region unlock was granted
    if (quest.rewards) {
      quest.rewards.forEach(r => {
        if (r.type === 'region_unlock' && this.worldUnlocks) {
          this.worldUnlocks.unlock(r.regionId, audio);
        }
      });
    }

    this.dispatchEvent('onQuestCompleted', { questId, quest });
    return true;
  }

  /**
   * Grants structured rewards once and prevents duplication
   */
  grantQuestReward(questId, context = {}) {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    if (this.claimedRewards.has(questId)) {
      console.warn(`[QuestProgression] Rewards for "${questId}" already claimed. Guarding against duplication.`);
      return false;
    }

    this.claimedRewards.add(questId);
    quest.status = window.QUEST_STATE.REWARDED;

    const survival = (context && context.survival) || window.gameSurvival || (window.testRef && window.testRef.survival);
    const player = (context && context.player) || window.gamePlayer || (window.testRef && window.testRef.player);
    const journal = (context && context.journal) || window.gameJournal;

    if (Array.isArray(quest.rewards)) {
      quest.rewards.forEach(reward => {
        switch (reward.type) {
          case 'currency':
            if (window.GameState && window.GameState.addCurrency) {
              window.GameState.addCurrency(reward.amount);
            }
            if (survival && typeof survival.currency === 'number' && (!window.GameState || survival !== window.gameSurvival)) {
              survival.currency += reward.amount;
            } else if (player && typeof player.currency === 'number' && (!window.GameState || player !== window.gamePlayer) && player !== survival) {
              player.currency += reward.amount;
            }
            this.showNotification(`💰 Received: ₹${reward.amount} Rupees`);
            break;

          case 'item':
            const itemObj = { id: reward.itemId, itemId: reward.itemId, name: reward.name || reward.itemId };
            if (player) {
              if (!player.inventory) player.inventory = [];
              player.inventory.push(itemObj);
            }
            if (context && context.survival && Array.isArray(context.survival.inventory)) {
              if (!context.survival.inventory.some(i => (i.id || i.itemId) === reward.itemId)) {
                context.survival.inventory.push(itemObj);
              }
            }
            this.showNotification(`🎒 Acquired Item: ${reward.name || reward.itemId}`);
            break;

          case 'story_flag':
            if (!window.STORY_FLAGS) window.STORY_FLAGS = new Set();
            window.STORY_FLAGS.add(reward.flag);
            break;

          case 'journal_entry':
            if (journal && reward.entryId) {
              journal.unlockEntry(reward.entryId);
            }
            break;

          case 'region_unlock':
            if (this.worldUnlocks) {
              this.worldUnlocks.unlock(reward.regionId);
            }
            break;
        }
      });
    }

    return true;
  }

  failQuest(questId, reason = "Objective failed") {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    quest.status = window.QUEST_STATE.FAILED;
    this.showNotification(`⚠️ Mission Halted: ${quest.title} (${reason})`);
    console.warn(`[QuestProgression] Quest ${questId} failed: ${reason}`);
    return true;
  }

  retryQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest || quest.status !== window.QUEST_STATE.FAILED) return false;

    quest.status = window.QUEST_STATE.ACTIVE;
    // Reset incomplete objectives
    quest.objectives.forEach(o => {
      if (!o.completed) o.currentAmount = 0;
    });
    this.showNotification(`🔄 Resumed: ${quest.title}`);
    return true;
  }

  // --- EVENT-DRIVEN DISPATCHERS ---

  onInteraction(targetId, context = {}) {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.ACTIVE || quest.status === window.QUEST_STATE.OBJECTIVE) {
        quest.objectives.forEach(obj => {
          if (!obj.completed && (obj.type === 'inspect' || obj.type === 'talk' || obj.type === 'explore')) {
            if (obj.target === targetId) {
              this.completeObjective(quest.id, obj.id, context);
            }
          }
        });
      }
    });
  }

  onPhotoCaptured(subjectId, context = {}) {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.ACTIVE || quest.status === window.QUEST_STATE.OBJECTIVE) {
        quest.objectives.forEach(obj => {
          if (!obj.completed && obj.type === 'photo' && obj.target === subjectId) {
            this.completeObjective(quest.id, obj.id, context);
          }
        });
      }
    });
  }

  onItemAdded(itemId, context = {}) {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.ACTIVE || quest.status === window.QUEST_STATE.OBJECTIVE) {
        quest.objectives.forEach(obj => {
          if (!obj.completed && obj.type === 'collect' && obj.target === itemId) {
            this.completeObjective(quest.id, obj.id, context);
          }
        });
      }
    });
  }

  onOutfitEquipped(outfitId, context = {}) {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.ACTIVE || quest.status === window.QUEST_STATE.OBJECTIVE) {
        quest.objectives.forEach(obj => {
          if (!obj.completed && obj.type === 'equip' && obj.target === outfitId) {
            this.completeObjective(quest.id, obj.id, context);
          }
        });
      }
    });
  }

  onPuzzleSolved(puzzleId, context = {}) {
    this.quests.forEach(quest => {
      if (quest.status === window.QUEST_STATE.ACTIVE || quest.status === window.QUEST_STATE.OBJECTIVE) {
        quest.objectives.forEach(obj => {
          if (!obj.completed && obj.type === 'puzzle' && (obj.target === puzzleId || puzzleId.includes(obj.target))) {
            this.completeObjective(quest.id, obj.id, context);
          }
        });
      }
    });
  }

  addEventListener(event, callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  dispatchEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  }

  showNotification(msg) {
    const notif = document.getElementById('quest-toast');
    if (notif) {
      notif.textContent = msg;
      notif.classList.remove('hidden');
      notif.classList.add('slide-in');
      setTimeout(() => {
        notif.classList.remove('slide-in');
        notif.classList.add('hidden');
      }, 3500);
    }
  }

  getState() {
    return {
      quests: this.quests.map(q => ({
        id: q.id,
        status: q.status,
        objectives: q.objectives.map(o => ({ id: o.id, completed: o.completed, currentAmount: o.currentAmount }))
      })),
      claimedRewards: Array.from(this.claimedRewards)
    };
  }

  restoreState(state) {
    if (!state) return;
    if (Array.isArray(state.claimedRewards)) {
      this.claimedRewards = new Set(state.claimedRewards);
    }

    if (Array.isArray(state.quests)) {
      state.quests.forEach(savedQ => {
        const liveQ = this.getQuest(savedQ.id);
        if (liveQ) {
          liveQ.status = savedQ.status;
          if (Array.isArray(savedQ.objectives)) {
            savedQ.objectives.forEach(savedO => {
              const liveO = liveQ.objectives.find(o => o.id === savedO.id);
              if (liveO) {
                liveO.completed = savedO.completed;
                liveO.currentAmount = savedO.currentAmount || (savedO.completed ? liveO.requiredAmount : 0);
              }
            });
          }
        }
      });
    }

    this.evaluateAvailableQuests();
  }
}

if (typeof window !== 'undefined') {
  window.QuestProgressionSystem = QuestProgressionSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuestProgressionSystem };
}
