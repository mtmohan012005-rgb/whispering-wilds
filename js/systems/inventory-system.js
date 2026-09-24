// ============================================================================
// THE WHISPERING WILDS - DIEGETIC SATCHEL & INVENTORY SYSTEM
// PC Authoritative Inventory with 20.0 kg Weight Constraint & Categories
// ============================================================================

const INVENTORY_ITEMS_DATABASE = {
    // Provisions
    cutting_chai: {
        id: 'cutting_chai',
        name: 'Cutting Chai',
        category: 'provisions',
        weight: 0.25,
        icon: '☕',
        rarity: 'common',
        desc: 'Hot roadside cardamom milk tea from Murugan Annan. Restores 25 Energy.',
        use(player, survival) {
            if (survival) survival.restoreEnergy(25);
            return true;
        }
    },
    filter_coffee: {
        id: 'filter_coffee',
        name: 'Kumbakonam Degree Coffee',
        category: 'provisions',
        weight: 0.3,
        icon: '🫖',
        rarity: 'uncommon',
        desc: 'Rich chicory decoction infused with frothy milk. Restores 40 Energy and sharpens focus.',
        use(player, survival) {
            if (survival) survival.restoreEnergy(40);
            return true;
        }
    },
    banana_leaf_meal: {
        id: 'banana_leaf_meal',
        name: 'Banana Leaf Virundhu',
        category: 'provisions',
        weight: 1.2,
        icon: '🍃',
        rarity: 'rare',
        desc: 'Traditional rice feast with sambar, kootu, and appalam. Fully restores Hunger & Health.',
        use(player, survival) {
            if (survival) {
                survival.restoreEnergy(60);
                survival.heal(50);
            }
            return true;
        }
    },
    elaneer: {
        id: 'elaneer',
        name: 'Tender Coconut (Elaneer)',
        category: 'provisions',
        weight: 1.5,
        icon: '🥥',
        rarity: 'common',
        desc: 'Fresh coconut water straight from Thanjavur groves. Restores 50 Hydration.',
        use(player, survival) {
            if (survival) survival.restoreHydration(50);
            return true;
        }
    },

    // Tools
    brass_lantern: {
        id: 'brass_lantern',
        name: 'Madras Kerosene Lantern',
        category: 'tools',
        weight: 2.2,
        icon: '🏮',
        rarity: 'uncommon',
        desc: 'A heavy brass lantern providing warm illumination through nocturnal exploration and deep fog.'
    },
    geological_compass: {
        id: 'geological_compass',
        name: 'Surveyor Brunton Compass',
        category: 'tools',
        weight: 0.8,
        icon: '🧭',
        rarity: 'rare',
        desc: 'High-precision azimuth compass calibrated to True North across the Tamil plateau.'
    },
    field_journal: {
        id: 'field_journal',
        name: 'Botanical Field Notebook',
        category: 'tools',
        weight: 0.6,
        icon: '📓',
        rarity: 'common',
        desc: 'Leather-bound notes documenting Tamil Nadu flora, fauna, and local folklore.'
    },
    bronze_magnifier: {
        id: 'bronze_magnifier',
        name: 'Engraver’s Lens',
        category: 'tools',
        weight: 0.4,
        icon: '🔍',
        rarity: 'uncommon',
        desc: 'Handheld convex lens used to decipher weathered Pallava and Chola lithic inscriptions.'
    },

    // Curios & Artifacts
    chola_kasu: {
        id: 'chola_kasu',
        name: 'Rajaraja Chola Octagonal Coin',
        category: 'curios',
        weight: 0.1,
        icon: '🪙',
        rarity: 'legendary',
        desc: 'A 10th-century gold kasu minted during the construction of the Brihadisvara temple.'
    },
    terracotta_ayyanar: {
        id: 'terracotta_ayyanar',
        name: 'Ayyanar Horse Fragment',
        category: 'curios',
        weight: 1.8,
        icon: '🐎',
        rarity: 'rare',
        desc: 'Baked red clay votive figurine offered at village boundaries for protection.'
    },
    brass_tiffin: {
        id: 'brass_tiffin',
        name: 'Chettinad 4-Tier Brass Carrier',
        category: 'curios',
        weight: 2.5,
        icon: '🪔',
        rarity: 'uncommon',
        desc: 'Vintage tiered brass carrier engraved with auspicious peacocks.'
    },

    // Documents
    palm_leaf_manuscript: {
        id: 'palm_leaf_manuscript',
        name: 'Oli-Chuvadi (Palm Manuscript)',
        category: 'documents',
        weight: 0.35,
        icon: '📜',
        rarity: 'legendary',
        desc: 'Ancient etched dried palm leaf recording herbal medicine secrets of the Western Ghats.'
    },
    madras_topo_map: {
        id: 'madras_topo_map',
        name: '1892 Survey of India Sheet',
        category: 'documents',
        weight: 0.2,
        icon: '🗺️',
        rarity: 'rare',
        desc: 'A sepia survey map detailing the lost waterways of the Buckingham Canal.'
    }
};

