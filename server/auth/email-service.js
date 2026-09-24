// ============================================================================
// THE WHISPERING WILDS - EMAIL SERVICE ABSTRACTION
// ============================================================================

class EmailService {
    constructor() {
        this.provider = process.env.EMAIL_PROVIDER || null;
    }

    isConfigured() {
        return !!this.provider;
    }

    async sendVerificationEmail(email, token) {
        if (!this.isConfigured()) {
            return {
                sent: false,
                configured: false,
                status: 'EMAIL VERIFICATION NOT CONFIGURED',
                message: 'Email service provider is not configured on this server.'
            };
        }
        // Provider integration (e.g. SendGrid / Resend) would be invoked here
        return { sent: true, configured: true };
    }

    async sendPasswordResetEmail(email, token) {
        if (!this.isConfigured()) {
            return {
                sent: false,
                configured: false,
                status: 'EMAIL VERIFICATION NOT CONFIGURED',
                message: 'Email service provider is not configured on this server.'
            };
        }
        return { sent: true, configured: true };
    }
}

module.exports = new EmailService();
