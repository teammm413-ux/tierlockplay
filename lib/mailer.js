const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass && user !== 'your_email@gmail.com') {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Send Email Verification Token
 */
async function sendVerificationEmail(toEmail, username, token) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"Vegas Vault Casino" <noreply@vegasvault.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification - Vegas Vault</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0e14; color: #ffffff; padding: 20px; }
        .card { max-width: 500px; margin: 0 auto; background: #151b26; border-radius: 12px; border: 1px solid #2a3447; padding: 32px; text-align: center; }
        .logo { font-size: 26px; font-weight: 800; color: #f59e0b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
        .code-box { background: #0f131a; border: 2px dashed #f59e0b; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fbbf24; padding: 18px; margin: 24px 0; }
        .footer { font-size: 12px; color: #64748b; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ VEGAS VAULT ⚡</div>
        <h2 style="margin: 0 0 12px; color: #ffffff;">Verify Your Email Address</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Hello <strong>${username}</strong>, welcome to Vegas Vault! Please use the following 6-digit verification code to confirm your email and activate instant cashouts:
        </p>
        <div class="code-box">${token}</div>
        <p style="color: #64748b; font-size: 13px;">This code is valid for 30 minutes. If you did not request this, please ignore this email.</p>
        <div class="footer">© 2026 Vegas Vault Casino & Sweepstakes Wallet. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: `[Vegas Vault] Your Email Verification Code: ${token}`,
        html,
      });
      return { success: true, simulated: false, messageId: info.messageId };
    } catch (err) {
      console.error('SMTP Email Error:', err.message);
      return { success: false, simulated: false, error: err.message, token };
    }
  }

  // Simulated fallback
  console.log(`[SIMULATED SMTP EMAIL] To: ${toEmail} | Code: ${token}`);
  return {
    success: true,
    simulated: true,
    token,
    message: `[Dev Mode] Verification code generated: ${token}. (Set SMTP_USER & SMTP_PASS in .env for live dispatch)`,
  };
}

/**
 * Send Promo Campaign Email
 */
async function sendPromoEmail(toEmail, subject, title, body, promoCode, bonusAmount) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"Vegas Vault Casino" <noreply@vegasvault.com>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0e14; color: #ffffff; padding: 20px; }
        .card { max-width: 550px; margin: 0 auto; background: #131923; border: 1px solid #f59e0b; border-radius: 14px; padding: 36px; text-align: center; }
        .banner { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 900; font-size: 18px; padding: 12px; border-radius: 8px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .promo-code { background: #0f131a; border: 2px dashed #10b981; color: #10b981; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 14px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; background: #f59e0b; color: #000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="banner">🎁 VEGAS VAULT EXCLUSIVE PROMO 🎁</div>
        <h1 style="color: #ffffff; margin-bottom: 12px;">${title}</h1>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">${body}</p>
        ${promoCode ? `<div class="promo-code">USE CODE: ${promoCode}</div>` : ''}
        ${bonusAmount > 0 ? `<p style="color: #10b981; font-size: 18px; font-weight: bold;">FREE BONUS: $${bonusAmount}</p>` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/player/wallet/deposit" class="btn">CLAIM IN VAULT NOW</a>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">You received this email because you are a registered player at Vegas Vault.</p>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      console.error('SMTP Promo Error to', toEmail, err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(`[SIMULATED PROMO EMAIL] To: ${toEmail} | Subject: ${subject} | Code: ${promoCode}`);
  return { success: true, simulated: true };
}

module.exports = { sendVerificationEmail, sendPromoEmail };
