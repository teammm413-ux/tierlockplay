import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction, UserGameAccount, GamePlatform } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { isFastApiPlatform, fastApiWithdrawal, fastApiGetBalance } from '@/lib/fastapi';
import { isFireKirinPlatform, fireKirinRedeem } from '@/lib/firekirin';
import { isJuwa2Platform, juwa2Withdraw } from '@/lib/juwa2';
import { isAgentVaultPlatform, agentVaultWithdraw } from '@/lib/agentvault';

function generateOrderNo(prefix = 'GWD') {
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
    const { platformName, gameAccount, amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return NextResponse.json({ success: false, message: 'Minimum game cashout amount is $1.00' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const orderNo = generateOrderNo('GWD');

    // 1. FastApi Automated Game Redemption
    if (isFastApiPlatform(platformName)) {
      const existingAccount = await UserGameAccount.findOne({
        user_id: user._id.toString(),
        $or: [
          { platform_name: platformName },
          { platform_name: new RegExp(platformName, 'i') },
        ],
      });

      const targetAccount = existingAccount?.in_game_account_id || gameAccount || existingAccount?.game_username;
      if (!targetAccount) {
        return NextResponse.json({
          success: false,
          message: `No active game account found for ${platformName}. Please create an account first.`,
        }, { status: 400 });
      }

      console.log(`[FastApi Withdraw] Cashout request: $${parsedAmount} from ${platformName} account ${targetAccount}`);

      const apiRes = await fastApiWithdrawal({
        platformName,
        account: targetAccount,
        amount: parsedAmount,
      });

      if (apiRes.success) {
        // Player successfully withdrew credits from the game, now add to website wallet
        const balanceBefore = user.wallet_balance || 0;
        const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));
        user.wallet_balance = balanceAfter;
        await user.save();

        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Withdrawal',
          platform_name: platformName,
          game_account: targetAccount,
          amount: parsedAmount,
          status: 'Approved',
          api_dispatch_status: 'FastApi',
          in_game_tx_id: String(apiRes.orderNum || ''),
          wallet_balance_before: balanceBefore,
          wallet_balance_after: balanceAfter,
          admin_notes: `Cashed out automatically via FastApi (Order #${apiRes.orderNum || 'N/A'})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Successfully redeemed $${parsedAmount.toFixed(2)} from ${platformName} to your Wallet!`,
          orderNo,
          amount: parsedAmount,
          newBalance: balanceAfter,
          inGameOrderNum: apiRes.orderNum,
        });
      } else {
        // FastApi returned error (e.g. Insufficient balance, in-game active round, IP whitelist)
        console.warn(`[FastApi Withdraw Error] ${apiRes.message} (Code: ${apiRes.code})`);

        return NextResponse.json({
          success: false,
          code: apiRes.code,
          message: apiRes.message || 'Game withdrawal failed on server.',
        }, { status: 400 });
      }
    }

    // 2. Fire Kirin Automated Game Redemption (Redeem)
    if (isFireKirinPlatform(platformName)) {
      const existingAccount = await UserGameAccount.findOne({
        user_id: user._id.toString(),
        $or: [
          { platform_name: platformName },
          { platform_name: new RegExp(platformName, 'i') },
        ],
      });

      const targetAccount = existingAccount?.in_game_account_id || gameAccount || existingAccount?.game_username;
      if (!targetAccount) {
        return NextResponse.json({
          success: false,
          message: `No active game account found for ${platformName}. Please create an account first.`,
        }, { status: 400 });
      }

      console.log(`[FireKirin Withdraw] Cashout request: $${parsedAmount} from ${platformName} account ${targetAccount}`);

      const apiRes = await fireKirinRedeem({
        account: targetAccount,
        amount: parsedAmount,
      });

      if (apiRes.success) {
        // Player successfully withdrew credits from Fire Kirin, add to website wallet
        const balanceBefore = user.wallet_balance || 0;
        const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));
        user.wallet_balance = balanceAfter;
        await user.save();

        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Withdrawal',
          platform_name: platformName,
          game_account: targetAccount,
          amount: parsedAmount,
          status: 'Approved',
          api_dispatch_status: 'FireKirin',
          in_game_tx_id: 'FK_REDEEM_SUCCESS',
          wallet_balance_before: balanceBefore,
          wallet_balance_after: balanceAfter,
          admin_notes: `Cashed out automatically via Fire Kirin Game API (${platformName})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Successfully redeemed $${parsedAmount.toFixed(2)} from Fire Kirin to your Wallet!`,
          orderNo,
          amount: parsedAmount,
          newBalance: balanceAfter,
        });
      } else {
        console.warn(`[FireKirin Withdraw Error] ${apiRes.message} (Code: ${apiRes.code})`);

        return NextResponse.json({
          success: false,
          code: apiRes.code,
          message: apiRes.message || 'Fire Kirin withdrawal failed on server.',
        }, { status: 400 });
      }
    }

    // 3. Juwa 2.0 Automated Game Redemption (Withdraw)
    if (isJuwa2Platform(platformName)) {
      const existingAccount = await UserGameAccount.findOne({
        user_id: user._id.toString(),
        $or: [
          { platform_name: platformName },
          { platform_name: new RegExp(platformName, 'i') },
        ],
      });

      const targetUserId = existingAccount?.in_game_account_id || gameAccount;
      if (!targetUserId) {
        return NextResponse.json({
          success: false,
          message: `No active game account found for ${platformName}. Please create an account first.`,
        }, { status: 400 });
      }

      console.log(`[Juwa2.0 Withdraw] Cashout request: $${parsedAmount} from ${platformName} user_id: ${targetUserId}`);

      const apiRes = await juwa2Withdraw({
        userId: targetUserId,
        amount: parsedAmount,
        orderId: orderNo,
      });

      if (apiRes.success) {
        // Player successfully withdrew credits from Juwa 2.0, add to website wallet
        const balanceBefore = user.wallet_balance || 0;
        const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));
        user.wallet_balance = balanceAfter;
        await user.save();

        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Withdrawal',
          platform_name: platformName,
          game_account: existingAccount?.game_username || targetUserId,
          amount: parsedAmount,
          status: 'Approved',
          api_dispatch_status: 'Juwa2',
          in_game_tx_id: String(apiRes.transactionId || apiRes.wdwOrderId || ''),
          wallet_balance_before: balanceBefore,
          wallet_balance_after: balanceAfter,
          admin_notes: `Cashed out automatically via Juwa 2.0 API (${platformName}, Order #${apiRes.transactionId || 'N/A'})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Successfully redeemed $${parsedAmount.toFixed(2)} from Juwa 2.0 to your Wallet!`,
          orderNo,
          amount: parsedAmount,
          newBalance: balanceAfter,
        });
      } else {
        console.warn(`[Juwa2.0 Withdraw Error] ${apiRes.message} (Code: ${apiRes.code})`);

        return NextResponse.json({
          success: false,
          code: apiRes.code,
          message: apiRes.message || 'Juwa 2.0 withdrawal failed on server.',
        }, { status: 400 });
      }
    }

    // 4. Agent Vault Automated Game Redemption
    if (isAgentVaultPlatform(platformName)) {
      const existingAccount = await UserGameAccount.findOne({
        user_id: user._id.toString(),
        $or: [
          { platform_name: platformName },
          { platform_name: new RegExp(platformName, 'i') },
        ],
      });

      const playerId = existingAccount?.in_game_account_id || gameAccount;
      if (!playerId) {
        return NextResponse.json({
          success: false,
          message: `No active game account found for ${platformName}. Please create an account first.`,
        }, { status: 400 });
      }

      const apiRes = await agentVaultWithdraw({
        platformName,
        playerId,
        amount: parsedAmount,
        remark: orderNo,
      });

      if (apiRes.success) {
        const balanceBefore = user.wallet_balance || 0;
        const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));
        user.wallet_balance = balanceAfter;
        await user.save();

        await GameTransaction.create({
          order_no: orderNo,
          user_id: user._id.toString(),
          username: user.username,
          type: 'Withdrawal',
          platform_name: platformName,
          game_account: existingAccount?.game_username || playerId,
          amount: parsedAmount,
          status: 'Approved',
          api_dispatch_status: 'AgentVault',
          in_game_tx_id: `AV_REDEEM_${playerId}`,
          wallet_balance_before: balanceBefore,
          wallet_balance_after: balanceAfter,
          admin_notes: `Cashed out via Agent Vault API (${platformName})`,
          created_at: new Date(),
        });

        return NextResponse.json({
          success: true,
          isAutoApproved: true,
          message: `Successfully redeemed $${parsedAmount.toFixed(2)} from ${platformName} to your Wallet!`,
          orderNo,
          amount: parsedAmount,
          newBalance: balanceAfter,
        });
      }

      return NextResponse.json({
        success: false,
        code: apiRes.code,
        message: apiRes.message || 'Game withdrawal failed. Exit active game rounds and try again.',
      }, { status: 400 });
    }

    // 5. Default flow for manual platforms
    const balanceBefore = user.wallet_balance || 0;
    const balanceAfter = parseFloat((balanceBefore + parsedAmount).toFixed(2));

    user.wallet_balance = balanceAfter;
    await user.save();

    await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Withdrawal',
      platform_name: platformName || 'Juwa',
      game_account: (gameAccount || '').trim(),
      amount: parsedAmount,
      status: 'Approved',
      api_dispatch_status: 'Manual',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed $${parsedAmount.toFixed(2)} from ${platformName} to your Wallet!`,
      orderNo,
      amount: parsedAmount,
      newBalance: balanceAfter,
    });
  } catch (error) {
    console.error('game withdraw error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
