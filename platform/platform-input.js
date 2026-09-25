/**
 * PlatformInput - Input Abstraction Bridge
 * Bridges platform controller detection with the game's authoritative InputManager.
 */

(function(root) {
  class PlatformInput {
    constructor(controllerManager) {
      this.controller = controllerManager;
    }

    init() {
      if (this.controller) {
        this.controller.addListener((evt) => {
          // Notify game UI to update button glyph prompts
          if (typeof window !== 'undefined' && window.HUD && typeof window.HUD.updateInputGlyphs === 'function') {
            window.HUD.updateInputGlyphs(this.controller.activeType);
          }
        });
      }
      return this;
    }

    getActionPrompt(action) {
      return this.controller ? this.controller.getGlyphForAction(action) : `[${action}]`;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformInput;
  } else {
    root.PlatformInput = PlatformInput;
  }
})(typeof window !== 'undefined' ? window : global);
