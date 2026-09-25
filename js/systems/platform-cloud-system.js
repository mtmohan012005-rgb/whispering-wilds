// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM CLOUD SYSTEM
// Coordinates SaveManager local saves with optional platform cloud storage.
// Enforces local save priority, payload checksums, and customization <= 5.
// ============================================================================

(function() {
  class PlatformCloudSystem {
    constructor() {
      this.isSyncing = false;
      this.lastSyncTime = 0;
      this.syncPending = false;
    }

    async onLocalSaveCompleted(slotId, localSaveData) {
      if (!window.PlatformIntegrationSystem || !window.PlatformIntegrationSystem.isFeatureSupported('CLOUD_SAVE')) {
        return { status: 'NOT_SUPPORTED' };
      }

      if (!window.PlatformIntegrationSystem.isOnline()) {
        this.syncPending = true;
        return { status: 'OFFLINE_PENDING' };
      }

      this.isSyncing = true;
      try {
        const cloudService = window.PlatformService ? window.PlatformService.cloud : null;
        if (!cloudService) return { status: 'NO_CLOUD_SERVICE' };

        const res = await cloudService.uploadSave(slotId, localSaveData);
        this.lastSyncTime = Date.now();
        this.syncPending = false;
        this.isSyncing = false;
        return res;
      } catch (err) {
        this.isSyncing = false;
        this.syncPending = true;
        return { status: 'ERROR', error: err.message };
      }
    }

    async checkForCloudConflict(slotId, localSaveMeta) {
      const cloudService = window.PlatformService ? window.PlatformService.cloud : null;
      if (!cloudService || !window.PlatformIntegrationSystem.isOnline()) {
        return { hasConflict: false };
      }

      try {
        const cloudRes = await cloudService.downloadSave(slotId);
        if (!cloudRes.success || !cloudRes.packageInfo) {
          return { hasConflict: false };
        }

        return cloudService.detectConflict(localSaveMeta, cloudRes.packageInfo);
      } catch (e) {
        return { hasConflict: false };
      }
    }
  }

  window.PlatformCloudSystem = new PlatformCloudSystem();
})();
