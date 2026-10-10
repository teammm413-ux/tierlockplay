import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction, UserGameAccount } from '@/lib/mongodb';
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
    const { platformName, amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      return NextResponse.json({ success: false, message: 'Minimum game load amount is $1.00' }, { status: 400 });
    }

    if (!platformName || !platformName.trim()) {
      return NextResponse.json({ success: false, message: 'Game platform name is required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Check if player has enough wallet balance
    if (user.wallet_balance < parsedAmount) {
      return NextResponse.json({
        success: false,
        message: `Insufficient wallet balance. You have $${Number(user.wallet_balance).toFixed(2)}, requested $${parsedAmount.toFixed(2)}. Please add funds to your wallet first.`,
      }, { status: 400 });
    }

    // Check if user already has existing credentials for this platform
    const existingAccount = await UserGameAccount.findOne({
      user_id: user._id.toString(),
      platform_name: platformName.trim()
    });

    const orderNo = generateOrderNo('GDP');

    // Create a pending request for Admin to review, create game credentials, and load coins
    const tx = await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Deposit',
      platform_name: platformName.trim(),
      game_account: existingAccount?.game_username || '',
      game_username: existingAccount?.game_username || '',
      game_password: existingAccount?.game_password || '',
      amount: parsedAmount,
      status: 'Pending', // Pending admin approval and coin load
      api_dispatch_status: 'Manual',
      wallet_balance_before: user.wallet_balance,
      wallet_balance_after: user.wallet_balance,
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Deposit request for $${parsedAmount.toFixed(2)} to ${platformName} submitted! Admin will set up your game account credentials and load credits shortly.`,
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
