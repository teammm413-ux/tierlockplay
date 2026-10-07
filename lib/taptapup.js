import crypto from 'crypto';

/**
 * Payment Gateway Integration Service
 * All credentials are strictly read from process.env environment variables.
 * No sensitive merchant keys or secrets are hardcoded.
 */

/**
 * Dynamically resolves channel product ID from process.env
 */
export function getChannelProductId(channel) {
  const key = (channel || '').toLowerCase().trim();
  if (key.includes('cash')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_CASHAPP || process.env.TAPTAPUP_PRODUCT_ID || '0', 10);
  }
  if (key.includes('apple') || key.includes('google') || key.includes('debit')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_GOOGLE_APPLE_PAY || '0', 10);
  }
  if (key.includes('paypal')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_PAYPAL || '0', 10);
  }
  if (key.includes('chime')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_CHIME || '0', 10);
  }
  if (key.includes('btc') || key.includes('lightning') || key.includes('bitcoin')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_BTC_LIGHTNING || '0', 10);
  }
  return parseInt(process.env.REVSOL_PRODUCT_ID_CASHAPP || process.env.TAPTAPUP_PRODUCT_ID || '0', 10);
}

export function getTapTapUpConfig(channel) {
  const chosenProductId = getChannelProductId(channel);
  return {
    merchantId: process.env.REVSOL_MERCHANT_ID || process.env.TAPTAPUP_MERCHANT_ID || '',
    merchantName: process.env.REVSOL_MERCHANT_NAME || process.env.TAPTAPUP_MERCHANT_NAME || 'Payment Gateway',
    vendorEmail: process.env.REVSOL_VENDOR_EMAIL || '',
    secretKey: process.env.REVSOL_SHARED_SECRET || process.env.TAPTAPUP_SECRET_KEY || '',
    webhookSecret: process.env.REVSOL_WEBHOOK_SECRET || process.env.TAPTAPUP_WEBHOOK_SECRET || '',
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
  if (!secretKey) return '';
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
    email: email || config.vendorEmail || 'support@tierlockplay.com',
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
          gateway: config.merchantName,
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

  throw lastError || new Error('Failed to connect to payment gateway');
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
