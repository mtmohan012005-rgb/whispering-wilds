/**
 * js/debug/diagnostics-console.js
 * Developer diagnostic console, error buffering, rate limiting, and system inspection.
 */

(function () {
  'use strict';

  class DiagnosticsConsole {
    constructor() {
      this._errors = [];
      this._events = [];
      this._maxBuffer = 100;
      this._isDebug = true; // Set to false in release bundles
    }

    recordError(systemId, error, severity = 'RECOVERABLE', context = {}) {
      const entry = {
        id: `DIAG_ERR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        systemId,
        message: error.message || String(error),
        stack: error.stack,
        severity,
        context,
        timestamp: Date.now()
      };

      this._errors.push(entry);
      if (this._errors.length > this._maxBuffer) {
        this._errors.shift();
      }

      return entry;
    }

    recordEvent(type, details = {}) {
      const entry = {
        type,
        details,
        timestamp: Date.now()
      };

      this._events.push(entry);
      if (this._events.length > this._maxBuffer) {
        this._events.shift();
      }

      return entry;
    }

    getErrors() {
      return [...this._errors];
    }

    getEvents() {
      return [...this._events];
    }

    report() {
      const snapshot = window.HealthMonitor ? window.HealthMonitor.getDiagnosticSnapshot() : {};
      console.log('=== THE WHISPERING WILDS DIAGNOSTIC REPORT ===');
      console.table(snapshot.health?.subsystems || {});
      return snapshot;
    }

    clear() {
      this._errors = [];
      this._events = [];
    }
  }

  window.DiagnosticsConsole = new DiagnosticsConsole();
  window.wwDiag = window.DiagnosticsConsole;
})();
