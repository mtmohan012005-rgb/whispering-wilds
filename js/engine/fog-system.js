// ============================================================================
// THE WHISPERING WILDS - FOG & ATMOSPHERIC HAZE SYSTEM
// ============================================================================

(function() {
    class FogSystem {
        constructor(scene) {
            this.scene = scene;
            this.currentMode = 'CLEAR';
        }

        update(region = 'GEORGE_TOWN', weather = 'clear', worldTime = 12.0) {
            if (!this.scene) return;

            const regProfile = window.VISUAL_QUALITY_DATA?.REGIONS?.[region] || window.VISUAL_QUALITY_DATA?.REGIONS?.GEORGE_TOWN;
            let fogColor = regProfile.fogColor || 0xa0b098;
            let fogNear = regProfile.fogNear || 40;
            let fogFar = regProfile.fogFar || 300;

            // Weather overrides
            if (weather === 'rain' || weather === 'heavy_rain') {
                fogColor = 0x6e787d;
                fogNear = Math.max(10, fogNear * 0.5);
                fogFar = Math.max(80, fogFar * 0.6);
            } else if (weather === 'mist' || region === 'NILGIRIS') {
                fogColor = 0x7a8e99;
                fogNear = 12;
                fogFar = 130; // dense Nilgiri mountain mist
            } else if (worldTime < 5.0 || worldTime > 20.0) {
                fogColor = 0x0f151c; // night fog
                fogNear = 20;
                fogFar = 180;
            }

            if (!this.scene.fog) {
                this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
            } else {
                this.scene.fog.color.setHex(fogColor);
                this.scene.fog.near = fogNear;
                this.scene.fog.far = fogFar;
            }
        }
    }

    window.FogSystem = FogSystem;
})();
