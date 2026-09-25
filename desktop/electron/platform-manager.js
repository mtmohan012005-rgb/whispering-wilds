/**
 * PlatformManager - Cross-Platform Detection & Capability Provider
 * Provides unified platform, architecture, and feature capability introspection.
 * Strictly used for desktop integration layer (never leaks OS checks into gameplay logic).
 */

const os = require('os');
const process = require('process');

class PlatformManager {
  constructor() {
    this.platform = process.platform; // 'win32', 'darwin', 'linux'
    this.arch = process.arch;         // 'x64', 'arm64', 'ia32'
    this._cachedCapabilities = null;
  }

  isWindows() {
    return this.platform === 'win32';
  }

  isMacOS() {
    return this.platform === 'darwin';
  }

  isLinux() {
    return this.platform === 'linux';
  }

  isArm64() {
    return this.arch === 'arm64';
  }

  isX64() {
    return this.arch === 'x64';
  }

  getPlatformName() {
    if (this.isWindows()) return 'Windows';
    if (this.isMacOS()) return 'macOS';
    if (this.isLinux()) return 'Linux';
    return this.platform;
  }

  getArchitecture() {
    return this.arch;
  }

  getOSVersion() {
    return os.release();
  }

  getTotalMemoryMB() {
    return Math.round(os.totalmem() / (1024 * 1024));
  }

  getCPUCores() {
    const cpus = os.cpus();
    return cpus ? cpus.length : 1;
  }

  getCPUModel() {
    const cpus = os.cpus();
    return cpus && cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
  }

  getCapabilities() {
    if (this._cachedCapabilities) {
      return { ...this._cachedCapabilities };
    }

    const caps = {
      fullscreen: true,
      borderless: true,
      windowed: true,
      gamepad: true,
      nativePaths: true,
      fileSave: true,
      update: true,
      notifications: true,
      retinaDisplay: this.isMacOS(),
      highDpiScaling: true,
      waylandSupported: this.isLinux(),
      x11Supported: this.isLinux(),
      appleSilicon: this.isMacOS() && this.isArm64(),
      intelArchitecture: this.isX64(),
      unicodeFilePaths: true,
      hardwareAcceleration: true
    };

    this._cachedCapabilities = caps;
    return { ...caps };
  }

  getSystemSummary() {
    return {
      platform: this.getPlatformName(),
      platformKey: this.platform,
      arch: this.getArchitecture(),
      osVersion: this.getOSVersion(),
      cpuModel: this.getCPUModel(),
      cpuCores: this.getCPUCores(),
      totalMemoryMB: this.getTotalMemoryMB(),
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Recommend initial hardware profile strictly based on hardware specs,
   * without platform prejudice.
   */
  recommendHardwareProfile(gpuTier = 'MEDIUM') {
    const mem = this.getTotalMemoryMB();
    const cores = this.getCPUCores();

    if (mem < 4096 || cores <= 2) {
      return 'VERY_LOW';
    } else if (mem < 8192 || cores <= 4) {
      return 'LOW';
    } else if (mem < 16384 || cores <= 6) {
      return gpuTier === 'ULTRA' ? 'HIGH' : 'MEDIUM';
    } else {
      return gpuTier === 'HIGH' || gpuTier === 'ULTRA' ? 'ULTRA' : 'HIGH';
    }
  }
}

module.exports = new PlatformManager();
