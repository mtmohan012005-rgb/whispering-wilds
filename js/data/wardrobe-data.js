/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Character & Cultural Wardrobe System + Trade & Merchant Logic
 * Culturally authentic Tamil Nadu characters, regional garments, and survival stats
 */

window.culturalWardrobeSystem = {
    characters: [
        {
            id: "npc_tea_annan",
            name: "Annan (Tea Stall Owner)",
            tamilName: "முருகன் அண்ணன் (டீக்கடைக்காரர்)",
            region: "Chennai / George Town",
            defaultOutfit: "Lungi and White Cotton Shirt",
            dialogue: "Thambi, oru hot tea kudi, then pesalam!",
            avatar: "👨🏽‍🍳",
            lore: "The heartbeat of George Town street culture. Wearing a folded checkered lungi and crisp white cotton shirt with a samovar towel over his shoulder."
        },
        {
            id: "npc_farmer",
            name: "Murugan (Village Farmer)",
            tamilName: "முருகன் (விவசாயி)",
            region: "Villupuram Farmlands",
            defaultOutfit: "Khaki Angavasthram and Cotton Dhoti",
            dialogue: "Veyil romba adikkuthu, paathu nadanthu po!",
            avatar: "👳🏽‍♂️",
            lore: "Veteran paddy cultivator of the red-soil plains. Wears a folded cotton dhoti tucked at the knees, a sun-weathered cotton shirt, and an angavasthram draped across his shoulder."
        },
        {
            id: "npc_hill_guide",
            name: "Karthik (Trekking Guide)",
            tamilName: "கார்த்திக் (மலையேற்ற வழிகாட்டி)",
            region: "Nilgiris / Ooty",
            defaultOutfit: "Woolen Sweater, Cap, and Cargo Trousers",
            dialogue: "Ooty malai mists la thappi porathu kashtam thambi.",
            avatar: "🧗🏽‍♂️",
            lore: "Native Nilgiri high-altitude trekking guide. Dressed in a thick knit Ooty mountain woolen sweater, woolen beanie cap, and multi-pocket cargo trekking pants."
        }
    ],

    tradeableClothingItems: [
        {
            itemId: "cloth_veshti",
            outfitId: "everyday_veshti",
            outfitKey: "everyday_veshti",
            legacyKey: "baseOutfit",
            name: "Traditional Cotton Veshti (வேட்டி)",
            tamilName: "பாரம்பரிய பருத்தி வேஷ்டி & சட்டை",
            regionUnlocked: "Chennai Plains",
            price: 50, // in game currency (₹)
            stats: { heatResistance: 10, coldResistance: 0, mobility: "High" },
            description: "Lightweight and breathable for hot coastal weather.",
            clothing: "White cotton shirt & golden-bordered Veshti / Dhoti with shoulder Jhola bag",
            footwear: "Traditional leather kolhapuri sandals",
            icon: "🥻"
        },
        {
            itemId: "cloth_farmer",
            outfitId: "village_workwear",
            outfitKey: "village_workwear",
            legacyKey: "farmlandGear",
            name: "Village Farmland Workwear (வேலை வேஷ்டி)",
            tamilName: "விழுப்புரம் விவசாய கள உடை",
            regionUnlocked: "Villupuram Farmlands",
            price: 80,
            stats: { heatResistance: 15, coldResistance: 5, mobility: "High" },
            description: "Breathable tucked cotton lungi and light shirt adapted for dusty agricultural trails.",
            clothing: "Faded blue cotton work shirt and folded red-soil checkered lungi",
            footwear: "Reinforced rubber farmer chappals",
            icon: "🌾"
        },
        {
            itemId: "cloth_cargo",
            outfitId: "urban_explorer",
            outfitKey: "urban_explorer",
            legacyKey: "farmlandGear",
            name: "Explorer Utility Jacket & Cargo (பயண உடை)",
            tamilName: "சாகச பயண கள உடை",
            regionUnlocked: "Villupuram / Delta",
            price: 150,
            stats: { heatResistance: 5, coldResistance: 15, durability: "Medium" },
            description: "Sturdy fabric for rough terrain and thorny jungle paths.",
            clothing: "Durable reinforced khaki canvas jacket & olive cargo trousers",
            footwear: "Sturdy high-traction trekking boots",
            icon: "🥾"
        },
        {
            itemId: "cloth_festival",
            outfitId: "festival_veshti",
            outfitKey: "festival_veshti",
            legacyKey: "baseOutfit",
            name: "Kanchipuram Silk Festival Veshti (பட்டு வேஷ்டி)",
            tamilName: "காஞ்சிபுரம் திருவிழா பட்டு வேஷ்டி",
            regionUnlocked: "Kanchipuram Heritage",
            price: 250,
            stats: { heatResistance: 5, coldResistance: 10, charisma: "+20% Merchant Barter" },
            description: "Pure cream silk with intricate golden zari borders for ceremonial gatherings.",
            clothing: "Raw silk cream kurta with pure gold zari handloom veshti",
            footwear: "Polished brass-buckle heritage sandals",
            icon: "✨"
        },
        {
            itemId: "cloth_woolen_set",
            outfitId: "nilgiri_warmwear",
            outfitKey: "nilgiri_warmwear",
            legacyKey: "mountainGear",
            name: "Nilgiri Woolen Thermal Suit (கம்பளி சூட்)",
            tamilName: "நீலகிரி குளிர் கம்பளி சூட்",
            regionUnlocked: "Ooty Mountain Ghats",
            price: 350,
            stats: { heatResistance: -10, coldResistance: 50, mobility: "Medium" },
            description: "Essential heavy wear to survive freezing mountain fog, frost, and gale winds.",
            clothing: "Thick knitted Ooty mountain sheep wool sweater & storm poncho",
            footwear: "Insulated mountain grip boots with spiked soles",
            icon: "🧥"
        }
    ]
};

