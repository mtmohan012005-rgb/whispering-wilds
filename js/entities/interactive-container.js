// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTIVE CONTAINER ENTITY
// Storage chests, trunks & baskets with anti-duplication loot distribution
// ============================================================================

(function() {
  'use strict';

  class InteractiveContainer extends window.InteractiveProp {
    constructor(config = {}) {
      super({
        ...config,
        type: 'container',
        anchorPoint: config.anchorPoint || 'CHEST_LID',
        savePolicy: 'PERSISTENT'
      });

      this.isOpen = !!config.isOpen;
      this.isLooted = !!config.isLooted;
      this.lootTable = Array.isArray(config.lootTable) ? [...config.lootTable] : [];
      this.lidAngle = this.isOpen ? 1.2 : 0; // ~70 deg open
      this.targetLidAngle = this.lidAngle;
      this.lidMesh = null;

      this._refreshInteractionTypes();
    }

    _refreshInteractionTypes() {
      this.interactionTypes = this.isOpen ? ['INSPECT'] : ['OPEN', 'INSPECT'];
    }

    open(player, context = {}) {
      if (this.isOpen) return { success: false, reason: 'already_open' };
      if (this.isLocked) {
        if (window.gameAudio) window.gameAudio.playLockedRattle?.();
        return { success: false, reason: 'locked', message: this.lockHint };
      }

      this.isOpen = true;
      this.targetLidAngle = 1.2;
      this._refreshInteractionTypes();

      if (window.gameAudio) {
        window.gameAudio.playChestSound?.(this.soundId || 'chest_open_creak', this.position);
      }

      const grantedItems = [];
      // Distribute Loot via single-deduction InventorySystem (Anti-Duplication)
      if (!this.isLooted && this.lootTable.length > 0) {
        // Double check with PropStateSystem to prevent any race condition
        const alreadyClaimed = window.PropStateSystem ? window.PropStateSystem.isContainerClaimed(this.id) : false;
        if (!alreadyClaimed) {
          this.isLooted = true;
          this.lootTable.forEach(item => {
            if (item.itemId === 'rupees') {
              if (window.GameState && window.GameState.addCurrency) {
                window.GameState.addCurrency(item.count);
              } else if (window.gameSurvival) {
                window.gameSurvival.currency = (window.gameSurvival.currency || 0) + item.count;
              }
              grantedItems.push({ itemId: 'rupees', count: item.count });
            } else {
              // Authoritative inventory write
              if (window.inventorySystem && window.inventorySystem.addItem) {
                window.inventorySystem.addItem(item.itemId, item.count, item.weight || 0.1);
              } else if (window.GameState && window.GameState.addItemToInventory) {
                window.GameState.addItemToInventory(item.itemId, item.count, item.itemId, item.weight || 0.1);
              }
              grantedItems.push(item);
            }
          });

          // Record container opened in authoritative GameState
          if (window.PropStateSystem) {
            window.PropStateSystem.recordContainerOpened(this.id, grantedItems);
          }
        }
      }

      return {
        success: true,
        action: 'OPEN',
        propId: this.id,
        items: grantedItems
      };
    }

    onInteract(category, player, context = {}) {
      if (category === 'INSPECT') {
        return super.onInteract('INSPECT', player, context);
      }
      return this.open(player, context);
    }

    update(deltaTime) {
      if (this.lidAngle < this.targetLidAngle) {
        this.lidAngle = Math.min(this.targetLidAngle, this.lidAngle + deltaTime * 2.5);
        if (this.lidMesh) {
          this.lidMesh.rotation.x = -this.lidAngle;
        }
      }
    }
  }

  window.InteractiveContainer = InteractiveContainer;
  console.log('[InteractiveContainer] Registered interactive container entity class.');
})();
