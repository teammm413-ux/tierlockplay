import crypto from 'crypto';

/**
 * Juwa 2.0 Game Platform Integration Service
 * Compliant with Juwa2.0_documentation.pdf
 * Official API Address: https://apiinterface.juwa2.xin
 * Web / App Portal: https://m.juwa2.com/
 */

export const JUWA2_CONFIG = {
  id: 'juwa2',
  displayName: 'Juwa2.0',
  aliases: ['juwa 2', 'juwa 2.0', 'juwa2', 'juwa2.0', 'juwa-2', 'juwa-2.0'],
  agentId: process.env.JUWA2_AGENT_ID || '9993',
  secretKey: process.env.JUWA2_SECRET_KEY || '92ff4c540b36b4b676b4d8da8d1cfda6',
  baseUrl: (process.env.JUWA2_BASE_URL || 'https://apiinterface.juwa2.xin').replace(/\/+$/, ''),
  gameUrl: process.env.JUWA2_GAME_URL || 'https://m.juwa2.com/',
};

export const JUWA2_ERROR_CODES = {
  0: 'Success',
  1: 'Invalid agent ID',
  2: 'Invalid request parameters',
  3: 'Invalid token',
  4: 'Token expired',
  5: 'Access IP is not whitelisted in Juwa2.0 firewall',
  6: 'Insufficient agent balance on Juwa2.0',
  7: 'Insufficient user balance on game account',
  8: 'Invalid user ID',
  9: 'User account is frozen',
  10: 'User is currently playing in an active game session',
  11: 'Invalid amount',
  12: 'Recharge failed, please try again later',
  13: 'Recharge permission denied',
  14: 'Withdrawal failed, please try again later',
  15: 'Withdrawal amount exceeds daily limit',
  16: 'Withdrawal under review',
  17: 'Withdrawal permission denied',
  18: 'Account name format error (must contain letters, numbers, or underscores)',
  19: 'Agent has no register user permission',
  20: 'Account name already exists on Juwa2.0',
  21: 'System failed',
  22: 'Number of registered accounts from IP exceeds limit',
  23: 'Password length error (must be 6 to 32 characters)',
  400: 'Parameter error',
};

/**
 * Check if platform identifier matches Juwa 2.0
 */
export function isJuwa2Platform(platformIdentifier) {
  if (!platformIdentifier) return false;
  const clean = platformIdentifier.toString().toLowerCase().trim();
  return (
    clean === JUWA2_CONFIG.id ||
    clean === JUWA2_CONFIG.displayName.toLowerCase() ||
    JUWA2_CONFIG.aliases.some((alias) => alias.toLowerCase() === clean)
  );
}

/**
 * Get Juwa 2.0 configuration
 */
export function getJuwa2Config() {
  return { ...JUWA2_CONFIG };
}

/**
 * Generate MD5 token for Juwa 2.0
 * Formula from documentation:
 * token = MD5(agent_id:timestamp:secret_key)
 */
export function calculateJuwa2Token(agentId, timestamp, secretKey) {
  const raw = `${String(agentId)}:${String(timestamp)}:${String(secretKey)}`;
  return crypto.createHash('md5').update(raw).digest('hex').toLowerCase();
}

/**
 * Sanitize account name for Juwa 2.0
 * Must contain letters, numbers, underscores (6-32 chars)
 */
export function sanitizeJuwa2Account(rawAccount) {
  let clean = String(rawAccount || '').replace(/[^a-zA-Z0-9_]/g, '');
  if (clean.length < 6) {
    clean = `j2_${clean}`.padEnd(6, '0');
  }
  return clean.substring(0, 32);
}

/**
 * Send an authorized request to Juwa 2.0
 * All endpoints use multipart/form-data and method POST
 */
export async function sendJuwa2Request(endpointPath, params = {}) {
  const config = JUWA2_CONFIG;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const token = calculateJuwa2Token(config.agentId, timestamp, config.secretKey);

  const endpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const queryUrl = `${config.baseUrl}${endpoint}?agent_id=${encodeURIComponent(config.agentId)}&timestamp=${encodeURIComponent(timestamp)}&token=${encodeURIComponent(token)}`;

  const formData = new FormData();
  formData.append('agent_id', config.agentId);
  formData.append('timestamp', timestamp);
  formData.append('token', token);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  console.log(`[Juwa2.0 API] Calling ${endpoint} with params:`, {
    ...params,
    login_pwd: params.login_pwd ? '***' : undefined,
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    const response = await fetch(queryUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 403) {
      return {
        success: false,
        code: 5,
        error: 'IP_NOT_WHITELISTED',
        message: 'HTTP 403 Forbidden. Your server IP is not yet whitelisted in Juwa2.0 firewall.',
        data: null,
      };
    }

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        code: response.status,
        error: 'NON_JSON_RESPONSE',
        message: `Juwa2.0 returned unexpected response: ${text.substring(0, 150)}`,
        data: null,
      };
    }

    const code = Number(json.code);
    const isSuccess = code === 0; // In Juwa2.0, 0 means Success
    const errorMessage = json.msg || JUWA2_ERROR_CODES[code] || `Juwa2.0 Error ${code}`;

    return {
      success: isSuccess,
      code,
      message: errorMessage,
      data: json.data || null,
      raw: json,
    };
  } catch (err) {
    console.error(`[Juwa2.0 Error] ${endpoint}:`, err.message);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      code: -1,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'Request timed out connecting to Juwa2.0 server. IP whitelisting is active on 179.236.244.219.'
        : err.message,
      data: null,
    };
  }
}

/**
 * 1. Add Player Account
 * URL: /api/external/addUser
 * @param {string} account - Player username (letters, numbers, underscores)
 * @param {string} password - Login password (6-32 chars)
 */
