// ============================================================================
// THE WHISPERING WILDS - SAVE VALIDATION
// Schema validation and strict customization ceiling enforcement for saves.
// ============================================================================

function validateSavePayload(payload) {
    const errors = [];

    if (!payload || typeof payload !== 'object') {
        return { isValid: false, errors: ['Save payload must be a non-null object.'] };
    }

    if (!payload.data || typeof payload.data !== 'object') {
        errors.push('Save payload must contain a "data" object.');
    } else {
        const data = payload.data;

        // Strict Customization Ceiling: customizationChangesUsed <= 5
        if (data.customizationChangesUsed !== undefined) {
            if (typeof data.customizationChangesUsed !== 'number' || data.customizationChangesUsed < 0) {
                errors.push('customizationChangesUsed must be a non-negative number.');
            } else if (data.customizationChangesUsed > 5) {
                errors.push('customizationChangesUsed exceeds permanent ceiling of 5.');
            }
        }

        // Validate currency
        if (data.currency !== undefined && (typeof data.currency !== 'number' || data.currency < 0)) {
            errors.push('Currency must be a non-negative number.');
        }

        // Validate player position structure if present
        if (data.position && (typeof data.position.x !== 'number' || typeof data.position.z !== 'number')) {
            errors.push('Invalid player coordinates structure in save data.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateSavePayload
};
