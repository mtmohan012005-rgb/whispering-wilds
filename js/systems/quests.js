/**
 * The Whispering Wilds (Kaattu Vazhi) - Quest & Narrative Progression System
 * Adapts legacy QuestManager interface to the authoritative QuestProgressionSystem,
 * maintaining full backward compatibility for existing callers and automated tests.
 */

class QuestManager {
  constructor() {
    // Instantiate or reference authoritative progression system
    if (typeof window.QuestProgressionSystem !== 'undefined') {
      this.progression = new window.QuestProgressionSystem(
        window.QUEST_PRODUCTION_DATA,
        window.worldUnlockSystem,
        window.investigationSystem
      );
      window.questProgression = this.progression;
    } else {
      this.progression = null;
    }

    // Build unified quest list supporting legacy properties (.done, .reward)
    this.syncLegacyQuests();
  }

  syncLegacyQuests() {
    if (!this.progression) {
      this.quests = [];
      return;
    }

    // Expose array of quests formatted for legacy consumers (e.g. FieldJournal, test scripts)
    this.quests = this.progression.quests.map(q => {
      // Create a compatible view
      const legacyQ = Object.create(q);
      legacyQ.reward = Array.isArray(q.rewards)
        ? q.rewards.map(r => r.name || (r.type === 'currency' ? `₹${r.amount} Rupees` : r.type)).join(', ')
        : (q.reward || "Cultural Discovery & Story Progress");

      legacyQ.objectives = q.objectives.map(o => {
        const legacyO = Object.create(o);
        Object.defineProperty(legacyO, 'done', {
          get: () => !!o.completed,
          set: (v) => { o.completed = !!v; }
        });
        return legacyO;
      });

      return legacyQ;
    });
  }

  /**
   * Maps legacy quest IDs to production quest IDs
   */
  mapQuestId(questId) {
    const aliasMap = {
      'main_prologue': 'main_missing_trail',
      'side_bull': 'side_selvam_bull',
      'main_delta': 'main_pichavaram_water',
      'main_ghats': 'main_nilgiris_mist'
    };
    return aliasMap[questId] || questId;
  }

  /**
   * Maps legacy objective IDs to production objective IDs
   */
  mapObjId(questId, objId) {
    const objMap = {
      'main_missing_trail': {
        'inspect_heist': 'find_first_clue',
        'follow_tracks': 'follow_tracks',
        'talk_murugan': 'talk_murugan'
      },
      'side_selvam_bull': {
        'find_bull': 'find_missing_bull',
        'photo_bull': 'photo_bull',
        'report_selvam': 'report_selvam'
      },
      'main_pichavaram_water': {
        'reach_mangroves': 'travel_to_pichavaram',
        'solve_waterwheel': 'operate_waterwheel_mechanism'
      },
      'main_nilgiris_mist': {
        'reach_ghats': 'travel_into_nilgiris',
        'survive_cold': 'obtain_suitable_clothing',
        'photo_tahr': 'photo_nilgiri_tahr',
        'unlock_portal': 'unlock_final_chapter'
      }
    };

    const qMap = objMap[questId];
    if (qMap && qMap[objId]) {
      return qMap[objId];
    }
    return objId;
  }

  completeObjective(questId, objId, audio) {
    const targetQuestId = this.mapQuestId(questId);
    const targetObjId = this.mapObjId(targetQuestId, objId);

    if (this.progression) {
      // Forward to authoritative progression engine
      const success = this.progression.completeObjective(targetQuestId, targetObjId, { audio });
      this.syncLegacyQuests();
      return success;
    }

    return false;
  }

  showQuestNotification(msg) {
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
}

window.QuestManager = QuestManager;
