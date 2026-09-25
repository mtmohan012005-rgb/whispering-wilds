/**
 * The Whispering Wilds - Graphics Fallback System
 * Per-feature degradation tracking (healthy, degraded, disabled, failed).
 * Automatically steps down failing graphics effects without terminating gameplay.
 */
(function(root) {
  'use strict';

  class GraphicsFallbackSystem {
    constructor() {
      this.featureStates = {
        shadows: 'healthy',     // healthy | degraded | disabled | failed
        water: 'healthy',       // healthy | degraded | disabled | failed
        reflections: 'healthy', // healthy | degraded | disabled | failed
        fog: 'healthy',         // healthy | degraded | disabled | failed
        particles: 'healthy'    // healthy | degraded | disabled | failed
      };
    }

    reportFeatureError(feature, error) {
      console.warn(`[GraphicsFallbackSystem] Error reported in feature '${feature}':`, error);
      const currentState = this.featureStates[feature] || 'healthy';

      if (currentState === 'healthy') {
        this.featureStates[feature] = 'degraded';
        this.applyFeatureDegradation(feature, 'degraded');
      } else if (currentState === 'degraded') {
        this.featureStates[feature] = 'disabled';
        this.applyFeatureDegradation(feature, 'disabled');
      } else {
        this.featureStates[feature] = 'failed';
      }
    }

    applyFeatureDegradation(feature, targetState) {
      if (root.GraphicsBackendManagerInstance) {
        if (targetState === 'disabled' || targetState === 'failed') {
          root.GraphicsBackendManagerInstance.disableFeature(feature);
        }
      }

      // Feature specific fallbacks
      switch (feature) {
        case 'shadows':
          if (root.ThreeWorld && root.ThreeWorld.renderer) {
            root.ThreeWorld.renderer.shadowMap.enabled = (targetState !== 'disabled' && targetState !== 'failed');
          }
          break;
        case 'water':
          // Revert to safe water shader or basic material
          if (root.WeatherSystem && typeof root.WeatherSystem.setSafeWaterMode === 'function') {
            root.WeatherSystem.setSafeWaterMode(true);
          }
          break;
        case 'particles':
          // Scale down particle budget
          if (root.WeatherSystem && typeof root.WeatherSystem.setParticleScale === 'function') {
            root.WeatherSystem.setParticleScale(0.25);
          }
          break;
        default:
          break;
      }
    }

    getFeatureState(feature) {
      return this.featureStates[feature] || 'healthy';
    }

    getAllFeatureStates() {
      return Object.assign({}, this.featureStates);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsFallbackSystem;
  } else {
    root.GraphicsFallbackSystem = GraphicsFallbackSystem;
  }
})(typeof window !== 'undefined' ? window : global);
