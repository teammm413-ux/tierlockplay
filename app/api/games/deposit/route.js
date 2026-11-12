import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction, UserGameAccount, GamePlatform } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { isFastApiPlatform, fastApiDeposit, fastApiCreatePlayer, generateGamePassword } from '@/lib/fastapi';
import { isFireKirinPlatform, fireKirinRecharge, fireKirinRegisterPlayer, sanitizeFireKirinAccount } from '@/lib/firekirin';
import { isJuwaExternalPlatform, juwaExternalRecharge, juwaExternalAddUser } from '@/lib/juwaExternal';
import { buildJuwaAccountName } from '@/lib/gameJuwaIntegration';

function generateOrderNo(prefix = 'GDP') {
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
    const { platformName, amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return NextResponse.json({ success: false, message: 'Minimum game load amount is $1.00' }, { status: 400 });
    }

    if (!platformName || !platformName.trim()) {
      return NextResponse.json({ success: false, message: 'Game platform name is required' }, { status: 400 });
    }

    // 1. Check if platform exists and is currently active
    const platform = await GamePlatform.findOne({
      $or: [
        { name: platformName.trim() },
        { slug: platformName.trim().toLowerCase().replace(/\s+/g, '-') },
      ],
    });

    if (!platform || platform.is_active === false) {
      return NextResponse.json({
        success: false,
        message: `Platform "${platformName}" is currently offline or unavailable. Please choose another game platform.`,
      }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 2. Check if player has enough wallet balance
    if (user.wallet_balance < parsedAmount) {
      return NextResponse.json({
        success: false,
        message: `Insufficient wallet balance. You have $${Number(user.wallet_balance).toFixed(2)}, requested $${parsedAmount.toFixed(2)}. Please add funds to your wallet first.`,
      }, { status: 400 });
    }

    // 3. Constraint: Check if user already has an active pending request in queue
    const existingPending = await GameTransaction.findOne({
      user_id: user._id.toString(),
      status: 'Pending',
    });

    if (existingPending) {
      return NextResponse.json({
        success: false,
        message: `Your game deposit request for ${existingPending.platform_name} ($${Number(existingPending.amount).toFixed(2)}) is currently pending review. You cannot submit another request until this request is processed. (Order #${existingPending.order_no})`,
      }, { status: 400 });
    }

    let existingAccount = await UserGameAccount.findOne({
      user_id: user._id.toString(),
      platform_name: platform.name,
    });

    const orderNo = generateOrderNo('GDP');

    // 4. FastApi Automated Coin Loading
    if (isFastApiPlatform(platform.name)) {
      // If user doesn't have an in-game account yet, auto-create one first!
      if (!existingAccount || !existingAccount.in_game_account_id) {
        const sanitizedUsername = (user.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const rawAccount = `${sanitizedUsername}${randomSuffix}`.slice(0, 16);
        const generatedPassword = generateGamePassword();

        console.log(`[FastApi Auto-Deposit] Auto-creating account for ${user.username} prior to deposit on ${platform.name}`);
        const createRes = await fastApiCreatePlayer({
          platformName: platform.name,
          account: rawAccount,
          password: generatedPassword,
        });

        if (createRes.success) {
          existingAccount = await UserGameAccount.findOneAndUpdate(
            { user_id: user._id.toString(), platform_name: platform.name },
            {
              user_id: user._id.toString(),
              username: user.username,
              platform_id: platform._id.toString(),
              platform_name: platform.name,
              in_game_account_id: rawAccount,
              game_username: createRes.fullAccount || rawAccount,
              game_password: generatedPassword,
              status: 'Active',
              updated_at: new Date(),
            },
            { upsert: true, new: true }
          );
        }
      }

      // If we have an active game account ID, execute FastApi instant deposit
      if (existingAccount && existingAccount.in_game_account_id) {
        const targetAccount = existingAccount.in_game_account_id;
        console.log(`[FastApi Deposit] Transferring $${parsedAmount} to account: ${targetAccount} on ${platform.name}`);

        const apiRes = await fastApiDeposit({
          platformName: platform.name,
          account: targetAccount,
          amount: parsedAmount,
        });

        if (apiRes.success) {
          // Deduct from player's website wallet
          const balanceBefore = user.wallet_balance;
          const balanceAfter = parseFloat((balanceBefore - parsedAmount).toFixed(2));
          user.wallet_balance = balanceAfter;
          await user.save();

          // Update total loaded credits
          existingAccount.total_loaded = parseFloat(((existingAccount.total_loaded || 0) + parsedAmount).toFixed(2));
          await existingAccount.save();

          // Record approved transaction
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount.game_username || targetAccount,
            game_username: existingAccount.game_username || targetAccount,
            game_password: existingAccount.game_password || '',
            amount: parsedAmount,
            status: 'Approved',
            api_dispatch_status: 'FastApi',
            in_game_tx_id: String(apiRes.orderNum || ''),
            wallet_balance_before: balanceBefore,
            wallet_balance_after: balanceAfter,
            admin_notes: `Loaded automatically via FastApi (Order #${apiRes.orderNum || 'N/A'})`,
            created_at: new Date(),
          });

          return NextResponse.json({
            success: true,
            isAutoApproved: true,
            message: `Deposit successful! $${parsedAmount.toFixed(2)} loaded directly into your ${platform.name} account!`,
            orderNo: tx.order_no,
            inGameOrderNum: apiRes.orderNum,
            amount: parsedAmount,
            newBalance: balanceAfter,
            status: 'Approved',
          });
        } else {
          console.warn(`[FastApi Deposit Error] ${apiRes.message} (Code: ${apiRes.code}). Queueing for admin.`);
          // Do not deduct balance if API call fails! Keep user's funds safe.
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount?.game_username || '',
            game_username: existingAccount?.game_username || '',
            game_password: existingAccount?.game_password || '',
            amount: parsedAmount,
            status: 'Pending',
            api_dispatch_status: 'Manual',
            failure_reason: apiRes.code === 403 ? 'IP Whitelist Required: ' + apiRes.message : apiRes.message,
            wallet_balance_before: user.wallet_balance,
            wallet_balance_after: user.wallet_balance,
            admin_notes: `FastApi deposit attempt failed: ${apiRes.message}. Fallback to manual admin review.`,
            created_at: new Date(),
          });

          const notice = apiRes.code === 403
            ? `Deposit request submitted! Note: Server IP whitelist in progress with game provider. Admin will credit your account shortly.`
            : `Deposit request submitted! Admin will credit your account shortly.`;

          return NextResponse.json({
            success: true,
            message: notice,
            orderNo: tx.order_no,
            amount: parsedAmount,
            status: 'Pending',
          });
        }
      }
    }

    // 5. Fire Kirin Automated Coin Loading (Recharge)
    if (isFireKirinPlatform(platform.name)) {
      // If user doesn't have an in-game account yet, auto-create one first!
      if (!existingAccount || !existingAccount.in_game_account_id) {
        const sanitizedUsername = (user.username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const rawAccount = sanitizeFireKirinAccount(`fk${sanitizedUsername}${randomSuffix}`);
        const generatedPassword = generateGamePassword();

        console.log(`[FireKirin Auto-Deposit] Auto-creating account for ${user.username} prior to deposit on ${platform.name}`);
        const createRes = await fireKirinRegisterPlayer({
          account: rawAccount,
          password: generatedPassword,
        });

        if (createRes.success) {
          existingAccount = await UserGameAccount.findOneAndUpdate(
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
        }
      }

      // If we have an active game account ID, execute Fire Kirin recharge
      if (existingAccount && existingAccount.in_game_account_id) {
        const targetAccount = existingAccount.in_game_account_id;
        console.log(`[FireKirin Deposit] Transferring $${parsedAmount} to account: ${targetAccount} on ${platform.name}`);

        const apiRes = await fireKirinRecharge({
          account: targetAccount,
          amount: parsedAmount,
        });

        if (apiRes.success) {
          // Deduct from player's website wallet
          const balanceBefore = user.wallet_balance;
          const balanceAfter = parseFloat((balanceBefore - parsedAmount).toFixed(2));
          user.wallet_balance = balanceAfter;
          await user.save();

          // Update total loaded credits
          existingAccount.total_loaded = parseFloat(((existingAccount.total_loaded || 0) + parsedAmount).toFixed(2));
          await existingAccount.save();

          // Record approved transaction
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount.game_username || targetAccount,
            game_username: existingAccount.game_username || targetAccount,
            game_password: existingAccount.game_password || '',
            amount: parsedAmount,
            status: 'Approved',
            api_dispatch_status: 'FireKirin',
            in_game_tx_id: 'FK_RECHARGE_SUCCESS',
            wallet_balance_before: balanceBefore,
            wallet_balance_after: balanceAfter,
            admin_notes: `Loaded automatically via Fire Kirin Game API (${platform.name})`,
            created_at: new Date(),
          });

          return NextResponse.json({
            success: true,
            isAutoApproved: true,
            message: `Deposit successful! $${parsedAmount.toFixed(2)} loaded directly into your Fire Kirin account!`,
            orderNo: tx.order_no,
            amount: parsedAmount,
            newBalance: balanceAfter,
            status: 'Approved',
          });
        } else {
          console.warn(`[FireKirin Deposit Error] ${apiRes.message} (Code: ${apiRes.code}). Queueing for admin.`);
          const isWhitelistOrConfig = apiRes.code === 403 || apiRes.code === -1 || apiRes.code === -2;
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount?.game_username || '',
            game_username: existingAccount?.game_username || '',
            game_password: existingAccount?.game_password || '',
            amount: parsedAmount,
            status: 'Pending',
            api_dispatch_status: 'Manual',
            failure_reason: apiRes.message,
            wallet_balance_before: user.wallet_balance,
            wallet_balance_after: user.wallet_balance,
            admin_notes: `Fire Kirin deposit attempt logged: ${apiRes.message}. Fallback to manual admin review.`,
            created_at: new Date(),
          });

          const notice = isWhitelistOrConfig
            ? `Deposit request submitted! Note: Server IP whitelist in progress on 179.236.244.219 with game provider. Admin will credit your account shortly.`
            : `Deposit request submitted! Admin will credit your account shortly.`;

          return NextResponse.json({
            success: true,
            message: notice,
            orderNo: tx.order_no,
            amount: parsedAmount,
            status: 'Pending',
          });
        }
      }
    }

    // 6. Juwa-family API (Juwa, Juwa2.0, Vegas Sweeps, Game Vault)
    if (isJuwaExternalPlatform(platform.name)) {
      if (!existingAccount || !existingAccount.in_game_account_id) {
        const rawAccount = buildJuwaAccountName(user.username, platform.name);
        const generatedPassword = generateGamePassword();

        const createRes = await juwaExternalAddUser({
          platformName: platform.name,
          account: rawAccount,
          password: generatedPassword,
        });

        if (createRes.success) {
          existingAccount = await UserGameAccount.findOneAndUpdate(
            { user_id: user._id.toString(), platform_name: platform.name },
            {
              user_id: user._id.toString(),
              username: user.username,
              platform_id: platform._id.toString(),
              platform_name: platform.name,
              in_game_account_id: createRes.userId,
              game_username: rawAccount,
              game_password: generatedPassword,
              status: 'Active',
              updated_at: new Date(),
            },
            { upsert: true, new: true }
          );
        }
      }

      // If we have an active game user_id, execute Juwa 2.0 recharge
      if (existingAccount && existingAccount.in_game_account_id) {
        const targetUserId = existingAccount.in_game_account_id;
        console.log(`[Juwa2.0 Deposit] Transferring $${parsedAmount} to user_id: ${targetUserId} on ${platform.name}`);

        const apiRes = await juwaExternalRecharge({
          platformName: platform.name,
          userId: targetUserId,
          amount: parsedAmount,
          orderId: orderNo,
        });

        if (apiRes.success) {
          // Deduct from player's website wallet
          const balanceBefore = user.wallet_balance;
          const balanceAfter = parseFloat((balanceBefore - parsedAmount).toFixed(2));
          user.wallet_balance = balanceAfter;
          await user.save();

          // Update total loaded credits
          existingAccount.total_loaded = parseFloat(((existingAccount.total_loaded || 0) + parsedAmount).toFixed(2));
          await existingAccount.save();

          // Record approved transaction
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount.game_username || targetUserId,
            game_username: existingAccount.game_username || targetUserId,
            game_password: existingAccount.game_password || '',
            amount: parsedAmount,
            status: 'Approved',
            api_dispatch_status: 'JuwaAPI',
            in_game_tx_id: String(apiRes.transactionId || apiRes.payOrderId || ''),
            wallet_balance_before: balanceBefore,
            wallet_balance_after: balanceAfter,
            admin_notes: `Loaded via Juwa External API (${platform.name}, Order #${apiRes.transactionId || 'N/A'})`,
            created_at: new Date(),
          });

          return NextResponse.json({
            success: true,
            isAutoApproved: true,
            message: `Deposit successful! $${parsedAmount.toFixed(2)} loaded directly into your ${platform.name} account!`,
            orderNo: tx.order_no,
            amount: parsedAmount,
            newBalance: balanceAfter,
            status: 'Approved',
          });
        } else {
          console.warn(`[Juwa API Deposit Error] ${apiRes.message} (Code: ${apiRes.code}). Queueing for admin.`);
          const isWhitelist = apiRes.code === 5 || apiRes.code === -1;
          const tx = await GameTransaction.create({
            order_no: orderNo,
            user_id: user._id.toString(),
            username: user.username,
            type: 'Deposit',
            platform_name: platform.name,
            game_account: existingAccount?.game_username || '',
            game_username: existingAccount?.game_username || '',
            game_password: existingAccount?.game_password || '',
            amount: parsedAmount,
            status: 'Pending',
            api_dispatch_status: 'Manual',
            failure_reason: apiRes.message,
            wallet_balance_before: user.wallet_balance,
            wallet_balance_after: user.wallet_balance,
            admin_notes: `Juwa API deposit failed: ${apiRes.message}`,
            created_at: new Date(),
          });

          const notice = isWhitelist
            ? `Deposit request submitted! Note: Server IP whitelist in progress on 179.236.244.219 with game provider. Admin will credit your account shortly.`
            : `Deposit request submitted! Admin will credit your account shortly.`;

          return NextResponse.json({
            success: true,
            message: notice,
            orderNo: tx.order_no,
            amount: parsedAmount,
            status: 'Pending',
          });
        }
      }
    }

    // 7. Manual platforms
    const tx = await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Deposit',
      platform_name: platform.name,
      game_account: existingAccount?.game_username || '',
      game_username: existingAccount?.game_username || '',
      game_password: existingAccount?.game_password || '',
      amount: parsedAmount,
      status: 'Pending',
      api_dispatch_status: 'Manual',
      wallet_balance_before: user.wallet_balance,
      wallet_balance_after: user.wallet_balance,
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Deposit request for $${parsedAmount.toFixed(2)} to ${platform.name} submitted! Admin will verify and load credits shortly.`,
      orderNo,
      amount: parsedAmount,
      status: 'Pending',
      hasExistingAccount: !!existingAccount,
    });
  } catch (error) {
    console.error('game deposit request error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
