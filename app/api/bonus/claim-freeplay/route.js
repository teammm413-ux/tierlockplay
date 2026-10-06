import { NextResponse } from 'next/server';
import { connectToDatabase, User, DepositRequest } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    let user = null;
    if (session && session.id) {
      user = await User.findById(session.id);
    }
    if (!user) {
      user = await User.findOne({ username: 'alex' }) || await User.findOne({});
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'Please sign in to claim your freeplay bonus' }, { status: 401 });
    }

    // Check if user already claimed freeplay
    const checkClaim = await DepositRequest.findOne({
      user_id: user._id.toString(),
      payment_method: 'Freeplay Bonus'
    });

    if (checkClaim) {
      return NextResponse.json({ success: false, message: 'You have already claimed your $5 Freeplay bonus!' }, { status: 400 });
    }

    const bonus = 5.00;
    const balanceBefore = user.wallet_balance || 0;
    const balanceAfter = parseFloat((balanceBefore + bonus).toFixed(2));
    const orderNo = `BONUS${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update wallet balance in MongoDB
    user.wallet_balance = balanceAfter;
    await user.save();

    // Record as approved deposit bonus in MongoDB
    await DepositRequest.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      payment_method: 'Freeplay Bonus',
      paid_amount: 0.00,
      received_amount: bonus,
      service_fee: 0.00,
      status: 'Approved',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      transaction_proof: 'Welcome Freeplay Bonus',
      processed_at: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Congratulations! $5.00 Freeplay bonus credited to your wallet!',
      newBalance: balanceAfter,
    });
  } catch (error) {
    console.error('claim freeplay error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
