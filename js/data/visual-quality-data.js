// ============================================================================
// THE WHISPERING WILDS - VISUAL QUALITY & PBR MATERIAL DATA
// ============================================================================

(function() {
    const PBR_MATERIAL_PRESETS = {
        SKIN: { color: 0xc68642, roughness: 0.65, metalness: 0.0, normalScale: 0.4 },
        COTTON: { color: 0xeeeeee, roughness: 0.90, metalness: 0.0, normalScale: 0.2 },
        SILK: { color: 0x9b2226, roughness: 0.35, metalness: 0.1, normalScale: 0.3 },
        WOOD: { color: 0x5a3d28, roughness: 0.70, metalness: 0.0, normalScale: 0.6 },
        STONE: { color: 0x777777, roughness: 0.85, metalness: 0.05, normalScale: 0.8 },
        GRANITE: { color: 0x555555, roughness: 0.80, metalness: 0.1, normalScale: 0.9 },
        METAL: { color: 0x888888, roughness: 0.30, metalness: 0.85, normalScale: 0.3 },
        BRASS: { color: 0xd4af37, roughness: 0.35, metalness: 0.75, normalScale: 0.4 },
        CERAMIC: { color: 0xdddddd, roughness: 0.25, metalness: 0.05, normalScale: 0.2 },
        CLAY: { color: 0x9c4f2b, roughness: 0.85, metalness: 0.0, normalScale: 0.6 },
        SOIL: { color: 0x4a3525, roughness: 0.95, metalness: 0.0, normalScale: 0.8 },
        MUD: { color: 0x362518, roughness: 0.50, metalness: 0.05, normalScale: 0.7 }, // wet look
        GRASS: { color: 0x3a6b35, roughness: 0.80, metalness: 0.0, normalScale: 0.5 },
        LEAF: { color: 0x2d5a27, roughness: 0.60, metalness: 0.0, normalScale: 0.4 },
        BARK: { color: 0x443322, roughness: 0.90, metalness: 0.0, normalScale: 0.9 },
        WATER: { color: 0x1b4965, roughness: 0.10, metalness: 0.1, normalScale: 0.8 },
        GLASS: { color: 0xaaddee, roughness: 0.05, metalness: 0.1, normalScale: 0.1 },
        PAINT: { color: 0x225588, roughness: 0.40, metalness: 0.0, normalScale: 0.3 },
        RUBBER: { color: 0x222222, roughness: 0.80, metalness: 0.0, normalScale: 0.3 },
        ROAD: { color: 0x3a3a3a, roughness: 0.75, metalness: 0.05, normalScale: 0.7 },
        SAND: { color: 0xd4b483, roughness: 0.90, metalness: 0.0, normalScale: 0.5 }
    };

    const REGIONAL_VISUAL_PROFILES = {
        GEORGE_TOWN: {
            sunColor: 0xfff0db,
            ambientColor: 0x6e8075,
            fogColor: 0x8a9990,
            fogNear: 40,
            fogFar: 280,
            waterColor: 0x1a4055,
            haze: 'COASTAL_HAZE'
        },
        CAUVERY_DELTA: {
            sunColor: 0xfff6dd,
            ambientColor: 0x5a7550,
            fogColor: 0xa0b098,
            fogNear: 50,
            fogFar: 350,
            waterColor: 0x235238,
            haze: 'CLEAR'
        },
        PICHAVARAM: {
            sunColor: 0xf5eedd,
            ambientColor: 0x486b5c,
            fogColor: 0x768f82,
            fogNear: 25,
            fogFar: 220,
            waterColor: 0x1c3b2b,
            haze: 'HUMID'
        },
        CHETTINAD: {
            sunColor: 0xffe8cc,
            ambientColor: 0x7a6b5c,
            fogColor: 0xb3a291,
            fogNear: 60,
            fogFar: 380,
            waterColor: 0x3d4a45,
            haze: 'CLEAR'
        },
        THANJAVUR: {
            sunColor: 0xffebcb,
            ambientColor: 0x786958,
            fogColor: 0xa89985,
            fogNear: 50,
            fogFar: 340,
            waterColor: 0x2b4238,
            haze: 'CLEAR'
        },
        MAMALLAPURAM: {
            sunColor: 0xfff2e0,
            ambientColor: 0x607a82,
            fogColor: 0x8ea2a8,
            fogNear: 35,
            fogFar: 260,
            waterColor: 0x184860,
            haze: 'COASTAL_HAZE'
        },
        NILGIRIS: {
            sunColor: 0xf0f5ff,
            ambientColor: 0x405560,
            fogColor: 0x657885,
            fogNear: 15,
            fogFar: 140, // dense mountain mist
            waterColor: 0x1a3340,
            haze: 'MIST'
        }
    };

    const GRAPHICS_PRESETS = {
        VERY_LOW: { shadows: false, shadowMapSize: 512, waterQuality: 'LOW', particles: 50, viewDist: 150 },
        LOW: { shadows: true, shadowMapSize: 1024, waterQuality: 'LOW', particles: 100, viewDist: 200 },
        MEDIUM: { shadows: true, shadowMapSize: 2048, waterQuality: 'HIGH', particles: 200, viewDist: 300 },
        HIGH: { shadows: true, shadowMapSize: 2048, waterQuality: 'HIGH', particles: 350, viewDist: 400 },
        ULTRA: { shadows: true, shadowMapSize: 4096, waterQuality: 'ULTRA', particles: 500, viewDist: 500 }
    };

    window.VISUAL_QUALITY_DATA = {
        MATERIALS: PBR_MATERIAL_PRESETS,
        REGIONS: REGIONAL_VISUAL_PROFILES,
        PRESETS: GRAPHICS_PRESETS
    };
})();
