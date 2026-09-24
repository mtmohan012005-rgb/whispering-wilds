// ============================================================================
// THE WHISPERING WILDS - PROFILE SERVICE
// Business logic for player profile management.
// ============================================================================

const profileRepo = require('./profile-repository');
const { validateProfileUpdate } = require('./profile-validation');

class ProfileService {
    getProfile(userId, userFallback = null) {
        let profile = profileRepo.findByUserId(userId);
        if (!profile && userFallback) {
            profile = profileRepo.upsert(userId, {
                display_name: userFallback.display_name || 'Explorer',
                active_title: 'Wanderer of Tamil Nadu',
                playtime_seconds: 0,
                discoveries_count: 0,
                codex_entries_count: 0,
                achievements_count: 0,
                customization_changes_used: 0,
                preferences: {}
            });
        }
        return profile;
    }

    updateProfile(userId, updateData) {
        const validation = validateProfileUpdate(updateData);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        // Clean update payload
        const allowed = {};
        if (updateData.display_name) allowed.display_name = updateData.display_name.trim();
        if (updateData.active_title) allowed.active_title = updateData.active_title.trim();
        if (updateData.playtime_seconds !== undefined) allowed.playtime_seconds = updateData.playtime_seconds;
        if (updateData.discoveries_count !== undefined) allowed.discoveries_count = updateData.discoveries_count;
        if (updateData.codex_entries_count !== undefined) allowed.codex_entries_count = updateData.codex_entries_count;
        if (updateData.achievements_count !== undefined) allowed.achievements_count = updateData.achievements_count;
        if (updateData.customization_changes_used !== undefined) {
            allowed.customization_changes_used = Math.min(updateData.customization_changes_used, 5);
        }
        if (updateData.preferences) allowed.preferences = updateData.preferences;

        const updated = profileRepo.upsert(userId, allowed);
        return { success: true, profile: updated };
    }
}

module.exports = new ProfileService();
