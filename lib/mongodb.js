import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Global cache across Next.js hot reloads in development
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memoryServer: null };
}

// Ensure Schema definitions are registered
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  wallet_balance: { type: Number, default: 0.00 },
  account_status: { type: String, default: 'Active' },
  is_email_verified: { type: Boolean, default: false },
  is_phone_verified: { type: Boolean, default: true },
  kyc_status: { type: String, default: 'INCOMPLETE' },
  kyc_name: { type: String, default: 'Alex Johnson' },
  invite_code: { type: String, default: 'VIP777' },
  referred_by: { type: String, default: '' },
  is_subscribed: { type: Boolean, default: true },
  last_login_time: { type: String, default: '2026-10-01 11:10:22' },
  last_login_ip: { type: String, default: '182.190.183.135' },
  last_login_device: { type: String, default: 'macos' },
  created_at: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'superadmin' },
  created_at: { type: Date, default: Date.now }
});

const GamePlatformSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  slug: { type: String, unique: true, required: true },
  download_url: { type: String, required: true },
  logo_url: { type: String, required: true },
  banner_image: { type: String, default: '' },
  tagline: { type: String, default: '' },
  category: { type: String, default: 'Fish & Slots' },
  min_deposit: { type: Number, default: 10 },
  rtp: { type: String, default: '96.5%' },
  is_active: { type: Boolean, default: true },
  order_priority: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const UserGameAccountSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  username: { type: String, default: '' },
  platform_id: { type: String, default: '' },
  platform_name: { type: String, required: true },
  in_game_account_id: { type: String, default: '' },
  game_username: { type: String, default: '' },
  game_password: { type: String, default: '' },
  total_loaded: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
UserGameAccountSchema.index({ user_id: 1, platform_name: 1 }, { unique: true });

const DepositRequestSchema = new mongoose.Schema({
  order_no: { type: String, unique: true, required: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  payment_method: { type: String, required: true },
  paid_amount: { type: Number, required: true },
  received_amount: { type: Number, required: true },
  service_fee: { type: Number, default: 0.00 },
  status: { type: String, default: 'Created' }, // Created, Pending, Approved, Rejected, Expired
  wallet_balance_before: { type: Number, default: 0.00 },
  wallet_balance_after: { type: Number, default: 0.00 },
  transaction_proof: { type: String, default: '' },
  payment_gateway: { type: String, default: 'Gateway' },
  product_id: { type: Number, default: 0 },
  payment_token: { type: String, default: '' },
  redirect_url: { type: String, default: '' },
  gateway_order_id: { type: String, default: '' },
  admin_notes: { type: String, default: '' },
  failure_reason: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date },
  processed_at: { type: Date }
});

