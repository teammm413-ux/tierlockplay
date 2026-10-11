/**
 * Utility to manage unique client device identification.
 * Persists deviceId across localStorage and long-lived cookies.
 */

export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return '';
  try {
    let deviceId = localStorage.getItem('trp_device_id');
    if (!deviceId) {
      // Check document cookies
      const match = document.cookie.match(/(?:^|;\s*)trp_device_id=([^;]+)/);
      if (match && match[1]) {
        deviceId = decodeURIComponent(match[1]);
      }
    }

    if (!deviceId || deviceId.trim().length === 0) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '');
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      }
    }

    // Persist in localStorage and 10-year cookie
    localStorage.setItem('trp_device_id', deviceId);
    document.cookie = `trp_device_id=${encodeURIComponent(deviceId)}; path=/; max-age=315360000; SameSite=Lax`;
    return deviceId;
  } catch (err) {
    return 'dev_fallback_' + Date.now();
  }
}
