/**
 * The Whispering Wilds - Advanced Village Kadai & Barter System (பண்டமாற்று முறை)
 * Handles dual-currency transactions (Cash ₹ OR gathered materials), localized Tamil NPC dialogues,
 * luck-based haggling discount rolls (15%), and real-time survival stat modifications.
 */

class TradeSystem {
  constructor(game) {
    this.game = game;

    // Player Barter & Financial State
    this.playerState = {
      wallet: 350,
      inventory: ["cloth_casual"],
      materials: {
        teaLeaves: 4,
        shells: 6,
        wildHerbs: 3
      },
      equipped: "cloth_casual",
      discountApplied: false,
      haggleAttempts: 0
    };

    // Regional Catalog with Barter Formulae & Survival Buffs
    this.catalog = [
      {
        id: "cloth_veshti",
        name: "Traditional Cotton Veshti (வேட்டி)",
        region: "Chennai Plains",
        cashPrice: 60,
        barter: { material: "shells", cost: 3, label: "3 River Shells (ஆற்றுச் சிப்பி)" },
        buff: { label: "+10 Heat Protection", tempMod: -0.3, thirstMod: -5, desc: "Lightweight woven cotton lowers skin temperature and slows dehydration under the harsh midday sun." }
      },
      {
        id: "cloth_cargo",
        name: "Explorer Tough Cargo Suit",
        region: "Delta & Wetlands",
        cashPrice: 180,
        barter: { material: "teaLeaves", cost: 3, label: "3 Tea Leaves (தேயிலை)" },
        buff: { label: "+15 Durability & Pockets", tempMod: 0.0, thirstMod: 0, desc: "Reinforced canvas with utility pouches improves sprint stamina efficiency and adds inventory slots." }
      },
      {
        id: "cloth_woolen",
        name: "Nilgiri Thermal Winter Cloak",
        region: "Western Ghats / Ooty",
        cashPrice: 300,
        barter: { material: "teaLeaves", cost: 5, label: "5 Tea Leaves (தேயிலை)" },
        buff: { label: "+50 Cold Defense", tempMod: +0.6, thirstMod: +5, desc: "Hand-spun Toda woolen fleece preserves core warmth (36.5°C) amidst freezing mountain fog and alpine gales." }
      }
    ];

    // Localized Tamil Dialogue Pool
    this.dialoguePool = {
      welcome: '"வணக்கம் தம்பி! வெயில் தாங்காது, வேட்டி இல்லாம நடந்தா கஷ்டம்!" (Welcome! Scorching sun ahead, traversing without a veshti is tough!)',
      cashSuccess: '"ரொம்ப நன்றி தம்பி! சரியான தேர்வு! கிராமத்து தையல் வேலை!" (Thank you, perfect choice! Authentic village tailoring!)',
      cashFail: '"தம்பி காசு பத்தலையே! கொஞ்சம் சில்லறை பாத்து குடு!" (Not enough cash! Complete roadside quests to earn rupees!)',
      barterSuccess: '"பண்டமாற்று சம்மதம்! தரமான காட்டு மூலப்பொருள் தம்பி!" (Barter accepted! Excellent wilderness harvest!)',
      barterFail: (cost, mat) => `"பொருட்கள் போதாது! எனக்கு ${cost} ${mat} வேணும்!" (Need more resources! Gather more across the trail!)`,
      haggleSuccess: '"சரி சரி, உனக்காக 15% குறைச்சு தரேன்! நல்லா வச்சிக்கோ!" (Alright, 15% off for you as a good friend!)',
      haggleFail: '"முடியாது தம்பி, நஷ்டமாயிடும்! அசல் விலை தான்!" (Cannot reduce, strictly fixed price for village artisans!)',
      alreadyHaggled: '"ஏற்கனவே தள்ளுபடி கொடுத்தாச்சு தம்பி! இன்னும் குறைக்க முடியாது!" (Already gave you the best discount, thambi!)'
    };

    this.isOpen = false;
    this.initDOM();
  }

