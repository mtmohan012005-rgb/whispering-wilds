// ============================================================================
// THE WHISPERING WILDS - FAST TRAVEL SYSTEM
// ============================================================================

(function() {
    class FastTravelSystem {
        constructor() {
            this.points = new Map();
            this.initPoints();
        }

        initPoints() {
            const raw = window.FAST_TRAVEL_DATA?.POINTS || [];
            for (const p of raw) {
                this.points.set(p.id, {
                    ...p,
                    isDiscovered: !!p.initiallyDiscovered
                });
            }
        }

        discoverPoint(pointId) {
            const pt = this.points.get(pointId);
            if (pt && !pt.isDiscovered) {
                pt.isDiscovered = true;
                if (window.NotificationUI) {
                    window.NotificationUI.show(`Travel Post Unlocked: ${pt.name}`, 'FAST TRAVEL', 4000);
                }
                return true;
            }
            return false;
        }

        getDiscoveredPoints() {
            return Array.from(this.points.values()).filter(p => p.isDiscovered);
        }

        canFastTravel(pointId) {
            const pt = this.points.get(pointId);
            if (!pt) {
                return { allowed: false, reason: 'Destination does not exist.' };
            }
            if (!pt.isDiscovered) {
                return { allowed: false, reason: 'Destination has not been discovered yet.' };
            }

            // Check gameplay lockout contexts
            const isCinematic = (window.cinematicSystem && typeof window.cinematicSystem.isPlaying === 'function' && window.cinematicSystem.isPlaying()) ||
                                (window.CinematicSystem && typeof window.CinematicSystem.isPlaying === 'function' && window.CinematicSystem.isPlaying());
            if (isCinematic) {
                return { allowed: false, reason: 'Cannot fast travel during cinematics.' };
            }
            const isDialogue = (window.dialogueController && (window.dialogueController.isActive === true || (typeof window.dialogueController.isActive === 'function' && window.dialogueController.isActive()))) ||
                               (window.DialogueController && typeof window.DialogueController.isActive === 'function' && window.DialogueController.isActive());
            if (isDialogue) {
                return { allowed: false, reason: 'Cannot fast travel during dialogue.' };
            }
            if (window.PuzzleSystem && typeof window.PuzzleSystem.isActive === 'function' && window.PuzzleSystem.isActive()) {
                return { allowed: false, reason: 'Cannot fast travel during puzzle interaction.' };
            }

            return { allowed: true };
        }

        executeFastTravel(pointId) {
            const check = this.canFastTravel(pointId);
            if (!check.allowed) {
                return { success: false, reason: check.reason };
            }

            const pt = this.points.get(pointId);

            // 1. Advance World Clock
            if (window.GameState && window.GameState.world) {
                window.GameState.world.time = (window.GameState.world.time + pt.travelHours) % 24;
                window.GameState.world.currentRegion = pt.region;
            }

            // 2. Deduct Energy and Hydration (Safe survival drain)
            if (window.GameState && window.GameState.player) {
                window.GameState.player.energy = Math.max(15, (window.GameState.player.energy || 100) - pt.energyCost);
                window.GameState.player.hydration = Math.max(15, (window.GameState.player.hydration || 100) - pt.hydrationCost);
            }

            // 3. Reposition 3D Player safely at arrival marker
            const marker = pt.arrivalMarker;
            if (window.threeWorld && window.threeWorld.player) {
                window.threeWorld.player.x = marker.x;
                window.threeWorld.player.y = marker.y;
                window.threeWorld.player.z = marker.z;
                window.threeWorld.player.yOffset = 0;
                window.threeWorld.player.verticalVelocity = 0;
                window.threeWorld.player.targetRotation = marker.rotationY || 0;
                window.threeWorld.player.currentRotation = marker.rotationY || 0;
                window.threeWorld.player.isGrounded = true;

                if (window.threeWorld.player.group) {
                    window.threeWorld.player.group.position.set(marker.x, marker.y, marker.z);
                    window.threeWorld.player.group.rotation.y = marker.rotationY || 0;
                }
            }

            // 4. Update Region Progression
            if (window.RegionProgressionSystem) {
                window.RegionProgressionSystem.visitRegion(pt.region);
            }

            // 5. Update Audio & Notifications
            if (window.AudioEngine) {
                window.AudioEngine.playTravelTransition?.();
            }
            if (window.NotificationUI) {
                window.NotificationUI.show(`Arrived at ${pt.name}`, pt.region, 3500);
            }

            return { success: true };
        }

        serialize() {
            const discovered = [];
            for (const [id, pt] of this.points.entries()) {
                if (pt.isDiscovered) discovered.push(id);
            }
            return { discovered };
        }

        deserialize(data) {
            if (!data || !Array.isArray(data.discovered)) return;
            for (const id of data.discovered) {
                if (this.points.has(id)) {
                    this.points.get(id).isDiscovered = true;
                }
            }
        }
    }

    window.FastTravelSystem = new FastTravelSystem();
})();