export async function juwa2AddUser({ account, password }) {
  const cleanAccount = sanitizeJuwa2Account(account);
  const cleanPassword = String(password || '123456');

  console.log(`[Juwa2.0 Register] Creating player account: ${cleanAccount}`);

  const res = await sendJuwa2Request('/api/external/addUser', {
    account: cleanAccount,
    login_pwd: cleanPassword,
  });

  if (res.success && res.data) {
    return {
      success: true,
      userId: String(res.data.user_id),
      accountName: res.data.account_name || cleanAccount,
      message: 'Juwa2.0 player account created successfully',
    };
  }

  return {
    success: false,
    code: res.code,
    account: cleanAccount,
    message: res.message || 'Failed to create Juwa2.0 player account',
  };
}

/**
 * 2. Recharge (Deposit coins into player account)
 * URL: /api/external/recharge
 * @param {string} userId - Juwa2.0 player id (e.g. "88880188")
 * @param {number|string} amount - Recharge amount
 * @param {string} orderId - Agent's unique order id
 */
export async function juwa2Recharge({ userId, amount, orderId }) {
  const orderNum = orderId || `J2R_${Date.now()}`;
  const cleanAmount = String(Math.max(1, Math.round(Number(amount))));

  console.log(`[Juwa2.0 Recharge] Depositing $${cleanAmount} for user_id: ${userId} (Order: ${orderNum})`);

  const res = await sendJuwa2Request('/api/external/recharge', {
    user_id: String(userId),
    amount: cleanAmount,
    order_id: String(orderNum),
  });

  if (res.success && res.data) {
    return {
      success: true,
      userId: String(userId),
      amount: parseFloat(res.data.amount || cleanAmount),
      userBalance: parseFloat(res.data.user_balance || 0),
      agentBalance: parseFloat(res.data.agent_balance || 0),
      transactionId: res.data.transaction_id,
      payOrderId: res.data.pay_order_id,
      message: `Successfully loaded $${cleanAmount} into Juwa2.0 account`,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Juwa2.0 recharge failed',
  };
}

/**
 * 3. Withdraw (Cashout from player account)
 * URL: /api/external/withdraw
 * @param {string} userId - Juwa2.0 player id
 * @param {number|string} amount - Withdraw amount
 * @param {string} orderId - Agent's unique order id
 */
export async function juwa2Withdraw({ userId, amount, orderId }) {
  const orderNum = orderId || `J2W_${Date.now()}`;
  const cleanAmount = String(Math.max(1, Math.round(Number(amount))));

  console.log(`[Juwa2.0 Withdraw] Redeeming $${cleanAmount} from user_id: ${userId} (Order: ${orderNum})`);

  const res = await sendJuwa2Request('/api/external/withdraw', {
    user_id: String(userId),
    amount: cleanAmount,
    order_id: String(orderNum),
  });

  if (res.success && res.data) {
    return {
      success: true,
      userId: String(userId),
      amount: parseFloat(res.data.amount || cleanAmount),
      userBalance: parseFloat(res.data.user_balance || 0),
      agentBalance: parseFloat(res.data.agent_balance || 0),
      transactionId: res.data.transaction_id,
      wdwOrderId: res.data.wdw_order_id,
      message: `Successfully redeemed $${cleanAmount} from Juwa2.0 account`,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Juwa2.0 withdrawal failed',
  };
}

/**
 * 4. Get Player Balance
 * URL: /api/external/userBalance
 * @param {string} userId - Juwa2.0 player id
 */
export async function juwa2GetUserBalance({ userId }) {
  const res = await sendJuwa2Request('/api/external/userBalance', {
    user_id: String(userId),
  });

  if (res.success && res.data) {
    return {
      success: true,
      balance: parseFloat(res.data.user_balance || 0),
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Failed to fetch Juwa2.0 player balance',
  };
}

/**
 * 5. Get Agent Balance
 * URL: /api/external/agentBalance
 */
export async function juwa2GetAgentBalance() {
  const res = await sendJuwa2Request('/api/external/agentBalance', {});
  if (res.success && res.data) {
    return {
      success: true,
      balance: parseFloat(res.data.agent_balance || 0),
    };
  }
  return {
    success: false,
    code: res.code,
    message: res.message || 'Failed to fetch Juwa2.0 agent balance',
  };
}

/**
 * 6. Login name to get player ID
 * URL: /api/external/getUserID
 * @param {string} accountName - player login name
 */
export async function juwa2GetUserId({ accountName }) {
  const res = await sendJuwa2Request('/api/external/getUserID', {
    account_name: String(accountName),
  });

  if (res.success && res.data) {
    return {
      success: true,
      userId: String(res.data.user_id),
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Player not found on Juwa2.0',
  };
}

/**
 * 7. Reset Player Password
 * URL: /api/external/resetPassword
 * @param {string} userId - Juwa2.0 player id
 * @param {string} newPassword - new login password
 */
export async function juwa2ResetPassword({ userId, newPassword }) {
  const res = await sendJuwa2Request('/api/external/resetPassword', {
    user_id: String(userId),
    login_pwd: String(newPassword),
  });

  return {
    success: res.success,
    code: res.code,
    message: res.message || (res.success ? 'Password reset successfully' : 'Reset password failed'),
  };
}

/**
 * 8. Force Player Offline
 * URL: /api/external/playerOffline
 * @param {string} userId - Juwa2.0 player id
 */
export async function juwa2PlayerOffline({ userId }) {
  const res = await sendJuwa2Request('/api/external/playerOffline', {
    user_id: String(userId),
  });

  return {
    success: res.success,
    code: res.code,
    message: res.message || (res.success ? 'Player forced offline' : 'Failed to force player offline'),
  };
}
