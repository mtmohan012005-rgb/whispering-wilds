// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD EVENT DIALOGUE
// Contextual NPC barks and reactions triggered during active world events.
// ============================================================================

(function() {
    const EVENT_DIALOGUES = {
        evt_monsoon_surge: [
            { npc: 'Selvam', text: 'The river is swelling fast! We must ensure the weir gates don\'t get jammed by driftwood.' },
            { npc: 'Villager', text: 'Listen to that roar from the upstream sluice. Cauvery is alive today!' }
        ],
        evt_nilgiri_dense_fog: [
            { npc: 'Tea Plucker', text: 'Watch your footing on the wet terrace grass! The mist swallows the ridge in minutes.' },
            { npc: 'Ramanathan', text: 'Turn on the shed brass lamps. You won\'t see your own outstretched hand out there.' }
        ],
        evt_temple_pradosham: [
            { npc: 'Archakar', text: 'The evening lamps are kindled. Step inside the cloister to hear the stone echo.' },
            { npc: 'Pilgrim', text: 'The chime from the big Nandi mantapa carries all the way down to the river bank.' }
        ],
        evt_mangrove_low_tide: [
            { npc: 'Kaliappan', text: 'Look at the mudflats! The egrets and mudskippers are out in hundreds between the roots.' },
            { npc: 'Fisherman', text: 'Tie the skiff secure to the timber pile until the evening tide returns.' }
        ],
        evt_chettinad_tile_firing: [
            { npc: 'Muthu Artisan', text: 'The kiln is up to heat. Keep the sand and oxide powders dry for the next casting batch.' }
        ]
    };

    if (typeof window !== 'undefined') {
        window.WorldEventDialogue = {
            EVENT_DIALOGUES: EVENT_DIALOGUES,
            getDialoguesForEvent: function(eventId) {
                return EVENT_DIALOGUES[eventId] || [];
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EVENT_DIALOGUES };
    }
})();
