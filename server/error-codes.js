// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CANONICAL ERROR CODES
// ============================================================================
//
// Every error surfaced by the persistence / identity layer uses one of these
// codes. The client switches on `code`, never on message text, so messages can
// be reworded without breaking callers.
//
// HTTP status mapping is declared here so routes cannot drift.
// ============================================================================

const ERROR_CODES = {
    // --- Identity / auth (401/403) -----------------------------------------
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    FORBIDDEN: 'FORBIDDEN',
    UID_MISMATCH: 'UID_MISMATCH',

    // --- Validation (400/422) ----------------------------------------------
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    UNSUPPORTED_SCHEMA_VERSION: 'UNSUPPORTED_SCHEMA_VERSION',
    MISSING_CHECKSUM: 'MISSING_CHECKSUM',

    // --- Concurrency (409) -------------------------------------------------
    SAVE_CONFLICT: 'SAVE_CONFLICT',
    REVISION_MISMATCH: 'REVISION_MISMATCH',
    IDEMPOTENCY_REPLAY: 'IDEMPOTENCY_REPLAY',

    // --- Domain rules (403/422) --------------------------------------------
    CUSTOMIZATION_LIMIT_REACHED: 'CUSTOMIZATION_LIMIT_REACHED',
    DUPLICATE_CUSTOMIZATION: 'DUPLICATE_CUSTOMIZATION',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

    // --- Rate limiting (429) ----------------------------------------------
    RATE_LIMITED: 'RATE_LIMITED',
    RETRY_AFTER_REQUIRED: 'RETRY_AFTER_REQUIRED',

    // --- Backend state (503) ----------------------------------------------
    FIREBASE_NOT_CONFIGURED: 'FIREBASE_NOT_CONFIGURED',
    DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
    NOT_READY: 'NOT_READY',

    // --- Server (500) ------------------------------------------------------
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

const STATUS_BY_CODE = {
    [ERROR_CODES.UNAUTHENTICATED]: 401,
    [ERROR_CODES.INVALID_TOKEN]: 401,
    [ERROR_CODES.TOKEN_EXPIRED]: 401,
    [ERROR_CODES.FORBIDDEN]: 403,
    [ERROR_CODES.UID_MISMATCH]: 403,
    [ERROR_CODES.VALIDATION_FAILED]: 400,
    [ERROR_CODES.INVALID_PAYLOAD]: 400,
    [ERROR_CODES.PAYLOAD_TOO_LARGE]: 413,
    [ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION]: 422,
    [ERROR_CODES.MISSING_CHECKSUM]: 422,
    [ERROR_CODES.SAVE_CONFLICT]: 409,
    [ERROR_CODES.REVISION_MISMATCH]: 409,
    [ERROR_CODES.IDEMPOTENCY_REPLAY]: 409,
    [ERROR_CODES.CUSTOMIZATION_LIMIT_REACHED]: 403,
    [ERROR_CODES.DUPLICATE_CUSTOMIZATION]: 422,
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 422,
    [ERROR_CODES.RATE_LIMITED]: 429,
    [ERROR_CODES.RETRY_AFTER_REQUIRED]: 429,
    [ERROR_CODES.FIREBASE_NOT_CONFIGURED]: 503,
    [ERROR_CODES.DEPENDENCY_UNAVAILABLE]: 503,
    [ERROR_CODES.NOT_READY]: 503,
    [ERROR_CODES.INTERNAL_ERROR]: 500
};

const DEFAULT_MESSAGES = {
    [ERROR_CODES.UNAUTHENTICATED]: 'Authentication required.',
    [ERROR_CODES.INVALID_TOKEN]: 'Invalid identity token.',
    [ERROR_CODES.TOKEN_EXPIRED]: 'Identity token has expired.',
    [ERROR_CODES.FORBIDDEN]: 'Not permitted.',
    [ERROR_CODES.UID_MISMATCH]: 'Identity does not match the requested player.',
    [ERROR_CODES.VALIDATION_FAILED]: 'Payload failed validation.',
    [ERROR_CODES.INVALID_PAYLOAD]: 'Payload is malformed.',
    [ERROR_CODES.PAYLOAD_TOO_LARGE]: 'Payload exceeds the allowed size.',
    [ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION]: 'Save schema version is not supported.',
    [ERROR_CODES.MISSING_CHECKSUM]: 'Save payload checksum is required.',
    [ERROR_CODES.SAVE_CONFLICT]: 'A newer save already exists. Reload before saving.',
    [ERROR_CODES.REVISION_MISMATCH]: 'Save revision does not match the stored revision.',
    [ERROR_CODES.IDEMPOTENCY_REPLAY]: 'This request was already processed.',
    [ERROR_CODES.CUSTOMIZATION_LIMIT_REACHED]: 'Maximum of 5 permanent appearance changes reached.',
    [ERROR_CODES.DUPLICATE_CUSTOMIZATION]: 'This change has already been applied.',
    [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Not enough currency for this change.',
    [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Retry later.',
    [ERROR_CODES.RETRY_AFTER_REQUIRED]: 'Retry after the indicated delay.',
    [ERROR_CODES.FIREBASE_NOT_CONFIGURED]: 'Persistence backend is not configured.',
    [ERROR_CODES.DEPENDENCY_UNAVAILABLE]: 'A required dependency is unavailable.',
    [ERROR_CODES.NOT_READY]: 'Service is not ready.',
    [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error.'
};

class AppError extends Error {
    constructor(code, message, details) {
        super(message || DEFAULT_MESSAGES[code] || 'Error');
        this.name = 'AppError';
        this.code = code;
        this.status = STATUS_BY_CODE[code] || 500;
        this.details = details || undefined;
        this.expose = true;
    }

    toJSON(requestId) {
        const body = {
            success: false,
            code: this.code,
            message: this.message
        };
        if (this.details) body.details = this.details;
        if (requestId) body.requestId = requestId;
        return body;
    }
}

function toAppError(code, message, details) {
    if (code instanceof AppError) return code;
    return new AppError(code || ERROR_CODES.INTERNAL_ERROR, message, details);
}

function statusForCode(code) {
    return STATUS_BY_CODE[code] || 500;
}

function isAppError(err) {
    return Boolean(err) && err.name === 'AppError' && typeof err.code === 'string';
}

module.exports = {
    ERROR_CODES,
    STATUS_BY_CODE,
    DEFAULT_MESSAGES,
    AppError,
    toAppError,
    statusForCode,
    isAppError
};
