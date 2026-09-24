// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EVENT CHAIN DATA
// Multi-stage causal event sequences where player decisions dictate subsequent world conditions.
// ============================================================================

(function() {
    const EVENT_CHAINS = [
        {
            id: 'chain_cauvery_restoration',
            title: 'The Flow of Cauvery',
            tamilTitle: 'காவிரியின் சீர்மை',
            region: 'cauvery_delta',
            stages: [
                {
                    stageIndex: 0,
                    id: 'stage_sluice_blockage',
                    title: 'Displaced Timber at the Sluice',
                    description: 'Debris from upstream rains has jammed against the ancient stone weir.',
                    actionRequired: 'clear_debris',
                    nextStageOnSuccess: 1
                },
                {
                    stageIndex: 1,
                    id: 'stage_gradient_balancing',
                    title: 'Hydraulic Balance',
                    description: 'Adjust the distributary channels to prevent silt build-up in the secondary feeder.',
                    actionRequired: 'tune_weir_height',
                    nextStageOnSuccess: 2
                },
                {
                    stageIndex: 2,
                    id: 'stage_harvest_harmony',
                    title: 'Fertile Riverbed',
                    description: 'The waters flow clear into both paddy fields and the coastal mangrove flats.',
                    actionRequired: 'conclude_chain',
                    reward: { xp: 300, currency: 150, codexUnlock: 'kallanai_dam' }
                }
            ],
            currentStage: 0,
            completed: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.EventChainData = {
            EVENT_CHAINS: EVENT_CHAINS,
            getChainById: function(id) {
                return EVENT_CHAINS.find(c => c.id === id) || null;
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EVENT_CHAINS };
    }
})();
