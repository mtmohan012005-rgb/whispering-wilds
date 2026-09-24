// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTIVE LAMP ENTITY
// Authentic traditional lamps (Kuthu Vilakku, Agal) with dynamic emissive & lighting
// ============================================================================

(function() {
  'use strict';

  class InteractiveLamp extends window.InteractiveProp {
    constructor(config = {}) {
      super({
        ...config,
        type: 'lamp',
        anchorPoint: config.anchorPoint || 'LAMP_WICK'
      });

      this.isLit = !!config.isLit;
      this.lightColor = config.lightProperties?.color || 0xff9933;
      this.lightIntensity = config.lightProperties?.intensity || 1.2;
      this.lightDistance = config.lightProperties?.distance || 4.5;

      this.pointLight = null;
      this.flameMesh = null;
      this._flickerTimer = 0;

      this._refreshInteractionTypes();
    }

    _refreshInteractionTypes() {
      this.interactionTypes = this.isLit ? ['EXTINGUISH', 'INSPECT'] : ['LIGHT', 'INSPECT'];
    }

    light() {
      if (this.isLit) return true;
      this.isLit = true;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playLampSound?.('lamp_ignite_match', this.position);
      }
      if (this.savePolicy === 'PERSISTENT' || this.savePolicy === 'QUEST_BOUND') {
        if (window.PropStateSystem) {
          window.PropStateSystem.recordLampState(this.id, true);
        }
      }
      if (window.WorldReactivitySystem) {
        window.WorldReactivitySystem.notifyLampStateChanged(this.id, true, this.position);
      }
      this._applyVisualLightingState(true);
      return true;
    }

    extinguish() {
      if (!this.isLit) return true;
      this.isLit = false;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playLampSound?.('lamp_blow_out', this.position);
      }
      if (this.savePolicy === 'PERSISTENT' || this.savePolicy === 'QUEST_BOUND') {
        if (window.PropStateSystem) {
          window.PropStateSystem.recordLampState(this.id, false);
        }
      }
      if (window.WorldReactivitySystem) {
        window.WorldReactivitySystem.notifyLampStateChanged(this.id, false, this.position);
      }
      this._applyVisualLightingState(false);
      return true;
    }

    toggle() {
      return this.isLit ? this.extinguish() : this.light();
    }

    _applyVisualLightingState(lit) {
      if (this.pointLight) {
        this.pointLight.intensity = lit ? this.lightIntensity : 0;
      }
      if (this.flameMesh) {
        this.flameMesh.visible = lit;
      }
      if (this.mesh && this.mesh.material) {
        if (this.mesh.material.emissive) {
          this.mesh.material.emissive.setHex(lit ? 0x442200 : 0x000000);
        }
      }
    }

    onInteract(category, player, context = {}) {
      if (category === 'INSPECT') {
        return super.onInteract('INSPECT', player, context);
      }
      const success = this.toggle();
      return {
        success,
        action: this.isLit ? 'LIGHT' : 'EXTINGUISH',
        propId: this.id,
        isLit: this.isLit
      };
    }

    update(deltaTime) {
      if (this.isLit && this.pointLight) {
        // Subtle natural oil lamp wick flicker
        this._flickerTimer += deltaTime * 8.0;
        const flicker = Math.sin(this._flickerTimer) * 0.15 + (Math.random() - 0.5) * 0.05;
        this.pointLight.intensity = Math.max(0.1, this.lightIntensity + flicker);
      }
    }
  }

  window.InteractiveLamp = InteractiveLamp;
  console.log('[InteractiveLamp] Registered interactive lamp entity class.');
})();
