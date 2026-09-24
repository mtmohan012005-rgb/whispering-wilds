// ============================================================================
// THE WHISPERING WILDS - SAVE SERVICE
// Cloud save synchronization, revision control, and conflict resolution.
// ============================================================================

const crypto = require('crypto');
const saveRepo = require('./save-repository');
const { validateSavePayload } = require('./save-validation');
const { migrateSaveData } = require('./save-migration');

function computeChecksum(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

class SaveService {
    getLatestSave(userId) {
        const record = saveRepo.getLatestSave(userId);
        if (!record) return null;
        return migrateSaveData(record);
    }

    saveGame(userId, payload, force = false) {
        const validation = validateSavePayload(payload);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        const currentCloud = saveRepo.getLatestSave(userId);
        const clientRevision = payload.revision || 1;

        if (currentCloud && !force) {
            const serverRevision = currentCloud.revision || 1;
            if (clientRevision < serverRevision) {
                return {
                    conflict: true,
                    clientRevision,
                    serverRevision,
                    cloudSave: migrateSaveData(currentCloud),
                    message: 'Cloud save revision is ahead of local save.'
                };
            }
        }

        const newRevision = currentCloud ? (currentCloud.revision + 1) : 1;
        const checksum = computeChecksum(payload.data);
        const migrated = migrateSaveData({ data: payload.data });

        // Enforce customization limit
        if (migrated.data.customizationChangesUsed > 5) {
            migrated.data.customizationChangesUsed = 5;
        }

        const saved = saveRepo.saveCloudSave(
            userId,
            migrated.data,
            newRevision,
            checksum,
            payload.clientTimestamp,
            payload.deviceId
        );

        return {
            success: true,
            revision: newRevision,
            serverTimestamp: saved.server_timestamp,
            checksum: checksum
        };
    }

    resolveConflict(userId, resolution) {
        const currentCloud = saveRepo.getLatestSave(userId);
        if (!currentCloud) {
            return this.saveGame(userId, resolution.localPayload, true);
        }

        const strategy = resolution.strategy; // 'local', 'cloud', or 'merge'

        if (strategy === 'cloud') {
            return {
                success: true,
                resolvedSave: migrateSaveData(currentCloud)
            };
        }

        if (strategy === 'local') {
            return this.saveGame(userId, resolution.localPayload, true);
        }

        if (strategy === 'merge') {
            const localData = resolution.localPayload.data || {};
            const cloudData = currentCloud.data || {};

            const merged = { ...cloudData, ...localData };

            // Union achievements
            const localAch = (localData.achievements && localData.achievements.unlocked) || [];
            const cloudAch = (cloudData.achievements && cloudData.achievements.unlocked) || [];
            const allAch = Array.from(new Set([...localAch, ...cloudAch]));
            merged.achievements = {
                ...(localData.achievements || {}),
                unlocked: allAch
            };

            // Union codex entries
            const localCodex = (localData.codex && localData.codex.unlockedEntries) || [];
            const cloudCodex = (cloudData.codex && cloudData.codex.unlockedEntries) || [];
            merged.codex = {
                ...(localData.codex || {}),
                unlockedEntries: Array.from(new Set([...localCodex, ...cloudCodex]))
            };

            // Union discoveries
            const localDisc = (localData.discoveries && localData.discoveries.discoveredPoints) || [];
            const cloudDisc = (cloudData.discoveries && cloudData.discoveries.discoveredPoints) || [];
            merged.discoveries = {
                ...(localData.discoveries || {}),
                discoveredPoints: Array.from(new Set([...localDisc, ...cloudDisc]))
            };

            // Authoritative max currency
            merged.currency = Math.max(localData.currency || 0, cloudData.currency || 0);

            // Highest chapter completed
            const localChIdx = (localData.story && localData.story.activeChapterIndex) || 0;
            const cloudChIdx = (cloudData.story && cloudData.story.activeChapterIndex) || 0;
            merged.story = {
                ...(cloudData.story || {}),
                ...(localData.story || {}),
                activeChapterIndex: Math.max(localChIdx, cloudChIdx),
                storyCompleted: !!(localData.story?.storyCompleted || cloudData.story?.storyCompleted)
            };

            // Strict Customization ceiling: maximum of changes used capped at 5
            const localCust = localData.customizationChangesUsed || 0;
            const cloudCust = cloudData.customizationChangesUsed || 0;
            merged.customizationChangesUsed = Math.min(Math.max(localCust, cloudCust), 5);

            return this.saveGame(userId, { data: merged }, true);
        }

        return { success: false, message: 'Invalid conflict resolution strategy.' };
    }
}

module.exports = new SaveService();
