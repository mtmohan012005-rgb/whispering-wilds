// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT SAVE & MIGRATION HANDLER
// Version tracking (gameVersion, contentVersion, schemaVersion) and safe migrations.
// Strictly guards the permanent 5-customization ceiling: customizationChangesUsed <= 5.
// ============================================================================

(function () {
  'use strict';

  const CURRENT_VERSIONS = {
    gameVersion: '1.4.0',
    contentVersion: '2026.09.25',
    schemaVersion: 4
  };

  const MAX_CUSTOMIZATION_CEILING = 5;

  class ContentSaveMigration {
    constructor() {
      this.versions = { ...CURRENT_VERSIONS };
    }

    /**
     * Prepare a save payload with current content and schema metadata
     */
    prepareSavePayload(baseState = null) {
      const state = baseState || window.GameState;
      if (!state) return null;

      // Invariant Guard: Player customization changes used MUST be <= 5
      const customUsed = state.player?.customizationChangesUsed ?? 0;
      if (customUsed > MAX_CUSTOMIZATION_CEILING) {
        console.warn(`[ContentSaveMigration] Security Invariant Alert: Customization ceiling (${customUsed}) exceeded ${MAX_CUSTOMIZATION_CEILING}. Clamping.`);
        if (state.player) state.player.customizationChangesUsed = MAX_CUSTOMIZATION_CEILING;
      }

      // Sync quest states if QuestStateMachine active
      if (window.QuestStateMachine) {
        window.QuestStateMachine._saveToGameState();
      }

      // Attach authoritative version tags
      const payload = {
        meta: {
          gameVersion: this.versions.gameVersion,
          contentVersion: this.versions.contentVersion,
          schemaVersion: this.versions.schemaVersion,
          savedAt: new Date().toISOString(),
          timestamp: Date.now()
        },
        data: JSON.parse(JSON.stringify(state))
      };

      return payload;
    }

    /**
     * Validate and migrate incoming save payload to current schema
     */
    migrateSave(rawPayload) {
      if (!rawPayload || typeof rawPayload !== 'object') {
        return { success: false, reason: 'INVALID_PAYLOAD' };
      }

      // Check if wrapped in meta or raw state
      let meta = rawPayload.meta || {};
      let data = rawPayload.data || rawPayload;

      const sourceSchemaVersion = meta.schemaVersion || (data.schemaVersion || 1);
      console.log(`[ContentSaveMigration] Migrating save from schema v${sourceSchemaVersion} to v${this.versions.schemaVersion}`);

      let migratedData = JSON.parse(JSON.stringify(data));
      let currentVersion = sourceSchemaVersion;

      // Schema Migration Pipeline
      // v1 -> v2: Add quests object & states
      if (currentVersion < 2) {
        if (!migratedData.quests) {
          migratedData.quests = { active: [], completed: [], states: {}, rewardHashes: [] };
        }
        currentVersion = 2;
      }

      // v2 -> v3: Add social relationships and reputation mapping
      if (currentVersion < 3) {
        if (!migratedData.social) migratedData.social = { relationships: {} };
        if (!migratedData.reputation) migratedData.reputation = {};
        currentVersion = 3;
      }

      // v3 -> v4: Add contentVersion and data-driven objective tracking
      if (currentVersion < 4) {
        if (migratedData.quests && !migratedData.quests.states) {
          migratedData.quests.states = {};
        }
        if (!migratedData.culturalKnowledge) {
          migratedData.culturalKnowledge = 0;
        }
        currentVersion = 4;
      }

      // CRITICAL INVARIANT: 5-Customization Rule
      if (migratedData.player) {
        if (typeof migratedData.player.customizationChangesUsed !== 'number') {
          migratedData.player.customizationChangesUsed = 0;
        } else if (migratedData.player.customizationChangesUsed > MAX_CUSTOMIZATION_CEILING) {
          console.warn(`[ContentSaveMigration] Clamping customization count from ${migratedData.player.customizationChangesUsed} to ${MAX_CUSTOMIZATION_CEILING}`);
          migratedData.player.customizationChangesUsed = MAX_CUSTOMIZATION_CEILING;
        }
      }

      // Update meta
      const finalPayload = {
        meta: {
          gameVersion: this.versions.gameVersion,
          contentVersion: this.versions.contentVersion,
          schemaVersion: this.versions.schemaVersion,
          migratedFrom: sourceSchemaVersion,
          migratedAt: new Date().toISOString()
        },
        data: migratedData
      };

      return {
        success: true,
        migrated: sourceSchemaVersion < this.versions.schemaVersion,
        fromVersion: sourceSchemaVersion,
        toVersion: this.versions.schemaVersion,
        payload: finalPayload
      };
    }

    /**
     * Restore save into active GameState
     */
    applySaveToGame(payload) {
      const result = this.migrateSave(payload);
      if (!result.success) return result;

      const state = result.payload.data;
      if (typeof window !== 'undefined') {
        window.GameState = state;
        if (window.QuestStateMachine) {
          window.QuestStateMachine.loadFromGameState();
        }
        if (window.DataDialogueSystem) {
          window.DataDialogueSystem._loadRelationshipsFromGameState();
        }
      }

      return {
        success: true,
        customizationChangesUsed: state.player?.customizationChangesUsed ?? 0,
        schemaVersion: result.toVersion
      };
    }
  }

  const instance = new ContentSaveMigration();

  if (typeof window !== 'undefined') {
    window.ContentSaveMigration = instance;
    window.contentSaveMigration = instance;
    window.MAX_CUSTOMIZATION_CEILING = MAX_CUSTOMIZATION_CEILING;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContentSaveMigration, instance, MAX_CUSTOMIZATION_CEILING };
  }
})();
