// ============================================================================
// THE WHISPERING WILDS - ROUTE NETWORK SYSTEM
// ============================================================================

(function() {
    class RouteSystem {
        constructor() {
            this.routes = new Map();
            this.initRoutes();
        }

        initRoutes() {
            const rawRoutes = window.NAVIGATION_DATA?.ROUTES || [];
            for (const r of rawRoutes) {
                this.routes.set(r.id, { ...r });
            }
        }

        discoverRoute(routeId) {
            const route = this.routes.get(routeId);
            if (route && !route.isDiscovered) {
                route.isDiscovered = true;
                if (window.NotificationUI) {
                    window.NotificationUI.show(`Discovered Route: ${route.name}`, 'EXPLORATION', 3500);
                }
                return true;
            }
            return false;
        }

        unlockRoute(routeId) {
            const route = this.routes.get(routeId);
            if (route) {
                route.isBlocked = false;
                delete route.blockReason;
                return true;
            }
            return false;
        }

        getRoutesFrom(regionId) {
            const list = [];
            for (const r of this.routes.values()) {
                if (r.from === regionId || r.to === regionId) {
                    list.push({ ...r });
                }
            }
            return list;
        }

        isBlocked(routeId) {
            const route = this.routes.get(routeId);
            return route ? !!route.isBlocked : false;
        }
    }

    window.RouteSystem = new RouteSystem();
})();
