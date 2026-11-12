import { isFastApiPlatform, getFastApiConfig } from '@/lib/fastapi';
import { isFireKirinPlatform } from '@/lib/firekirin';
import { isJuwaExternalPlatform, getJuwaExternalConfig } from '@/lib/juwaExternal';

/** Only these platforms use live API — all others are manual admin queue */
export function isAutoGamePlatform(platformIdentifier) {
  return (
    isFastApiPlatform(platformIdentifier) ||
    isFireKirinPlatform(platformIdentifier) ||
    isJuwaExternalPlatform(platformIdentifier)
  );
}

export function getGameApiProvider(platformIdentifier) {
  if (isFastApiPlatform(platformIdentifier)) return 'FastApi';
  if (isFireKirinPlatform(platformIdentifier)) return 'FireKirin';
  if (isJuwaExternalPlatform(platformIdentifier)) return 'JuwaAPI';
  return 'Manual';
}

export function getGameApiProviderLabel(platformIdentifier) {
  const provider = getGameApiProvider(platformIdentifier);
  if (provider === 'FastApi') {
    const cfg = getFastApiConfig(platformIdentifier);
    return cfg?.displayName ? `${cfg.displayName} Auto` : 'FastApi Auto';
  }
  if (provider === 'JuwaAPI') {
    const cfg = getJuwaExternalConfig(platformIdentifier);
    return cfg?.displayName ? `${cfg.displayName} Auto` : 'Juwa API Auto';
  }
  if (provider === 'FireKirin') return 'Fire Kirin Auto';
  return 'Manual';
}
