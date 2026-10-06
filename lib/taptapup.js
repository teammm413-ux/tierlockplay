import crypto from 'crypto';

/**
 * TapTapUp Payment Gateway Integration Service
 * Based on official TapTapUp API Integration Guide (Third-Party) v2
 */

export function getTapTapUpConfig() {
  return {
    merchantId: process.env.TAPTAPUP_MERCHANT_ID || 'merchant_test_001',
    merchantName: process.env.TAPTAPUP_MERCHANT_NAME || 'Testing Merchant',
    secretKey: process.env.TAPTAPUP_SECRET_KEY || 'secret_key_abc123xyz789',
    webhookSecret: process.env.TAPTAPUP_WEBHOOK_SECRET || 'webhook_secret_xyz789abc123',
    baseUrl: (process.env.TAPTAPUP_BASE_URL || 'https://www.taptapup.xyz').replace(/\/+$/, ''),
    productId: parseInt(process.env.TAPTAPUP_PRODUCT_ID || '2507', 10),
    minAmount: parseFloat(process.env.TAPTAPUP_MIN_AMOUNT || '20.00'),
    mode: process.env.TAPTAPUP_MODE || 'sandbox', // 'sandbox' or 'production'
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
 * Initiate payment on TapTapUp
 * @param {Object} params
 * @param {number} params.amount - Payment amount (min $20.00 for sandbox)
 * @param {string} params.email - Customer email
 * @param {string} params.merchantReference - Unique order number
 * @param {string} [params.returnUrl] - Redirect URL after payment
 * @param {string} [params.webhookUrl] - Server webhook callback URL
 */
export async function initiateTapTapUpPayment({
  amount,
  email,
  merchantReference,
  returnUrl,
  webhookUrl,
}) {
  const config = getTapTapUpConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const finalReturnUrl = returnUrl || `${appBaseUrl}/player/wallet/deposit?status=return&order_no=${merchantReference}`;
  const finalWebhookUrl = webhookUrl || `${appBaseUrl}/api/webhooks/taptapup`;

  const payload = {
    product_id: config.productId,
    amount: parseFloat(Number(amount).toFixed(2)),
    email: email || 'customer@example.com',
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
        // If HTML under construction or other page returned, try next candidate
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
          gateway: data.gateway || 'TapTapUp',
          merchantReference,
          endpointUsed: url,
        };
      } else {
        return {
          success: false,
          error: data.error || 'initiate_failed',
          message: data.message || 'Payment initiation failed',
          code: data.code || response.status,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to connect to TapTapUp payment gateway');
}

/**
 * Check payment status by token
 * GET /api/v1/status/{token} or /wp-json/taptapup/v1/status/{token}
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
    } catch (e) {
      // try next
    }
  }

  return { success: false, status: 'unknown' };
}

/**
 * Verify token details
 * POST /api/v1/verify-token or /wp-json/taptapup/v1/verify-token
 */
export async function verifyTapTapUpToken(token) {
  const config = getTapTapUpConfig();
  const endpoints = [
    `${config.baseUrl}/wp-json/taptapup/v1/verify-token`,
    `${config.baseUrl}/api/v1/verify-token`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      // try next
    }
  }

  return { success: false, message: 'Could not verify token' };
}
