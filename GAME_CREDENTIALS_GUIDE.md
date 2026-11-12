# TierLockPlay — Game API (Auto vs Manual)

**Live:** https://app.tierlockplay.com  
**VPS IP to whitelist:** `179.236.244.219`  
**Env file:** `.env.local` (use `bash scripts/sync-env-local.sh` after `git pull`)

---

## Automatic API games (8)

| Admin platform name | API type | Main `.env.local` keys |
|---------------------|----------|-------------------------|
| **Juwa** (Simple) | Juwa External | `JUWA_AGENT_ID`, `JUWA_SECRET_KEY`, `JUWA_BASE_URL` |
| **Juwa2.0** | Juwa External | `JUWA2_AGENT_ID`, `JUWA2_SECRET_KEY`, `JUWA2_BASE_URL` |
| **Vegas Sweeps** | Juwa External | `VEGAS_SWEEP_AGENT_ID`, `VEGAS_SWEEP_SECRET_KEY`, `VEGAS_SWEEP_BASE_URL` |
| **Game Vault** | Juwa External | `GAME_VAULT_AGENT_ID`, `GAME_VAULT_SECRET_KEY`, `GAME_VAULT_BASE_URL` |
| **E-Star** / Egames | FastApi | `ESTAR_APP_ID`, `ESTAR_APP_SECRET`, `ESTAR_AGENT_ACCOUNT`, `ESTAR_BASE_URL` |
| **Dragon Fury** | FastApi | `DRAGONFURY_*` |
| **Ultra Thunder** | FastApi | `ULTRATHUNDER_*` |
| **Fire Kirin** | Fire Kirin | `FIREKIRIN_AGENT_NAME`, `FIREKIRIN_AGENT_PASSWORD`, `FIREKIRIN_BASE_URL` |

Docs folder: `Api_documentation_2/` (Juwa2.0.pdf, Juwa_simple.pdf, Game_Vault.pdf, vegas_sweep.docx, FK Game API docx, FastApi PDF).

---

## Manual games (admin panel)

Orion Star, Panda Master, Ultra Panda, V-Blink, Golden Dragon, Milky Way, and any other title **not** in the table above.

---

## Deploy on VPS

```bash
cd /var/www/tierlockplay && \
git pull && \
bash scripts/sync-env-local.sh && \
nano .env.local && \
npm ci && npm run build && \
pm2 restart tierlockplay
```

If Vegas Sweeps or Game Vault API URL differs from distributor docs, only change `VEGAS_SWEEP_BASE_URL` / `GAME_VAULT_BASE_URL` in `.env.local`.
