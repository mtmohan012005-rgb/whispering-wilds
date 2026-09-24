// ============================================================================
// THE WHISPERING WILDS - PROFILE CONTROLLER
// HTTP handlers for profile retrieval and modification.
// ============================================================================

const profileService = require('./profile-service');

class ProfileController {
    async getProfile(req, res) {
        try {
            const profile = profileService.getProfile(req.user.id, req.user);
            return res.status(200).json({ success: true, profile });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
        }
    }

    async updateProfile(req, res) {
        try {
            const result = profileService.updateProfile(req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, errors: result.errors });
            }
            return res.status(200).json({ success: true, profile: result.profile });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Failed to update profile.' });
        }
    }
}

module.exports = new ProfileController();
