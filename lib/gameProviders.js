import { isFastApiPlatform, getFastApiConfig } from '@/lib/fastapi';
import { isFireKirinPlatform } from '@/lib/firekirin';
import { isJuwa2Platform } from '@/lib/juwa2';
import { isAgentVaultPlatform, getAgentVaultConfig } from '@/lib/agentvault';

export function isAutoGamePlatform(platformIdentifier) {
  return (
    isFastApiPlatform(platformIdentifier) ||
    isFireKirinPlatform(platformIdentifier) ||
    isJuwa2Platform(platformIdentifier) ||
    isAgentVaultPlatform(platformIdentifier)
  );
}

export function getGameApiProvider(platformIdentifier) {
  if (isFastApiPlatform(platformIdentifier)) return 'FastApi';
  if (isFireKirinPlatform(platformIdentifier)) return 'FireKirin';
  if (isJuwa2Platform(platformIdentifier)) return 'Juwa2';
  if (isAgentVaultPlatform(platformIdentifier)) return 'AgentVault';
  return 'Manual';
}

export function getGameApiProviderLabel(platformIdentifier) {
  const provider = getGameApiProvider(platformIdentifier);
  if (provider === 'FastApi') {
    const cfg = getFastApiConfig(platformIdentifier);
    return cfg?.displayName ? `FastApi (${cfg.displayName})` : 'FastApi Auto';
  }
  if (provider === 'AgentVault') {
    const cfg = getAgentVaultConfig(platformIdentifier);
    return cfg?.displayName ? `${cfg.displayName} Auto` : 'AgentVault Auto';
  }
  if (provider === 'FireKirin') return 'FireKirin Auto';
  if (provider === 'Juwa2') return 'Juwa2 Auto';
  return 'Manual';
}
