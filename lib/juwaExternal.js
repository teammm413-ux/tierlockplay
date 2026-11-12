import crypto from 'crypto';

/**
 * Juwa-family External API (MD5 token, multipart form)
 * Docs: Api_documentation_2/Juwa_simple.pdf, Juwa2.0.pdf, Game_Vault.pdf, vegas_sweep.docx
 * token = MD5(agent_id:timestamp:secret_key).toLowerCase()
 */

export const JUWA_EXTERNAL_CONFIGS = {
  juwa: {
    id: 'juwa',
    displayName: 'Juwa',
    aliases: ['juwa', 'juwa simple', 'juwa777', 'juwa 777'],
    agentId: process.env.JUWA_AGENT_ID || '81551',
    secretKey: process.env.JUWA_SECRET_KEY || 'ec11108d6f0227ed132c4fd265d7abbb',
    baseUrl: (process.env.JUWA_BASE_URL || 'https://external.juwa777.com').replace(/\/+$/, ''),
    gameUrl: process.env.JUWA_GAME_URL || 'https://dl.juwa777.com/',
    accountPrefix: 'jw',
  },
  juwa2: {
    id: 'juwa2',
    displayName: 'Juwa2.0',
    aliases: ['juwa 2', 'juwa 2.0', 'juwa2', 'juwa2.0', 'juwa-2', 'juwa-2.0'],
    agentId: process.env.JUWA2_AGENT_ID || '9993',
    secretKey: process.env.JUWA2_SECRET_KEY || '92ff4c540b36b4b676b4d8da8d1cfda6',
    baseUrl: (process.env.JUWA2_BASE_URL || 'https://apiinterface.juwa2.xin').replace(/\/+$/, ''),
    gameUrl: process.env.JUWA2_GAME_URL || 'https://m.juwa2.com/',
    accountPrefix: 'j2',
  },
  vegasweeps: {
    id: 'vegasweeps',
    displayName: 'Vegas Sweeps',
    aliases: ['vegas sweeps', 'vegas sweep', 'vegas-sweeps', 'river sweeps', 'river-sweeps', 'riversweeps'],
    agentId: process.env.VEGAS_SWEEP_AGENT_ID || '195608',
    secretKey: process.env.VEGAS_SWEEP_SECRET_KEY || '316bfbc49bb18391846cb0ffcba9678f',
    baseUrl: (process.env.VEGAS_SWEEP_BASE_URL || 'https://external.river777.com').replace(/\/+$/, ''),
    gameUrl: process.env.VEGAS_SWEEP_GAME_URL || 'https://river777.com/',
    accountPrefix: 'vs',
  },
  gamevault: {
    id: 'gamevault',
    displayName: 'Game Vault',
    aliases: ['game vault', 'gamevault', 'game-vault', 'gv', 'game vault 999'],
    agentId: process.env.GAME_VAULT_AGENT_ID || '127471',
    secretKey: process.env.GAME_VAULT_SECRET_KEY || '1d6146363b97d88b2a988050ee935a8b',
    baseUrl: (process.env.GAME_VAULT_BASE_URL || 'https://external.gamevault999.com').replace(/\/+$/, ''),
    gameUrl: process.env.GAME_VAULT_GAME_URL || 'https://download.gamevault999.com/',
    accountPrefix: 'gv',
  },
};

const ERROR_CODES = {
  0: 'Success',
  5: 'Access IP is not whitelisted',
  6: 'Insufficient agent balance',
  7: 'Insufficient user balance',
  10: 'User is in active game session',
  20: 'Account already exists',
};

export function getJuwaExternalConfig(platformIdentifier) {
  if (!platformIdentifier) return null;
  const clean = platformIdentifier.toString().toLowerCase().trim();

  for (const key of Object.keys(JUWA_EXTERNAL_CONFIGS)) {
    const config = JUWA_EXTERNAL_CONFIGS[key];
    if (config.id === clean) return config;
    if (config.displayName.toLowerCase() === clean) return config;
    if (config.aliases.some((a) => a.toLowerCase() === clean)) return config;
  }
  return null;
}

export function isJuwaExternalPlatform(platformIdentifier) {
  return Boolean(getJuwaExternalConfig(platformIdentifier));
}

export function isJuwa2Platform(platformIdentifier) {
  const cfg = getJuwaExternalConfig(platformIdentifier);
  return cfg?.id === 'juwa2';
}

function calculateToken(agentId, timestamp, secretKey) {
  const raw = `${String(agentId)}:${String(timestamp)}:${String(secretKey)}`;
  return crypto.createHash('md5').update(raw).digest('hex').toLowerCase();
}

