/**
 * Device & IP Detection Utility for TierlockPlay
 */

/**
 * Detect client IP from Next.js request headers
 */
export function getClientIp(request) {
  if (!request || !request.headers) return '127.0.0.1';

  const getHeader = (name) => {
    if (typeof request.headers.get === 'function') return request.headers.get(name);
    return request.headers[name] || request.headers[name.toLowerCase()];
  };

  const cfIp = getHeader('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && !firstIp.startsWith('127.') && firstIp !== '::1') return firstIp;
  }

  const realIp = getHeader('x-real-ip');
  if (realIp && !realIp.startsWith('127.') && realIp !== '::1') return realIp.trim();

  return '127.0.0.1';
}

/**
 * Parse human-readable device name from User-Agent string
 */
export function parseDeviceFromUserAgent(ua = '') {
  if (!ua) return 'Web Browser';
  const userAgent = ua.toLowerCase();

  // iOS Devices
  if (userAgent.includes('iphone')) {
    return 'iPhone (iOS)';
  }
  if (userAgent.includes('ipad')) {
    return 'iPad (iPadOS)';
  }
  if (userAgent.includes('ipod')) {
    return 'iPod Touch';
  }

  // Android Devices
  if (userAgent.includes('android')) {
    const match = ua.match(/Android[^;]+;\s*([^;)]+)/);
    let model = match && match[1] ? match[1].trim() : '';
    if (model.includes('Build/')) {
      model = model.split('Build/')[0].trim();
    }
    if (model && !model.toLowerCase().includes('k') && model.length > 2) {
      if (/samsung|sm-/i.test(model)) return `Samsung Android (${model})`;
      if (/pixel/i.test(model)) return `Google Pixel (${model})`;
      if (/xiaomi|redmi|mi\s/i.test(model)) return `Xiaomi Android (${model})`;
      if (/oneplus/i.test(model)) return `OnePlus (${model})`;
      if (/vivo/i.test(model)) return `Vivo Android (${model})`;
      if (/oppo/i.test(model)) return `Oppo Android (${model})`;
      if (/motorola|moto/i.test(model)) return `Moto Android (${model})`;
      return `Android (${model})`;
    }
    return 'Android Phone';
  }

  // Desktop OS
  if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
    return 'macOS (Desktop)';
  }
  if (userAgent.includes('windows nt 10.0') || userAgent.includes('windows nt 11.0')) {
    return 'Windows 10/11 (PC)';
  }
  if (userAgent.includes('windows')) {
    return 'Windows (PC)';
  }
  if (userAgent.includes('cros')) {
    return 'ChromeOS (Chromebook)';
  }
  if (userAgent.includes('linux')) {
    return 'Linux (Desktop)';
  }

  return 'Mobile Browser';
}

/**
 * Client-side browser device detection helper
 */
export function getBrowserDeviceDetails() {
  if (typeof window === 'undefined') {
    return { name: 'Current Device', type: 'desktop' };
  }

  const ua = window.navigator.userAgent;
  const name = parseDeviceFromUserAgent(ua);
  const uaLower = ua.toLowerCase();

  let type = 'desktop';
  if (/mobile|android|iphone|ipod/i.test(uaLower)) {
    type = 'mobile';
  } else if (/ipad|tablet/i.test(uaLower)) {
    type = 'tablet';
  }

  return { name, type };
}

/**
 * Get or create unique device UUID stored in localStorage
 */
export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'server-side-session';
  try {
    let id = localStorage.getItem('trp_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('trp_device_id', id);
    }
    return id;
  } catch (err) {
    return 'fallback-device-id';
  }
}
