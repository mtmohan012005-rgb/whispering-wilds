/**
 * CrashHandler - Crash Reporting, Breadcrumbs, Safe Mode & Log Management
 * Records bounded, sanitized logs, tracks abnormal exits, manages crash loops, and triggers safe mode recovery.
 */

const fs = require('fs');
const path = require('path');
const pathManager = require('./path-manager');
const platformManager = require('./platform-manager');

class CrashHandler {
  constructor() {
    this.maxLogBytes = 2 * 1024 * 1024; // 2MB cap per log file
    this.maxBreadcrumbs = 50;
    this.breadcrumbs = [];
    this.sessionFile = path.join(pathManager.getUserDataDir(), 'session_state.json');
    this.crashLogPath = pathManager.resolveUserFilePath('log', 'crash.log');
    this.gameLogPath = pathManager.resolveUserFilePath('log', 'game.log');
    this.launcherLogPath = pathManager.resolveUserFilePath('log', 'launcher.log');

    this.crashCountThreshold = 3;
    this.sessionState = this._loadSessionState();
  }

  _loadSessionState() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const raw = fs.readFileSync(this.sessionFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      // Corrupted session file fallback
    }
    return {
      cleanExit: true,
      consecutiveCrashes: 0,
      lastCrashTimestamp: 0,
      safeModeRecommended: false,
      lastRunVersion: '1.0.0'
    };
  }

  _saveSessionState() {
    try {
      fs.writeFileSync(this.sessionFile, JSON.stringify(this.sessionState, null, 2), 'utf8');
    } catch (e) {
      console.warn('[CrashHandler] Failed saving session state:', e.message);
    }
  }

  onAppStartup(version = '1.0.0', buildId = 'PROD-2026.1') {
    this.appVersion = version;
    this.buildId = buildId;

    // Check if previous session ended abnormally
    const hadAbnormalExit = !this.sessionState.cleanExit;

    if (hadAbnormalExit) {
      this.sessionState.consecutiveCrashes = (this.sessionState.consecutiveCrashes || 0) + 1;
      this.addBreadcrumb('startup', `Abnormal previous exit detected. Consecutive crashes: ${this.sessionState.consecutiveCrashes}`);
      if (this.sessionState.consecutiveCrashes >= this.crashCountThreshold) {
        this.sessionState.safeModeRecommended = true;
      }
    } else {
      // Previous session was clean
      this.sessionState.consecutiveCrashes = 0;
      this.sessionState.safeModeRecommended = false;
    }

    // Mark current session as running (unclean until shutdown)
    this.sessionState.cleanExit = false;
    this.sessionState.lastRunVersion = version;
    this._saveSessionState();

    this.log('launcher', `Application started. Version=${version}, Build=${buildId}, Platform=${platformManager.getPlatformName()} (${platformManager.getArchitecture()})`);
  }

  onAppCleanShutdown() {
    this.sessionState.cleanExit = true;
    this.sessionState.consecutiveCrashes = 0;
    this.sessionState.safeModeRecommended = false;
    this._saveSessionState();
    this.log('launcher', 'Application exited cleanly.');
  }

  shouldOfferSafeMode() {
    return !!this.sessionState.safeModeRecommended;
  }

  resetCrashCounter() {
    this.sessionState.consecutiveCrashes = 0;
    this.sessionState.safeModeRecommended = false;
    this._saveSessionState();
  }

  addBreadcrumb(category, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      category: String(category || 'general'),
      message: this._sanitize(String(message || '')),
      metadata: this._sanitizeMetadata(metadata)
    };

    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  _sanitize(text) {
    if (!text || typeof text !== 'string') return '';
    // Strip possible sensitive tokens, passwords, keys
    return text
      .replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED]')
      .replace(/password["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'password=[REDACTED]')
      .replace(/apiKey["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'apiKey=[REDACTED]')
      .replace(/token["']?\s*[:=]\s*["']?[^"',\s]+/gi, 'token=[REDACTED]');
  }

  _sanitizeMetadata(meta) {
    if (!meta || typeof meta !== 'object') return {};
    const clean = {};
    for (const [k, v] of Object.entries(meta)) {
      if (/pass|secret|token|auth|key/i.test(k)) {
        clean[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        clean[k] = this._sanitize(v);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = v;
      }
    }
    return clean;
  }

  log(category, message) {
    const filePath = category === 'launcher' ? this.launcherLogPath : this.gameLogPath;
    this._appendBoundedLog(filePath, `[${new Date().toISOString()}] [${category.toUpperCase()}] ${this._sanitize(message)}\n`);
  }

  recordCrash(errorType, errorObj = {}) {
    const crashReport = {
      timestamp: new Date().toISOString(),
      gameVersion: this.appVersion || '1.0.0',
      buildId: this.buildId || 'PROD-2026.1',
      platform: platformManager.getPlatformName(),
      architecture: platformManager.getArchitecture(),
      osRelease: platformManager.getOSVersion(),
      cpuModel: platformManager.getCPUModel(),
      totalMemoryMB: platformManager.getTotalMemoryMB(),
      errorType: String(errorType || 'UnknownError'),
      errorMessage: this._sanitize(errorObj.message || String(errorObj)),
      stackTrace: this._sanitize(errorObj.stack || ''),
      breadcrumbs: [...this.breadcrumbs]
    };

    const formatted = [
      '================================================================',
      `CRASH REPORT - ${crashReport.timestamp}`,
      `Game Version: ${crashReport.gameVersion} (${crashReport.buildId})`,
      `Platform: ${crashReport.platform} ${crashReport.architecture} (OS: ${crashReport.osRelease})`,
      `CPU: ${crashReport.cpuModel} | RAM: ${crashReport.totalMemoryMB} MB`,
      `Error Type: ${crashReport.errorType}`,
      `Error Message: ${crashReport.errorMessage}`,
      '----------------------------------------------------------------',
      'Recent Breadcrumbs:',
      ...crashReport.breadcrumbs.map(b => `[${b.timestamp}] [${b.category}] ${b.message}`),
      '----------------------------------------------------------------',
      'Stack Trace:',
      crashReport.stackTrace,
      '================================================================\n'
    ].join('\n');

    this._appendBoundedLog(this.crashLogPath, formatted);
    return crashReport;
  }

  _appendBoundedLog(filePath, content) {
    try {
      // Check file size, rotate if larger than 2MB
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.size > this.maxLogBytes) {
          const oldPath = filePath + '.1';
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          fs.renameSync(filePath, oldPath);
        }
      }
      fs.appendFileSync(filePath, content, 'utf8');
    } catch (e) {
      console.warn(`[CrashHandler] Failed writing log ${filePath}:`, e.message);
    }
  }

  exportDiagnostics(extraInfo = {}) {
    return {
      gameVersion: this.appVersion || '1.0.0',
      buildId: this.buildId || 'PROD-2026.1',
      platform: platformManager.getPlatformName(),
      architecture: platformManager.getArchitecture(),
      osRelease: platformManager.getOSVersion(),
      cpuModel: platformManager.getCPUModel(),
      totalMemoryMB: platformManager.getTotalMemoryMB(),
      consecutiveCrashes: this.sessionState.consecutiveCrashes,
      safeModeRecommended: this.sessionState.safeModeRecommended,
      recentBreadcrumbs: [...this.breadcrumbs],
      customizationChangesCeiling: 5,
      ...this._sanitizeMetadata(extraInfo)
    };
  }
}

module.exports = new CrashHandler();
