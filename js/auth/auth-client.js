// ============================================================================
// THE WHISPERING WILDS - AUTH API CLIENT
// ============================================================================

(function() {
    class AuthClient {
        constructor() {
            this.baseUrl = this.resolveBaseUrl();
            this.token = null; // optional token fallback if cookies blocked
        }

        resolveBaseUrl() {
            // Check runtime config
            if (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.multiplayerServerUrl) {
                const url = window.RUNTIME_CONFIG.multiplayerServerUrl.replace(/\/$/, '');
                // If on localhost / same domain or explicit server
                return `${url}/api/auth`;
            }
            return '/api/auth';
        }

        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(options.headers || {})
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const fetchOpts = {
                ...options,
                headers,
                credentials: 'include' // include HttpOnly session cookies
            };

            try {
                const response = await fetch(url, fetchOpts);
                let json = {};
                try {
                    json = await response.json();
                } catch (e) {
                    json = { success: false, message: 'Invalid response from account service.' };
                }

                if (!response.ok) {
                    return {
                        success: false,
                        status: response.status,
                        message: json.message || 'Unable to complete request.'
                    };
                }

                return {
                    success: true,
                    status: response.status,
                    data: json.data || null,
                    message: json.message || '',
                    token: json.token || null
                };
            } catch (err) {
                return {
                    success: false,
                    status: 0,
                    isOffline: true,
                    message: 'Unable to connect to the account service.'
                };
            }
        }

        async register(email, displayName, password, confirmPassword) {
            return this.request('/register', {
                method: 'POST',
                body: JSON.stringify({ email, displayName, password, confirmPassword })
            });
        }

        async login(email, password, remember = false) {
            const res = await this.request('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, remember })
            });
            if (res.success && res.token) {
                this.token = res.token;
            }
            return res;
        }

        async logout() {
            const res = await this.request('/logout', { method: 'POST' });
            this.token = null;
            return res;
        }

        async getMe() {
            return this.request('/me', { method: 'GET' });
        }

        async forgotPassword(email) {
            return this.request('/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        }

        async resetPassword(token, newPassword, confirmPassword) {
            return this.request('/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword, confirmPassword })
            });
        }

        async verifyEmail(token) {
            return this.request('/verify-email', {
                method: 'POST',
                body: JSON.stringify({ token })
            });
        }

        async getCloudSave() {
            return this.request('/cloud-save', { method: 'GET' });
        }

        async saveCloudSave(saveData) {
            return this.request('/cloud-save', {
                method: 'POST',
                body: JSON.stringify({ saveData })
            });
        }
    }

    window.AuthClient = new AuthClient();
})();
