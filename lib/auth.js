const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vegas_vault_super_secret_jwt_key_2026';

function signUserToken(user) {
  const userId = user._id ? user._id.toString() : (user.id ? String(user.id) : '');
  return jwt.sign(
    {
      id: userId,
      _id: userId,
      username: user.username,
      email: user.email,
      role: 'user',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function signAdminToken(admin) {
  const adminId = admin._id ? admin._id.toString() : (admin.id ? String(admin.id) : '');
  return jwt.sign(
    {
      id: adminId,
      _id: adminId,
      username: admin.username,
      email: admin.email,
      role: admin.role || 'superadmin',
      isAdmin: true,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(';');
  for (const item of items) {
    const parts = item.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if (key) cookies[key] = decodeURIComponent(val);
  }
  return cookies;
}

function getSessionFromRequest(request) {
  // Check cookie or Authorization header
  let token = null;

  // Determine if this is an admin request
  let isAdminRoute = false;
  if (request) {
    const rawUrl = request.url || (request.nextUrl && request.nextUrl.pathname) || '';
    if (typeof rawUrl === 'string' && (rawUrl.includes('/api/admin') || rawUrl.includes('/admin/'))) {
      isAdminRoute = true;
    }
  }

  if (request && request.cookies && typeof request.cookies.get === 'function') {
    const userCookie = request.cookies.get('user_token');
    const adminCookie = request.cookies.get('admin_token');

    if (isAdminRoute) {
      token = (adminCookie && adminCookie.value) || (userCookie && userCookie.value);
    } else {
      token = (userCookie && userCookie.value) || (adminCookie && adminCookie.value);
    }
  } else if (request && request.headers) {
    const cookieHeader = request.headers.get ? request.headers.get('cookie') : request.headers.cookie;
    const cookies = parseCookies(cookieHeader);

    if (isAdminRoute) {
      token = cookies.admin_token || cookies.user_token;
    } else {
      token = cookies.user_token || cookies.admin_token;
    }

    if (!token) {
      const authHeader = request.headers.get ? request.headers.get('authorization') : request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  signUserToken,
  signAdminToken,
  verifyToken,
  getSessionFromRequest,
};
