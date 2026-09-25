// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT REGISTRY
// Central authoritative registry for all data-driven game content:
// Quests, Dialogue, NPCs, Locations, Events, Wildlife, Items, Crafting,
// Shops, Achievements, Collectibles, Lore, Culture, Audio, and Cinematics.
// ============================================================================

(function () {
  'use strict';

  const CONTENT_TYPES = [
    'quest',
    'dialogue',
    'npc',
    'location',
    'event',
    'wildlife',
    'item',
    'crafting',
    'shop',
    'achievement',
    'collectible',
    'lore',
    'culture',
    'audio',
    'cinematic'
  ];

  class ContentRegistry {
    constructor() {
      this.version = '1.0.0';
      this.contentVersion = '2026.09.25';
      this.stores = new Map(); // type -> Map(id, definition)
      this.dependencies = new Map(); // id -> Set(dependencyIds)
      this.idIndex = new Map(); // id -> { type, def }
      this.initialized = false;

      // Initialize typed sub-stores
      for (const t of CONTENT_TYPES) {
        this.stores.set(t, new Map());
      }
    }

    /**
     * Register a content definition into the registry
     */
    register(type, def) {
      if (!type || typeof type !== 'string') {
        throw new Error('[ContentRegistry] Type must be a non-empty string');
      }
      const normType = type.toLowerCase();
      if (!this.stores.has(normType)) {
        this.stores.set(normType, new Map());
      }

      if (!def || typeof def !== 'object') {
        throw new Error(`[ContentRegistry] Definition for type '${normType}' must be an object`);
      }

      if (!def.id || typeof def.id !== 'string' || def.id.trim() === '') {
        throw new Error(`[ContentRegistry] Item in type '${normType}' must have a valid string ID`);
      }

      const id = def.id.trim();

      // Check for duplicate ID across all types to ensure global ID uniqueness
      if (this.idIndex.has(id)) {
        const existing = this.idIndex.get(id);
        if (existing.type !== normType) {
          throw new Error(`[ContentRegistry] Duplicate ID '${id}' across different types ('${existing.type}' and '${normType}')`);
        }
        // In dev mode we allow hot reload replacement for the same type
        console.warn(`[ContentRegistry] Overwriting existing definition for ID '${id}' in type '${normType}' (hot-reload)`);
      }

      // Track dependencies
      const deps = new Set();
      if (Array.isArray(def.dependencies)) {
        def.dependencies.forEach(d => deps.add(d));
      }
      if (Array.isArray(def.prerequisites?.requiredQuests)) {
        def.prerequisites.requiredQuests.forEach(q => deps.add(q));
      }
      if (def.dialogueId) deps.add(def.dialogueId);
      if (def.questId) deps.add(def.questId);
      if (def.locationId) deps.add(def.locationId);

      this.dependencies.set(id, deps);

      // Deep clone to ensure immutable storage
      const storedDef = window.ContentUtils ? window.ContentUtils.clone(def) : JSON.parse(JSON.stringify(def));

      // Enforce metadata defaults
      if (!storedDef.version) storedDef.version = '1.0.0';
      if (!storedDef.type) storedDef.type = normType;

      this.stores.get(normType).set(id, storedDef);
      this.idIndex.set(id, { type: normType, def: storedDef });

      return storedDef;
    }

    /**
     * Batch register an array of definitions for a type
     */
    registerBatch(type, definitions = []) {
      if (!Array.isArray(definitions)) return [];
      const registered = [];
      for (const def of definitions) {
        registered.push(this.register(type, def));
      }
      return registered;
    }

    /**
     * Retrieve a definition by type and ID
     */
    get(type, id) {
      if (!type || !id) return null;
      const store = this.stores.get(type.toLowerCase());
      return store ? (store.get(id) || null) : null;
    }

    /**
     * Retrieve a definition by ID alone (searches global index)
     */
    getById(id) {
      if (!id) return null;
      const entry = this.idIndex.get(id);
      return entry ? entry.def : null;
    }

    /**
     * Check if an ID exists
     */
    has(type, id) {
      if (type) {
        const store = this.stores.get(type.toLowerCase());
        return store ? store.has(id) : false;
      }
      return this.idIndex.has(id);
    }

    /**
     * Get all definitions for a type
     */
    getAll(type) {
      const store = this.stores.get(type.toLowerCase());
      if (!store) return [];
      return Array.from(store.values());
    }

    /**
     * Filter definitions by region
     */
    getByRegion(type, region) {
      const all = this.getAll(type);
      if (!region) return all;
      const target = region.toLowerCase();
      return all.filter(item => {
        const r = (item.region || '').toLowerCase();
        return r === target || r === 'all' || r === 'global';
      });
    }

    /**
     * Get all content types supported
     */
    getContentTypes() {
      return [...CONTENT_TYPES];
    }

    /**
     * Get registry metrics
     */
    getMetrics() {
      const counts = {};
      let total = 0;
      for (const [type, store] of this.stores.entries()) {
        counts[type] = store.size;
        total += store.size;
      }
      return {
        totalDefinitions: total,
        byType: counts,
        version: this.version,
        contentVersion: this.contentVersion
      };
    }

    /**
     * Clear registry (primarily for tests)
     */
    clear() {
      for (const store of this.stores.values()) {
        store.clear();
      }
      this.dependencies.clear();
      this.idIndex.clear();
    }
  }

  const instance = new ContentRegistry();

  if (typeof window !== 'undefined') {
    window.ContentRegistry = instance;
    window.contentRegistry = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
