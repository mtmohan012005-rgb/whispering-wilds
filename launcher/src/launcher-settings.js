/**
 * launcher/src/launcher-settings.js
 * Manages desktop launcher preferences, installation directories,
 * release channels, and language selections (separate from game save data).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LauncherSettings = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class LauncherSettings {
    constructor() {
      this.defaults = {
        installPath: 'C:\\Games\\TheWhisperingWilds\\app',
        userDataPath: 'C:\\Users\\User\\AppData\\Local\\TheWhisperingWilds\\savedata',
        releaseChannel: 'stable', // 'stable' | 'beta'
        bandwidthLimit: 'unlimited', // 'unlimited' | 'limited_5mb' | 'limited_1mb'
        language: 'en', // 'en' | 'ta'
        safeModeLaunch: false,
        highContrast: false,
        autoVerifyOnStartup: true
      };

      this.current = { ...this.defaults };
    }

    get(key) {
      return this.current[key] !== undefined ? this.current[key] : this.defaults[key];
    }

    set(key, value) {
      this.current[key] = value;
      return value;
    }

    reset() {
      this.current = { ...this.defaults };
    }

    exportConfig() {
      return JSON.stringify(this.current, null, 2);
    }

    importConfig(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object') {
          this.current = { ...this.defaults, ...parsed };
          return true;
        }
      } catch (_) {}
      return false;
    }
  }

  return LauncherSettings;
});
