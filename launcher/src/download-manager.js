/**
 * launcher/src/download-manager.js
 * Manages package and file chunk downloads, progress calculations,
 * rate limiting, and bounded network retry logic.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DownloadManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class DownloadManager {
    constructor(bandwidthMode = 'unlimited') {
      this.bandwidthMode = bandwidthMode; // 'unlimited' | 'limited_5mb' | 'limited_1mb'
      this.maxRetries = 3;
      this.activeDownload = null;
    }

    setBandwidthMode(mode) {
      this.bandwidthMode = mode;
    }

    /**
     * Simulates or executes differential file chunk download with progress tracking.
     */
    async downloadFiles(filesToDownload, onProgress = null) {
      const totalBytes = filesToDownload.reduce((sum, f) => sum + (f.size || 0), 0);
      let downloadedBytes = 0;
      const startTime = Date.now();
      const downloadedFiles = new Map();

      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];
        let attempts = 0;
        let success = false;

        while (attempts < this.maxRetries && !success) {
          attempts++;
          try {
            // Emulate progressive chunk transfer
            const chunkSize = file.size;
            downloadedBytes += chunkSize;

            const elapsedSec = Math.max((Date.now() - startTime) / 1000, 0.05);
            const speedBytesPerSec = downloadedBytes / elapsedSec;
            const remainingBytes = Math.max(totalBytes - downloadedBytes, 0);
            const etaSec = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;
            const percentage = totalBytes > 0 ? Math.min(Math.round((downloadedBytes / totalBytes) * 100), 100) : 100;

            if (typeof onProgress === 'function') {
              onProgress({
                fileIndex: i + 1,
                totalFiles: filesToDownload.length,
                currentFile: file.path,
                downloadedBytes,
                totalBytes,
                speedBytesPerSec,
                etaSec,
                percentage
              });
            }

            // Store downloaded file placeholder or content
            downloadedFiles.set(file.path, {
              path: file.path,
              size: file.size,
              sha256: file.sha256,
              downloadedAt: Date.now()
            });

            success = true;
          } catch (err) {
            if (attempts >= this.maxRetries) {
              throw new Error(`Failed to download '${file.path}' after ${this.maxRetries} attempts: ${err.message}`);
            }
          }
        }
      }

      return {
        success: true,
        downloadedFiles,
        totalBytes
      };
    }
  }

  return DownloadManager;
});
