import crypto from 'crypto';

/**
 * Revsol / TapTapUp Payment Gateway Integration Service
 * Configured with live merchant credentials:
 * - Merchant Name: Revsol
 * - Vendor Email: Revsolc@gmail.com
 * - Merchant ID: 2026103966
 * - Shared Secret: 2b6e6936744bdb6e79b74308013c889a
 * - Webhook Secret: 22cb23cce492a1efe7d7f34f6c2a0d99
 */

export const REVSOL_PRODUCTS = {
  CASHAPP: { id: 272835, name: 'Cash App', badge: 'CashApp $tag' },
  GOOGLE_APPLE_PAY: { id: 49794, name: 'Google & Apple Pay', badge: 'Instant Pay' },
  PAYPAL: { id: 373683, name: 'PayPal', badge: 'Buyer Protected' },
  CHIME: { id: 314026, name: 'Chime', badge: 'Chime Sign' },
  BTC_LIGHTNING: { id: 93593, name: 'BTC Lightning', badge: 'Zero Conf' },
};

export const REVSOL_CHANNEL_MAP = {
  'Cash APP': 272835,
  'CashApp': 272835,
  'Cash App': 272835,
  'Google & Apple Pay': 49794,
  'Apple Pay': 49794,
  'Google Pay': 49794,
  'PayPal': 373683,
  'Paypal': 373683,
  'Chime': 314026,
  'BTC Lightning': 93593,
  'Bitcoin': 93593,
  'Debit Card': 49794,
};

export function getRevsolProductId(channel) {
  if (!channel) return REVSOL_PRODUCTS.CASHAPP.id;
  const key = channel.trim();
  return REVSOL_CHANNEL_MAP[key] || REVSOL_PRODUCTS.CASHAPP.id;
}

export function getTapTapUpConfig(channel) {
  const chosenProductId = getRevsolProductId(channel);
  return {
    merchantId: process.env.REVSOL_MERCHANT_ID || process.env.TAPTAPUP_MERCHANT_ID || '2026103966',
    merchantName: process.env.REVSOL_MERCHANT_NAME || process.env.TAPTAPUP_MERCHANT_NAME || 'Revsol',
    vendorEmail: process.env.REVSOL_VENDOR_EMAIL || 'Revsolc@gmail.com',
    secretKey: process.env.REVSOL_SHARED_SECRET || process.env.TAPTAPUP_SECRET_KEY || '2b6e6936744bdb6e79b74308013c889a',
    webhookSecret: process.env.REVSOL_WEBHOOK_SECRET || process.env.TAPTAPUP_WEBHOOK_SECRET || '22cb23cce492a1efe7d7f34f6c2a0d99',
    baseUrl: (process.env.REVSOL_BASE_URL || process.env.TAPTAPUP_BASE_URL || 'https://www.taptapup.xyz').replace(/\/+$/, ''),
    productId: chosenProductId,
    minAmount: 1.00,
    mode: process.env.REVSOL_MODE || 'production',
  };
}

/**
 * Compute HMAC-SHA256 signature: hmac_sha256("{timestamp}{raw_body}", shared_secret)
 */
export function generateHmacSignature(timestamp, rawBody, secretKey) {
  const dataToSign = `${timestamp}${rawBody}`;
  return crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex');
}

/**
 * Verify Webhook Signature using Webhook Secret
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Initiate payment on Revsol / TapTapUp
 * @param {Object} params
 * @param {number} params.amount - Payment amount
 * @param {string} params.email - Customer email
 * @param {string} params.merchantReference - Unique order number
 * @param {string} [params.paymentMethod] - Selected payment channel (e.g. Cash App, PayPal, Apple Pay)
 * @param {string} [params.returnUrl] - Redirect URL after payment
 * @param {string} [params.webhookUrl] - Server webhook callback URL
 */
export async function initiateTapTapUpPayment({
  amount,
  email,
  merchantReference,
  paymentMethod = 'Cash App',
  returnUrl,
  webhookUrl,
}) {
  const config = getTapTapUpConfig(paymentMethod);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const finalReturnUrl = returnUrl || `${appBaseUrl}/player/wallet/deposit?status=return&order_no=${merchantReference}`;
  const finalWebhookUrl = webhookUrl || `${appBaseUrl}/api/webhooks/taptapup`;

  const payload = {
    product_id: config.productId,
    amount: parseFloat(Number(amount).toFixed(2)),
    email: email || config.vendorEmail,
    merchant_reference: String(merchantReference),
    return_url: finalReturnUrl,
    webhook_url: finalWebhookUrl,
  };

  const rawBody = JSON.stringify(payload);
  const signature = generateHmacSignature(timestamp, rawBody, config.secretKey);

  const headers = {
    'Content-Type': 'application/json',
    'X-Merchant-ID': config.merchantId,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };

  // Try endpoints (WordPress REST path first since it is active on the server, fallback to /api/v1/)
  const endpoints = [
    `${config.baseUrl}/wp-json/taptapup/v1/initiate-payment`,
    `${config.baseUrl}/api/v1/initiate-payment`,
  ];

  let lastError = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: rawBody,
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        lastError = new Error(`Non-JSON response from ${url}: ${text.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          redirectUrl: data.redirect_url,
          token: data.token,
          expiresIn: data.expires_in || 3600,
          requestedAmount: data.requested_amount || amount,
          finalAmount: data.final_amount || amount,
          gateway: 'Revsol',
          productId: config.productId,
          merchantReference,
          endpointUsed: url,
        };
      } else {
        return {
          success: false,
          error: data.error || 'initiate_failed',
          message: data.message || 'Payment initiation failed',
          code: data.code || response.status,
          productId: config.productId,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to connect to Revsol payment gateway');
}

/**
 * Check payment status by token
 */
export async function checkTapTapUpStatus(token) {
  const config = getTapTapUpConfig();
  const endpoints = [
    `${config.baseUrl}/wp-json/taptapup/v1/status/${encodeURIComponent(token)}`,
    `${config.baseUrl}/api/v1/status/${encodeURIComponent(token)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        return json;
      }
    } catch (err) {
      // try next
    }
  }

  return { success: false, status: 'unknown' };
}
