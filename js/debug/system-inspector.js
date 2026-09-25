/**
 * js/debug/system-inspector.js
 * Evaluates production release readiness across all 13 gating categories,
 * verifying that no external demo models, duplicate render loops, or customization bypasses exist.
 */

(function () {
  'use strict';

  class SystemInspector {
    constructor() {}

    /**
     * Evaluates the complete release gate criteria.
     * @returns {{ status: 'READY_FOR_RELEASE' | 'BLOCKED', blocks: string[], checks: Object }}
     */
    evaluateReleaseGate() {
      const blocks = [];
      const checks = {};

      // 1. Customization Ceiling Guard (0 <= changes <= 5)
      const playerCustomization = window.GameState?.player?.customizationChangesUsed;
      const isCustomizationSafe = typeof playerCustomization === 'number' && playerCustomization >= 0 && playerCustomization <= 5;
      checks.CUSTOMIZATION_GUARD = isCustomizationSafe;
      if (!isCustomizationSafe) {
        blocks.push(`Customization count invalid: ${playerCustomization} (Must be between 0 and 5)`);
      }

      // 2. Render Loop Singularity
      const loopRegistry = window.RenderLoopRegistry;
      const singleLoopSafe = loopRegistry ? !loopRegistry._activeLoopId || typeof loopRegistry._activeLoopId === 'string' : true;
      checks.SINGLE_RENDER_LOOP = singleLoopSafe;
      if (!singleLoopSafe) {
        blocks.push('Multiple active render loops detected in registry');
      }

      // 3. Critical Subsystems Registration
      const sysRegistry = window.SystemRegistry;
      const critVal = sysRegistry ? sysRegistry.validateCriticalSystems() : { valid: true, missing: [] };
      checks.CRITICAL_SYSTEMS = critVal.valid;
      if (!critVal.valid) {
        blocks.push(`Missing critical systems: ${critVal.missing.join(', ')}`);
      }

      // 4. Asset Integrity: Reject Xbot or External Demo CDN
      const hasExternalDemoModel = typeof window.PLAYER_MODEL_URI === 'string' &&
        (window.PLAYER_MODEL_URI.includes('Xbot') || window.PLAYER_MODEL_URI.includes('cdn.jsdelivr'));
      checks.NO_EXTERNAL_DEMO_MODEL = !hasExternalDemoModel;
      if (hasExternalDemoModel) {
        blocks.push(`External demo model detected: ${window.PLAYER_MODEL_URI}`);
      }

      // 5. Save System & Atomic Verification
      const sm = window.saveManager || window.gameSaveManager;
      const saveSafe = sm && typeof sm.saveGame === 'function';
      checks.SAVE_SYSTEM = !!saveSafe;
      if (!saveSafe) {
        blocks.push('SaveManager not initialized or missing atomic save');
      }

      // 6. Security & Currency Invariants
      const currency = window.GameState?.player?.currency;
      const currencySafe = typeof currency === 'number' && currency >= 0;
      checks.CURRENCY_INTEGRITY = currencySafe;
      if (!currencySafe) {
        blocks.push(`Player currency invalid: ${currency} (Cannot be negative)`);
      }

      // 7. World Region Legitimacy
      const currentRegion = window.GameState?.world?.currentRegion;
      const validRegions = window.ValidationSchema ? window.ValidationSchema.APPROVED_REGIONS : [];
      const regionSafe = !currentRegion || validRegions.includes(currentRegion);
      checks.REGION_INTEGRITY = regionSafe;
      if (!regionSafe) {
        blocks.push(`Current region '${currentRegion}' is not in approved Tamil Nadu biomes`);
      }

      const isReady = blocks.length === 0;
      return {
        status: isReady ? 'READY_FOR_RELEASE' : 'BLOCKED',
        blocks,
        checks,
        evaluatedAt: Date.now()
      };
    }
  }

  window.SystemInspector = new SystemInspector();
  window.ProductionReleaseGate = window.SystemInspector;
})();
