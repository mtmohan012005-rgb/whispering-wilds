// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EVENT CONDITION SYSTEM
// Evaluates environmental, regional, temporal, and weather conditions.
// ============================================================================

(function() {
    class EventConditionSystem {
        checkEventConditions(event, currentContext) {
            if (!event || !event.conditions) return true;

            const { region, weather, timeOfDay } = currentContext;

            // Region match
            if (event.region && event.region !== region) {
                return false;
            }

            // Weather match
            if (event.conditions.weather && Array.isArray(event.conditions.weather)) {
                if (!event.conditions.weather.includes(weather)) {
                    return false;
                }
            }

            // Time of day match
            if (event.conditions.timeOfDay && Array.isArray(event.conditions.timeOfDay)) {
                if (!event.conditions.timeOfDay.includes(timeOfDay)) {
                    return false;
                }
            }

            return true;
        }

        getCurrentContext() {
            let region = 'george_town';
            let weather = 'clear';
            let timeOfDay = 'day';

            if (window.GameState) {
                if (window.GameState.region) region = window.GameState.region;
                if (window.GameState.weather) weather = window.GameState.weather;
                if (window.GameState.timeOfDay) timeOfDay = window.GameState.timeOfDay;
            }

            return { region, weather, timeOfDay };
        }
    }

    if (typeof window !== 'undefined') {
        window.EventConditionSystem = new EventConditionSystem();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { EventConditionSystem };
    }
})();
