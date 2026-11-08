# TierLockPlay — Game API Credentials & Deployment

**Live site:** https://app.tierlockplay.com  
**VPS SSH:** `ssh root@179.236.244.219`  
**Env file on server:** `.env.local` in the app root (copy from `.env.example`)

Ask each game **distributor** to whitelist outbound API calls from **`179.236.244.219`** where required.

---

## Automatic API games (fill `.env.local`)

| Game (Admin name) | Provider | Variables in `.env.local` | Notes |
|-------------------|----------|-----------------------------|--------|
| **E-Star** / Egames | FastApi | `ESTAR_APP_ID`, `ESTAR_APP_SECRET`, `ESTAR_AGENT_ACCOUNT`, `ESTAR_BASE_URL` | MD5 sign + appid |
| **Dragon Fury** | FastApi | `DRAGONFURY_APP_ID`, `DRAGONFURY_APP_SECRET`, `DRAGONFURY_AGENT_ACCOUNT`, `DRAGONFURY_BASE_URL` | Same FastApi spec |
| **Ultra Thunder** | FastApi | `ULTRATHUNDER_APP_ID`, `ULTRATHUNDER_APP_SECRET`, `ULTRATHUNDER_AGENT_ACCOUNT`, `ULTRATHUNDER_BASE_URL` | Same FastApi spec |
| **Fire Kirin** | Fire Kirin API | `FIREKIRIN_AGENT_NAME`, `FIREKIRIN_AGENT_PASSWORD`, `FIREKIRIN_BASE_URL`, `FIREKIRIN_GAME_URL` | Agent login → agentKey |
| **Juwa2.0** | Juwa 2.0 API | `JUWA2_AGENT_ID`, `JUWA2_SECRET_KEY`, `JUWA2_BASE_URL`, `JUWA2_GAME_URL` | Token = MD5(agent:time:secret) |
| **Cash Frenzy** | Agent Vault | `CASHFRENZY_AGENT_USERNAME`, `CASHFRENZY_AGENT_PASSWORD`, `CASHFRENZY_BASE_URL` | Bearer after `/api/agent/login` |
| **Cash Machine** | Agent Vault | `CASHMACHINE_AGENT_USERNAME`, `CASHMACHINE_AGENT_PASSWORD`, `CASHMACHINE_BASE_URL` | Same pattern |
| **Lucky Stars** | Agent Vault | `LUCKYSTARS_AGENT_USERNAME`, `LUCKYSTARS_AGENT_PASSWORD`, `LUCKYSTARS_BASE_URL` | Same pattern |
| **Mafia** | Agent Vault | `MAFIA_AGENT_USERNAME`, `MAFIA_AGENT_PASSWORD`, `MAFIA_BASE_URL` | Same pattern |
| **Mr All In One** | Agent Vault | `MRALLINONE_AGENT_USERNAME`, `MRALLINONE_AGENT_PASSWORD`, `MRALLINONE_BASE_URL` | Same pattern |
| **Noble** | Agent Vault | `NOBLE_AGENT_USERNAME`, `NOBLE_AGENT_PASSWORD`, `NOBLE_BASE_URL` | Redeem sends `winning` field |
| **Vegas Roll** | Agent Vault | `VEGASROLL_AGENT_USERNAME`, `VEGASROLL_AGENT_PASSWORD`, `VEGASROLL_BASE_URL` | Same pattern |

---

## Manual games (no API keys)

Admin creates accounts and approves load/redeem in **Admin → Game Transactions**:

- Juwa (original, not Juwa 2.0)
- Orion Star
- Panda Master
- Ultra Panda
- V-Blink
- River Sweeps
- Golden Dragon
- Game Vault
- Milky Way

---

## Deploy on VPS (after credentials are set)

App path on server: **`/var/www/tierlockplay`**

### One paste: pull code + auto-update `.env.local` (keeps your old values)

```bash
cd /var/www/tierlockplay && \
git pull && \
bash scripts/sync-env-local.sh && \
nano .env.local
```

`sync-env-local` only **adds missing keys** from `.env.example`; it does not overwrite passwords you already saved.

### Full deploy after env is ready

```bash
cd /var/www/tierlockplay && \
npm ci && \
npm run build && \
pm2 restart tierlockplay
```

If you do not use git on the VPS yet, run this once to merge env without the script file:

```bash
cd /var/www/tierlockplay && \
test -f .env.example || { echo "ERROR: .env.example missing"; exit 1; } && \
if [ ! -f .env.local ]; then cp .env.example .env.local; echo "Created .env.local"; else \
  cp -a .env.local ".env.local.bak.$(date +%Y%m%d%H%M%S)"; \
  while IFS= read -r line; do \
    case "$line" in ''|\#*) continue ;; *=*) key="${line%%=*}"; \
      grep -q "^${key}=" .env.local || { echo "$line" >> .env.local; echo "Added: $key"; };; \
    esac; \
  done < .env.example; \
  echo "Env merge done."; \
fi && \
nano .env.local
```

Set `NEXT_PUBLIC_APP_URL=https://app.tierlockplay.com` in `.env.local`.

---

## Quick test

1. Player → **Game Platforms** → pick an API game → **Create Account** (should auto-approve if credentials work).
2. **Load Credits** from wallet (instant if API OK, else Pending for admin).
3. **Check Balance** / **Redeem** on supported API games.

If registration goes to **Pending**, read server logs for `[FastApi]`, `[FireKirin]`, `[Juwa2.0]`, or `[AgentVault]` messages — usually missing env vars or IP whitelist.
