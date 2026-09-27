// ============================================================================
// THE WHISPERING WILDS — CENTRAL ASSET MANAGER
// Priority-queued loading, deduplication, timeout, retry, abort, cache.
// NEVER called from inside requestAnimationFrame.
// ============================================================================

(function () {
  'use strict';

  const PRIORITY = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  const TIMEOUT_MS = { 0: 20_000, 1: 30_000, 2: 45_000, 3: 60_000 };

  // Simple LRU-ish in-memory result cache
  const MAX_CACHE = 200;
  const _resultCache = new Map();

  function _cacheGet(key) { return _resultCache.get(key) || null; }
  function _cacheSet(key, val) {
    if (_resultCache.size >= MAX_CACHE) {
      const oldest = _resultCache.keys().next().value;
      _resultCache.delete(oldest);
    }
    _resultCache.set(key, val);
  }

  // --------------------------------------------------------------------------
  // In-flight deduplication
  // --------------------------------------------------------------------------
  const _inFlight = new Map(); // url → Promise<any>

  // --------------------------------------------------------------------------
  // ASSET MANAGER
  // --------------------------------------------------------------------------
  class AssetManager {
    constructor() {
      this._queue = [];  // { id, url, type, priority, resolve, reject, abortCtrl }
      this._active = 0;
      this.MAX_CONCURRENT = 4;
      this._disposed = new Set();
      this._sizeEstimates = new Map(); // url → bytes (for memory budget tracking)
      this._totalEstimatedBytes = 0;
      this.BUDGET_BYTES = 512 * 1024 * 1024; // 512 MB soft budget
    }

    // ------------------------------------------------------------------
    // Main load entry point
    // Returns a Promise that resolves with the loaded asset.
    // Deduplicates concurrent requests for the same URL.
    // ------------------------------------------------------------------
    load(url, options = {}) {
      const {
        type     = 'blob',      // 'json' | 'blob' | 'arraybuffer' | 'text' | 'gltf' | 'texture'
        priority = PRIORITY.NORMAL,
        id       = url,
        retries  = 2,
      } = options;

      // 1. Check result cache
      const cached = _cacheGet(url);
      if (cached) return Promise.resolve(cached);

      // 2. Check in-flight deduplification
      if (_inFlight.has(url)) {
        console.log(`[AssetManager] Dedup hit: ${url}`);
        return _inFlight.get(url);
      }

      // 3. Queue it
      const promise = new Promise((resolve, reject) => {
        this._queue.push({ url, type, priority, id, retries, resolve, reject, _attempt: 0 });
        this._queue.sort((a, b) => a.priority - b.priority);
      });

      _inFlight.set(url, promise);
      promise.finally(() => _inFlight.delete(url));

      this._pump();
      return promise;
    }

    // Convenience wrappers
    loadJSON(url, priority = PRIORITY.NORMAL)      { return this.load(url, { type: 'json', priority }); }
    loadBlob(url, priority = PRIORITY.NORMAL)      { return this.load(url, { type: 'blob', priority }); }
    loadText(url, priority = PRIORITY.NORMAL)      { return this.load(url, { type: 'text', priority }); }
    loadGLTF(url, priority = PRIORITY.NORMAL)      { return this.load(url, { type: 'gltf', priority }); }

    // ------------------------------------------------------------------
    // Cancel a queued (not yet started) load
    // ------------------------------------------------------------------
    cancel(url) {
      const idx = this._queue.findIndex(item => item.url === url);
      if (idx !== -1) {
        const item = this._queue.splice(idx, 1)[0];
        item.reject(new DOMException('Cancelled by AssetManager', 'AbortError'));
      }
    }

    // ------------------------------------------------------------------
    // Cancel all LOW priority loads (call before heavy region load)
    // ------------------------------------------------------------------
    cancelLowPriority() {
      this._queue
        .filter(item => item.priority >= PRIORITY.LOW)
        .forEach(item => {
          item.reject(new DOMException('Cancelled (low priority purge)', 'AbortError'));
        });
      this._queue = this._queue.filter(item => item.priority < PRIORITY.LOW);
    }

    // ------------------------------------------------------------------
    // Soft memory budget check
    // ------------------------------------------------------------------
    isOverBudget() {
      return this._totalEstimatedBytes > this.BUDGET_BYTES;
    }

    freeEstimate(url) {
      const size = this._sizeEstimates.get(url) || 0;
      this._totalEstimatedBytes = Math.max(0, this._totalEstimatedBytes - size);
      this._sizeEstimates.delete(url);
    }

    // ------------------------------------------------------------------
    // INTERNAL — pump queue
    // ------------------------------------------------------------------
    _pump() {
      while (this._active < this.MAX_CONCURRENT && this._queue.length > 0) {
        const item = this._queue.shift();
        this._active++;
        this._execute(item).finally(() => {
          this._active--;
          this._pump();
        });
      }
    }

    async _execute(item) {
      const { url, type, priority, retries, resolve, reject } = item;
      const timeoutMs = TIMEOUT_MS[priority] || 45_000;

      for (let attempt = 0; attempt <= retries; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          const result = await this._fetch(url, type, ctrl.signal);
          clearTimeout(timer);

          // Cache and track size
          _cacheSet(url, result);
          if (result instanceof Blob) {
            this._sizeEstimates.set(url, result.size);
            this._totalEstimatedBytes += result.size;
          } else if (result instanceof ArrayBuffer) {
            this._sizeEstimates.set(url, result.byteLength);
            this._totalEstimatedBytes += result.byteLength;
          }

          resolve(result);
          return;
        } catch (e) {
          clearTimeout(timer);
          if (e.name === 'AbortError' && attempt === retries) {
            console.error(`[AssetManager] TIMEOUT: ${url}`);
            reject(new Error(`Asset load timeout: ${url}`));
            return;
          }
          if (attempt < retries) {
            const delay = 500 * Math.pow(2, attempt);
            console.warn(`[AssetManager] Retry ${attempt + 1}/${retries} for ${url} in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
          } else {
            console.error(`[AssetManager] Failed: ${url}`, e.message);
            reject(e);
          }
        }
      }
    }

    async _fetch(url, type, signal) {
      // GLTF — use Three.js GLTFLoader
      if (type === 'gltf') {
        return this._loadGLTF(url, signal);
      }

      const resp = await fetch(url, {
        signal,
        headers: { 'Cache-Control': 'max-age=86400' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);

      switch (type) {
        case 'json':        return resp.json();
        case 'text':        return resp.text();
        case 'arraybuffer': return resp.arrayBuffer();
        default:            return resp.blob();
      }
    }

    _loadGLTF(url, signal) {
      return new Promise((resolve, reject) => {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
          reject(new Error('[AssetManager] THREE.GLTFLoader not available'));
          return;
        }
        const loader = new THREE.GLTFLoader();
        if (typeof THREE.DRACOLoader !== 'undefined') {
          const dracoLoader = new THREE.DRACOLoader();
          dracoLoader.setDecoderPath('js/lib/draco/');
          loader.setDRACOLoader(dracoLoader);
        }
        loader.load(url, resolve, undefined, reject);

        // Respect abort signal
        signal.addEventListener('abort', () => reject(new DOMException('Load aborted', 'AbortError')));
      });
    }

    getStats() {
      return {
        queued:   this._queue.length,
        active:   this._active,
        cached:   _resultCache.size,
        inFlight: _inFlight.size,
        estimatedMB: (this._totalEstimatedBytes / 1024 / 1024).toFixed(1),
        overBudget: this.isOverBudget(),
      };
    }
  }

  const instance = new AssetManager();
  window.AssetManager = instance;
  window.ASSET_PRIORITY = PRIORITY;

})();
