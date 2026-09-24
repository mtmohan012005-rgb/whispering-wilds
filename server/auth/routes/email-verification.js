// ============================================================================
// THE WHISPERING WILDS - EMAIL VERIFICATION ROUTES
// Handles send verification, token verification, and direct link verification
// ============================================================================

const express = require('express');
const router = express.Router();
const EmailVerificationService = require('../email-verification-service');
const db = require('../db');
const { csrfProtection } = require('../auth-middleware');

// POST /api/auth/send-verification
router.post('/send-verification', csrfProtection, async (req, res) => {
    try {
        let user = null;
        if (req.user) {
            user = db.findUserById(req.user.id);
        } else if (req.body.email) {
            user = db.findUserByEmail(req.body.email);
        }

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If the account exists, a verification link has been sent.'
            });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const result = await EmailVerificationService.sendVerificationEmail(user, ip);

        if (!result.success) {
            return res.status(429).json(result);
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('[EmailVerificationRoutes] send-verification error:', err.message);
        return res.status(500).json({ success: false, reason: 'Unable to send verification email right now.' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', csrfProtection, (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, reason: 'Missing verification token.' });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const result = EmailVerificationService.verifyToken(token, ip);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (err) {
        console.error('[EmailVerificationRoutes] verify-email error:', err.message);
        return res.status(500).json({ success: false, reason: 'Verification failed. Please try again.' });
    }
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).send('<h3>Invalid verification link.</h3>');
        }

        const ip = req.ip || req.connection.remoteAddress;
        const result = EmailVerificationService.verifyToken(token, ip);

        const appUrl = (process.env.APP_PUBLIC_URL || 'https://thewhisperingwilds.netlify.app').replace(/\/+$/, '');
        const redirectUrl = `${appUrl}/?verified=${result.success ? 'true' : 'false'}&msg=${encodeURIComponent(result.message || result.reason)}`;

        // Render response page with automatic return redirect
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The Whispering Wilds - Account Verification</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0c1219; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #141c26; border: 1px solid #d4af37; border-radius: 12px; padding: 36px 28px; max-width: 440px; text-align: center; }
    h2 { color: #ffd875; margin-top: 0; }
    p { color: #cbd5e0; line-height: 1.5; }
    .btn { display: inline-block; background: #d4af37; color: #0c1219; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
  </style>
  <meta http-equiv="refresh" content="3;url=${redirectUrl}">
</head>
<body>
  <div class="card">
    <h2>${result.success ? 'EMAIL VERIFIED' : 'VERIFICATION FAILED'}</h2>
    <p>${result.message || result.reason}</p>
    <a href="${redirectUrl}" class="btn">RETURN TO GAME</a>
  </div>
</body>
</html>
        `;
        return res.status(result.success ? 200 : 400).send(html);
    } catch (err) {
        console.error('[EmailVerificationRoutes] GET verify-email error:', err.message);
        return res.status(500).send('<h3>Server error processing verification.</h3>');
    }
});

module.exports = router;