const WithdrawalRequestSchema = new mongoose.Schema({
  order_no: { type: String, unique: true, required: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  payment_method: { type: String, required: true },
  payment_info: { type: String, required: true },
  amount: { type: Number, required: true },
  service_fee: { type: Number, default: 0.00 },
  received_amount: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  admin_notes: { type: String, default: '' },
  failure_reason: { type: String, default: '' },
  wallet_balance_before: { type: Number, default: 0.00 },
  wallet_balance_after: { type: Number, default: 0.00 },
  created_at: { type: Date, default: Date.now },
  processed_at: { type: Date }
});

const GameTransactionSchema = new mongoose.Schema({
  order_no: { type: String, unique: true, required: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  type: { type: String, required: true }, // Deposit or Withdrawal
  platform_name: { type: String, required: true },
  game_account: { type: String, default: '' },
  game_username: { type: String, default: '' },
  game_password: { type: String, default: '' },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
  api_dispatch_status: { type: String, default: 'Manual' },
  in_game_tx_id: { type: String, default: '' },
  admin_notes: { type: String, default: '' },
  api_latency_ms: { type: Number, default: 0 },
  failure_reason: { type: String, default: '' },
  wallet_balance_before: { type: Number, default: 0.00 },
  wallet_balance_after: { type: Number, default: 0.00 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ChatMessageSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  sender_type: { type: String, required: true }, // user or admin
  sender_name: { type: String, required: true },
  message: { type: String, required: true },
  is_read_by_user: { type: Boolean, default: false },
  is_read_by_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const PromotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  promo_code: { type: String, default: '' },
  bonus_amount: { type: Number, default: 0.00 },
  target_audience: { type: String, default: 'both' }, // subscribers, unsubscribers, both
  delivery_channel: { type: String, default: 'both' }, // chrome, email, both
  total_sent: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const ChromeNotificationSchema = new mongoose.Schema({
  user_id: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '/icons/jackpot-icon.png' },
  promo_code: { type: String, default: '' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const PaymentMethodSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  type: { type: String, required: true }, // Cash App, Chime, Paypal, Debit Card
  account_identifier: { type: String, required: true },
  is_default: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const OtpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, required: true }, // phone_otp, email_token
  expires_at: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
export const GamePlatform = mongoose.models.GamePlatform || mongoose.model('GamePlatform', GamePlatformSchema);
export const UserGameAccount = mongoose.models.UserGameAccount || mongoose.model('UserGameAccount', UserGameAccountSchema);
export const DepositRequest = mongoose.models.DepositRequest || mongoose.model('DepositRequest', DepositRequestSchema);
export const WithdrawalRequest = mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
export const GameTransaction = mongoose.models.GameTransaction || mongoose.model('GameTransaction', GameTransactionSchema);
export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
export const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
export const ChromeNotification = mongoose.models.ChromeNotification || mongoose.model('ChromeNotification', ChromeNotificationSchema);
export const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', PaymentMethodSchema);
export const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    let targetUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vegas_vault';
    const isAtlas = targetUri.startsWith('mongodb+srv://') || targetUri.includes('ssl=true') || targetUri.includes('tls=true');

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 7000,
    };

    cached.promise = (async () => {
      try {
        const masked = targetUri.replace(/:([^:@]+)@/, ':****@');
        console.log(`[MongoDB] Connecting to ${isAtlas ? 'MongoDB Atlas Cloud' : 'Local MongoDB'}: ${masked}`);
        const mongooseInstance = await mongoose.connect(targetUri, opts);
        console.log('[MongoDB] Connected successfully to MongoDB instance.');
        // Seed in background asynchronously without blocking user requests
        seedDatabase().catch(err => console.error('[MongoDB Background Seed Error]', err));
        return mongooseInstance;
      } catch (err) {
        console.error(`[MongoDB] Connection error to primary database:`, err.message);

        // If SRV connection fails (common on VPS due to DNS SRV resolution issues), attempt Direct Shard ReplicaSet fallback
        if (targetUri.startsWith('mongodb+srv://')) {
          try {
            console.log('[MongoDB] SRV failed or timed out. Attempting Direct Shard ReplicaSet fallback...');
            const directUri = 'mongodb://teammm413_db_user:bP3Qt1nLQmGwcKxQ@ac-wrpkhtj-shard-00-00.ud7n6br.mongodb.net:27017,ac-wrpkhtj-shard-00-01.ud7n6br.mongodb.net:27017,ac-wrpkhtj-shard-00-02.ud7n6br.mongodb.net:27017/vegas_vault?ssl=true&replicaSet=atlas-3d0zy4-shard-0&authSource=admin&retryWrites=true&w=majority';
            const directInstance = await mongoose.connect(directUri, {
              bufferCommands: false,
              serverSelectionTimeoutMS: 5000,
              connectTimeoutMS: 7000,
            });
            console.log('[MongoDB] Connected successfully via Direct Shard ReplicaSet URI!');
            await seedDatabase();
            return directInstance;
          } catch (directErr) {
            console.error('[MongoDB] Direct Shard fallback also failed:', directErr.message);
          }
        }

        // If Atlas failed, attempt local MongoDB fallback if running on the server
        if (isAtlas) {
          try {
            console.log('[MongoDB] Attempting fallback to local MongoDB (127.0.0.1:27017)...');
            const fallbackInstance = await mongoose.connect('mongodb://127.0.0.1:27017/vegas_vault', {
              bufferCommands: false,
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 4000,
            });
            console.log('[MongoDB] Connected successfully to fallback local MongoDB.');
            await seedDatabase();
            return fallbackInstance;
          } catch (fallbackErr) {
            console.error('[MongoDB] Fallback to local MongoDB also failed:', fallbackErr.message);
          }
        }

        cached.promise = null;
        cached.conn = null;
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}

/**
 * Automatically expire abandoned 'Created' deposit checkouts after 30 minutes
 */
export async function expireStaleDeposits() {
  try {
    await connectToDatabase();
    const now = new Date();
    const defaultCutoff = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    const result = await DepositRequest.updateMany(
      {
        status: 'Created',
        $or: [
          { expires_at: { $exists: true, $ne: null, $lte: now } },
          { expires_at: { $exists: false }, created_at: { $lte: defaultCutoff } },
          { expires_at: null, created_at: { $lte: defaultCutoff } }
        ]
      },
      {
        $set: {
          status: 'Expired',
          processed_at: now
        }
      }
    );

    if (result && result.modifiedCount > 0) {
      console.log(`[expireStaleDeposits] Auto-expired ${result.modifiedCount} abandoned deposit order(s).`);
    }
    return result;
  } catch (err) {
    console.error('[expireStaleDeposits Error]', err);
    return null;
  }
}

/**
 * Seed initial data if database is empty
 */
async function seedDatabase() {
  try {
    // 1. Seed Super Admin
    const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
    const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@vegasvault.com';

    let admin = await Admin.findOne({ username: envAdminUser });
    if (!admin) {
      const hashedPass = bcrypt.hashSync(envAdminPass, 10);
      admin = await Admin.create({
        username: envAdminUser,
        email: envAdminEmail,
        password: hashedPass,
        role: 'superadmin'
      });
      console.log(`[MongoDB Seed] Default Admin '${envAdminUser}' initialized.`);
    }

    // 2. Seed Demo Player 'alex' matching the screenshots exactly
    let alex = await User.findOne({ username: 'alex' });
    if (!alex) {
      const hashedAlexPass = bcrypt.hashSync('alex123', 10);
      alex = await User.create({
        username: 'alex',
        email: 'ahmadnabeel634@gmail.com',
        phone: '+12025550192',
        password: hashedAlexPass,
        wallet_balance: 0.00,
        account_status: 'Active',
        is_email_verified: false,
        is_phone_verified: true,
        kyc_status: 'INCOMPLETE',
        kyc_name: 'Alex Johnson',
        invite_code: 'VIP777',
        is_subscribed: true,
        last_login_time: '2026-10-01 11:10:22',
        last_login_ip: '182.190.183.135',
        last_login_device: 'macos'
      });
      console.log(`[MongoDB Seed] Demo user 'alex' created.`);
    }

    // 3. Seed Game Platforms with custom generated images & official links
    const platformCount = await GamePlatform.countDocuments();
    if (platformCount === 0) {
      const platforms = [
        {
          name: 'Juwa',
          slug: 'juwa',
          download_url: 'https://dl.juwa777.com/',
          logo_url: '/images/games/juwa.jpg',
          tagline: 'The legendary fish & slots experience',
          category: 'Fish & Slots',
          min_deposit: 10,
          rtp: '97.2%',
          order_priority: 1
        },
        {
          name: 'Juwa2.0',
          slug: 'juwa-2',
          download_url: 'https://m.juwa2.com/',
          logo_url: '/images/games/juwa.jpg',
          tagline: 'Next-gen graphics & mega bonuses',
          category: 'Video Slots',
          min_deposit: 10,
          rtp: '96.8%',
          order_priority: 2
        },
        {
          name: 'Fire Kirin',
          slug: 'fire-kirin',
          download_url: 'https://start.firekirin.xyz:8580/',
          logo_url: '/images/games/fire-kirin.jpg',
          tagline: 'Epic dragon ocean fish hunting arcade',
          category: 'Fish Hunter',
          min_deposit: 10,
          rtp: '98.1%',
          order_priority: 3
        },
        {
          name: 'Orion Star',
          slug: 'orion-star',
          download_url: 'http://start.orionstars.vip:8580/',
          logo_url: '/images/games/orion-stars.jpg',
          tagline: 'Classic arcade slots & lucky wheel spins',
          category: 'Arcade & Wheel',
          min_deposit: 10,
          rtp: '96.5%',
          order_priority: 4
        },
        {
          name: 'Panda Master',
          slug: 'panda-master',
          download_url: 'https://pandamaster.vip:8888/',
          logo_url: '/images/games/panda-master.jpg',
          tagline: 'Golden panda reels with huge payouts',
          category: 'Video Slots',
          min_deposit: 10,
          rtp: '96.0%',
          order_priority: 5
        },
        {
          name: 'Egames',
          slug: 'egames',
          download_url: 'https://www.egame99.club/',
          logo_url: '/images/games/juwa.jpg',
          tagline: 'Ultra high RTP sweepstakes club',
          category: 'Multi-Game',
          min_deposit: 10,
          rtp: '97.5%',
          order_priority: 6
        },
        {
          name: 'Ultra Panda',
          slug: 'ultra-panda',
          download_url: 'https://www.ultrapanda.mobi/',
          logo_url: '/images/games/ultra-panda.jpg',
          tagline: 'Wild multiplier bonuses & arcade fish',
          category: 'Fish Hunter',
          min_deposit: 10,
          rtp: '96.9%',
          order_priority: 7
        },
        {
          name: 'V-Blink',
          slug: 'v-blink',
          download_url: 'https://www.vblink777.club/',
          logo_url: '/images/games/orion-stars.jpg',
          tagline: 'Neon lightning table & slot games',
          category: 'Table Games',
          min_deposit: 10,
          rtp: '96.7%',
          order_priority: 8
        },
        {
          name: 'River Sweeps',
          slug: 'river-sweeps',
          download_url: 'https://river777.com/',
          logo_url: '/images/games/juwa.jpg',
          tagline: "America's favorite classic sweepstakes",
          category: 'Classic Slots',
          min_deposit: 10,
          rtp: '97.0%',
          order_priority: 9
        },
        {
          name: 'Golden Dragon',
          slug: 'golden-dragon',
          download_url: 'https://playgd.world/',
          logo_url: '/images/games/golden-dragon.jpg',
          tagline: 'High roller multiplier jackpots',
          category: 'Fish & Slots',
          min_deposit: 10,
          rtp: '97.8%',
          order_priority: 10
        },
        {
          name: 'Game Vault',
          slug: 'game-vault',
          download_url: 'https://download.gamevault999.com/',
          logo_url: '/images/games/orion-stars.jpg',
          tagline: 'Secure vault gaming hub',
          category: 'Cyber Arcade',
          min_deposit: 10,
          rtp: '96.4%',
          order_priority: 11
        },
        {
          name: 'Milky Way',
          slug: 'milky-way',
          download_url: 'https://milkywayapp.xyz/',
          logo_url: '/images/games/orion-stars.jpg',
          tagline: 'Interstellar slots & community jackpots',
          category: 'Galaxy Slots',
          min_deposit: 10,
          rtp: '97.1%',
          order_priority: 12
        }
      ];

      await GamePlatform.insertMany(platforms);
      console.log(`[MongoDB Seed] 12 Game Platforms seeded successfully.`);
    } else {
      await GamePlatform.updateOne({ name: 'Panda Master' }, { $set: { logo_url: '/images/games/panda-master.jpg' } });
      await GamePlatform.updateOne({ name: 'Ultra Panda' }, { $set: { logo_url: '/images/games/ultra-panda.jpg' } });
      await GamePlatform.updateOne({ name: 'Golden Dragon' }, { $set: { logo_url: '/images/games/golden-dragon.jpg' } });
    }

    // 4. Seed initial Deposit Record for alex matching screenshot
    const depositCount = await DepositRequest.countDocuments();
    if (depositCount === 0 && alex) {
      await DepositRequest.create({
        order_no: 'MCH2026100202070141865521058',
        user_id: alex._id.toString(),
        username: alex.username,
        payment_method: 'Cash App',
        paid_amount: 9.99,
        received_amount: 10.00,
        service_fee: 0.00,
        status: 'Created',
        wallet_balance_before: 0.00,
        wallet_balance_after: 0.00,
        created_at: new Date('2026-10-02T01:07:01Z'),
        expires_at: new Date(new Date('2026-10-02T01:07:01Z').getTime() + 30 * 60 * 1000)
      });
    }

    // 5. Seed initial Promotional message
    const promoCount = await Promotion.countDocuments();
    if (promoCount === 0) {
      await Promotion.create({
        title: '🔥 VIP Welcome Weekend 100% Reload!',
        message: 'Deposit $20 or more on Juwa or Fire Kirin and receive instant $20 Freeplay match bonus! Use code: VEGAS100',
        promo_code: 'VEGAS100',
        bonus_amount: 20.00,
        target_audience: 'both',
        delivery_channel: 'both',
        total_sent: 1
      });
    }

    // Auto-expire any stale 'Created' deposit sessions (> 30 mins)
    await expireStaleDeposits();

  } catch (err) {
    console.error('[MongoDB Seed Error]', err);
  }
}
