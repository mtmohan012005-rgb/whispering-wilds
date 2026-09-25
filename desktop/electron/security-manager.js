/**
 * SecurityManager - Desktop Security, CSP, Sandboxing & Permission Guard
 * Prevents remote code execution, isolates context, restricts child windows, and rejects untrusted permissions.
 */

class SecurityManager {
  constructor() {
    this.allowedNavigationHosts = new Set(['localhost', '127.0.0.1']);
    this.allowedProtocols = new Set(['file:', 'game:', 'http:', 'https:']);
  }

  /**
   * Generates production-grade Content-Security-Policy headers
   */
  getCSPHeader(isDev = false) {
    if (isDev) {
      return [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' file: game: http://localhost:* ws://localhost:* data: blob:;",
        "img-src 'self' data: blob: file: game: http://localhost:*;",
        "media-src 'self' data: blob: file: game: http://localhost:*;",
        "connect-src 'self' http://localhost:* ws://localhost:* file: game:;",
        "font-src 'self' data: file: game:;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*;",
        "style-src 'self' 'unsafe-inline';"
      ].join(' ');
    }

    return [
      "default-src 'self' file: game: data: blob:;",
      "img-src 'self' data: blob: file: game:;",
      "media-src 'self' data: blob: file: game:;",
      "connect-src 'self' file: game:;",
      "font-src 'self' data: file: game:;",
      "script-src 'self' 'unsafe-inline';", // Required for modular game systems
      "style-src 'self' 'unsafe-inline';",
      "object-src 'none';",
      "base-uri 'self';"
    ].join(' ');
  }

  /**
   * Applies security policies to session and browser windows
   */
  configureSessionSecurity(sessionObj, isDev = false) {
    if (!sessionObj) return;

    // 1. Permission request handler: reject unauthorized capabilities
    sessionObj.setPermissionRequestHandler((webContents, permission, callback) => {
      const allowedPermissions = ['fullscreen', 'pointerLock'];
      if (allowedPermissions.includes(permission)) {
        return callback(true);
      }
      // Deny camera, microphone, geolocation, notifications by default
      callback(false);
    });

    // 2. CSP injection via response headers
    const csp = this.getCSPHeader(isDev);
    sessionObj.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      responseHeaders['Content-Security-Policy'] = [csp];
      responseHeaders['X-Content-Type-Options'] = ['nosniff'];
      responseHeaders['X-Frame-Options'] = ['DENY'];
      callback({ responseHeaders });
    });
  }

  /**
   * Configures window-level navigation and popup security
   */
  configureWindowSecurity(win) {
    if (!win) return;

    // Disallow new window/popup creation
    win.webContents.setWindowOpenHandler(({ url }) => {
      console.warn(`[SecurityManager] Blocked popup request to: ${url}`);
      return { action: 'deny' };
    });

    // Navigation filter: prevent leaving local app context
    win.webContents.on('will-navigate', (event, navigationUrl) => {
      try {
        const parsed = new URL(navigationUrl);
        if (parsed.protocol === 'file:' || parsed.protocol === 'game:') {
          return; // Allow local game files
        }
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return; // Allow local dev server
        }
      } catch (e) {
        // Malformed URL
      }
      event.preventDefault();
      console.warn(`[SecurityManager] Blocked unauthorized navigation to: ${navigationUrl}`);
    });
  }

  /**
   * Standard secure webPreferences for BrowserWindow
   */
  getSecureWebPreferences(preloadPath) {
    return {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      enableRemoteModule: false,
      sandbox: false, // Required for custom preload IPC with desktopAPI
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
      backgroundThrottling: false // Managed explicitly via app lifecycle
    };
  }
}

module.exports = new SecurityManager();
