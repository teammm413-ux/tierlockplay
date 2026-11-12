import crypto from 'crypto';

/**
 * FastApi Game Platform Integration Service
 * Compliant with FastApi Documentation Eng_20250624.pdf
 * Supports:
 *  - YAPI -61 (E-Star / Egames)
 *  - API -60 (Dragon Fury)
 *  - apl -62 (Ultra Thunder)
 */

export const FAST_API_CONFIGS = {
  'estar': {
    id: 'estar',
    displayName: 'E-Star / Egames',
    aliases: ['egames', 'e-star', 'e star', 'estar', 'yapi', 'yapi -61', 'yapi-61'],
    appId: process.env.ESTAR_APP_ID || 'n9aMGWVhVxlG7pq7bd',
    appSecret: process.env.ESTAR_APP_SECRET || 'W4cE5QYsknROmhjpHg7yuc1u236',
    agentAccount: process.env.ESTAR_AGENT_ACCOUNT || 'AnjumxES',
    baseUrl: (process.env.ESTAR_BASE_URL || 'https://papi.estar88.club').replace(/\/+$/, ''),
    gameUrl: 'https://papi.estar88.club',
  },
  'dragonfury': {
    id: 'dragonfury',
    displayName: 'Dragon Fury',
    aliases: ['dragon fury', 'dragonfury', 'dragon-fury', 'api -60', 'api-60'],
    appId: process.env.DRAGONFURY_APP_ID || 'O4cE5QYsknqBtu4236',
    appSecret: process.env.DRAGONFURY_APP_SECRET || 'lafJrYhxfzFbamzcZr2no3cf6',
    agentAccount: process.env.DRAGONFURY_AGENT_ACCOUNT || 'AnjumxDF',
    baseUrl: (process.env.DRAGONFURY_BASE_URL || 'https://www.dragonfury.club').replace(/\/+$/, ''),
    gameUrl: 'https://www.dragonfury.club/',
  },
  'ultrathunder': {
    id: 'ultrathunder',
    displayName: 'Ultra Thunder',
    aliases: ['ultra thunder', 'ultrathunder', 'ultra-thunder', 'apl -62', 'apl-62'],
    appId: process.env.ULTRATHUNDER_APP_ID || 'i37K0piyVvUF65_5f2',
    appSecret: process.env.ULTRATHUNDER_APP_SECRET || 'QcaDnNcYQql8ZRQWXVk1vekkdec',
    agentAccount: process.env.ULTRATHUNDER_AGENT_ACCOUNT || 'AnjumxUT',
    baseUrl: (process.env.ULTRATHUNDER_BASE_URL || 'https://www.ultrathunder.mobi').replace(/\/+$/, ''),
    gameUrl: 'https://www.ultrathunder.mobi',
  },
};

export const FAST_API_ERROR_CODES = {
  200: 'Success',
  1: 'New User Is Created',
  2: 'User Does Not Exist on game server',
  3: 'Parameter Error',
  4: 'Invalid Signature',
  5: 'Agent Account Banned',
  6: 'Account length error (must be 3-16 characters)',
  7: 'Account format error (letters and numbers only)',
  8: 'Password length error (must be 6-16 characters)',
  9: 'Password format error (must include letters and numbers)',
  10: 'Request ID already used',
  11: 'Database Error on game server',
  12: 'User Already Exists on game server',
  13: 'Top Up / Deposit Failed',
  14: 'Insufficient Credit in Agent balance',
  15: 'Withdrawal Failed from game server',
  16: 'Get Balance Failed',
  17: 'Operations Not Allowed In Game (player is currently in an active round)',
  18: 'Game System Is Under Maintenance',
  19: 'Requested API Endpoint Does Not Exist',
  20: 'Password error',
  21: 'Agent Name or Password error',
  22: 'Platform Not Configured',
};

/**
 * Match a platform name or slug to its FastApi configuration
 */
export function getFastApiConfig(platformIdentifier) {
  if (!platformIdentifier) return null;
  const clean = platformIdentifier.toString().toLowerCase().trim();

  for (const key of Object.keys(FAST_API_CONFIGS)) {
    const config = FAST_API_CONFIGS[key];
    if (config.id === clean) return config;
    if (config.displayName.toLowerCase() === clean) return config;
    if (config.aliases.some((alias) => alias.toLowerCase() === clean)) return config;
  }
  return null;
}

