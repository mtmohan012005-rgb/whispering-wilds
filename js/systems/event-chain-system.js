// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EVENT CHAIN SYSTEM
// Multi-stage causal chain execution, branch resolution, and state saving.
// ============================================================================

(function() {
    class EventChainSystem {
        constructor() {
            this.chains = [];
        }

        init(savedData = null) {
            const raw = (window.EventChainData && window.EventChainData.EVENT_CHAINS) ? window.EventChainData.EVENT_CHAINS : [];
            this.chains = JSON.parse(JSON.stringify(raw));

            if (savedData && Array.isArray(savedData.chainProgress)) {
                savedData.chainProgress.forEach(saved => {
                    const ch = this.chains.find(c => c.id === saved.id);
                    if (ch) {
                        ch.currentStage = saved.currentStage;
                        ch.completed = saved.completed;
                    }
                });
            }
            return this;
        }

        advanceStage(chainId, actionTaken) {
            const chain = this.chains.find(c => c.id === chainId);
            if (!chain || chain.completed) return false;

            const stage = chain.stages[chain.currentStage];
            if (!stage) return false;

            if (stage.nextStageOnSuccess !== undefined) {
                chain.currentStage = stage.nextStageOnSuccess;
                if (window.NotificationSystem) {
                    window.NotificationSystem.show(`Event Chain Progressed: ${chain.title} (Stage ${chain.currentStage + 1})`, 'info');
                }
            } else {
                // Completed chain
                chain.completed = true;
                if (stage.reward) {
                    if (window.GameState) {
                        if (stage.reward.currency && typeof window.GameState.addCurrency === 'function') {
                            window.GameState.addCurrency(stage.reward.currency);
                        }
                        if (stage.reward.xp && typeof window.GameState.addXP === 'function') {
                            window.GameState.addXP(stage.reward.xp);
                        }
                    }
                    if (stage.reward.codexUnlock && window.CodexSystem) {
                        window.CodexSystem.unlockEntry('culture', stage.reward.codexUnlock);
                    }
                }
                if (window.NotificationSystem) {
                    window.NotificationSystem.show(`Event Chain Concluded: ${chain.title}!`, 'success');
                }
            }

            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('event_chain_advanced', { detail: { chain } }));
            }
            return true;
        }
    }

    if (typeof window !== 'undefined') {
        window.EventChainSystem = new EventChainSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EventChainSystem };
    }
})();
