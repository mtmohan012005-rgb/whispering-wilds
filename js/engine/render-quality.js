// ============================================================================
// THE WHISPERING WILDS - RENDER QUALITY & COLOR MANAGEMENT
// ============================================================================

(function() {
    class RenderQualityManager {
        static applyQualitySettings(renderer, preset = 'HIGH') {
            if (!renderer) return;

            const config = window.VISUAL_QUALITY_DATA?.PRESETS?.[preset] || window.VISUAL_QUALITY_DATA?.PRESETS?.HIGH;

            // 1. Color Management & Tonemapping
            if (THREE.sRGBEncoding !== undefined) {
                renderer.outputEncoding = THREE.sRGBEncoding;
            }
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;

            // 2. Pixel Ratio (cap at 2.0 to preserve 60 FPS on high-DPI PC monitors)
            const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
            renderer.setPixelRatio(dpr);

            // 3. Shadow Maps
            if (config.shadows) {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            } else {
                renderer.shadowMap.enabled = false;
            }
        }
    }

    window.RenderQualityManager = RenderQualityManager;
})();
