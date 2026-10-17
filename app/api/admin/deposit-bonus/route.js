import { NextResponse } from 'next/server';
import { connectToDatabase, DepositBonusConfig } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    let config = await DepositBonusConfig.findOne();
    if (!config) {
      config = await DepositBonusConfig.create({
        first_deposit_bonus_percent: 300,
        regular_deposit_bonus_percent: 50,
        is_active: true,
        updated_at: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        first_deposit_bonus_percent: config.first_deposit_bonus_percent ?? 300,
        regular_deposit_bonus_percent: config.regular_deposit_bonus_percent ?? 50,
        is_active: config.is_active ?? true,
        updated_at: config.updated_at
      }
    });
  } catch (error) {
    console.error('[Admin Get Deposit Bonus Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { first_deposit_bonus_percent, regular_deposit_bonus_percent, is_active } = body;

    let config = await DepositBonusConfig.findOne();
    if (!config) {
      config = new DepositBonusConfig();
    }

    if (first_deposit_bonus_percent !== undefined) {
      config.first_deposit_bonus_percent = Math.max(0, parseFloat(first_deposit_bonus_percent) || 0);
    }
    if (regular_deposit_bonus_percent !== undefined) {
      config.regular_deposit_bonus_percent = Math.max(0, parseFloat(regular_deposit_bonus_percent) || 0);
    }
    if (is_active !== undefined) {
      config.is_active = Boolean(is_active);
    }
    config.updated_at = new Date();
    await config.save();

    return NextResponse.json({
      success: true,
      message: 'Deposit bonus configurations saved successfully!',
      config: {
        first_deposit_bonus_percent: config.first_deposit_bonus_percent,
        regular_deposit_bonus_percent: config.regular_deposit_bonus_percent,
        is_active: config.is_active
      }
    });
  } catch (error) {
    console.error('[Admin Save Deposit Bonus Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
