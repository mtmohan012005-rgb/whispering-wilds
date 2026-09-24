// ============================================================================
// THE WHISPERING WILDS - ANIMATION CONTROLLER (CLIPS & BLENDING)
// ============================================================================

(function() {
    class AnimationController {
        constructor(mixer = null) {
            this.mixer = mixer;
            this.actions = new Map();
            this.currentAction = null;
            this.currentClipName = 'idle';
            this.playbackSpeed = 1.0;
        }

        registerClip(name, action) {
            this.actions.set(name, action);
        }

        hasClip(name) {
            return this.actions.has(name);
        }

        getCurrentState() {
            return this.currentClipName;
        }

        setSpeed(speed) {
            this.playbackSpeed = speed;
            if (this.currentAction) {
                this.currentAction.setEffectiveTimeScale(speed);
            }
        }

        play(clipName, duration = 0.25) {
            const nextAction = this.actions.get(clipName);
            if (!nextAction) return;

            if (this.currentAction === nextAction) {
                return;
            }

            if (this.currentAction) {
                this.currentAction.crossFadeTo(nextAction, duration, true);
            } else {
                nextAction.play();
            }

            this.currentAction = nextAction;
            this.currentClipName = clipName;
        }

        stop() {
            if (this.currentAction) {
                this.currentAction.stop();
                this.currentAction = null;
            }
        }

        update(deltaTime) {
            if (this.mixer) {
                this.mixer.update(deltaTime * this.playbackSpeed);
            }
        }
    }

    window.AnimationController = AnimationController;
})();
