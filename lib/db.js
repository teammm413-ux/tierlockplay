const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

let dbInstance = null;

function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'vegas_vault.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrency and performance
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      password TEXT NOT NULL,
      wallet_balance REAL DEFAULT 0.00,
      account_status TEXT DEFAULT 'Active',
      is_email_verified INTEGER DEFAULT 0,
      is_phone_verified INTEGER DEFAULT 0,
      kyc_status TEXT DEFAULT 'INCOMPLETE',
      kyc_name TEXT DEFAULT '',
      invite_code TEXT DEFAULT 'VIP777',
      is_subscribed INTEGER DEFAULT 1,
      last_login_time TEXT DEFAULT '',
      last_login_ip TEXT DEFAULT '182.190.183.135',
      last_login_device TEXT DEFAULT 'MacOS (Desktop)',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'superadmin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposit_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      paid_amount REAL NOT NULL,
      received_amount REAL NOT NULL,
      service_fee REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Pending',
      wallet_balance_before REAL DEFAULT 0.00,
      wallet_balance_after REAL DEFAULT 0.00,
      transaction_proof TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_info TEXT NOT NULL,
      amount REAL NOT NULL,
      service_fee REAL DEFAULT 0.00,
      received_amount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      failure_reason TEXT DEFAULT '',
      wallet_balance_before REAL DEFAULT 0.00,
      wallet_balance_after REAL DEFAULT 0.00,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS game_platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      download_url TEXT NOT NULL,
      logo_url TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_game_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      platform_name TEXT NOT NULL,
      in_game_account_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, platform_id)
    );

    CREATE TABLE IF NOT EXISTS game_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      type TEXT NOT NULL,
      platform_name TEXT NOT NULL,
      game_account TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'Approved',
      failure_reason TEXT DEFAULT '',
      wallet_balance_before REAL DEFAULT 0.00,
      wallet_balance_after REAL DEFAULT 0.00,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      account_identifier TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read_by_user INTEGER DEFAULT 0,
      is_read_by_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      promo_code TEXT DEFAULT '',
      bonus_amount REAL DEFAULT 0.00,
      target_audience TEXT NOT NULL,
      delivery_channel TEXT NOT NULL,
      total_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chrome_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      icon TEXT DEFAULT '/icons/jackpot-icon.png',
      promo_code TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin from ENV or defaults
  const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@vegasvault.com';

  const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?');
  const existingAdmin = checkAdmin.get(envAdminUser);

  if (!existingAdmin) {
    const hashedPass = bcrypt.hashSync(envAdminPass, 10);
    const insertAdmin = db.prepare(`
      INSERT INTO admins (username, email, password, role)
      VALUES (?, ?, ?, 'superadmin')
    `);
    insertAdmin.run(envAdminUser, envAdminEmail, hashedPass);
  }

  // Seed demo player 'alex'
  const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
  const existingAlex = checkUser.get('alex');
  let alexId = null;

  if (!existingAlex) {
    const hashedAlexPass = bcrypt.hashSync('alex123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (
        username, email, phone, password, wallet_balance, account_status,
        is_email_verified, is_phone_verified, kyc_status, kyc_name,
        invite_code, is_subscribed, last_login_time, last_login_ip, last_login_device
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = insertUser.run(
      'alex',
      'ahmadnabeel634@gmail.com',
      '+12025550192',
      hashedAlexPass,
      250.00,
      'Active',
      0, // unverified initially to demo verification flow
      1, // phone verified
      'INCOMPLETE',
      'Alex Johnson',
      'VIP777',
      1,
      '2026-10-02 12:10:22',
      '182.190.183.135',
      'MacOS'
    );
    alexId = res.lastInsertRowid;
  } else {
    alexId = existingAlex.id;
  }

  // Seed Game Platforms
  const checkPlatforms = db.prepare('SELECT COUNT(*) as count FROM game_platforms');
  const platformCount = checkPlatforms.get().count;

  if (platformCount === 0) {
    const platforms = [
      { name: 'Juwa', slug: 'juwa', download: 'https://dl.juwa777.com/', logo: '🎰', tagline: 'The legendary fish & slots experience' },
      { name: 'Juwa2.0', slug: 'juwa-2', download: 'https://m.juwa2.com/', logo: '🎲', tagline: 'Next-gen graphics & mega bonuses' },
      { name: 'Fire Kirin', slug: 'fire-kirin', download: 'https://start.firekirin.xyz:8580/', logo: '🐉', tagline: 'Epic dragon ocean fish hunting' },
      { name: 'Orion Star', slug: 'orion-star', download: 'http://start.orionstars.vip:8580/', logo: '⭐', tagline: 'Classic arcade slots & wheel spins' },
      { name: 'Panda Master', slug: 'panda-master', download: 'https://pandamaster.vip:8888/', logo: '🐼', tagline: 'Golden panda reels with huge payouts' },
      { name: 'Egames', slug: 'egames', download: 'https://www.egame99.club/', logo: '🎮', tagline: 'Ultra high RTP sweepstakes' },
      { name: 'Ultra Panda', slug: 'ultra-panda', download: 'https://www.ultrapanda.mobi/', logo: '🐾', tagline: 'Wild multiplier bonuses' },
      { name: 'V-Blink', slug: 'v-blink', download: 'https://www.vblink777.club/', logo: '✨', tagline: 'Neon lightning table games' },
      { name: 'River Sweeps', slug: 'river-sweeps', download: 'https://river777.com/', logo: '🌊', tagline: 'America\'s favorite classic sweepstakes' },
      { name: 'Golden Dragon', slug: 'golden-dragon', download: 'https://playgd.world/', logo: '🐲', tagline: 'High roller multiplier jackpots' },
      { name: 'Game Vault', slug: 'game-vault', download: 'https://download.gamevault999.com/', logo: '🛡️', tagline: 'Secure vault gaming hub' },
      { name: 'Milky Way', slug: 'milky-way', download: 'https://milkywayapp.xyz/', logo: '🌌', tagline: 'Interstellar slots & community jackpots' }
    ];

    const insertPlatform = db.prepare(`
      INSERT INTO game_platforms (name, slug, download_url, logo_url, tagline)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const p of platforms) {
      insertPlatform.run(p.name, p.slug, p.download, p.logo, p.tagline);
    }
  }

  // Seed sample initial records if table is empty
  const checkDeposits = db.prepare('SELECT COUNT(*) as count FROM deposit_requests');
  if (checkDeposits.get().count === 0 && alexId) {
    const insertDep = db.prepare(`
      INSERT INTO deposit_requests (
        order_no, user_id, username, payment_method, paid_amount,
        received_amount, service_fee, status, wallet_balance_before,
        wallet_balance_after, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDep.run(
      'MCH2026100202070141865521058',
      alexId,
      'alex',
      'Cash App',
      9.99,
      10.00,
      0.00,
      'Approved',
      240.00,
      250.00,
      '2026-10-02 01:07:01',
      '2026-10-02 01:07:30'
    );

    insertDep.run(
      'MCH2026100203154876219438012',
      alexId,
      'alex',
      'Apple Pay',
      49.99,
      50.00,
      0.00,
      'Pending',
      250.00,
      250.00,
      '2026-10-02 03:15:48',
      ''
    );
  }

  // Seed sample withdrawal records if empty
  const checkWithdrawals = db.prepare('SELECT COUNT(*) as count FROM withdrawal_requests');
  if (checkWithdrawals.get().count === 0 && alexId) {
    const insertWith = db.prepare(`
      INSERT INTO withdrawal_requests (
        order_no, user_id, username, payment_method, payment_info,
        amount, service_fee, received_amount, status, failure_reason,
        wallet_balance_before, wallet_balance_after, created_at, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertWith.run(
      'WTH20261001091530998812345',
      alexId,
      'alex',
      'Cash App',
      '$AlexWinner777',
      50.00,
      2.50,
      47.50,
      'Approved',
      '',
      300.00,
      250.00,
      '2026-10-01 09:15:30',
      '2026-10-01 09:30:15'
    );
  }

  // Seed sample chat messages
  const checkChat = db.prepare('SELECT COUNT(*) as count FROM chat_messages');
  if (checkChat.get().count === 0 && alexId) {
    const insertChat = db.prepare(`
      INSERT INTO chat_messages (user_id, sender_type, sender_name, message, is_read_by_user, is_read_by_admin, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertChat.run(
      alexId,
      'admin',
      'Vegas Vault Support',
      'Hello Alex! Welcome to Vegas Vault Casino. Your VIP $5 Freeplay bonus is active. Need help loading credits?',
      0, // unread by user to trigger the notification banner!
      1,
      '2026-10-02 11:45:00'
    );
  }

  dbInstance = db;
  return db;
}

module.exports = { getDb };