// 2. Trade & Merchant System Logic
// Function to handle buying or trading clothes at a village shop
window.tradeOrBuyClothing = function(player, itemID, merchantRegion) {
    const wardrobe = window.culturalWardrobeSystem;
    const item = wardrobe.tradeableClothingItems.find(i => i.itemId === itemID);

    if (!item) {
        console.log("Item not found!");
        return { success: false, reason: "Item not found!" };
    }

    const p = player || window.gamePlayer || (window.testRef && window.testRef.player);
    const survival = window.gameSurvival || (window.testRef && window.testRef.survival);
    const audio = window.gameAudio;
    const currentRupees = (p && p.currency !== undefined) ? p.currency : (survival ? survival.currency : 0);

    // Initialize inventory if needed
    if (p && !p.inventory) {
        p.inventory = [
            wardrobe.tradeableClothingItems[0] // Starts with everyday veshti
        ];
    }

    const targetOutfitId = item.outfitId || item.outfitKey;

    // Check if already purchased
    const alreadyOwned = p && p.inventory && p.inventory.some(i => i.itemId === itemID);

    if (alreadyOwned) {
        // Equip directly if already purchased
        p.equippedOutfit = item;
        p.outfitId = targetOutfitId;
        if (p.setOutfit) p.setOutfit(targetOutfitId);
        if (window.threeWorld && window.threeWorld.player) {
            window.threeWorld.player.setOutfit(targetOutfitId);
        }
        console.log(`Equipped owned attire: ${item.name}!`);
        if (audio && typeof audio.playPinTap === 'function') audio.playPinTap();
        const mobility = (item.stats && (item.stats.mobility || item.stats.durability)) || 'Standard';
        if (window.gameQuests) window.gameQuests.showQuestNotification(`Equipped: ${item.name} (${mobility} mobility)`);
        if (window.gameJournal && window.gameJournal.isOpen) window.gameJournal.render();
        return { success: true, alreadyOwned: true, item };
    }

    // Check if player has enough currency or barter items
    if (currentRupees >= item.price) {
        if (window.GameState && window.GameState.deductCurrency) {
            window.GameState.deductCurrency(item.price);
        } else {
            if (survival) survival.currency -= item.price;
            if (p && p.currency !== undefined && p !== survival) p.currency -= item.price;
        }

        if (p) {
            p.inventory.push(item);
            p.equippedOutfit = item;
            p.outfitId = targetOutfitId;
            if (p.setOutfit) p.setOutfit(targetOutfitId);
            if (window.threeWorld && window.threeWorld.player) {
                window.threeWorld.player.setOutfit(targetOutfitId);
            }
        }

        console.log(`Successfully purchased/traded for: ${item.name}! Stats updated.`);
        if (audio && typeof audio.playTeaPour === 'function') audio.playTeaPour();
        if (window.gameQuests) {
            const coldRes = (item.stats && item.stats.coldResistance !== undefined) ? item.stats.coldResistance : 0;
            const heatRes = (item.stats && item.stats.heatResistance !== undefined) ? item.stats.heatResistance : 0;
            window.gameQuests.showQuestNotification(`Purchased & Equipped: ${item.name} for ₹${item.price}! (+${coldRes} Cold Res, +${heatRes} Heat Res)`);
        }
        if (window.gameJournal && window.gameJournal.isOpen) window.gameJournal.render();
        return { success: true, item };
    } else {
        const msg = "Not enough currency! Complete village missions or sell gathered resources to trade.";
        console.log(msg);
        if (window.gameQuests) window.gameQuests.showQuestNotification(`Aiyo! Need ₹${item.price} (Have ₹${currentRupees}). Trade or complete quests!`);
        return { success: false, reason: msg };
    }
};

window.buyOrEquipWardrobeItem = function(itemOrId, player, merchantRegion, audio) {
    if (!itemOrId) return { success: false, reason: 'Invalid item' };
    const wardrobe = window.culturalWardrobeSystem;
    const itemId = typeof itemOrId === 'string' ? itemOrId : (itemOrId.id || itemOrId.itemId);
    let item = wardrobe.tradeableClothingItems.find(i => i.itemId === itemId || i.id === itemId);
    if (!item && typeof itemOrId === 'object') {
        item = {
            stats: { coldResistance: 0, heatResistance: 0, mobility: 'Standard' },
            ...itemOrId
        };
        if (!item.itemId) item.itemId = itemId;
        wardrobe.tradeableClothingItems.push(item);
    }
    return window.tradeOrBuyClothing(player, itemId, merchantRegion);
};
