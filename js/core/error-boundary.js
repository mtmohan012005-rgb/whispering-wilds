/**
 * js/core/error-boundary.js
 * Error boundary system isolating non-critical subsystem exceptions,
 * deduplicating and rate-limiting errors, and routing critical faults to recovery.
 */

(function () {
  'use strict';

  class ErrorBoundary {
    constructor() {
      this._recentErrors = new Map(); // key -> { count, lastTime, sample }
      this._errorLog = [];
      this._maxLogSize = 200;
      this._cooldownMs = 1500; // Rate limit duplicate errors to once per 1.5s
      this._isRecoveryActive = false;

      this._initGlobalHandlers();
    }

    _initGlobalHandlers() {
      window.addEventListener('error', (event) => {
        this.catchError('GlobalWindow', event.error || new Error(event.message), 'CRITICAL', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.catchError('PromiseRejection', error, 'RECOVERABLE', {
          reason: String(event.reason)
        });
      });
    }

    /**
     * Executes a synchronous function inside a protected boundary.
     */
    wrap(systemId, fn, fallback = null, isCritical = false) {
      try {
        return fn();
      } catch (err) {
        const severity = isCritical ? 'CRITICAL' : 'RECOVERABLE';
        this.catchError(systemId, err, severity);
        if (typeof fallback === 'function') {
          try {
            return fallback(err);
          } catch (fallbackErr) {
            this.catchError(`${systemId}_Fallback`, fallbackErr, 'CRITICAL');
          }
        }
        return null;
      }
    }

    /**
     * Executes an asynchronous function inside a protected boundary.
     */
    async wrapAsync(systemId, asyncFn, fallback = null, isCritical = false) {
      try {
        return await asyncFn();
      } catch (err) {
        const severity = isCritical ? 'CRITICAL' : 'RECOVERABLE';
        this.catchError(systemId, err, severity);
        if (typeof fallback === 'function') {
          try {
            return await fallback(err);
          } catch (fallbackErr) {
            this.catchError(`${systemId}_Fallback`, fallbackErr, 'CRITICAL');
          }
        }
        return null;
      }
    }

    /**
     * Catches and records an error with deduplication, rate limiting, and routing.
     */
    catchError(systemId, error, severity = 'RECOVERABLE', context = {}) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const message = errObj.message || 'Unknown error';
      const key = `${systemId}:${message}`;
      const now = Date.now();

      let rateLimited = false;
      if (this._recentErrors.has(key)) {
        const entry = this._recentErrors.get(key);
        entry.count++;
        if (now - entry.lastTime < this._cooldownMs) {
          rateLimited = true;
        } else {
          entry.lastTime = now;
        }
      } else {
        this._recentErrors.set(key, { count: 1, lastTime: now, sample: message });
      }

      const record = {
        id: `ERR_${now}_${Math.floor(Math.random() * 1000)}`,
        systemId,
        message,
        stack: errObj.stack,
        severity, // 'INFO' | 'WARNING' | 'RECOVERABLE' | 'CRITICAL'
        timestamp: now,
        rateLimited,
        region: window.GameState?.world?.currentRegion || 'unknown',
        context
      };

      if (!rateLimited) {
        this._errorLog.push(record);
        if (this._errorLog.length > this._maxLogSize) {
          this._errorLog.shift();
        }

        console.error(`[ErrorBoundary][${severity}][${systemId}]`, message, errObj);

        if (window.DiagnosticsConsole) {
          window.DiagnosticsConsole.recordError(systemId, errObj, severity, context);
        }
      }

      // If critical, trigger the crash recovery pipeline
      if (severity === 'CRITICAL' && !this._isRecoveryActive) {
        this._isRecoveryActive = true;
        if (window.CrashRecoverySystem) {
          window.CrashRecoverySystem.handleCriticalFailure(systemId, errObj, record);
        }
      }

      return record;
    }

    getErrors() {
      return [...this._errorLog];
    }

    clearErrors() {
      this._errorLog = [];
      this._recentErrors.clear();
      this._isRecoveryActive = false;
    }
  }

  window.ErrorBoundary = new ErrorBoundary();
})();
