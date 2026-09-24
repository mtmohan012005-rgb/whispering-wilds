// ============================================================================
// THE WHISPERING WILDS - CENTRALIZED PBR MATERIAL SYSTEM
// ============================================================================

(function() {
    class MaterialSystem {
        constructor() {
            this.cache = new Map();
        }

        getMaterial(presetKey, customProps = {}) {
            const preset = window.VISUAL_QUALITY_DATA?.MATERIALS?.[presetKey] || window.VISUAL_QUALITY_DATA?.MATERIALS?.STONE;
            const cacheKey = `${presetKey}_${JSON.stringify(customProps)}`;

            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const mat = new THREE.MeshStandardMaterial({
                color: customProps.color !== undefined ? customProps.color : preset.color,
                roughness: customProps.roughness !== undefined ? customProps.roughness : preset.roughness,
                metalness: customProps.metalness !== undefined ? customProps.metalness : preset.metalness
            });

            // Set color spaces if textures are supplied
            if (customProps.map) {
                customProps.map.encoding = THREE.sRGBEncoding;
                mat.map = customProps.map;
            }
            if (customProps.normalMap) {
                // Normal maps must remain linear
                mat.normalMap = customProps.normalMap;
                if (preset.normalScale) {
                    mat.normalScale = new THREE.Vector2(preset.normalScale, preset.normalScale);
                }
            }

            this.cache.set(cacheKey, mat);
            return mat;
        }

        applyWetness(material, wetness = 0) {
            if (!material || !material.roughness) return;
            // Wet surfaces are darker and have lower roughness
            const targetRoughness = Math.max(0.12, material.roughness * (1.0 - wetness * 0.45));
            material.roughness = targetRoughness;
        }

        clear() {
            for (const mat of this.cache.values()) {
                mat.dispose();
            }
            this.cache.clear();
        }
    }

    window.MaterialSystem = new MaterialSystem();
})();
