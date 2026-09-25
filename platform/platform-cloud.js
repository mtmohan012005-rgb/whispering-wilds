/**
 * PlatformCloud - Storefront Cloud Save Integration & Conflict Resolution
 * Handles checksummed save packaging, schema validation, and 3-way conflict resolution.
 * Strictly preserves the <= 5 customization changes ceiling.
 */

(function(root) {
  class PlatformCloud {
    constructor(provider, session) {
      this.provider = provider;
      this.session = session;
    }

    _calculateChecksum(dataString) {
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return 'ck_' + Math.abs(hash).toString(16);
    }

    preparePackage(savePayload) {
      if (!savePayload || typeof savePayload !== 'object') {
        throw new Error('Invalid save payload for cloud upload');
      }

      // Ensure customization ceiling is respected
      if (savePayload.player && typeof savePayload.player.customizationChangesUsed === 'number') {
        savePayload.player.customizationChangesUsed = Math.min(5, Math.max(0, savePayload.player.customizationChangesUsed));
      }

      const serialized = JSON.stringify(savePayload);
      const checksum = this._calculateChecksum(serialized);

      return {
        saveVersion: savePayload.version || '3.0.0',
        gameVersion: '1.0.0',
        timestamp: Date.now(),
        checksum,
        profileId: savePayload.profileId || 'default',
        regionId: (savePayload.world && savePayload.world.currentRegion) || 'chennai',
        storyChapter: (savePayload.story && savePayload.story.chapter) || 1,
        playTimeSeconds: savePayload.playTime || 0,
        customizationChangesUsed: (savePayload.player && savePayload.player.customizationChangesUsed) || 0,
        payload: serialized
      };
    }

    validateCloudPackage(pkg) {
      if (!pkg || typeof pkg !== 'object' || !pkg.payload || !pkg.checksum) {
        return { valid: false, error: 'Malformed cloud save package' };
      }

      const expectedChecksum = this._calculateChecksum(pkg.payload);
      if (expectedChecksum !== pkg.checksum) {
        return { valid: false, error: 'Checksum mismatch on cloud package' };
      }

      try {
        const parsed = JSON.parse(pkg.payload);
        if (parsed.player && parsed.player.customizationChangesUsed > 5) {
          return { valid: false, error: 'Cloud package violates customization ceiling (>5)' };
        }
        return { valid: true, data: parsed };
      } catch (e) {
        return { valid: false, error: 'Failed parsing cloud payload JSON' };
      }
    }

    detectConflict(localSaveMeta, cloudPackage) {
      if (!localSaveMeta || !cloudPackage) {
        return { hasConflict: false };
      }

      const localTime = localSaveMeta.timestamp || 0;
      const cloudTime = cloudPackage.timestamp || 0;
      const timeDiff = Math.abs(localTime - cloudTime);

      // If timestamps differ by more than 5 seconds and content differs
      if (timeDiff > 5000 && localSaveMeta.checksum !== cloudPackage.checksum) {
        return {
          hasConflict: true,
          local: {
            timestamp: localTime,
            formattedDate: new Date(localTime).toLocaleString(),
            region: localSaveMeta.regionId || 'Unknown',
            chapter: localSaveMeta.storyChapter || 1,
            playTime: localSaveMeta.playTimeSeconds || 0
          },
          cloud: {
            timestamp: cloudTime,
            formattedDate: new Date(cloudTime).toLocaleString(),
            region: cloudPackage.regionId || 'Unknown',
            chapter: cloudPackage.storyChapter || 1,
            playTime: cloudPackage.playTimeSeconds || 0
          },
          recommended: cloudTime > localTime ? 'CLOUD' : 'LOCAL'
        };
      }

      return { hasConflict: false };
    }

    async uploadSave(slotId, savePayload) {
      if (!this.session || !this.session.isOnline || !this.provider) {
        return { success: false, reason: 'OFFLINE' };
      }

      const pkg = this.preparePackage(savePayload);
      try {
        const res = await this.provider.saveCloud(slotId, pkg);
        if (res && res.status === 'NOT_SUPPORTED') {
          return { success: false, status: 'NOT_SUPPORTED', message: res.message };
        }
        return { success: true, result: res };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async downloadSave(slotId) {
      if (!this.session || !this.session.isOnline || !this.provider) {
        return { success: false, reason: 'OFFLINE' };
      }

      try {
        const pkg = await this.provider.loadCloud(slotId);
        const validation = this.validateCloudPackage(pkg);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        return { success: true, data: validation.data, packageInfo: pkg };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformCloud;
  } else {
    root.PlatformCloud = PlatformCloud;
  }
})(typeof window !== 'undefined' ? window : global);
