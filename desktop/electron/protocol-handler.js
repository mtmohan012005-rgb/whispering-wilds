/**
 * ProtocolHandler - Secure Custom Protocol & Local Asset Streaming
 * Serves game assets via custom 'game://' scheme with path traversal protection and MIME resolution.
 */

const path = require('path');
const fs = require('fs');

class ProtocolHandler {
  constructor() {
    this.scheme = 'game';
    this.baseDir = path.resolve(__dirname, '..', '..');
  }

  getScheme() {
    return this.scheme;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
      '.bin': 'application/octet-stream',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Resolves URL to safe absolute file path within baseDir.
   * Rejects path traversal attempts.
   */
  resolveSafePath(requestedUrl) {
    let cleanUrl = requestedUrl.replace(/^game:\/\//i, '').replace(/^app\/?/i, '');
    // Remove query params or hashes
    cleanUrl = cleanUrl.split('?')[0].split('#')[0];
    // Normalize path separators
    const decoded = decodeURIComponent(cleanUrl);
    const normalized = path.normalize(decoded);
    const absolutePath = path.resolve(this.baseDir, normalized.startsWith('/') || normalized.startsWith('\\') ? normalized.slice(1) : normalized);

    // Verify it stays inside baseDir
    if (!absolutePath.startsWith(this.baseDir)) {
      console.warn(`[ProtocolHandler] Directory traversal blocked: ${requestedUrl} -> ${absolutePath}`);
      return null;
    }

    return absolutePath;
  }

  registerProtocol(protocolObj) {
    if (!protocolObj || typeof protocolObj.handle !== 'function') return;

    protocolObj.handle(this.scheme, async (request) => {
      const safePath = this.resolveSafePath(request.url);
      if (!safePath || !fs.existsSync(safePath)) {
        return new Response('Not Found', { status: 404 });
      }

      try {
        const data = await fs.promises.readFile(safePath);
        const mimeType = this.getMimeType(safePath);
        return new Response(data, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } catch (err) {
        console.error(`[ProtocolHandler] Failed reading file: ${safePath}`, err);
        return new Response('Internal Error', { status: 500 });
      }
    });
  }
}

module.exports = new ProtocolHandler();