export function sanitizeJuwaExternalAccount(rawAccount, prefix = 'jx') {
  let clean = String(rawAccount || '').replace(/[^a-zA-Z0-9_]/g, '');
  if (clean.length < 6) {
    clean = `${prefix}_${clean}`.padEnd(6, '0');
  }
  return clean.substring(0, 32);
}

async function sendRequest(config, endpointPath, params = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const token = calculateToken(config.agentId, timestamp, config.secretKey);
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

  console.log(`[${config.displayName} API] ${endpoint}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(queryUrl, { method: 'POST', body: formData, signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 403) {
      return {
        success: false,
        code: 5,
        message: `HTTP 403. Whitelist server IP 179.236.244.219 on ${config.displayName}.`,
        data: null,
      };
    }

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { success: false, code: -1, message: `Non-JSON: ${text.substring(0, 120)}`, data: null };
    }

    const code = Number(json.code);
    const isSuccess = code === 0;
    return {
      success: isSuccess,
      code,
      message: json.msg || ERROR_CODES[code] || `Error ${code}`,
      data: json.data || null,
      raw: json,
    };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      code: -1,
      message: isTimeout ? 'Request timed out' : err.message,
      data: null,
    };
  }
}

export async function juwaExternalAddUser({ platformName, account, password }) {
  const config = getJuwaExternalConfig(platformName);
  if (!config) return { success: false, message: 'Platform not configured for Juwa API' };

  const cleanAccount = sanitizeJuwaExternalAccount(account, config.accountPrefix);
  const res = await sendRequest(config, '/api/external/addUser', {
    account: cleanAccount,
    login_pwd: String(password || '123456'),
  });

  if (res.success && res.data) {
    return {
      success: true,
      userId: String(res.data.user_id),
      accountName: res.data.account_name || cleanAccount,
      message: `${config.displayName} account created`,
    };
  }
  return { success: false, code: res.code, account: cleanAccount, message: res.message };
}

export async function juwaExternalRecharge({ platformName, userId, amount, orderId }) {
  const config = getJuwaExternalConfig(platformName);
  if (!config) return { success: false, message: 'Platform not configured' };

  const orderNum = orderId || `JXR_${Date.now()}`;
  const cleanAmount = String(Math.max(1, Math.round(Number(amount))));

  const res = await sendRequest(config, '/api/external/recharge', {
    user_id: String(userId),
    amount: cleanAmount,
    order_id: String(orderNum),
  });

  if (res.success && res.data) {
    return {
      success: true,
      transactionId: res.data.transaction_id,
      payOrderId: res.data.pay_order_id,
      message: `Loaded $${cleanAmount} into ${config.displayName}`,
    };
  }
  return { success: false, code: res.code, message: res.message };
}

export async function juwaExternalWithdraw({ platformName, userId, amount, orderId }) {
  const config = getJuwaExternalConfig(platformName);
  if (!config) return { success: false, message: 'Platform not configured' };

  const orderNum = orderId || `JXW_${Date.now()}`;
  const cleanAmount = String(Math.max(1, Math.round(Number(amount))));

  const res = await sendRequest(config, '/api/external/withdraw', {
    user_id: String(userId),
    amount: cleanAmount,
    order_id: String(orderNum),
  });

  if (res.success && res.data) {
    return {
      success: true,
      transactionId: res.data.transaction_id,
      wdwOrderId: res.data.wdw_order_id,
      message: `Redeemed $${cleanAmount} from ${config.displayName}`,
    };
  }
  return { success: false, code: res.code, message: res.message };
}

export async function juwaExternalGetUserBalance({ platformName, userId }) {
  const config = getJuwaExternalConfig(platformName);
  if (!config) return { success: false, message: 'Platform not configured' };

  const res = await sendRequest(config, '/api/external/userBalance', { user_id: String(userId) });
  if (res.success && res.data) {
    return { success: true, balance: parseFloat(res.data.user_balance || 0) };
  }
  return { success: false, code: res.code, message: res.message };
}

// Backward-compatible Juwa 2.0 exports
export const sanitizeJuwa2Account = (account) => sanitizeJuwaExternalAccount(account, 'j2');

export function juwa2AddUser(args) {
  return juwaExternalAddUser({ platformName: 'Juwa2.0', ...args });
}
export function juwa2Recharge(args) {
  return juwaExternalRecharge({ platformName: 'Juwa2.0', ...args });
}
export function juwa2Withdraw(args) {
  return juwaExternalWithdraw({ platformName: 'Juwa2.0', ...args });
}
export function juwa2GetUserBalance(args) {
  return juwaExternalGetUserBalance({ platformName: 'Juwa2.0', ...args });
}