/**
 * Check if a platform has FastApi automated integration
 */
export function isFastApiPlatform(platformIdentifier) {
  return Boolean(getFastApiConfig(platformIdentifier));
}

/**
 * Generate MD5 Signature matching FastApi Specification:
 * 1. Exclude the 'sign' parameter.
 * 2. Sort parameters alphabetically by key.
 * 3. Format as key=value&...
 * 4. Append appsecret at the end.
 * 5. Compute MD5 hash.
 */
export function generateFastApiSign(data, appSecret) {
  const keys = Object.keys(data).filter((k) => k !== 'sign' && data[k] !== undefined && data[k] !== null).sort();
  const parts = [];

  for (const k of keys) {
    let val = data[k];
    if (typeof val === 'boolean') {
      val = val ? 'true' : 'false';
    } else if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    } else {
      val = String(val);
    }
    parts.push(`${k}=${val}`);
  }

  const baseString = parts.join('&') + appSecret;
  return crypto.createHash('md5').update(baseString).digest('hex');
}

/**
 * Generate a unique alphanumeric Request ID (up to 64 chars)
 */
export function generateRequestId(prefix = 'REQ') {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${randomPart}`.substring(0, 64);
}

/**
 * Send an authorized request to FastApi
 */
export async function sendFastApiRequest(config, endpointPath, params = {}) {
  const timestamp = Date.now().toString();
  const requestId = params.requestid || generateRequestId();

  const payload = {
    ...params,
    appid: config.appId,
    timestamp,
    requestid: requestId,
  };

  // Generate signature
  payload.sign = generateFastApiSign(payload, config.appSecret);

  const url = `${config.baseUrl}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;

  // Doc specifies HTTP POST with application/x-www-form-urlencoded
  const urlEncodedBody = new URLSearchParams(payload).toString();

  console.log(`[FastApi] Calling ${url} (${config.displayName}) with requestid: ${requestId}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TierLockPlay-API-Engine/1.0',
      },
      body: urlEncodedBody,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 403) {
      return {
        success: false,
        code: 403,
        error: 'IP_NOT_WHITELISTED',
        message: `HTTP 403 Forbidden. Your server IP address is not yet whitelisted in ${config.displayName}'s FastApi firewall. Please provide your server IP to the provider.`,
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
        message: `Game server returned unexpected response: ${text.substring(0, 150)}`,
        data: null,
      };
    }

    // FastApi returns { code: 200, message: "...", data: { ... } }
    // Code 200 or 1 indicates success depending on operation
    const code = Number(json.code);
    const isSuccess = code === 200 || (endpointPath === '/fast/user/create' && code === 1);

    const errorMessage = json.message || json.msg || FAST_API_ERROR_CODES[code] || `Error code ${code}`;

    return {
      success: isSuccess,
      code,
      message: errorMessage,
      data: json.data || null,
      raw: json,
    };
  } catch (err) {
    console.error(`[FastApi Error] ${config.displayName} ${endpointPath}:`, err.message);
    return {
      success: false,
      code: -1,
      error: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: err.name === 'AbortError' ? 'Request timed out connecting to game server' : err.message,
      data: null,
    };
  }
}

/**
 * 1. Create Player Account on Game Platform
 * Path: /fast/user/create
 * @param {string} platformIdentifier
 * @param {string} account - Raw player account (3-16 chars, letters/numbers, NO prefix)
 * @param {string} password - Player password (6-16 chars, letters + numbers, allowed symbols: !@#$()%^/.,)
 */
export async function fastApiCreatePlayer({ platformName, account, password }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  // Sanitize account (3-16 chars, alphanumeric)
  const cleanAccount = String(account).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  if (cleanAccount.length < 3) {
    return { success: false, message: 'Account name must be at least 3 alphanumeric characters' };
  }

  const result = await sendFastApiRequest(config, '/fast/user/create', {
    account: cleanAccount,
    passwd: password,
  });

  if (result.success) {
    const fullAccount = result.data?.full_account || cleanAccount;
    return {
      success: true,
      platformName: config.displayName,
      rawAccount: cleanAccount,
      fullAccount,
      password,
      data: result.data,
      message: result.message || 'Game account created successfully',
    };
  }

  return result;
}

