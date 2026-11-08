import { NextResponse } from 'next/server';
import { connectToDatabase, User, UserGameAccount } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { isFastApiPlatform, fastApiGetBalance } from '@/lib/fastapi';
import { isFireKirinPlatform, fireKirinGetBalance } from '@/lib/firekirin';
import { isJuwa2Platform, juwa2GetUserBalance } from '@/lib/juwa2';
import { isAgentVaultPlatform, agentVaultGetScore } from '@/lib/agentvault';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { platformName } = body;

    if (!platformName) {
      return NextResponse.json({ success: false, message: 'Platform name is required' }, { status: 400 });
    }

    const isFK = isFireKirinPlatform(platformName);
    const isJ2 = isJuwa2Platform(platformName);
    const isFast = isFastApiPlatform(platformName);
    const isAV = isAgentVaultPlatform(platformName);

    if (!isFast && !isFK && !isJ2 && !isAV) {
      return NextResponse.json({
        success: false,
        message: `${platformName} does not support live API balance check.`,
      }, { status: 400 });
    }

    const account = await UserGameAccount.findOne({
      user_id: session.id.toString(),
      $or: [
        { platform_name: platformName },
        { platform_name: new RegExp(platformName, 'i') },
      ],
    });

    if (!account || !account.in_game_account_id) {
      return NextResponse.json({
        success: false,
        message: `No active account found for ${platformName}`,
      }, { status: 404 });
    }

    const targetAccount = account.in_game_account_id;

    if (isAV) {
      const res = await agentVaultGetScore({
        platformName,
        playerId: targetAccount,
      });

      if (res.success) {
        return NextResponse.json({
          success: true,
          balance: res.balance,
          platformName,
          account: account.game_username || targetAccount,
          isInGame: res.isInGame,
        });
      }

      return NextResponse.json({
        success: false,
        code: res.code,
        message: res.message || 'Failed to fetch in-game balance.',
      }, { status: 400 });
    }

    if (isJ2) {
      const res = await juwa2GetUserBalance({
        userId: targetAccount,
      });

      if (res.success) {
        return NextResponse.json({
          success: true,
          balance: res.balance,
          platformName,
          account: account.game_username || targetAccount,
        });
      }

      return NextResponse.json({
        success: false,
        code: res.code,
        message: res.message || 'Failed to fetch Juwa 2.0 in-game balance.',
      }, { status: 400 });
    }

    if (isFK) {
      const res = await fireKirinGetBalance({
        account: targetAccount,
        password: account.game_password,
      });

      if (res.success) {
        return NextResponse.json({
          success: true,
          balance: res.balance,
          platformName,
          account: targetAccount,
          webLoginUrl: res.webLoginUrl || null,
        });
      }

      return NextResponse.json({
        success: false,
        code: res.code,
        message: res.message || 'Failed to fetch Fire Kirin in-game balance.',
      }, { status: 400 });
    }

    const res = await fastApiGetBalance({
      platformName,
      account: targetAccount,
    });

    if (res.success) {
      return NextResponse.json({
        success: true,
        balance: res.balance,
        platformName,
        account: targetAccount,
      });
    }

    return NextResponse.json({
      success: false,
      code: res.code,
      message: res.message || 'Failed to fetch in-game balance.',
    }, { status: 400 });
  } catch (error) {
    console.error('get game balance error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
