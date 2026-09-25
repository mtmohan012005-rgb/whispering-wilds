/**
 * AppLifecycle - Application Lifecycle, Power Events, Alt-Tab & Background Throttling
 * Manages OS sleep/resume, focus changes, Alt-Tab input reset, background throttling, and graceful shutdown.
 */

const crashHandler = require('./crash-handler');

class AppLifecycle {
  constructor() {
    this.powerMonitor = null;
    this.mainWindow = null;
    this.isSuspended = false;
    this.isFocused = true;
    this.isMinimized = false;
    this.hasUnsavedProgress = false;
  }

  init(app, powerMonitor, windowManager) {
    this.powerMonitor = powerMonitor;
    this.windowManager = windowManager;
    this.mainWindow = windowManager.getMainWindow();

    if (!this.mainWindow) return;

    // 1. Focus / Blur Handling (Alt-Tab)
    this.mainWindow.on('blur', () => {
      this.isFocused = false;
      crashHandler.addBreadcrumb('lifecycle', 'Window lost focus (Alt-Tab/blur).');
      this.windowManager.notifyRenderer('desktop:focus-changed', {
        focused: false,
        resetInput: true,
        autoPause: true
      });
    });

    this.mainWindow.on('focus', () => {
      this.isFocused = true;
      crashHandler.addBreadcrumb('lifecycle', 'Window regained focus.');
      this.windowManager.notifyRenderer('desktop:focus-changed', {
        focused: true,
        resetInput: true,
        autoPause: false
      });
    });

    // 2. Minimize / Restore Handling
    this.mainWindow.on('minimize', () => {
      this.isMinimized = true;
      crashHandler.addBreadcrumb('lifecycle', 'Window minimized. Throttling background simulation.');
      this.windowManager.notifyRenderer('desktop:visibility-changed', {
        visible: false,
        throttleSimulation: true
      });
    });

    this.mainWindow.on('restore', () => {
      this.isMinimized = false;
      crashHandler.addBreadcrumb('lifecycle', 'Window restored from minimize.');
      this.windowManager.notifyRenderer('desktop:visibility-changed', {
        visible: true,
        throttleSimulation: false,
        resetDeltaTime: true
      });
    });

    // 3. Power Monitor Events (Sleep/Wake / Laptop Lid)
    if (this.powerMonitor) {
      this.powerMonitor.on('suspend', () => {
        this.isSuspended = true;
        crashHandler.addBreadcrumb('lifecycle', 'OS suspend/sleep triggered. Freezing game state.');
        this.windowManager.notifyRenderer('desktop:power-event', {
          event: 'suspend',
          freezeSimulation: true,
          saveSafetyCheckpoint: true
        });
      });

      this.powerMonitor.on('resume', () => {
        this.isSuspended = false;
        crashHandler.addBreadcrumb('lifecycle', 'OS resume from sleep. Realigning clock & resetting input.');
        this.windowManager.notifyRenderer('desktop:power-event', {
          event: 'resume',
          resetDeltaTime: true,
          resetInput: true
        });
      });

      this.powerMonitor.on('lock-screen', () => {
        this.windowManager.notifyRenderer('desktop:power-event', {
          event: 'lock-screen',
          autoPause: true
        });
      });
    }

    // 4. Safe Close Interception
    this.mainWindow.on('close', (event) => {
      if (this.hasUnsavedProgress) {
        // Allow game renderer to perform quick local save or confirm
        event.preventDefault();
        this.windowManager.notifyRenderer('desktop:request-safe-exit', {});
      } else {
        crashHandler.onAppCleanShutdown();
      }
    });
  }

  setUnsavedProgress(hasProgress) {
    this.hasUnsavedProgress = !!hasProgress;
  }

  forceExit() {
    this.hasUnsavedProgress = false;
    crashHandler.onAppCleanShutdown();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
    }
  }
}

module.exports = new AppLifecycle();
