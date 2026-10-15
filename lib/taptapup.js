import crypto from 'crypto';

/**
 * Payment Gateway Integration Service (Revsol / TapTapUp)
 * All credentials are read from process.env environment variables.
 * Production Live Merchant: Revsol (ID: 2026103966)
 */

/**
 * Dynamically resolves channel product ID from process.env
 */
export function getChannelProductId(channel) {
  const key = (channel || '').toLowerCase().trim();
  if (key.includes('cash')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_CASHAPP || '272835', 10);
  }
  if (key.includes('apple') || key.includes('google') || key.includes('card') || key.includes('debit') || key.includes('credit')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_GOOGLE_APPLE_PAY || '49794', 10);
  }
  if (key.includes('paypal')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_PAYPAL || '373683', 10);
  }
  if (key.includes('chime')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_CHIME || '314026', 10);
  }
  if (key.includes('btc') || key.includes('lightning') || key.includes('bitcoin') || key.includes('crypto')) {
    return parseInt(process.env.REVSOL_PRODUCT_ID_BTC_LIGHTNING || '93593', 10);
  }
  return parseInt(process.env.REVSOL_PRODUCT_ID_CASHAPP || '272835', 10);
}

export function getTapTapUpConfig(channel) {
  const chosenProductId = getChannelProductId(channel);
  return {
    merchantId: process.env.REVSOL_MERCHANT_ID || process.env.TAPTAPUP_MERCHANT_ID || '2026103966',
    merchantName: process.env.REVSOL_MERCHANT_NAME || process.env.TAPTAPUP_MERCHANT_NAME || 'Revsol',
    vendorEmail: process.env.REVSOL_VENDOR_EMAIL || 'Revsolc@gmail.com',
    secretKey: process.env.REVSOL_SHARED_SECRET || process.env.TAPTAPUP_SECRET_KEY || '2b6e6936744bdb6e79b74308013c889a',
    webhookSecret: process.env.REVSOL_WEBHOOK_SECRET || process.env.TAPTAPUP_WEBHOOK_SECRET || '22cb23cce492a1efe7d7f34f6c2a0d99',
    baseUrl: (process.env.REVSOL_BASE_URL || process.env.TAPTAPUP_BASE_URL || 'https://www.taptapup.com').replace(/\/+$/, ''),
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

  const LIVE_PRODUCTION_URL = 'https://app.tierlockplay.com';

  const publicBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')
      : LIVE_PRODUCTION_URL;

  const finalReturnUrl = returnUrl || `${publicBaseUrl}/player/wallet/deposit?status=return&order_no=${merchantReference}`;
  const finalWebhookUrl =
    webhookUrl ||
    process.env.REVSOL_WEBHOOK_URL ||
    `${publicBaseUrl}/api/webhooks/taptapup`;

  const key = (paymentMethod || '').toLowerCase();
  let paymentProvider = undefined;
  if (config.productId === 49794 || key.includes('apple') || key.includes('google') || key.includes('card') || key.includes('debit')) {
    paymentProvider = key.includes('google') ? 'googlepay' : 'applepay';
  }

  const payload = {
    product_id: config.productId,
    amount: parseFloat(Number(amount).toFixed(2)),
    email: email || config.vendorEmail || 'Revsolc@gmail.com',
    merchant_reference: String(merchantReference),
    webhook_url: finalWebhookUrl,
    callback_url: finalWebhookUrl,
    return_url: finalReturnUrl,
    redirect_url: finalReturnUrl,
  };

  if (paymentProvider) {
    payload.payment_provider = paymentProvider;
  }

  console.log(`[Revsol / TapTapUp Gateway] Initiating payment for Order #${merchantReference}:`, {
    amount: payload.amount,
    productId: payload.product_id,
    payment_provider: payload.payment_provider,
    webhook_url: payload.webhook_url,
    return_url: payload.return_url,
  });

  const rawBody = JSON.stringify(payload);
  const signature = generateHmacSignature(timestamp, rawBody, config.secretKey);

  const headers = {
    'Content-Type': 'application/json',
    'X-Merchant-ID': String(config.merchantId),
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  };

  // Primary official endpoint is /api/v1/initiate-payment
  const endpoints = [
    `${config.baseUrl}/api/v1/initiate-payment`,
    `${config.baseUrl}/wp-json/taptapup/v1/initiate-payment`,
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

      const json = await response.json();
      const resData = json.data || json;

      if (json && (json.success || resData.redirect_url)) {
        return {
          success: true,
          redirectUrl: resData.redirect_url || json.redirect_url,
          token: resData.token || json.token,
          expiresIn: resData.expires_in || json.expires_in || 3600,
          requestedAmount: resData.requested_amount || json.requested_amount || amount,
          finalAmount: resData.final_amount || json.final_amount || amount,
          gateway: config.merchantName,
          productId: config.productId,
          merchantReference,
          endpointUsed: url,
        };
      } else {
        return {
          success: false,
          error: resData.error || json.error || 'initiate_failed',
          message: resData.message || json.message || 'Payment initiation failed',
          code: resData.code || json.code || response.status,
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
 * Check payment status by token: GET /api/v1/status/{token}
 */
export async function checkTapTapUpStatus(token) {
  const config = getTapTapUpConfig();
  const endpoints = [
    `${config.baseUrl}/api/v1/status/${encodeURIComponent(token)}`,
    `${config.baseUrl}/wp-json/taptapup/v1/status/${encodeURIComponent(token)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const resData = json.data || json;
        return {
          success: Boolean(json.success),
          status: resData.status || json.status || 'unknown',
          order_id: resData.order_id || json.order_id || null,
          data: resData,
        };
      }
    } catch (err) {
      // try next
    }
  }

  return { success: false, status: 'unknown' };
}

/**
 * Verify payment token: POST /api/v1/verify-token
 */
export async function verifyTapTapUpToken(token) {
  const config = getTapTapUpConfig();
  const endpoints = [
    `${config.baseUrl}/api/v1/verify-token`,
    `${config.baseUrl}/wp-json/taptapup/v1/verify-token`,
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
        const resData = json.data || json;
        return {
          success: Boolean(json.success),
          status: resData.status || json.status || 'unknown',
          order_id: resData.order_id || json.order_id || null,
          amount: resData.amount || json.amount,
          email: resData.email || json.email,
          data: resData,
        };
      }
    } catch (err) {
      // try next
    }
  }

  return { success: false, status: 'unknown' };
}
