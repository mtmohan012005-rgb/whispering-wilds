// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REQUEST CONTEXT MIDDLEWARE
// ============================================================================
//
// Assigns every request a stable requestId and echoes it back, so a user can
// quote it in a bug report and it can be matched to a log line. Incoming
// requestIds are validated to prevent log injection via header smuggling.
// ============================================================================

const crypto = require('crypto');
const Logger = require('../logger');
const { ERROR_CODES, isAppError } = require('../error-codes');

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

function requestContext() {
    return (req, res, next) => {
        const incoming = req.headers['x-request-id'];
        const requestId = (typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming))
            ? incoming
            : crypto.randomUUID();
        req.requestId = requestId;
        res.setHeader('X-Request-Id', requestId);
        next();
    };
}

function requestLogger() {
    return (req, res, next) => {
        const startedAt = process.hrtime.bigint();
        res.on('finish', () => {
            const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
            const level = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
            Logger[level]('[HTTP] request', {
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl ? req.originalUrl.split('?')[0] : req.url,
                status: res.statusCode,
                durationMs: Number(durationMs.toFixed(2))
            });
        });
        next();
    };
}

/**
 * Terminal error handler. Converts AppError to its canonical code + status.
 * Unknown errors are logged with their stack and reported as INTERNAL_ERROR
 * without leaking internals to the client.
 */
function errorHandler() {
    // eslint-disable-next-line no-unused-vars
    return (err, req, res, next) => {
        if (res.headersSent) return;

        if (isAppError(err)) {
            if (err.status >= 500) {
                Logger.error('[HTTP] handled error', { requestId: req.requestId, code: err.code });
            }
            return res.status(err.status).json(err.toJSON(req.requestId));
        }

        Logger.error('[HTTP] unhandled error', {
            requestId: req.requestId,
            error: err && err.message,
            stack: err && err.stack
        });

        res.status(500).json({
            success: false,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Internal server error.',
            requestId: req.requestId
        });
    };
}

/**
 * Wraps an async route handler so rejected promises reach the error handler
 * instead of becoming unhandled rejections.
 */
function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = {
    requestContext,
    requestLogger,
    errorHandler,
    asyncHandler
};
