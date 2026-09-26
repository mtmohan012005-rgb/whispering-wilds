// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CLOUD SAVE HTTP CLIENT
// Secure, credentialed HTTP client for saving, loading, and profile synchronization.
// ============================================================================

(function() {
    class CloudSaveClient {
        constructor() {
            const runtimeBackend = (typeof window !== 'undefined' && window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.multiplayerServerUrl)
                ? window.RUNTIME_CONFIG.multiplayerServerUrl
                : (typeof window !== 'undefined' ? window.location.origin : '');
            this.baseUrl = runtimeBackend.replace(/\/$/, '');
        }

        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                'x-ww-csrf': '1',
                ...(options.headers || {})
            };

            const config = {
                ...options,
                headers,
                credentials: 'include' // Send auth cookies
            };

            try {
                const response = await fetch(url, config);
                const data = await response.json().catch(() => ({}));
                return {
                    ok: response.ok,
                    status: response.status,
                    data
                };
            } catch (err) {
                return {
                    ok: false,
                    status: 0,
                    error: err.message
                };
            }
        }

        async getLatestSave() {
            return this.request('/api/saves/latest', { method: 'GET' });
        }

        async saveGame(payload, force = false) {
            return this.request(`/api/saves?force=${force}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }

        async resolveConflict(resolution) {
            return this.request('/api/saves/resolve-conflict', {
                method: 'POST',
                body: JSON.stringify(resolution)
            });
        }

        async getProfile() {
            return this.request('/api/profile', { method: 'GET' });
        }

        async updateProfile(profileData) {
            return this.request('/api/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        }
    }

    if (typeof window !== 'undefined') {
        window.CloudSaveClient = new CloudSaveClient();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { CloudSaveClient };
    }
})();
