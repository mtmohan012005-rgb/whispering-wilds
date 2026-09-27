/**
 * The Whispering Wilds (Kaattu Vazhi) - Advanced PBR Lighting & Surface Shaders
 * Injects custom physically-based lighting, dynamic rain wetness, specular water sheen,
 * procedural puddle ripples, and normal-map micro-relief into Three.js materials.
 */

(function () {
  'use strict';

  class LightingShaders {
    constructor() {
      this.materials = new Set();
      this.time = 0;
      this.rainWetness = 0.0;
      this.targetWetness = 0.0;
      this.sunMoonDir = new THREE.Vector3(0.3, 0.8, 0.5).normalize();
      this.sunMoonColor = new THREE.Color(0.95, 0.9, 0.8);
      this.ambientBounce = 0.35;

      this.sharedUniforms = {
        uTime: { value: 0 },
        uRainWetness: { value: 0.0 },
        uSunMoonDir: { value: this.sunMoonDir },
        uSunMoonColor: { value: this.sunMoonColor },
        uAmbientBounce: { value: 0.35 }
      };
    }

    /**
     * Patch a Three.js MeshStandardMaterial or MeshPhysicalMaterial with advanced PBR effects
     * @param {THREE.Material} material
     * @param {Object} options
     */
    applyPBRShader(material, options = {}) {
      if (!material || material._wwPbrPatched) return material;
      material._wwPbrPatched = true;

      const receiveWetness = options.receiveWetness !== false;
      const enhanceNormals = options.enhanceNormals !== false;
      const roughnessFloor = options.roughnessFloor !== undefined ? options.roughnessFloor : 0.08;

      const prevCompile = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        if (typeof prevCompile === 'function') {
          prevCompile(shader, renderer);
        }

        // Link shared uniforms
        shader.uniforms.uTime = this.sharedUniforms.uTime;
        shader.uniforms.uRainWetness = this.sharedUniforms.uRainWetness;
        shader.uniforms.uSunMoonDir = this.sharedUniforms.uSunMoonDir;
        shader.uniforms.uSunMoonColor = this.sharedUniforms.uSunMoonColor;
        shader.uniforms.uAmbientBounce = this.sharedUniforms.uAmbientBounce;

        // Vertex Shader injections
        shader.vertexShader = `
          varying vec3 vWorldNormal;
          varying vec3 vWorldPosition;
          ${shader.vertexShader}
        `;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <worldpos_vertex>',
          `
          #include <worldpos_vertex>
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
          `
        );

        // Fragment Shader injections
        shader.fragmentShader = `
          uniform float uTime;
          uniform float uRainWetness;
          uniform vec3 uSunMoonDir;
          uniform vec3 uSunMoonColor;
          uniform float uAmbientBounce;
          varying vec3 vWorldNormal;
          varying vec3 vWorldPosition;

          // Procedural high-frequency ripple perturbation for wet surfaces
          vec3 calculateWetnessRipple(vec3 pos, float time, float wetness) {
            if (wetness < 0.05) return vec3(0.0);
            float dist1 = length(pos.xz * 4.5);
            float wave1 = sin(dist1 * 7.0 - time * 6.5);
            float wave2 = cos(pos.x * 6.0 + pos.z * 5.5 + time * 5.0);
            float ripple = (wave1 + wave2) * 0.045 * wetness;
            return vec3(ripple * 0.5, 0.0, ripple * 0.5);
          }
          ${shader.fragmentShader}
        `;

        // 1. Wetness diffuse absorption (darkens porous surfaces when drenched)
        if (receiveWetness) {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <roughnessmap_fragment>',
            `
            #include <roughnessmap_fragment>
            if (uRainWetness > 0.01) {
              float upFactor = clamp(vWorldNormal.y, 0.0, 1.0);
              // Reduce roughness on horizontal surfaces during rain (wet gloss)
              roughnessFactor = mix(roughnessFactor, ${roughnessFloor.toFixed(3)}, uRainWetness * upFactor * 0.82);
            }
            `
          );

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            if (uRainWetness > 0.01) {
              // Porous diffuse darkening: wet stone/clay/soil absorbs light
              diffuseColor.rgb *= (1.0 - uRainWetness * 0.32);
            }
            `
          );

          // 2. Normal perturbation with raindrops
          if (enhanceNormals) {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <normal_fragment_maps>',
              `
              #include <normal_fragment_maps>
              if (uRainWetness > 0.05 && vWorldNormal.y > 0.35) {
                vec3 rippleNorm = calculateWetnessRipple(vWorldPosition, uTime, uRainWetness);
                normal = normalize(normal + rippleNorm);
              }
              `
            );
          }
        }
      };

      material.needsUpdate = true;
      this.materials.add(material);
      return material;
    }

    /**
     * Update lighting, weather response, and uniform state each frame
     * @param {number} deltaTime
     * @param {Object} weatherSystem
     * @param {Object} lightingSystem
     */
    update(deltaTime, weatherSystem = null, lightingSystem = null) {
      this.time += deltaTime;
      this.sharedUniforms.uTime.value = this.time;

      // Update rain wetness target based on weather
      let targetWet = 0.0;
      if (weatherSystem) {
        if (weatherSystem.currentWeather === 'rain' || weatherSystem.isRaining) {
          targetWet = 1.0;
        } else if (weatherSystem.currentWeather === 'mist') {
          targetWet = 0.35;
        }
      } else if (window.gameWeather && window.gameWeather.isRaining) {
        targetWet = 1.0;
      }

      // Smooth wetness accumulation (accumulates faster than dries)
      const wetRate = (targetWet > this.rainWetness) ? 0.35 : 0.08;
      this.rainWetness += (targetWet - this.rainWetness) * Math.min(1.0, deltaTime * wetRate);
      this.sharedUniforms.uRainWetness.value = this.rainWetness;

      // Synchronize sun/moon direction and color if lighting system is active
      if (lightingSystem && lightingSystem.moonLight) {
        this.sunMoonDir.copy(lightingSystem.moonLight.position).normalize();
        this.sharedUniforms.uSunMoonDir.value.copy(this.sunMoonDir);
        this.sharedUniforms.uSunMoonColor.value.copy(lightingSystem.moonLight.color);
      }
    }

    dispose() {
      this.materials.clear();
    }
  }

  window.LightingShaders = LightingShaders;
  window.lightingShaders = new LightingShaders();
})();