/**
 * 2. Deposit Credits to Player Game Account
 * Path: /fast/user/deposit
 * @param {string} platformName
 * @param {string} account - Player account (WITHOUT prefix)
 * @param {number} amount - e.g. 100.55
 */
export async function fastApiDeposit({ platformName, account, amount }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  const formattedAmount = parseFloat(Number(amount).toFixed(2));
  if (isNaN(formattedAmount) || formattedAmount <= 0) {
    return { success: false, message: 'Deposit amount must be greater than 0' };
  }

  const cleanAccount = String(account).trim();

  const result = await sendFastApiRequest(config, '/fast/user/deposit', {
    account: cleanAccount,
    amount: formattedAmount,
  });

  if (result.success) {
    return {
      success: true,
      platformName: config.displayName,
      account: cleanAccount,
      amount: formattedAmount,
      balance: result.data?.balance,
      orderNum: result.data?.order_num,
      requestId: result.data?.requestid,
      time: result.data?.time,
      data: result.data,
      message: `Successfully loaded $${formattedAmount.toFixed(2)} into ${config.displayName}!`,
    };
  }

  return result;
}

/**
 * 3. Withdrawal Credits from Player Game Account to Platform Wallet
 * Path: /fast/user/withdrawal
 * @param {string} platformName
 * @param {string} account - Player account (WITHOUT prefix)
 * @param {number} amount
 */
export async function fastApiWithdrawal({ platformName, account, amount }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  const formattedAmount = parseFloat(Number(amount).toFixed(2));
  if (isNaN(formattedAmount) || formattedAmount <= 0) {
    return { success: false, message: 'Withdrawal amount must be greater than 0' };
  }

  const cleanAccount = String(account).trim();

  const result = await sendFastApiRequest(config, '/fast/user/withdrawal', {
    account: cleanAccount,
    amount: formattedAmount,
  });

  if (result.success) {
    return {
      success: true,
      platformName: config.displayName,
      account: cleanAccount,
      amount: formattedAmount,
      balance: result.data?.balance,
      orderNum: result.data?.order_num,
      data: result.data,
      message: `Successfully cashed out $${formattedAmount.toFixed(2)} from ${config.displayName}!`,
    };
  }

  return result;
}

/**
 * 4. Get In-Game Real-Time Balance
 * Path: /fast/user/balance
 * @param {string} platformName
 * @param {string} account - Player account (WITHOUT prefix)
 */
export async function fastApiGetBalance({ platformName, account }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  const cleanAccount = String(account).trim();

  const result = await sendFastApiRequest(config, '/fast/user/balance', {
    account: cleanAccount,
  });

  if (result.success) {
    return {
      success: true,
      platformName: config.displayName,
      account: cleanAccount,
      balance: Number(result.data?.balance || 0),
      data: result.data,
    };
  }

  return result;
}

/**
 * 5. Get Game Log List (Latest bets, wins, and RTP history)
 * Path: /fast/user/gameLogList
 */
export async function fastApiGetGameLogs({ platformName, account }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  const result = await sendFastApiRequest(config, '/fast/user/gameLogList', {
    account: String(account).trim(),
  });

  if (result.success) {
    return {
      success: true,
      logs: result.data?.list || [],
      data: result.data,
    };
  }

  return result;
}

/**
 * 6. Get Trade List (Financial load/redeem records)
 * Path: /fast/user/tradeList
 */
export async function fastApiGetTradeList({ platformName, account, startDate, endDate, page = 0, pageNum = 20 }) {
  const config = getFastApiConfig(platformName);
  if (!config) {
    return { success: false, message: `Platform ${platformName} is not configured for FastApi` };
  }

  const result = await sendFastApiRequest(config, '/fast/user/tradeList', {
    account: String(account).trim(),
    start_date: startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    end_date: endDate || new Date().toISOString().split('T')[0],
    page: String(page),
    page_num: String(pageNum),
  });

  if (result.success) {
    return {
      success: true,
      total: result.data?.total || 0,
      pages: result.data?.pages || 0,
      list: result.data?.list || [],
      data: result.data,
    };
  }

  return result;
}

/**
 * Generate a compliant random password (6-16 chars, letters + numbers + special char)
 */
export function generateGamePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = '';
  // Ensure at least 1 uppercase, 1 lowercase, 1 number, 1 symbol
  pass += 'Ab1@';
  for (let i = 4; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
