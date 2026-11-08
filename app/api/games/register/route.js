import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction, UserGameAccount, GamePlatform } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { isFastApiPlatform, fastApiCreatePlayer, generateGamePassword } from '@/lib/fastapi';
import { isFireKirinPlatform, fireKirinRegisterPlayer, sanitizeFireKirinAccount } from '@/lib/firekirin';
import { isJuwa2Platform, juwa2AddUser, sanitizeJuwa2Account } from '@/lib/juwa2';
import {
  isAgentVaultPlatform,
  agentVaultInsertPlayer,
  sanitizeAgentVaultUsername,
} from '@/lib/agentvault';

function generateOrderNo(prefix = 'REG') {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(100000000000 + Math.random() * 900000000000);
  return `${prefix}${y}${m}${day}${rand}`;
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { platformName } = body;

    if (!platformName || !platformName.trim()) {
      return NextResponse.json({ success: false, message: 'Game platform name is required' }, { status: 400 });
    }

    const platform = await GamePlatform.findOne({
      $or: [
        { name: platformName.trim() },
        { slug: platformName.trim().toLowerCase().replace(/\s+/g, '-') },
      ],
    });

    if (!platform || platform.is_active === false) {
      return NextResponse.json({
        success: false,
        message: `Platform "${platformName}" is currently unavailable.`,
      }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 1. Check if user already has an existing account for this platform
    const existingAccount = await UserGameAccount.findOne({
      user_id: user._id.toString(),
      platform_name: platform.name,
    });

    if (existingAccount && existingAccount.game_username) {
      return NextResponse.json({
        success: false,
        message: `You already have an active account for ${platform.name} (Username: ${existingAccount.game_username}). You can load credits directly.`,
        hasAccount: true,
        game_username: existingAccount.game_username,
      }, { status: 400 });
    }

    // 2. Check if user already has any pending request
    const existingPending = await GameTransaction.findOne({
      user_id: user._id.toString(),
      status: 'Pending',
    });

    if (existingPending) {
      return NextResponse.json({
        success: false,
        message: `You already have an active request in review (${existingPending.platform_name} - ${existingPending.type}). Please wait for admin approval before submitting another request.`,
      }, { status: 400 });
    }

    const orderNo = generateOrderNo('REG');

    // 3. FastApi Integration: Check if this platform supports real-time automated API registration
    if (isFastApiPlatform(platform.name)) {
      const sanitizedUsername = (user.username || 'user')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 8);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const rawAccount = `${sanitizedUsername}${randomSuffix}`.slice(0, 16);
      const generatedPassword = generateGamePassword();

      console.log(`[FastApi Auto-Register] Attempting auto account creation for ${user.username} on ${platform.name} (${rawAccount})`);

      const apiRes = await fastApiCreatePlayer({
        platformName: platform.name,
        account: rawAccount,
        password: generatedPassword,
      });

      if (apiRes.success) {
        const fullAccount = apiRes.fullAccount || rawAccount;

        // Save new in-game account in UserGameAccount
        await UserGameAccount.findOneAndUpdate(
          { user_id: user._id.toString(), platform_name: platform.name },
          {
            user_id: user._id.toString(),
            username: user.username,
            platform_id: platform._id.toString(),
            platform_name: platform.name,
            in_game_account_id: rawAccount,
            game_username: fullAccount,
            game_password: generatedPassword,
            status: 'Active',
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );

        // Record approved transaction
        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: fullAccount,
          game_username: fullAccount,
          game_password: generatedPassword,
          amount: 0,
          status: 'Approved',
          api_dispatch_status: 'FastApi',
          in_game_tx_id: 'AUTO_REG_SUCCESS',
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Auto-registered instantly via FastApi (${platform.name})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Your ${platform.name} game account was created instantly! Use your username & password to log in.`,
          orderNo,
          platformName: platform.name,
          game_username: fullAccount,
          game_password: generatedPassword,
          status: 'Approved',
        });
      } else {
        console.warn(`[FastApi Auto-Register] API call returned error: ${apiRes.message} (Code: ${apiRes.code}). Falling back to manual admin queue.`);

        // If IP is not yet whitelisted or API returned temporary error, fallback to Pending so admin can review
        const tx = await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: '',
          game_username: '',
          game_password: '',
          amount: 0,
          status: 'Pending',
          api_dispatch_status: 'Manual',
          failure_reason: apiRes.code === 403 ? 'IP Whitelist Required: ' + apiRes.message : apiRes.message,
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `FastApi registration attempt logged (${apiRes.message}). Awaiting admin or provider whitelist.`,
          created_at: new Date(),
        });

        const noticeMsg = apiRes.code === 403
          ? `Account creation request submitted for ${platform.name}! Server IP is being whitelisted by game provider; Admin will provide credentials shortly.`
          : `Account creation request submitted! Admin will provide credentials shortly.`;

        return NextResponse.json({
          success: true,
          message: noticeMsg,
          orderNo: tx.order_no,
          platformName: tx.platform_name,
          status: 'Pending',
        });
      }
    }

    // 4. Fire Kirin Integration: Check if this platform is Fire Kirin
    if (isFireKirinPlatform(platform.name)) {
      const sanitizedUsername = (user.username || 'user')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 8);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const rawAccount = sanitizeFireKirinAccount(`fk${sanitizedUsername}${randomSuffix}`);
      const generatedPassword = generateGamePassword();

      console.log(`[FireKirin Auto-Register] Attempting auto account creation for ${user.username} on ${platform.name} (${rawAccount})`);

      const apiRes = await fireKirinRegisterPlayer({
        account: rawAccount,
        password: generatedPassword,
      });

      if (apiRes.success) {
        // Save new in-game account in UserGameAccount
        await UserGameAccount.findOneAndUpdate(
          { user_id: user._id.toString(), platform_name: platform.name },
          {
            user_id: user._id.toString(),
            username: user.username,
            platform_id: platform._id.toString(),
            platform_name: platform.name,
            in_game_account_id: rawAccount,
            game_username: rawAccount,
            game_password: generatedPassword,
            status: 'Active',
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );

        // Record approved transaction
        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: rawAccount,
          game_username: rawAccount,
          game_password: generatedPassword,
          amount: 0,
          status: 'Approved',
          api_dispatch_status: 'FireKirin',
          in_game_tx_id: 'AUTO_FK_REG_SUCCESS',
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Auto-registered instantly via Fire Kirin Game API (${platform.name})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Your ${platform.name} game account was created instantly! Use your username & password to log in.`,
          orderNo,
          platformName: platform.name,
          game_username: rawAccount,
          game_password: generatedPassword,
          status: 'Approved',
        });
      } else {
        console.warn(`[FireKirin Auto-Register] API call returned error: ${apiRes.message} (Code: ${apiRes.code}). Falling back to manual admin queue.`);

        const isWhitelistOrConfig = apiRes.code === 403 || apiRes.code === -1 || apiRes.code === -2;
        const tx = await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: '',
          game_username: '',
          game_password: '',
          amount: 0,
          status: 'Pending',
          api_dispatch_status: 'Manual',
          failure_reason: apiRes.message,
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Fire Kirin registration logged (${apiRes.message}). Awaiting provider whitelist on 179.236.244.219 or admin action.`,
          created_at: new Date(),
        });

        const noticeMsg = isWhitelistOrConfig
          ? `Account creation request submitted for ${platform.name}! Server IP is being whitelisted by game provider; Admin will provide credentials shortly.`
          : `Account creation request submitted! Admin will provide credentials shortly.`;

        return NextResponse.json({
          success: true,
          message: noticeMsg,
          orderNo: tx.order_no,
          platformName: tx.platform_name,
          status: 'Pending',
        });
      }
    }

    // 5. Juwa 2.0 Integration: Check if this platform is Juwa 2.0
    if (isJuwa2Platform(platform.name)) {
      const sanitizedUsername = (user.username || 'user')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 8);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const rawAccount = sanitizeJuwa2Account(`j2_${sanitizedUsername}${randomSuffix}`);
      const generatedPassword = generateGamePassword();

      console.log(`[Juwa2.0 Auto-Register] Attempting auto account creation for ${user.username} on ${platform.name} (${rawAccount})`);

      const apiRes = await juwa2AddUser({
        account: rawAccount,
        password: generatedPassword,
      });

      if (apiRes.success) {
        // Save new in-game account in UserGameAccount
        await UserGameAccount.findOneAndUpdate(
          { user_id: user._id.toString(), platform_name: platform.name },
          {
            user_id: user._id.toString(),
            username: user.username,
            platform_id: platform._id.toString(),
            platform_name: platform.name,
            in_game_account_id: apiRes.userId,
            game_username: rawAccount,
            game_password: generatedPassword,
            status: 'Active',
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );

        // Record approved transaction
        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: rawAccount,
          game_username: rawAccount,
          game_password: generatedPassword,
          amount: 0,
          status: 'Approved',
          api_dispatch_status: 'Juwa2',
          in_game_tx_id: `JUWA2_ID_${apiRes.userId}`,
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Auto-registered instantly via Juwa 2.0 API (${platform.name}, UserID: ${apiRes.userId})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Your ${platform.name} game account was created instantly! Use your username & password to log in.`,
          orderNo,
          platformName: platform.name,
          game_username: rawAccount,
          game_password: generatedPassword,
          status: 'Approved',
        });
      } else {
        console.warn(`[Juwa2.0 Auto-Register] API call returned error: ${apiRes.message} (Code: ${apiRes.code}). Falling back to manual admin queue.`);

        const isWhitelist = apiRes.code === 5 || apiRes.code === -1;
        const tx = await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: '',
          game_username: '',
          game_password: '',
          amount: 0,
          status: 'Pending',
          api_dispatch_status: 'Manual',
          failure_reason: apiRes.message,
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Juwa 2.0 registration logged (${apiRes.message}). Awaiting provider whitelist on 179.236.244.219 or admin action.`,
          created_at: new Date(),
        });

        const noticeMsg = isWhitelist
          ? `Account creation request submitted for ${platform.name}! Server IP is being whitelisted by game provider; Admin will provide credentials shortly.`
          : `Account creation request submitted! Admin will provide credentials shortly.`;

        return NextResponse.json({
          success: true,
          message: noticeMsg,
          orderNo: tx.order_no,
          platformName: tx.platform_name,
          status: 'Pending',
        });
      }
    }

    // 6. Agent Vault Integration (Cash Frenzy, Cash Machine, Lucky Stars, Mafia, Mr All In One, Noble, Vegas Roll)
    if (isAgentVaultPlatform(platform.name)) {
      const sanitizedUsername = (user.username || 'user')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
        .slice(0, 6);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const rawAccount = sanitizeAgentVaultUsername(`${sanitizedUsername}${randomSuffix}`);
      const generatedPassword = generateGamePassword();

      console.log(`[AgentVault Auto-Register] Creating account for ${user.username} on ${platform.name} (${rawAccount})`);

      const apiRes = await agentVaultInsertPlayer({
        platformName: platform.name,
        username: rawAccount,
        password: generatedPassword,
      });

      if (apiRes.success) {
        await UserGameAccount.findOneAndUpdate(
          { user_id: user._id.toString(), platform_name: platform.name },
          {
            user_id: user._id.toString(),
            username: user.username,
            platform_id: platform._id.toString(),
            platform_name: platform.name,
            in_game_account_id: apiRes.playerId,
            game_username: apiRes.account || rawAccount,
            game_password: generatedPassword,
            status: 'Active',
            updated_at: new Date(),
          },
          { upsert: true, new: true }
        );

        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Register',
          platform_name: platform.name,
          game_account: apiRes.account || rawAccount,
          game_username: apiRes.account || rawAccount,
          game_password: generatedPassword,
          amount: 0,
          status: 'Approved',
          api_dispatch_status: 'AgentVault',
          in_game_tx_id: `AV_ID_${apiRes.playerId}`,
          wallet_balance_before: user.wallet_balance || 0,
          wallet_balance_after: user.wallet_balance || 0,
          admin_notes: `Auto-registered via Agent Vault API (${platform.name}, PlayerID: ${apiRes.playerId})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Your ${platform.name} game account was created instantly! Use your username & password to log in.`,
          orderNo,
          platformName: platform.name,
          game_username: apiRes.account || rawAccount,
          game_password: generatedPassword,
          status: 'Approved',
        });
      }

      const tx = await GameTransaction.create({
        order_no: orderNo,
        user_id: user._id.toString(),
        username: user.username,
        type: 'Register',
        platform_name: platform.name,
        game_account: '',
        game_username: '',
        game_password: '',
        amount: 0,
        status: 'Pending',
        api_dispatch_status: 'Manual',
        failure_reason: apiRes.message,
        wallet_balance_before: user.wallet_balance || 0,
        wallet_balance_after: user.wallet_balance || 0,
        admin_notes: `Agent Vault registration failed (${apiRes.message}). Check agent credentials in .env.local on VPS.`,
        created_at: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `Account creation request submitted for ${platform.name}! Admin will provide credentials if API credentials are not yet configured.`,
        orderNo: tx.order_no,
        platformName: tx.platform_name,
        status: 'Pending',
      });
    }

    // 7. Default flow for manual platforms (Original Juwa, Orion Star, Panda Master, etc.)
    const tx = await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Register',
      platform_name: platform.name,
      game_account: '',
      game_username: '',
      game_password: '',
      amount: 0,
      status: 'Pending',
      api_dispatch_status: 'Manual',
      wallet_balance_before: user.wallet_balance || 0,
      wallet_balance_after: user.wallet_balance || 0,
      admin_notes: 'New player game account registration requested',
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Account creation request for ${platform.name} submitted! Admin will create your game account and provide credentials.`,
      orderNo: tx.order_no,
      platformName: tx.platform_name,
      status: 'Pending',
    });
  } catch (error) {
    console.error('game registration request error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