class InventorySystem {
    constructor(maxWeightKg = 20.0) {
        this.maxWeightKg = maxWeightKg;
        // Map of itemId -> { item, quantity }
        this.items = new Map();
        this.onChange = null;

        // Populate initial explorer starter kit
        this.addItem('field_journal', 1);
        this.addItem('geological_compass', 1);
        this.addItem('brass_lantern', 1);
        this.addItem('cutting_chai', 2);
    }

    get maxWeight() {
        return this.maxWeightKg;
    }

    get currentWeight() {
        return this.getTotalWeight();
    }

    addItem(itemOrId, qty = 1) {
        let itemId = '';
        let itemDef = null;

        if (typeof itemOrId === 'string') {
            itemId = itemOrId;
            itemDef = INVENTORY_ITEMS_DATABASE[itemId];
        } else if (itemOrId && typeof itemOrId === 'object') {
            itemId = itemOrId.id || itemOrId.itemId;
            itemDef = itemOrId;
            if (!INVENTORY_ITEMS_DATABASE[itemId]) {
                INVENTORY_ITEMS_DATABASE[itemId] = itemDef;
            }
        }

        if (!itemDef) {
            console.warn(`[Inventory] Unknown item ID: ${itemOrId}`);
            return false;
        }

        const currentWeight = this.getTotalWeight();
        const addedWeight = (itemDef.weight || 0) * qty;

        // Overencumber warning, but allow picking up vital quest documents
        if (currentWeight + addedWeight > this.maxWeightKg && itemDef.category !== 'documents') {
            if (window.quests && window.quests.showQuestNotification) {
                window.quests.showQuestNotification(`⚠️ Satchel Overweight! Cannot carry ${itemDef.name}`);
            }
            return false;
        }

        if (this.items.has(itemId)) {
            this.items.get(itemId).quantity += qty;
        } else {
            this.items.set(itemId, {
                item: itemDef,
                quantity: qty
            });
        }

        if (this.onChange) this.onChange(this);
        return true;
    }

    removeItem(itemId, qty = 1) {
        if (!this.items.has(itemId)) return false;

        const entry = this.items.get(itemId);
        if (entry.item && (entry.item.isQuestItem || entry.item.category === 'documents')) {
            return false;
        }

        entry.quantity -= qty;
        if (entry.quantity <= 0) {
            this.items.delete(itemId);
        }

        if (this.onChange) this.onChange(this);
        return true;
    }

    hasItem(itemId, minQty = 1) {
        if (!this.items.has(itemId)) return false;
        return this.items.get(itemId).quantity >= minQty;
    }

    getItemCount(itemId) {
        if (!this.items.has(itemId)) return 0;
        return this.items.get(itemId).quantity;
    }

    getTotalWeight() {
        let sum = 0;
        for (const [, entry] of this.items) {
            sum += entry.item.weight * entry.quantity;
        }
        return Math.round(sum * 100) / 100;
    }

    getMaxWeight() {
        return this.maxWeightKg;
    }

    isOverencumbered() {
        return this.getTotalWeight() > this.maxWeightKg;
    }

    useItem(itemId, survivalRef) {
        if (!this.hasItem(itemId)) return false;

        const entry = this.items.get(itemId);

        // 1. Check if registered in authoritative SurvivalProductionSystem consumables
        if (window.survivalProductionSystem && typeof window.survivalProductionSystem.consumeItem === 'function') {
            const consumed = window.survivalProductionSystem.consumeItem(itemId);
            if (consumed) {
                this.removeItem(itemId, 1);
                return true;
            }
        }

        // 2. Fallback to custom item.use() hook
        if (typeof entry.item.use === 'function') {
            const survival = survivalRef || (window.GameState && window.GameState.player && window.GameState.player.survival) || (window.testRef && window.testRef.survival);
            const success = entry.item.use(window.player, survival);
            if (success) {
                this.removeItem(itemId, 1);
                return true;
            }
        }
        return false;
    }

    getItemsByCategory(category = 'all') {
        const list = [];
        for (const [, entry] of this.items) {
            if (category === 'all' || entry.item.category === category) {
                list.push(entry);
            }
        }
        return list;
    }

    serialize() {
        const out = [];
        for (const [id, entry] of this.items) {
            out.push({ id, quantity: entry.quantity });
        }
        return out;
    }

    deserialize(data) {
        if (!Array.isArray(data)) return;
        this.items.clear();
        for (const entry of data) {
            if (INVENTORY_ITEMS_DATABASE[entry.id]) {
                this.items.set(entry.id, {
                    item: INVENTORY_ITEMS_DATABASE[entry.id],
                    quantity: entry.quantity
                });
            }
        }
        if (this.onChange) this.onChange(this);
    }
}

window.INVENTORY_ITEMS_DATABASE = INVENTORY_ITEMS_DATABASE;
window.InventorySystem = InventorySystem;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { INVENTORY_ITEMS_DATABASE, InventorySystem };
}
