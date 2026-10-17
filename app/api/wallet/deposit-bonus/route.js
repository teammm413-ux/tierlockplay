import { NextResponse } from 'next/server';
import { connectToDatabase, DepositBonusConfig, DepositRequest, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    await connectToDatabase();

    let config = await DepositBonusConfig.findOne();
    if (!config) {
      config = {
        first_deposit_bonus_percent: 300,
        regular_deposit_bonus_percent: 50,
        is_active: true
      };
    }

    let isFirstDeposit = true;
    let username = '';

    if (session && session.id) {
      const user = await User.findById(session.id);
      if (user) {
        username = user.username;
        const approvedCount = await DepositRequest.countDocuments({
          user_id: user._id.toString(),
          status: 'Approved'
        });
        isFirstDeposit = approvedCount === 0;
      }
    }

    const appliedBonusPercent = isFirstDeposit
      ? (config.first_deposit_bonus_percent ?? 300)
      : (config.regular_deposit_bonus_percent ?? 50);

    const bonusTitle = isFirstDeposit
      ? `First Deposit Bonus (+${appliedBonusPercent}%)`
      : `Reload Deposit Bonus (+${appliedBonusPercent}%)`;

    return NextResponse.json({
      success: true,
      is_first_deposit: isFirstDeposit,
      applied_bonus_percent: appliedBonusPercent,
      bonus_title: bonusTitle,
      first_deposit_bonus_percent: config.first_deposit_bonus_percent ?? 300,
      regular_deposit_bonus_percent: config.regular_deposit_bonus_percent ?? 50,
      is_active: config.is_active ?? true
    });
  } catch (error) {
    console.error('[Get Player Deposit Bonus Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
