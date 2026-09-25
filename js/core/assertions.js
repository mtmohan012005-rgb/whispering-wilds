/**
 * js/core/assertions.js
 * Invariant checking and type/range assertions for The Whispering Wilds.
 * Ensures invalid states are identified early with descriptive contexts.
 */

(function () {
  'use strict';

  class AssertionError extends Error {
    constructor(message, code = 'ASSERTION_FAILED', context = {}) {
      super(message);
      this.name = 'AssertionError';
      this.code = code;
      this.context = context;
      this.timestamp = Date.now();
    }
  }

  const Assertions = {
    AssertionError,

    assert(condition, message, code = 'ASSERTION_FAILED', context = {}) {
      if (!condition) {
        const error = new AssertionError(message || 'Assertion failed', code, context);
        if (window.DiagnosticsConsole) {
          window.DiagnosticsConsole.recordError('Assertions', error, 'CRITICAL');
        }
        throw error;
      }
      return true;
    },

    assertNumber(val, min = -Infinity, max = Infinity, name = 'Value') {
      if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
        throw new AssertionError(`${name} must be a finite number, received: ${val}`, 'INVALID_NUMBER', { val, name });
      }
      if (val < min || val > max) {
        throw new AssertionError(`${name} must be between ${min} and ${max}, received: ${val}`, 'OUT_OF_BOUNDS', { val, min, max, name });
      }
      return val;
    },

    assertString(val, name = 'Value', allowEmpty = false) {
      if (typeof val !== 'string') {
        throw new AssertionError(`${name} must be a string, received: ${typeof val}`, 'INVALID_STRING', { val, name });
      }
      if (!allowEmpty && val.trim().length === 0) {
        throw new AssertionError(`${name} must not be empty`, 'EMPTY_STRING', { val, name });
      }
      return val;
    },

    assertObject(val, name = 'Object') {
      if (typeof val !== 'object' || val === null || Array.isArray(val)) {
        throw new AssertionError(`${name} must be a non-null object`, 'INVALID_OBJECT', { val, name });
      }
      return val;
    },

    assertArray(val, name = 'Array') {
      if (!Array.isArray(val)) {
        throw new AssertionError(`${name} must be an array`, 'INVALID_ARRAY', { val, name });
      }
      return val;
    },

    assertEnum(val, validValues, name = 'Enum') {
      if (!Array.isArray(validValues) || !validValues.includes(val)) {
        throw new AssertionError(`${name} must be one of [${validValues.join(', ')}], received: ${val}`, 'INVALID_ENUM', { val, validValues, name });
      }
      return val;
    },

    assertInRange(val, min, max, name = 'Range') {
      return this.assertNumber(val, min, max, name);
    }
  };

  window.Assertions = Assertions;
  window.assert = Assertions.assert.bind(Assertions);
})();
