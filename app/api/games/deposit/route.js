import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

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
    const { platformName, gameAccount, amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return NextResponse.json({ success: false, message: 'Minimum game load amount is $1.00' }, { status: 400 });
    }

    if (!gameAccount || gameAccount.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'In-game account ID is required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.wallet_balance < parsedAmount) {
      return NextResponse.json({
        success: false,
        message: `Insufficient wallet balance. You have $${Number(user.wallet_balance).toFixed(2)}, requested $${parsedAmount.toFixed(2)}. Please deposit funds first.`,
      }, { status: 400 });
    }

    const balanceBefore = user.wallet_balance;
    const balanceAfter = parseFloat((balanceBefore - parsedAmount).toFixed(2));
    const orderNo = generateOrderNo('GDP');

    user.wallet_balance = balanceAfter;
    await user.save();

    await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Deposit',
      platform_name: platformName || 'Juwa',
      game_account: gameAccount.trim(),
      amount: parsedAmount,
      status: 'Approved',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully loaded $${parsedAmount.toFixed(2)} to ${platformName} (ID: ${gameAccount})!`,
      orderNo,
      amount: parsedAmount,
      newBalance: balanceAfter,
    });
  } catch (error) {
    console.error('game deposit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
