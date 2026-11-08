/**
 * Agent Vault Game API (Bearer JWT Agent Portal)
 * Shared pattern for: Cash Frenzy, Cash Machine, Lucky Stars, Mafia,
 * Mr All In One, Noble, Vegas Roll — per Api_documentation/*.docx
 */

const tokenCache = {};

function env(key, fallback = '') {
  return process.env[key] || fallback;
}

export const AGENT_VAULT_CONFIGS = {
  cashfrenzy: {
    id: 'cashfrenzy',
    displayName: 'Cash Frenzy',
    aliases: ['cash frenzy', 'cashfrenzy', 'cash-frenzy', 'cash frenzy 777'],
    baseUrl: env('CASHFRENZY_BASE_URL', 'https://agentserver.cashfrenzy777.com').replace(/\/+$/, ''),
    username: env('CASHFRENZY_AGENT_USERNAME'),
    password: env('CASHFRENZY_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
  cashmachine: {
    id: 'cashmachine',
    displayName: 'Cash Machine',
    aliases: ['cash machine', 'cashmachine', 'cash-machine', 'cash machine 777'],
    baseUrl: env('CASHMACHINE_BASE_URL', 'https://agentserver.cashmachine777.com').replace(/\/+$/, ''),
    username: env('CASHMACHINE_AGENT_USERNAME'),
    password: env('CASHMACHINE_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
  luckystars: {
    id: 'luckystars',
    displayName: 'Lucky Stars',
    aliases: ['lucky stars', 'luckystars', 'lucky-stars'],
    baseUrl: env('LUCKYSTARS_BASE_URL', 'https://agent.luckystars.games').replace(/\/+$/, ''),
    username: env('LUCKYSTARS_AGENT_USERNAME'),
    password: env('LUCKYSTARS_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
  mafia: {
    id: 'mafia',
    displayName: 'Mafia',
    aliases: ['mafia', 'mafia 777', 'mafia777'],
    baseUrl: env('MAFIA_BASE_URL', 'https://agentserver.mafia77777.com').replace(/\/+$/, ''),
    username: env('MAFIA_AGENT_USERNAME'),
    password: env('MAFIA_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
  mrallinone: {
    id: 'mrallinone',
    displayName: 'Mr All In One',
    aliases: ['mr all in one', 'mrallinone', 'mr-all-in-one', 'mr all in one 777'],
    baseUrl: env('MRALLINONE_BASE_URL', 'https://agentserver.mrallinone777.com').replace(/\/+$/, ''),
    username: env('MRALLINONE_AGENT_USERNAME'),
    password: env('MRALLINONE_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
  noble: {
    id: 'noble',
    displayName: 'Noble',
    aliases: ['noble', 'noble 777', 'noble777'],
    baseUrl: env('NOBLE_BASE_URL', 'https://agentserver.noble777.com').replace(/\/+$/, ''),
    username: env('NOBLE_AGENT_USERNAME'),
    password: env('NOBLE_AGENT_PASSWORD'),
    supportsWinningWithdraw: true,
  },
  vegasroll: {
    id: 'vegasroll',
    displayName: 'Vegas Roll',
    aliases: ['vegas roll', 'vegasroll', 'vegas-roll'],
    baseUrl: env('VEGASROLL_BASE_URL', 'https://backend.vegas-roll.com').replace(/\/+$/, ''),
    username: env('VEGASROLL_AGENT_USERNAME'),
    password: env('VEGASROLL_AGENT_PASSWORD'),
    supportsWinningWithdraw: false,
  },
};

export function getAgentVaultConfig(platformIdentifier) {
  if (!platformIdentifier) return null;
  const clean = platformIdentifier.toString().toLowerCase().trim();

  for (const key of Object.keys(AGENT_VAULT_CONFIGS)) {
    const config = AGENT_VAULT_CONFIGS[key];
    if (config.id === clean) return config;
    if (config.displayName.toLowerCase() === clean) return config;
    if (config.aliases.some((a) => a.toLowerCase() === clean)) return config;
  }
  return null;
}

export function isAgentVaultPlatform(platformIdentifier) {
  return Boolean(getAgentVaultConfig(platformIdentifier));
}

function isTokenValid(cacheEntry) {
  if (!cacheEntry?.token) return false;
  const expires = Number(cacheEntry.expiresAt || 0);
  if (expires > 0 && Date.now() / 1000 > expires - 120) return false;
  return true;
}

async function parseJsonResponse(response, label) {
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      success: false,
      statusCode: response.status,
      message: `${label} returned non-JSON: ${text.substring(0, 120)}`,
      data: null,
    };
  }
  const statusCode = Number(json.status_code ?? response.status);
  const ok = statusCode === 200;
  return {
    success: ok,
    statusCode,
    message: json.message || (ok ? 'Success' : `Error ${statusCode}`),
    data: json.data ?? null,
    raw: json,
  };
}

/**
 * Agent login — POST /api/agent/login (form-data: username, password)
 */
export async function agentVaultLogin(platformIdentifier, forceRefresh = false) {
  const config = getAgentVaultConfig(platformIdentifier);
  if (!config) {
    return { success: false, message: `Platform ${platformIdentifier} is not an Agent Vault integration` };
  }

  const cacheKey = config.id;
  if (!forceRefresh && isTokenValid(tokenCache[cacheKey])) {
    return { success: true, token: tokenCache[cacheKey].token, cached: true, config };
  }

  if (!config.username || !config.password) {
    const prefix = config.id.toUpperCase().replace(/[^A-Z]/g, '');
    return {
      success: false,
      message: `${config.displayName} agent credentials missing. Set ${prefix}_AGENT_USERNAME and ${prefix}_AGENT_PASSWORD in .env.local on VPS 179.236.244.219.`,
    };
  }

  const form = new FormData();
  form.append('username', config.username);
  form.append('password', config.password);

  const url = `${config.baseUrl}/api/agent/login`;
  console.log(`[AgentVault] Login ${config.displayName} -> ${url}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
    clearTimeout(timeout);

    const parsed = await parseJsonResponse(response, config.displayName);
    if (!parsed.success || !parsed.data?.token) {
      return {
        success: false,
        message: parsed.message || `${config.displayName} agent login failed`,
        code: parsed.statusCode,
      };
    }

    tokenCache[cacheKey] = {
      token: parsed.data.token,
      expiresAt: Number(parsed.data.expires_time || 0),
    };

    return { success: true, token: parsed.data.token, cached: false, config };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      message: isTimeout
        ? `Timeout connecting to ${config.displayName}. Whitelist VPS IP 179.236.244.219 with provider if required.`
        : err.message,
    };
  }
}

async function authorizedRequest(platformIdentifier, method, path, { query, formFields } = {}, retry = 0) {
  const login = await agentVaultLogin(platformIdentifier, retry > 0);
  if (!login.success) return login;

  const config = login.config;
  let url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (query && method === 'GET') {
    const qs = new URLSearchParams(query).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  const headers = { Authorization: `Bearer ${login.token}` };
  let body;
  if (formFields && method !== 'GET') {
    const form = new FormData();
    for (const [k, v] of Object.entries(formFields)) {
      if (v !== undefined && v !== null) form.append(k, String(v));
    }
    body = form;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, { method, headers, body, signal: controller.signal });
    clearTimeout(timeout);

    const parsed = await parseJsonResponse(response, config.displayName);
    if (!parsed.success && retry === 0 && parsed.statusCode === 401) {
      delete tokenCache[config.id];
      return authorizedRequest(platformIdentifier, method, path, { query, formFields }, 1);
    }
    return { ...parsed, config };
  } catch (err) {
    return {
      success: false,
      message: err.name === 'AbortError' ? 'Request timed out' : err.message,
    };
  }
}

export function sanitizeAgentVaultUsername(raw) {
  let clean = String(raw || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (clean.length < 4) clean = `av${clean}`.padEnd(4, '0');
  return clean.substring(0, 16);
}

/**
 * Find player numeric id by account name (pagination)
 */
export async function agentVaultFindPlayerId(platformIdentifier, accountName) {
  const target = String(accountName).toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const res = await authorizedRequest(platformIdentifier, 'GET', '/api/player/playerList', {
      query: { limit: '50', page: String(page) },
    });
    if (!res.success) return res;

    const list = Array.isArray(res.data) ? res.data : [];
    const found = list.find(
      (p) =>
        String(p.Account || p.account || '').toLowerCase() === target ||
        String(p.username || '').toLowerCase() === target
    );
    if (found?.id) {
      return { success: true, playerId: String(found.id), account: found.Account || found.account };
    }
    if (list.length < 50) break;
  }
  return { success: false, message: `Player ${accountName} not found on agent server after insert` };
}

/**
 * Create player — POST /api/player/insertPlayer
 */
export async function agentVaultInsertPlayer({ platformName, username, password, nickname = '' }) {
  const cleanUser = sanitizeAgentVaultUsername(username);

  const res = await authorizedRequest(platformName, 'POST', '/api/player/insertPlayer', {
    formFields: {
      username: cleanUser,
      nickname: nickname || cleanUser,
      password: String(password),
      money: '0',
    },
  });

  if (!res.success) {
    return {
      success: false,
      code: res.statusCode,
      message: res.message || 'Failed to create player account',
    };
  }

  let playerId = res.data?.id ? String(res.data.id) : null;
  const account = res.data?.account || cleanUser;

  if (!playerId) {
    const lookup = await agentVaultFindPlayerId(platformName, account);
    if (!lookup.success) {
      return { success: false, message: lookup.message || 'Account created but player id lookup failed' };
    }
    playerId = lookup.playerId;
  }

  return {
    success: true,
    playerId,
    account,
    password,
    message: res.message || 'Player account created',
    data: res.data,
  };
}

export async function agentVaultGetScore({ platformName, playerId }) {
  const res = await authorizedRequest(platformName, 'GET', '/api/player/getScore', {
    query: { id: String(playerId) },
  });

  if (!res.success) {
    return { success: false, code: res.statusCode, message: res.message };
  }

  return {
    success: true,
    balance: parseFloat(res.data?.balance ?? 0),
    winning: parseFloat(res.data?.winning ?? 0),
    isInGame: Boolean(res.data?.is_game),
    username: res.data?.username,
    data: res.data,
  };
}

export async function agentVaultRecharge({ platformName, playerId, amount, remark = 'TierLockPlay load' }) {
  const intAmount = Math.max(1, Math.round(Number(amount)));

  const res = await authorizedRequest(platformName, 'POST', '/api/player/playerRecharge', {
    formFields: {
      id: String(playerId),
      balance: String(intAmount),
      remark,
    },
  });

  if (!res.success) {
    return {
      success: false,
      code: res.statusCode,
      message: res.message || 'Recharge failed',
    };
  }

  return {
    success: true,
    amount: intAmount,
    message: res.message || `Loaded $${intAmount}`,
    data: res.data,
  };
}

export async function agentVaultWithdraw({ platformName, playerId, amount, remark = 'TierLockPlay redeem' }) {
  const intAmount = Math.max(1, Math.round(Number(amount)));
  const config = getAgentVaultConfig(platformName);

  const formFields = {
    id: String(playerId),
    balance: String(intAmount),
    remark,
  };

  if (config?.supportsWinningWithdraw) {
    const score = await agentVaultGetScore({ platformName, playerId });
    if (score.success) {
      formFields.winning = String(Math.max(0, Math.round(score.winning || 0)));
    } else {
      formFields.winning = '0';
    }
  }

  const res = await authorizedRequest(platformName, 'POST', '/api/player/playerWithdraw', {
    formFields,
  });

  if (!res.success) {
    return {
      success: false,
      code: res.statusCode,
      message: res.message || 'Withdrawal failed',
    };
  }

  return {
    success: true,
    amount: intAmount,
    message: res.message || `Redeemed $${intAmount}`,
    data: res.data,
  };
}
