// ============================================================================
// THE WHISPERING WILDS - SAVE REPOSITORY
// Database access for cloud saves.
// ============================================================================

const db = require('../auth/db');

class SaveRepository {
    getLatestSave(userId) {
        return db.getCloudSave(userId);
    }

    saveCloudSave(userId, saveData, revision, checksum, clientTimestamp, deviceId) {
        return db.saveCloudSave(userId, saveData, revision, checksum, clientTimestamp, deviceId);
    }
}

module.exports = new SaveRepository();
