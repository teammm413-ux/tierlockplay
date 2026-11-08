import crypto from 'crypto';

/**
 * Fire Kirin Game API Integration Service
 * Compliant with Fire Kirin Game API (Ver=2026.07.28)
 * Provider Endpoint: https://firekirin.xyz:8034/ws/service.ashx
 * Web Game Portal: https://play.firekirin.xyz
 */

export const FIREKIRIN_CONFIG = {
  id: 'firekirin',
  displayName: 'Fire Kirin',
  aliases: ['fire kirin', 'firekirin', 'fire-kirin', 'fk', 'fire_kirin', 'fire kirin arcade'],
  agentName: process.env.FIREKIRIN_AGENT_NAME || 'AnjumxFKCO',
  agentPasswd: process.env.FIREKIRIN_AGENT_PASSWORD || '',
  baseUrl: (process.env.FIREKIRIN_BASE_URL || 'https://firekirin.xyz:8034').replace(/\/+$/, ''),
  gameUrl: process.env.FIREKIRIN_GAME_URL || 'https://play.firekirin.xyz',
};

// In-memory cache for dynamic agentKey returned by agentLogin
let cachedSession = {
  agentKey: null,
  balance: null,
  lastLoginAt: 0,
};

/**
 * Check if a platform identifier matches Fire Kirin
 */
export function isFireKirinPlatform(platformIdentifier) {
  if (!platformIdentifier) return false;
  const clean = platformIdentifier.toString().toLowerCase().trim();
  return (
    clean === FIREKIRIN_CONFIG.id ||
    clean === FIREKIRIN_CONFIG.displayName.toLowerCase() ||
    FIREKIRIN_CONFIG.aliases.some((alias) => alias.toLowerCase() === clean)
  );
}

/**
 * Get current Fire Kirin configuration
 */
export function getFireKirinConfig() {
  return { ...FIREKIRIN_CONFIG };
}

/**
 * Compute MD5 hash helper (hex lowercase)
 */
export function md5(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex').toLowerCase();
}

/**
 * Generate fresh timestamp for Fire Kirin requests
 * The doc specifies 10-digit unix timestamp in examples (e.g. 1598452539)
 */
let lastTimestampUsed = 0;
export function getFireKirinTimestamp() {
  let ts = Math.floor(Date.now() / 1000);
  if (ts <= lastTimestampUsed) {
    ts = lastTimestampUsed + 1;
  }
  lastTimestampUsed = ts;
  return ts;
}

/**
 * Calculate Fire Kirin API Signature
 * Formula from documentation:
 * sign = md5(agentName.toLowerCase() + time.toString() + agentKey.toLowerCase())
 */
export function calculateFireKirinSign(agentName, time, agentKey) {
  const raw = `${String(agentName).toLowerCase()}${String(time)}${String(agentKey).toLowerCase()}`;
  return md5(raw);
}

/**
 * Low-level HTTP POST dispatcher to Fire Kirin ashx handler
 */
async function sendRawRequest(action, params = {}) {
  const baseUrl = FIREKIRIN_CONFIG.baseUrl;
  const url = `${baseUrl}/ws/service.ashx?action=${encodeURIComponent(action)}`;

  // Convert parameters to URLSearchParams for application/x-www-form-urlencoded
  const formParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      formParams.append(key, String(value));
    }
  }

  console.log(`[FireKirin API] Calling action=${action} with params:`, {
    ...params,
    agentPasswd: params.agentPasswd ? '***[MD5]' : undefined,
    passwd: params.passwd ? '***[MD5]' : undefined,
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TierLockPlay-FK-Client/1.0',
      },
      body: formParams.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 403) {
      return {
        success: false,
        code: 403,
        error: 'IP_NOT_WHITELISTED',
        message: 'HTTP 403 Forbidden. Fire Kirin firewall requires server IP whitelisting (Target: 179.236.244.219).',
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
        message: `Fire Kirin returned non-JSON response: ${text.substring(0, 150)}`,
        rawText: text,
      };
    }

    const code = Number(json.code);
    const isSuccess = code === 200;

    return {
      success: isSuccess,
      code,
      message: json.msg || (isSuccess ? 'Success' : `Error code ${code}`),
      data: json,
    };
  } catch (err) {
    console.error(`[FireKirin Error] action=${action}:`, err.message);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      code: -1,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: isTimeout
        ? 'Request timed out connecting to Fire Kirin server. IP whitelisting is active on 179.236.244.219.'
        : err.message,
    };
  }
}

