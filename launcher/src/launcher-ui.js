/**
 * launcher/src/launcher-ui.js
 * Controller for the PC launcher interface.
 * Implements bilingual support (English/Tamil), crash loop alerts,
 * and running-game update guards.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LauncherUI = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STRINGS = {
    en: {
      play: 'PLAY GAME',
      update: 'UPDATE NOW',
      install: 'INSTALL GAME',
      safeMode: 'SAFE MODE',
      verify: 'VERIFY FILES',
      repair: 'REPAIR',
      settings: 'SETTINGS',
      rollback: 'ROLLBACK TO PREVIOUS',
      gameRunning: 'Game is currently running. Please close the game before updating or repairing.',
      crashLoopAlert: 'The game closed unexpectedly multiple times. We recommend launching in Safe Mode or verifying game files.',
      offlineAlert: 'Unable to check for updates. Offline play is available.',
      statusReady: 'Ready to play',
      statusUpdating: 'Updating game files…',
      statusVerifying: 'Verifying cryptographic checksums…'
    },
    ta: {
      play: 'விளையாட்டைத் தொடங்கு',
      update: 'இப்போதே புதுப்பி',
      install: 'நிறுவு',
      safeMode: 'பாதுகாப்பு முறை',
      verify: 'கோப்புகளைச் சரிபார்',
      repair: 'பழுதுபார்',
      settings: 'அமைப்புகள்',
      rollback: 'முந்தைய பதிப்புக்குத் திரும்பு',
      gameRunning: 'விளையாட்டு தற்போது இயங்குகிறது. புதுப்பிக்க அல்லது பழுதுபார்க்க முதலில் விளையாட்டை மூடவும்.',
      crashLoopAlert: 'விளையாட்டு பலமுறை எதிர்பாராமல் நின்றது. பாதுகாப்பு முறையில் இயக்கவும் அல்லது கோப்புகளைச் சரிபார்க்கவும்.',
      offlineAlert: 'புதுப்பிப்புகளைச் சரிபார்க்க முடியவில்லை. ஆஃப்லைன் முறை தயாராக உள்ளது.',
      statusReady: 'விளையாடத் தயார்',
      statusUpdating: 'கோப்புகள் புதுப்பிக்கப்படுகின்றன…',
      statusVerifying: 'கோப்பு ஒருமைப்பாடு சரிபார்க்கப்படுகிறது…'
    }
  };

  class LauncherUI {
    constructor(launcherState, launcherSettings) {
      this.state = launcherState;
      this.settings = launcherSettings;
      this.currentLang = launcherSettings ? launcherSettings.get('language') : 'en';
    }

    t(key) {
      const langMap = STRINGS[this.currentLang] || STRINGS.en;
      return langMap[key] || STRINGS.en[key] || key;
    }

    setLanguage(lang) {
      if (STRINGS[lang]) {
        this.currentLang = lang;
        if (this.settings) this.settings.set('language', lang);
      }
    }

    /**
     * Determines whether update or repair can proceed safely.
     * Rejects if game process is currently running.
     */
    canModifyGameFiles() {
      if (this.state && this.state.isGameRunning) {
        return {
          allowed: false,
          reason: 'GAME_RUNNING',
          message: this.t('gameRunning')
        };
      }
      return { allowed: true };
    }

    /**
     * Determines whether to trigger the crash loop recovery recommendation.
     */
    checkCrashRecoveryRecommendation() {
      if (this.state && this.state.isCrashLoop()) {
        return {
          recommended: true,
          options: ['SAFE_MODE', 'VERIFY_FILES', 'REPAIR', 'ROLLBACK', 'SUPPORT'],
          message: this.t('crashLoopAlert')
        };
      }
      return { recommended: false };
    }

    /**
     * Formats pre-launch options based on hardware settings and safe mode flag.
     */
    getLaunchArguments(forceSafeMode = false) {
      const isSafe = forceSafeMode || (this.settings && this.settings.get('safeModeLaunch'));
      return {
        safeMode: isSafe,
        args: isSafe ? ['--safe-mode', '--profile=LOW', '--windowed'] : ['--profile=AUTO']
      };
    }
  }

  return LauncherUI;
});
