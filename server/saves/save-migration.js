// ============================================================================
// THE WHISPERING WILDS - SAVE MIGRATION
// Schema evolution and data normalisation across game versions.
// ============================================================================

const CURRENT_SAVE_VERSION = 2;

function migrateSaveData(rawSave) {
    if (!rawSave || !rawSave.data) return rawSave;

    const data = { ...rawSave.data };
    const version = data.version || 1;

    // Enforce customization limit
    if (typeof data.customizationChangesUsed === 'number' && data.customizationChangesUsed > 5) {
        data.customizationChangesUsed = 5;
    }

    if (version < 2) {
        // Upgrade from v1 to v2: Add achievements, codex, sideQuests, secrets, collectibles containers
        if (!data.achievements) data.achievements = { unlocked: [], progress: {}, activeTitle: 'Wanderer of Tamil Nadu' };
        if (!data.codex) data.codex = { unlockedEntries: [], favorites: [], notes: {} };
        if (!data.discoveries) data.discoveries = { discoveredPoints: [], regionalStats: {} };
        if (!data.sideQuests) data.sideQuests = { activeQuestId: null, completedQuests: [], questProgress: {} };
        if (!data.secrets) data.secrets = { discoveredSecrets: [], totalDiscovered: 0 };
        if (!data.collectibles) data.collectibles = { foundCollectibles: [], totalFound: 0 };
        if (!data.story) data.story = { activeChapterIndex: 0, storyCompleted: false, completedChapters: [], collectedEvidence: [], unlockedRegions: ['george_town'] };
        data.version = 2;
    }

    return {
        ...rawSave,
        data,
        version: CURRENT_SAVE_VERSION
    };
}

module.exports = {
    CURRENT_SAVE_VERSION,
    migrateSaveData
};
