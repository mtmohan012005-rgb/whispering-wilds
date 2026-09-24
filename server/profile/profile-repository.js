// ============================================================================
// THE WHISPERING WILDS - PROFILE REPOSITORY
// Database access for player profiles and public stats.
// ============================================================================

const db = require('../auth/db');

class ProfileRepository {
    findByUserId(userId) {
        return db.getProfile(userId);
    }

    upsert(userId, profileData) {
        return db.upsertProfile(userId, profileData);
    }
}

module.exports = new ProfileRepository();
