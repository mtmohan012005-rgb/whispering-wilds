// ============================================================================
// THE WHISPERING WILDS - PROFILE VALIDATION
// Profile field validation and customization ceiling enforcement.
// ============================================================================

function validateProfileUpdate(data) {
    const errors = [];

    if (data.display_name !== undefined) {
        if (typeof data.display_name !== 'string' || data.display_name.trim().length < 2 || data.display_name.trim().length > 30) {
            errors.push('Display name must be between 2 and 30 characters.');
        }
    }

    if (data.active_title !== undefined) {
        if (typeof data.active_title !== 'string' || data.active_title.length > 100) {
            errors.push('Active title must be a valid string up to 100 characters.');
        }
    }

    if (data.customization_changes_used !== undefined) {
        if (typeof data.customization_changes_used !== 'number' || data.customization_changes_used < 0) {
            errors.push('Customization changes used must be a non-negative number.');
        } else if (data.customization_changes_used > 5) {
            errors.push('Customization changes used cannot exceed the permanent limit of 5.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateProfileUpdate
};
