// ============================================================================
// THE WHISPERING WILDS - SAVE CONTROLLER
// HTTP endpoints for cloud saves and conflict management.
// ============================================================================

const saveService = require('./save-service');

class SaveController {
    async getLatest(req, res) {
        try {
            const save = saveService.getLatestSave(req.user.id);
            if (!save) {
                return res.status(404).json({ success: false, message: 'No cloud save found for this user.' });
            }
            return res.status(200).json({ success: true, save });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve cloud save.' });
        }
    }

    async saveGame(req, res) {
        try {
            const force = req.query.force === 'true';
            const result = saveService.saveGame(req.user.id, req.body, force);

            if (result.conflict) {
                return res.status(409).json({
                    success: false,
                    conflict: true,
                    serverRevision: result.serverRevision,
                    clientRevision: result.clientRevision,
                    cloudSave: result.cloudSave,
                    message: result.message
                });
            }

            if (!result.success) {
                return res.status(400).json({ success: false, errors: result.errors });
            }

            return res.status(200).json({
                success: true,
                revision: result.revision,
                serverTimestamp: result.serverTimestamp,
                checksum: result.checksum
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Failed to save game to cloud.' });
        }
    }

    async resolveConflict(req, res) {
        try {
            const result = saveService.resolveConflict(req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ success: false, message: result.message });
            }
            return res.status(200).json({ success: true, result });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Failed to resolve save conflict.' });
        }
    }
}

module.exports = new SaveController();
