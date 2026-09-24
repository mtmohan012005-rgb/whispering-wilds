// ============================================================================
// THE WHISPERING WILDS - BRANDED EMAIL TEMPLATES
// Responsive HTML and plain-text fallback templates with header sanitization
// ============================================================================

(function() {
  'use strict';

  function sanitizeHeader(val) {
    if (!val) return '';
    return String(val).replace(/[\r\n]/g, '').trim();
  }

  const EmailTemplates = {
    sanitizeHeader,

    /**
     * Account Email Verification Template
     */
    getVerificationEmail({ user, verifyUrl, expiryHours = 24 }) {
      const displayName = sanitizeHeader(user.display_name || user.email.split('@')[0]);
      const subject = "Verify your Whispering Wilds account";

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1219; color: #e2e8f0; margin: 0; padding: 24px; }
    .email-container { max-width: 560px; margin: 0 auto; background: #141c26; border: 1px solid #d4af37; border-radius: 12px; overflow: hidden; }
    .header { background: #0e1520; padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); }
    .title { color: #ffd875; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 1px; }
    .subtitle { color: #8c9ba5; font-size: 13px; margin-top: 6px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 16px; }
    .body-text { font-size: 14px; line-height: 1.6; color: #cbd5e0; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #d4af37; color: #0c1219 !important; font-weight: bold; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px; }
    .footer { background: #0e1520; padding: 20px 24px; font-size: 12px; color: #718096; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .expiry { color: #ffd875; font-weight: 500; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="title">THE WHISPERING WILDS</div>
      <div class="subtitle">Kaattu Vazhi • Thadam Exploration</div>
    </div>
    <div class="content">
      <div class="greeting">Vanakkam, ${displayName}!</div>
      <div class="body-text">
        Welcome to <strong>The Whispering Wilds</strong>. To protect your expedition progress, achievements, and cloud saves, please verify your email address.
      </div>
      <div class="btn-container">
        <a href="${verifyUrl}" class="btn" target="_blank">VERIFY EMAIL ADDRESS</a>
      </div>
      <div class="body-text">
        This link will expire in <span class="expiry">${expiryHours} hours</span>. If the button above does not work, copy and paste this link into your browser:<br>
        <span style="color: #63b3ed; word-break: break-all; font-size: 12px;">${verifyUrl}</span>
      </div>
    </div>
    <div class="footer">
      If you did not create an account for The Whispering Wilds, you can safely ignore this message.<br>
      Automated account security • Kaattu Vazhi Studios
    </div>
  </div>
</body>
</html>
      `;

      const text = `
THE WHISPERING WILDS (Kaattu Vazhi)
=====================================
Vanakkam, ${displayName}!

Welcome to The Whispering Wilds. Please verify your email address to secure your account and cloud saves:

${verifyUrl}

This link is valid for ${expiryHours} hours.

If you did not create this account, you can safely ignore this message.
      `.trim();

      return { subject, html, text };
    },

    /**
     * Password Reset Request Template
     */
    getPasswordResetEmail({ user, resetUrl, expiryMinutes = 30 }) {
      const displayName = sanitizeHeader(user.display_name || user.email.split('@')[0]);
      const subject = "Reset your Whispering Wilds password";

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1219; color: #e2e8f0; margin: 0; padding: 24px; }
    .email-container { max-width: 560px; margin: 0 auto; background: #141c26; border: 1px solid #d4af37; border-radius: 12px; overflow: hidden; }
    .header { background: #0e1520; padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); }
    .title { color: #ffd875; font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 1px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 17px; font-weight: 600; color: #fff; margin-bottom: 16px; }
    .body-text { font-size: 14px; line-height: 1.6; color: #cbd5e0; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #d4af37; color: #0c1219 !important; font-weight: bold; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px; }
    .footer { background: #0e1520; padding: 20px 24px; font-size: 12px; color: #718096; line-height: 1.5; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .expiry { color: #ffd875; font-weight: 500; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="title">THE WHISPERING WILDS</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${displayName},</div>
      <div class="body-text">
        A password reset was requested for your Whispering Wilds explorer account. Click the button below to choose a new password.
      </div>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">RESET PASSWORD</a>
      </div>
      <div class="body-text">
        This link is single-use and will expire in <span class="expiry">${expiryMinutes} minutes</span>.<br>
        Direct URL: <span style="color: #63b3ed; word-break: break-all; font-size: 12px;">${resetUrl}</span>
      </div>
    </div>
    <div class="footer">
      If you did not request a password reset, no action is required. Your password will remain unchanged.<br>
      The Whispering Wilds Security
    </div>
  </div>
</body>
</html>
      `;

      const text = `
THE WHISPERING WILDS (Kaattu Vazhi)
=====================================
Hello ${displayName},

A password reset was requested for your account. You can reset your password using the link below:

${resetUrl}

This link is single-use and expires in ${expiryMinutes} minutes.

If you did not request this reset, you can safely ignore this email.
      `.trim();

      return { subject, html, text };
    },

    /**
     * 6-Digit OTP Verification Email Template
     */
    getOtpEmail({ user, otpCode, purpose = 'Verification', expiryMinutes = 10 }) {
      const displayName = sanitizeHeader(user.display_name || user.email.split('@')[0]);
      const subject = `Your ${purpose} Code: ${otpCode} - The Whispering Wilds`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1219; color: #e2e8f0; margin: 0; padding: 24px; }
    .email-container { max-width: 560px; margin: 0 auto; background: #141c26; border: 1px solid #d4af37; border-radius: 12px; overflow: hidden; }
    .header { background: #0e1520; padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); }
    .title { color: #ffd875; font-size: 22px; font-weight: bold; margin: 0; }
    .content { padding: 32px 24px; text-align: center; }
    .otp-box { display: inline-block; background: #0c1219; border: 2px dashed #d4af37; border-radius: 8px; padding: 14px 28px; margin: 24px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffd875; font-family: monospace; }
    .footer { background: #0e1520; padding: 20px 24px; font-size: 12px; color: #718096; line-height: 1.5; text-align: left; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="title">THE WHISPERING WILDS</div>
    </div>
    <div class="content">
      <h3 style="color:#fff; margin-top:0;">One-Time Verification Code</h3>
      <p style="color:#cbd5e0; font-size:14px;">Use the code below to complete your ${purpose.toLowerCase()} request for <strong>${displayName}</strong>:</p>
      <div class="otp-box">${otpCode}</div>
      <p style="color:#a0aec0; font-size:13px;">This code will expire in <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
    </div>
    <div class="footer">
      Never share this code with anyone. Game administrators will never ask for your one-time code.
    </div>
  </div>
</body>
</html>
      `;

      const text = `
THE WHISPERING WILDS
====================
Your ${purpose} Code: ${otpCode}

This code is valid for ${expiryMinutes} minutes. Never share this code with anyone.
      `.trim();

      return { subject, html, text };
    },

    /**
     * Security Notification Template (Password Changed / Session Revoked)
     */
    getSecurityNotificationEmail({ user, eventTitle, eventMessage }) {
      const displayName = sanitizeHeader(user.display_name || user.email.split('@')[0]);
      const subject = `Security Notice: ${eventTitle} - The Whispering Wilds`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c1219; color: #e2e8f0; margin: 0; padding: 24px; }
    .email-container { max-width: 560px; margin: 0 auto; background: #141c26; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; overflow: hidden; }
    .header { background: #0e1520; padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .title { color: #ffd875; font-size: 18px; font-weight: bold; margin: 0; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #cbd5e0; }
    .footer { background: #0e1520; padding: 16px 24px; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="title">Security Alert: ${eventTitle}</div>
    </div>
    <div class="content">
      <p>Hello ${displayName},</p>
      <p>${eventMessage}</p>
      <p>Timestamp: <strong>${new Date().toUTCString()}</strong></p>
      <p>If you did not perform this action, please reset your password immediately and contact support.</p>
    </div>
    <div class="footer">
      The Whispering Wilds Account Security
    </div>
  </div>
</body>
</html>
      `;

      const text = `
THE WHISPERING WILDS - SECURITY NOTICE
=======================================
Hello ${displayName},

${eventMessage}
Time: ${new Date().toUTCString()}

If this was not you, please reset your password immediately.
      `.trim();

      return { subject, html, text };
    }
  };

  module.exports = EmailTemplates;
})();
