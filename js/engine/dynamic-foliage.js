/**
 * The Whispering Wilds (Kaattu Vazhi) - Dynamic Foliage System
 * Procedural wind-sway vertex shader logic tailored to authentic Tamil Nadu flora:
 *  - Palmyra Palms (Borassus flabellifer): Trunk flexion + crown frond flutter
 *  - Mangrove Clusters (Pitchavaram): Stilt root grounding + canopy oscillation
 *  - Tea Bushes (Nilgiris): Surface undulating wind ripple waves
 */

(function () {
  'use strict';

  const FOLIAGE_TYPES = {
    PALMYRA_PALM: 0,
    MANGROVE: 1,
    TEA_BUSH: 2,
    SHRUB_GRASS: 3
  };

  class DynamicFoliageSystem {
    constructor(scene) {
      this.scene = scene;
      this.registeredMeshes = [];
      this.time = 0;
      this.windSpeed = 2.4; // m/s
      this.windDirection = new THREE.Vector2(0.85, 0.52).normalize();
      this.windGust = 1.0;
      this.gustTimer = 0;

      this.sharedUniforms = {
        uFoliageTime: { value: 0 },
        uWindDir: { value: new THREE.Vector3(this.windDirection.x, 0, this.windDirection.y) },
        uWindIntensity: { value: this.windSpeed },
        uWindGust: { value: 1.0 }
      };
    }

    /**
     * Apply wind sway vertex shader hook to a foliage material
     * @param {THREE.Material} material
     * @param {string|number} floraType - PALMYRA_PALM, MANGROVE, TEA_BUSH, or SHRUB_GRASS
     * @param {Object} options
     */
    applyFoliageShader(material, floraType = FOLIAGE_TYPES.PALMYRA_PALM, options = {}) {
      if (!material || material._wwFoliagePatched) return material;
      material._wwFoliagePatched = true;

      const typeInt = typeof floraType === 'string'
        ? (FOLIAGE_TYPES[floraType.toUpperCase()] ?? FOLIAGE_TYPES.PALMYRA_PALM)
        : floraType;

      const swayStrength = options.swayStrength !== undefined ? options.swayStrength : 1.0;
      const refHeight = options.refHeight !== undefined ? options.refHeight : 12.0;

      const prevCompile = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        if (typeof prevCompile === 'function') {
          prevCompile(shader, renderer);
        }

        shader.uniforms.uFoliageTime = this.sharedUniforms.uFoliageTime;
        shader.uniforms.uWindDir = this.sharedUniforms.uWindDir;
        shader.uniforms.uWindIntensity = this.sharedUniforms.uWindIntensity;
        shader.uniforms.uWindGust = this.sharedUniforms.uWindGust;

        shader.vertexShader = `
          uniform float uFoliageTime;
          uniform vec3 uWindDir;
          uniform float uWindIntensity;
          uniform float uWindGust;

          vec3 calculateFloraWindSway(vec3 pos, float height, int floraType, float time, vec3 windDir, float intensity, float gust) {
            vec3 offset = vec3(0.0);
            float hFactor = clamp(pos.y / ${refHeight.toFixed(2)}, 0.0, 1.0);
            float effectiveWind = intensity * gust;

            if (floraType == 0) {
              // 1. PALMYRA PALM: Quadratic trunk bend + high-frequency crown flutter
              float trunkBend = hFactor * hFactor * 0.45 * effectiveWind;
              offset.x += windDir.x * trunkBend;
              offset.z += windDir.z * trunkBend;

              // Crown frond turbulence if near top of palm
              if (hFactor > 0.65) {
                float frondPhase = pos.x * 2.2 + pos.z * 1.8 + time * 3.8;
                float frondFlutter = sin(frondPhase) * cos(frondPhase * 0.7) * 0.18 * (hFactor - 0.65);
                offset.x += frondFlutter;
                offset.y -= abs(frondFlutter) * 0.35;
                offset.z += frondFlutter * 0.8;
              }
            } else if (floraType == 1) {
              // 2. MANGROVE: Stiff stilt roots near bottom (y < 1.5m), flexible canopy
              float rootStiffness = smoothstep(0.2, 1.2, hFactor);
              float canopySway = sin(time * 2.2 + pos.x * 1.5 + pos.z * 1.2) * 0.12 * effectiveWind * rootStiffness;
              offset.x += windDir.x * canopySway;
              offset.z += windDir.z * canopySway;
            } else if (floraType == 2) {
              // 3. TEA BUSH: Dense rolling wind ripple across planar canopy
              float ripple = sin(pos.x * 3.2 + time * 4.2) * cos(pos.z * 2.8 + time * 3.5) * 0.065 * effectiveWind;
              offset.y += ripple * hFactor;
              offset.x += windDir.x * ripple * 0.5;
              offset.z += windDir.z * ripple * 0.5;
            } else {
              // 4. SHRUB / GRASS: Ground-anchored pendulum sway
              float shrubSway = hFactor * sin(time * 3.0 + pos.x * 4.0 + pos.z * 3.0) * 0.08 * effectiveWind;
              offset.x += windDir.x * shrubSway;
              offset.z += windDir.z * shrubSway;
            }

            return offset * ${swayStrength.toFixed(3)};
          }
          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          vec3 floraSway = calculateFloraWindSway(transformed, transformed.y, ${typeInt}, uFoliageTime, uWindDir, uWindIntensity, uWindGust);
          transformed += floraSway;
          `
        );
      };

      material.needsUpdate = true;
      return material;
    }

    /**
     * Register a mesh or instanced mesh to the dynamic foliage system
     */
    registerMesh(mesh, floraType = 'PALMYRA_PALM', options = {}) {
      if (!mesh) return;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => this.applyFoliageShader(m, floraType, options));
        } else {
          this.applyFoliageShader(mesh.material, floraType, options);
        }
      }
      this.registeredMeshes.push({ mesh, floraType, options });
    }

    /**
     * Auto-detect and register foliage in a scene group
     */
    registerHierarchy(rootGroup) {
      if (!rootGroup) return;
      rootGroup.traverse((child) => {
        if (child.isMesh) {
          const name = (child.name || '').toLowerCase();
          if (name.includes('palm') || name.includes('palmyra')) {
            this.registerMesh(child, 'PALMYRA_PALM', { refHeight: 14.0 });
          } else if (name.includes('mangrove') || name.includes('canal_tree')) {
            this.registerMesh(child, 'MANGROVE', { refHeight: 6.0 });
          } else if (name.includes('tea') || name.includes('bush') || name.includes('hedge')) {
            this.registerMesh(child, 'TEA_BUSH', { refHeight: 2.2 });
          } else if (name.includes('grass') || name.includes('flora') || name.includes('foliage')) {
            this.registerMesh(child, 'SHRUB_GRASS', { refHeight: 1.5 });
          }
        }
      });
    }

    /**
     * Update wind simulation each frame
     * @param {number} deltaTime
     * @param {Object} weatherSystem
     */
    update(deltaTime, weatherSystem = null) {
      this.time += deltaTime;
      this.sharedUniforms.uFoliageTime.value = this.time;

      // Wind gust modulation
      this.gustTimer += deltaTime;
      const baseGust = 1.0 + 0.45 * Math.sin(this.gustTimer * 0.8) + 0.25 * Math.sin(this.gustTimer * 2.1);

      let targetSpeed = 2.4;
      if (weatherSystem) {
        if (weatherSystem.currentWeather === 'rain') targetSpeed = 5.8;
        else if (weatherSystem.currentWeather === 'storm') targetSpeed = 9.2;
        else if (weatherSystem.currentWeather === 'mist') targetSpeed = 1.6;
      }

      this.windSpeed += (targetSpeed - this.windSpeed) * Math.min(1.0, deltaTime * 0.5);
      this.windGust = Math.max(0.4, baseGust);

      this.sharedUniforms.uWindIntensity.value = this.windSpeed;
      this.sharedUniforms.uWindGust.value = this.windGust;
    }
  }

  window.DynamicFoliageSystem = DynamicFoliageSystem;
  window.FOLIAGE_TYPES = FOLIAGE_TYPES;
})();