/**
 * 1. Agent Login
 * Action: agentLogin
 * Obtains and refreshes the dynamic agentKey required for all subsequent signed calls.
 */
export async function fireKirinLogin(forceRefresh = false) {
  const now = Date.now();
  // Return cached key if less than 15 minutes old and not forced
  if (!forceRefresh && cachedSession.agentKey && (now - cachedSession.lastLoginAt < 15 * 60 * 1000)) {
    return {
      success: true,
      agentKey: cachedSession.agentKey,
      balance: cachedSession.balance,
      cached: true,
    };
  }

  const { agentName, agentPasswd } = FIREKIRIN_CONFIG;

  if (!agentName) {
    return {
      success: false,
      code: -2,
      message: 'Fire Kirin agent username (FIREKIRIN_AGENT_NAME) is not configured in .env.local',
    };
  }

  if (!agentPasswd) {
    return {
      success: false,
      code: -2,
      message: 'Fire Kirin agent password (FIREKIRIN_AGENT_PASSWORD) is not configured in .env.local',
    };
  }

  const time = getFireKirinTimestamp();
  const encryptedPasswd = md5(agentPasswd);

  const res = await sendRawRequest('agentLogin', {
    agentName,
    agentPasswd: encryptedPasswd,
    time,
  });

  if (res.success && res.data?.agentKey) {
    cachedSession = {
      agentKey: res.data.agentKey,
      balance: res.data.Balance || res.data.balance || '0',
      lastLoginAt: Date.now(),
    };

    console.log(`[FireKirin] Logged in successfully as ${agentName}. Agent balance: $${cachedSession.balance}`);
    return {
      success: true,
      agentKey: cachedSession.agentKey,
      balance: cachedSession.balance,
      cached: false,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Fire Kirin agent login failed',
  };
}

/**
 * Send an authorized signed request with automatic login & retry on invalid agentKey
 */
async function sendSignedRequest(action, params = {}, retryCount = 0) {
  // Ensure we have an active agentKey
  let loginRes = await fireKirinLogin(false);
  if (!loginRes.success) {
    return loginRes;
  }

  const { agentName } = FIREKIRIN_CONFIG;
  const time = getFireKirinTimestamp();
  const sign = calculateFireKirinSign(agentName, time, loginRes.agentKey);

  const payload = {
    ...params,
    agentName,
    time,
    sign,
  };

  const res = await sendRawRequest(action, payload);

  // If failed due to signature or expired session, force refresh login once and retry
  if (!res.success && retryCount === 0) {
    const errorMsg = (res.message || '').toLowerCase();
    if (errorMsg.includes('sign') || errorMsg.includes('key') || errorMsg.includes('login') || res.code === 201) {
      console.warn(`[FireKirin] Call ${action} returned: ${res.message}. Refreshing agentKey and retrying...`);
      await fireKirinLogin(true);
      return sendSignedRequest(action, params, 1);
    }
  }

  return res;
}

/**
 * Format & sanitize player account
 * Fire Kirin requirement: length between 6 to 32 characters
 */
export function sanitizeFireKirinAccount(rawAccount) {
  let clean = String(rawAccount || '').replace(/[^a-zA-Z0-9_]/g, '');
  if (clean.length < 6) {
    clean = `fk_${clean}`.padEnd(6, '0');
  }
  return clean.substring(0, 32);
}

/**
 * 2. Register Player Account
 * Action: registerUser
 * @param {string} account - Player username (6-32 chars)
 * @param {string} password - Raw player password
 */
export async function fireKirinRegisterPlayer({ account, password }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const encryptedPassword = md5(password);

  console.log(`[FireKirin Register] Registering player account: ${cleanAccount}`);

  const res = await sendSignedRequest('registerUser', {
    account: cleanAccount,
    passwd: encryptedPassword,
  });

  if (res.success) {
    return {
      success: true,
      account: cleanAccount,
      message: 'Fire Kirin player account created successfully',
    };
  }

  return {
    success: false,
    code: res.code,
    account: cleanAccount,
    message: res.message || 'Failed to create Fire Kirin player account',
  };
}

/**
 * 3. Query User Information & Balance
 * Action: queryInfo
 * @param {string} account - Player username (6-32 chars)
 * @param {string} [password] - Optional raw player password
 */
export async function fireKirinQueryInfo({ account, password }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const payload = { account: cleanAccount };

  if (password) {
    payload.passwd = md5(password);
  }

  const res = await sendSignedRequest('queryInfo', payload);

  if (res.success) {
    const data = res.data || {};
    return {
      success: true,
      account: cleanAccount,
      gameId: data.gameId,
      userbalance: parseFloat(data.userbalance || 0),
      agentBalance: parseFloat(data.agentBalance || 0),
      webLoginUrl: data.webLoginUrl || null,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Failed to query Fire Kirin player information',
  };
}

/**
 * Fetch live balance for a player
 */
export async function fireKirinGetBalance({ account, password }) {
  const info = await fireKirinQueryInfo({ account, password });
  if (info.success) {
    return {
      success: true,
      balance: info.userbalance,
      gameId: info.gameId,
      webLoginUrl: info.webLoginUrl,
    };
  }
  return info;
}

/**
 * 4. Recharge (Deposit into player account)
 * Action: recharge
 * @param {string} account - Player username
 * @param {number} amount - Amount in dollars (Fire Kirin expects integer dollar amount)
 */
export async function fireKirinRecharge({ account, amount }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const intAmount = Math.max(1, Math.round(Number(amount)));

  console.log(`[FireKirin Recharge] Depositing $${intAmount} into account: ${cleanAccount}`);

  const res = await sendSignedRequest('recharge', {
    account: cleanAccount,
    amount: intAmount,
  });

  if (res.success) {
    return {
      success: true,
      account: cleanAccount,
      amount: intAmount,
      message: `Successfully loaded $${intAmount} into Fire Kirin account ${cleanAccount}`,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Fire Kirin deposit failed',
  };
}

/**
 * 5. Redeem (Withdraw from player account)
 * Action: redeem
 * @param {string} account - Player username
 * @param {number} amount - Amount in dollars (integer)
 */
export async function fireKirinRedeem({ account, amount }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const intAmount = Math.max(1, Math.round(Number(amount)));

  console.log(`[FireKirin Redeem] Withdrawing $${intAmount} from account: ${cleanAccount}`);

  const res = await sendSignedRequest('redeem', {
    account: cleanAccount,
    amount: intAmount,
  });

  if (res.success) {
    return {
      success: true,
      account: cleanAccount,
      amount: intAmount,
      message: `Successfully redeemed $${intAmount} from Fire Kirin account ${cleanAccount}`,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Fire Kirin withdrawal failed',
  };
}

/**
 * 6. Enter Game & Get Quick Web Login URL
 * Action: entergame
 */
export async function fireKirinEnterGame({ account, password, kindId = '2039', redirectUrl }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const payload = {
    account: cleanAccount,
    passwd: md5(password),
    kindId: String(kindId),
  };

  if (redirectUrl) {
    payload.redirectUrl = redirectUrl;
  }

  const res = await sendSignedRequest('entergame', payload);

  if (res.success) {
    const data = res.data || {};
    return {
      success: true,
      gameId: data.gameId,
      userbalance: parseFloat(data.userbalance || 0),
      webLoginUrl: data.webLoginUrl || null,
    };
  }

  return {
    success: false,
    code: res.code,
    message: res.message || 'Failed to generate game session',
  };
}

/**
 * 7. Get Game List
 * Action: getgamelist
 */
export async function fireKirinGetGameList() {
  const res = await sendSignedRequest('getgamelist', {});
  if (res.success) {
    return {
      success: true,
      games: res.data?.data || [],
    };
  }
  return {
    success: false,
    code: res.code,
    message: res.message || 'Failed to fetch game list',
  };
}

/**
 * 8. Change User Password
 * Action: changePasswd
 */
export async function fireKirinChangePassword({ account, currentPassword, newPassword }) {
  const cleanAccount = sanitizeFireKirinAccount(account);
  const payload = {
    account: cleanAccount,
    passwdNew: md5(newPassword),
  };

  if (currentPassword) {
    payload.passwd = md5(currentPassword);
  }

  const res = await sendSignedRequest('changePasswd', payload);
  return {
    success: res.success,
    code: res.code,
    message: res.message || (res.success ? 'Password updated' : 'Password change failed'),
  };
}
