/**
 * The Whispering Wilds (Kaattu Vazhi) - Player Customization System
 * Authoritative 5-change progression limit, preview pipeline, anti-duplication guard,
 * history logging, and event dispatchers.
 */

class PlayerCustomizationSystem {
  constructor(config) {
    this.config = config || window.PLAYER_CUSTOMIZATION_CONFIG || {};
    this.maxCustomizationChanges = this.config.MAX_CHANGES || 5;
    this.customizationChangesUsed = 0;

    // Active permanent configuration
    this.activeConfiguration = {
      outfitId: "everyday_veshti",
      hairstyleId: "short_traditional_part",
      accessoryId: "none",
      footwearId: "kolhapuri_sandals",
      appearancePresetId: "everyday_explorer"
    };

    // Transient preview configuration (does not consume changes)
    this.previewConfiguration = null;

    // Permanent modification history: max 5 records
    this.history = [];

    // Event listeners
    this.listeners = {
      playerCustomizationPreview: [],
      playerCustomizationConfirmed: [],
      playerCustomizationCancelled: [],
      playerCustomizationLimitReached: []
    };
  }

  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  dispatchEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(`[PlayerCustomization] Error in ${event} listener:`, e); }
      });
    }
    // Also dispatch on window for global listeners
    try {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    } catch (_) {}
  }

  canCustomize() {
    return this.customizationChangesUsed < this.maxCustomizationChanges;
  }

  getRemainingChanges() {
    return Math.max(0, this.maxCustomizationChanges - this.customizationChangesUsed);
  }

  /**
   * Validates a customization request against registered schemas and limit constraints
   */
  validatePlayerCustomization(config) {
    const errors = [];
    const remaining = this.getRemainingChanges();

    if (!config || typeof config !== 'object') {
      errors.push("Invalid configuration payload.");
      return { valid: false, errors, remainingChanges: remaining };
    }

    if (this.customizationChangesUsed >= this.maxCustomizationChanges) {
      errors.push("Player customization limit reached (maximum 5 changes used).");
    }

    const cfg = this.config;
    if (config.outfitId && (!cfg.outfits || !cfg.outfits[config.outfitId])) {
      errors.push(`Invalid outfit ID: "${config.outfitId}"`);
    }
    if (config.hairstyleId && (!cfg.hairstyles || !cfg.hairstyles[config.hairstyleId])) {
      errors.push(`Invalid hairstyle ID: "${config.hairstyleId}"`);
    }
    if (config.accessoryId && (!cfg.accessories || !cfg.accessories[config.accessoryId])) {
      errors.push(`Invalid accessory ID: "${config.accessoryId}"`);
    }
    if (config.footwearId && (!cfg.footwear || !cfg.footwear[config.footwearId])) {
      errors.push(`Invalid footwear ID: "${config.footwearId}"`);
    }
    if (config.appearancePresetId && (!cfg.appearancePresets || !cfg.appearancePresets[config.appearancePresetId])) {
      errors.push(`Invalid appearance preset ID: "${config.appearancePresetId}"`);
    }

    return {
      valid: errors.length === 0,
      errors,
      remainingChanges: remaining
    };
  }

  /**
   * Temporary preview mode — updates 3D model without modifying saved state or consuming changes
   */
  preview(candidateConfig) {
    if (!candidateConfig) return false;

    this.previewConfiguration = {
      outfitId: candidateConfig.outfitId || this.activeConfiguration.outfitId,
      hairstyleId: candidateConfig.hairstyleId || this.activeConfiguration.hairstyleId,
      accessoryId: candidateConfig.accessoryId || this.activeConfiguration.accessoryId,
      footwearId: candidateConfig.footwearId || this.activeConfiguration.footwearId,
      appearancePresetId: candidateConfig.appearancePresetId || this.activeConfiguration.appearancePresetId
    };

    // Apply preview to 3D character without saving
    this.applyVisuals(this.previewConfiguration);

    this.dispatchEvent('playerCustomizationPreview', {
      configuration: this.previewConfiguration,
      remainingChanges: this.getRemainingChanges()
    });

    return true;
  }

  /**
   * Cancel preview mode — reverts 3D model back to authoritative activeConfiguration
   */
  cancel() {
    this.previewConfiguration = null;
    this.applyVisuals(this.activeConfiguration);

    this.dispatchEvent('playerCustomizationCancelled', {
      configuration: this.activeConfiguration,
      remainingChanges: this.getRemainingChanges()
    });

    return true;
  }

  /**
   * Check if a candidate configuration is identical to the current active configuration
   */
  isIdenticalConfiguration(config) {
    if (!config) return true;
    const act = this.activeConfiguration;
    return (
      config.outfitId === act.outfitId &&
      config.hairstyleId === act.hairstyleId &&
      config.accessoryId === act.accessoryId &&
      config.footwearId === act.footwearId &&
      config.appearancePresetId === act.appearancePresetId
    );
  }

  /**
   * Confirm the customization change — consumes exactly 1 change
   */
  confirm(targetConfig = null) {
    const candidate = targetConfig || this.previewConfiguration || this.activeConfiguration;

    // 1. Anti-Duplication Check: Changing to the same configuration does NOT consume a change
    if (this.isIdenticalConfiguration(candidate)) {
      this.cancel();
      return {
        success: true,
        changeConsumed: false,
        reason: "identical_configuration",
        remainingChanges: this.getRemainingChanges()
      };
    }

    // 2. Validate configuration and remaining changes limit
    const validation = this.validatePlayerCustomization(candidate);
    if (!validation.valid) {
      console.warn("[PlayerCustomization] Customization confirmation rejected:", validation.errors);
      return {
        success: false,
        changeConsumed: false,
        errors: validation.errors,
        remainingChanges: validation.remainingChanges
      };
    }

    // 3. Consume 1 change
    const prevConfig = { ...this.activeConfiguration };
    this.customizationChangesUsed++;

    // 4. Update authoritative state
    this.activeConfiguration = {
      outfitId: candidate.outfitId || prevConfig.outfitId,
      hairstyleId: candidate.hairstyleId || prevConfig.hairstyleId,
      accessoryId: candidate.accessoryId || prevConfig.accessoryId,
      footwearId: candidate.footwearId || prevConfig.footwearId,
      appearancePresetId: candidate.appearancePresetId || prevConfig.appearancePresetId
    };
    this.previewConfiguration = null;

    // 5. Update game player state
    const p = window.gamePlayer || (window.testRef && window.testRef.player);
    if (p) {
      p.outfitId = this.activeConfiguration.outfitId;
      p.hairstyleId = this.activeConfiguration.hairstyleId;
      p.accessoryId = this.activeConfiguration.accessoryId;
      p.footwearId = this.activeConfiguration.footwearId;
      p.appearancePresetId = this.activeConfiguration.appearancePresetId;
      p.customizationChangesUsed = this.customizationChangesUsed;
      p.maxCustomizationChanges = this.maxCustomizationChanges;
    }

    // 6. Record in customization history
    const historyEntry = {
      changeIndex: this.customizationChangesUsed,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      previousConfiguration: prevConfig,
      newConfiguration: { ...this.activeConfiguration }
    };
    this.history.push(historyEntry);

    // 7. Apply permanent visuals to 3D model
    this.applyVisuals(this.activeConfiguration);

    // 8. Emit confirmed event
    this.dispatchEvent('playerCustomizationConfirmed', {
      changeIndex: this.customizationChangesUsed,
      historyEntry,
      remainingChanges: this.getRemainingChanges(),
      configuration: this.activeConfiguration
    });

    // 9. If limit reached, emit limit reached event
    if (this.customizationChangesUsed >= this.maxCustomizationChanges) {
      this.dispatchEvent('playerCustomizationLimitReached', {
        customizationChangesUsed: this.customizationChangesUsed,
        maxCustomizationChanges: this.maxCustomizationChanges
      });
    }

    return {
      success: true,
      changeConsumed: true,
      changeIndex: this.customizationChangesUsed,
      remainingChanges: this.getRemainingChanges(),
      configuration: this.activeConfiguration
    };
  }

  /**
   * Apply configuration to 3D and 2D player instances
   */
  applyVisuals(config) {
    if (!config) return;

    // 3D Three.js Player update
    if (window.threeWorld && window.threeWorld.player) {
      if (typeof window.threeWorld.player.setOutfit === 'function') {
        window.threeWorld.player.setOutfit(config.outfitId);
      }
      if (typeof window.threeWorld.player.setCustomization === 'function') {
        window.threeWorld.player.setCustomization(config);
      }
    }

    // 2D Canvas Player update (if active)
    const p = window.gamePlayer || (window.testRef && window.testRef.player);
    if (p) {
      p.outfitId = config.outfitId;
      if (typeof p.setOutfit === 'function') {
        p.setOutfit(config.outfitId);
      }
    }
  }

  /**
   * Reset counter strictly for NEW GAME
   */
  resetForNewGame() {
    this.customizationChangesUsed = 0;
    this.history = [];
    this.previewConfiguration = null;
    this.activeConfiguration = {
      outfitId: "everyday_veshti",
      hairstyleId: "short_traditional_part",
      accessoryId: "none",
      footwearId: "kolhapuri_sandals",
      appearancePresetId: "everyday_explorer"
    };
    this.applyVisuals(this.activeConfiguration);
    console.log("[PlayerCustomization] New game reset: customization changes reset to 0/5.");
  }

  /**
   * Serialization for SaveManager
   */
  serialize() {
    return {
      outfitId: this.activeConfiguration.outfitId,
      hairstyleId: this.activeConfiguration.hairstyleId,
      accessoryId: this.activeConfiguration.accessoryId,
      footwearId: this.activeConfiguration.footwearId,
      appearancePresetId: this.activeConfiguration.appearancePresetId,
      customizationChangesUsed: this.customizationChangesUsed,
      maxCustomizationChanges: this.maxCustomizationChanges,
      history: this.history
    };
  }

  /**
   * Deserialization with strict clamping [0, 5] and corruption protection
   */
  deserialize(data) {
    if (!data || typeof data !== 'object') return;

    // Clamp change count
    const rawUsed = Number(data.customizationChangesUsed);
    this.customizationChangesUsed = isNaN(rawUsed) ? 0 : Math.max(0, Math.min(5, Math.floor(rawUsed)));
    this.maxCustomizationChanges = 5;

    // Migrate old currentOutfit if present
    const outfit = data.outfitId || data.currentOutfit || "everyday_veshti";

    this.activeConfiguration = {
      outfitId: (this.config.outfits && this.config.outfits[outfit]) ? outfit : "everyday_veshti",
      hairstyleId: data.hairstyleId || "short_traditional_part",
      accessoryId: data.accessoryId || "none",
      footwearId: data.footwearId || "kolhapuri_sandals",
      appearancePresetId: data.appearancePresetId || "everyday_explorer"
    };

    if (Array.isArray(data.history)) {
      this.history = data.history.slice(0, 5);
    }

    this.applyVisuals(this.activeConfiguration);
  }
}

window.PlayerCustomizationSystem = PlayerCustomizationSystem;