  initDOM() {
    this.modal = document.getElementById('shop-modal');
    this.speechEl = document.getElementById('npc-speech-bubble');
    this.containerEl = document.getElementById('shop-items-container');
    this.haggleBtn = document.getElementById('btn-haggle');
    this.materialsBadge = document.getElementById('hud-materials');

    if (this.haggleBtn) {
      this.haggleBtn.addEventListener('click', () => this.haggleDiscount());
    }

    const closeBtn = document.getElementById('btn-close-shop');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeShop());
    }

    // Sync with existing player wallet if available
    if (this.game && this.game.player) {
      if (this.game.player.rupees !== undefined) {
        this.playerState.wallet = this.game.player.rupees;
      }
      if (this.game.player.materials) {
        this.playerState.materials = Object.assign(this.playerState.materials, this.game.player.materials);
      }
    }

    this.updateHUD();
  }

  openShop() {
    if (!this.modal) this.modal = document.getElementById('shop-modal');
    if (!this.modal) return;

    this.isOpen = true;
    this.modal.classList.remove('hidden');
    this.modal.style.display = 'flex';

    if (this.speechEl) {
      this.speechEl.innerText = this.dialoguePool.welcome;
    }

    this.renderShop();
    this.updateHUD();
  }

  closeShop() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.classList.add('hidden');
    this.modal.style.display = 'none';
  }

  toggleShop() {
    if (this.isOpen) {
      this.closeShop();
    } else {
      this.openShop();
    }
  }

  renderShop() {
    if (!this.containerEl) this.containerEl = document.getElementById('shop-items-container');
    if (!this.containerEl) return;

    this.containerEl.innerHTML = '';

    this.catalog.forEach(item => {
      const isOwned = this.playerState.inventory.includes(item.id);
      const isEquipped = this.playerState.equipped === item.id;
      const finalPrice = this.playerState.discountApplied ? Math.floor(item.cashPrice * 0.85) : item.cashPrice;

      const itemCard = document.createElement('div');
      itemCard.className = `shop-item-card ${isEquipped ? 'item-equipped' : ''}`;

      itemCard.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-title-row">
            <h4>${item.name}</h4>
            ${isEquipped ? '<span class="equipped-tag">ACTIVE / பொருத்தப்பட்டது</span>' : ''}
          </div>
          <p class="shop-item-meta">📍 ${item.region} • <span class="buff-highlight">🛡️ ${item.buff.label}</span></p>
          <p class="shop-item-desc">${item.buff.desc}</p>
          <div class="shop-item-price-row">
            <span class="price-cash">₹${finalPrice} ${this.playerState.discountApplied ? '<small class="discount-badge">-15%</small>' : ''}</span>
            <span class="price-or">OR</span>
            <span class="price-barter">📦 ${item.barter.label}</span>
          </div>
        </div>
        <div class="shop-action-group">
          ${isOwned ? `
            <button class="btn-shop-equip ${isEquipped ? 'active' : ''}" data-item-id="${item.id}">
              ${isEquipped ? 'Equipped (அணிந்துள்ளது)' : 'Equip (அணி)'}
            </button>
          ` : `
            <button class="btn-shop-buy" data-item-id="${item.id}" data-price="${finalPrice}">
              💰 Cash (₹${finalPrice})
            </button>
            <button class="btn-shop-barter" data-item-id="${item.id}">
              ⚖️ Barter (பண்டமாற்று)
            </button>
          `}
        </div>
      `;

      // Event Listeners
      const buyBtn = itemCard.querySelector('.btn-shop-buy');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => this.buyWithCash(item.id, finalPrice));
      }

      const barterBtn = itemCard.querySelector('.btn-shop-barter');
      if (barterBtn) {
        barterBtn.addEventListener('click', () => this.barterItem(item.id));
      }

      const equipBtn = itemCard.querySelector('.btn-shop-equip');
      if (equipBtn) {
        equipBtn.addEventListener('click', () => this.equipOutfit(item.id));
      }

      this.containerEl.appendChild(itemCard);
    });
  }

  buyWithCash(itemId, cost) {
    if (this.playerState.wallet >= cost) {
      this.playerState.wallet -= cost;
      this.equipOutfit(itemId);

      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.cashSuccess;
      }

      this.triggerAudioCue('buy');
      this.postTransaction(itemId);
    } else {
      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.cashFail;
      }
      this.triggerAudioCue('error');
    }

    this.updateHUD();
    this.renderShop();
  }

  barterItem(itemId) {
    const item = this.catalog.find(i => i.id === itemId);
    if (!item) return;

    const mat = item.barter.material;
    const cost = item.barter.cost;

    if (this.playerState.materials[mat] && this.playerState.materials[mat] >= cost) {
      this.playerState.materials[mat] -= cost;
      this.equipOutfit(itemId);

      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.barterSuccess;
      }

      this.triggerAudioCue('barter');
      this.postTransaction(itemId);
    } else {
      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.barterFail(cost, item.barter.label);
      }
      this.triggerAudioCue('error');
    }

    this.updateHUD();
    this.renderShop();
  }

  equipOutfit(itemId) {
    if (!this.playerState.inventory.includes(itemId)) {
      this.playerState.inventory.push(itemId);
    }
    this.playerState.equipped = itemId;

    const item = this.catalog.find(i => i.id === itemId);

    // Apply live survival stat buffs
    if (this.game && this.game.survival) {
      if (itemId === "cloth_veshti") {
        // Veshti mitigates extreme heat and slows thirst
        this.game.survival.thirstDrainModifier = 0.65;
        this.game.survival.tempModifier = -0.3;
        this.game.survival.staminaEfficiency = 1.0;
      } else if (itemId === "cloth_woolen") {
        // Thermal cloak stabilizes body warmth in alpine fog
        this.game.survival.coldDefense = 50;
        this.game.survival.tempModifier = 0.6;
        this.game.survival.thirstDrainModifier = 1.1;
      } else if (itemId === "cloth_cargo") {
        // Cargo suits boost sprint endurance & inventory
        this.game.survival.staminaEfficiency = 0.7;
        this.game.survival.tempModifier = 0.0;
        this.game.survival.thirstDrainModifier = 1.0;
      }

      // Re-evaluate core temperature
      this.game.survival.recalculateThermalEquilibrium();
    }

    // Sync with 3D player mesh if active
    if (this.game && this.game.threeWorld && this.game.threeWorld.player && typeof this.game.threeWorld.player.updateAttireColors === 'function') {
      this.game.threeWorld.player.updateAttireColors(itemId);
    }

    // Broadcast toast notification
    if (this.game && this.game.showToast && item) {
      this.game.showToast(`🛡️ Equipped ${item.name} (${item.buff.label})`, 3500);
    }
  }

  haggleDiscount() {
    if (this.playerState.discountApplied) {
      if (this.speechEl) this.speechEl.innerText = this.dialoguePool.alreadyHaggled;
      return;
    }

    this.playerState.haggleAttempts++;

    // 60% chance of success (Math.random() > 0.4)
    if (Math.random() > 0.4) {
      this.playerState.discountApplied = true;
      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.haggleSuccess;
      }
      this.triggerAudioCue('success');
      this.renderShop();
    } else {
      if (this.speechEl) {
        this.speechEl.innerText = this.dialoguePool.haggleFail;
      }
      this.triggerAudioCue('error');
    }
  }

  postTransaction(itemId) {
    // Sync with game economy
    if (this.game && this.game.player) {
      this.game.player.rupees = this.playerState.wallet;
      this.game.player.materials = this.playerState.materials;
      this.game.player.equippedOutfit = this.playerState.equipped;
    }

    // Checkpoint autosave on meaningful economic milestone
    if (this.game && this.game.saveSystem) {
      this.game.saveSystem.triggerAutosave(`Purchased ${itemId}`);
    }
  }

  updateHUD() {
    // Update currency badge
    const rupeeCountEl = document.getElementById('rupee-count');
    if (rupeeCountEl) {
      rupeeCountEl.innerText = `₹${this.playerState.wallet}`;
    }

    // Update materials badge
    if (!this.materialsBadge) this.materialsBadge = document.getElementById('hud-materials');
    if (this.materialsBadge) {
      this.materialsBadge.innerHTML = `🍃 Tea: ${this.playerState.materials.teaLeaves} | 🐚 Shells: ${this.playerState.materials.shells}`;
    }

    // Update equipped display if exists
    const equippedDisplay = document.getElementById('equippedDisplay');
    if (equippedDisplay) {
      const cur = this.catalog.find(i => i.id === this.playerState.equipped);
      equippedDisplay.innerText = cur ? cur.name : "Casual Attire";
    }
  }

  triggerAudioCue(type) {
    if (this.game && this.game.audioEngine) {
      const a = this.game.audioEngine;
      if (type === 'buy' || type === 'barter' || type === 'success') {
        if (typeof a.playTeaPour === 'function') a.playTeaPour();
        else if (typeof a.playPinTap === 'function') a.playPinTap();
      } else if (type === 'error') {
        if (typeof a.playFootstep === 'function') a.playFootstep('dirt');
        else if (typeof a.playPinTap === 'function') a.playPinTap();
      }
    }
  }
}

// Expose globally
window.TradeSystem = TradeSystem;
