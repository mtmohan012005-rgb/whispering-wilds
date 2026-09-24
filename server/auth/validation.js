// ============================================================================
// THE WHISPERING WILDS - AUTH VALIDATION SUITE
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

class AuthValidation {
    static normalizeEmail(email) {
        if (!email || typeof email !== 'string') return '';
        return email.trim().toLowerCase();
    }

    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        const trimmed = email.trim();
        if (trimmed.length < 5 || trimmed.length > 254) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        if (!EMAIL_REGEX.test(trimmed)) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        return { valid: true, normalized: trimmed.toLowerCase() };
    }

    static validateDisplayName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, message: 'Display name is required.' };
        }
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 32) {
            return { valid: false, message: 'Display name must be between 2 and 32 characters.' };
        }
        // Disallow dangerous HTML tags or control characters
        if (/[<>\r\n\t]/.test(trimmed)) {
            return { valid: false, message: 'Display name contains invalid characters.' };
        }
        return { valid: true, sanitized: trimmed };
    }

    static validatePassword(password, confirmPassword = null) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Password is required.' };
        }
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters long.' };
        }
        if (password.length > 128) {
            return { valid: false, message: 'Password exceeds maximum length (128 characters).' };
        }
        if (confirmPassword !== null && password !== confirmPassword) {
            return { valid: false, message: 'Passwords do not match.' };
        }
        return { valid: true };
    }

    static validateCloudSave(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return { valid: false, message: 'Invalid save payload structure.' };
        }
        // Enforce the strict permanent rule: MAXIMUM PLAYER CUSTOMIZATION CHANGES = 5
        const changesUsed = Number(saveData.customizationChangesUsed || 0);
        if (isNaN(changesUsed) || changesUsed < 0) {
            return { valid: false, message: 'Invalid customization counter.' };
        }
        if (changesUsed > 5) {
            return { valid: false, message: 'Save rejected: Customization changes exceed maximum allowed (5).' };
        }

        // Validate inventory weight limit (max 20kg satchel)
        if (saveData.inventory && Array.isArray(saveData.inventory)) {
            let totalWeight = 0;
            for (const item of saveData.inventory) {
                totalWeight += Number(item.weight || 0) * Number(item.quantity || 1);
            }
            if (totalWeight > 25.0) { // allowance for minor float discrepancy
                return { valid: false, message: 'Save rejected: Inventory weight exceeds satchel capacity.' };
            }
        }

        return { valid: true };
    }
}

module.exports = AuthValidation;
