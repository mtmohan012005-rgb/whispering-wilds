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
            outfitKey: "baseOutfit",
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
            itemId: "cloth_cargo",
            outfitKey: "farmlandGear",
            name: "Explorer Cargo Pants & Jacket",
            tamilName: "விழுப்புரம் பண்ணை & நடைபயண உடை",
            regionUnlocked: "Villupuram / Delta",
            price: 150,
            stats: { heatResistance: 5, coldResistance: 15, durability: "Medium" },
            description: "Sturdy fabric for rough terrain and thorny paths.",
            clothing: "Durable reinforced khaki canvas jacket & field cargo trousers",
            footwear: "Sturdy high-traction trekking boots",
            icon: "🥾"
        },
        {
            itemId: "cloth_woolen_set",
            outfitKey: "mountainGear",
            name: "Nilgiri Woolen Thermal Suit",
            tamilName: "நீலகிரி குளிர் கம்பளி சூட்",
            regionUnlocked: "Ooty Mountain Ghats",
            price: 350,
            stats: { heatResistance: -10, coldResistance: 50, mobility: "Medium" },
            description: "Essential heavy wear to survive freezing mountain fog and frost.",
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
            wardrobe.tradeableClothingItems[0] // Starts with base veshti
        ];
    }

    // Check if already purchased
    const alreadyOwned = p && p.inventory && p.inventory.some(i => i.itemId === itemID);

    if (alreadyOwned) {
        // Equip directly if already purchased
        p.equippedOutfit = item;
        if (p.setOutfit) p.setOutfit(item.outfitKey);
        console.log(`Equipped owned attire: ${item.name}!`);
        if (audio) audio.playPinTap();
        if (window.gameQuests) window.gameQuests.showQuestNotification(`Equipped: ${item.name} (${item.stats.mobility || item.stats.durability} mobility)`);
        if (window.gameJournal && window.gameJournal.isOpen) window.gameJournal.render();
        return { success: true, alreadyOwned: true, item };
    }

    // Check if player has enough currency or barter items
    if (currentRupees >= item.price) {
        if (p && p.currency !== undefined) p.currency -= item.price;
        if (survival) survival.currency -= item.price;

        if (p) {
            p.inventory.push(item);
            p.equippedOutfit = item;
            if (p.setOutfit) p.setOutfit(item.outfitKey);
        }

        console.log(`Successfully purchased/traded for: ${item.name}! Stats updated.`);
        if (audio) audio.playTeaPour();
        if (window.gameQuests) {
            window.gameQuests.showQuestNotification(`Purchased & Equipped: ${item.name} for ₹${item.price}! (+${item.stats.coldResistance} Cold Res, +${item.stats.heatResistance} Heat Res)`);
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
