import { NextResponse } from 'next/server';
import { connectToDatabase, User, WithdrawalRequest } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

function generateOrderNo(prefix = 'WTH') {
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
    const { paymentMethod, paymentInfo, amount } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Please enter a valid withdrawal amount' }, { status: 400 });
    }

    if (!paymentInfo || paymentInfo.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Payout account details (e.g. account tag, email or phone) are required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.wallet_balance < parsedAmount) {
      return NextResponse.json({
        success: false,
        message: `Insufficient balance. Available: $${Number(user.wallet_balance).toFixed(2)}, Requested: $${parsedAmount.toFixed(2)}`,
      }, { status: 400 });
    }

    // Zero handling fee as per requirements
    const serviceFee = 0.00;
    const receivedAmount = parsedAmount;
    const balanceBefore = user.wallet_balance;
    const balanceAfter = parseFloat((balanceBefore - parsedAmount).toFixed(2));

    const orderNo = generateOrderNo('WTH');

    // Deduct balance from user
    user.wallet_balance = balanceAfter;
    await user.save();

    // Create withdrawal request in MongoDB
    const withdrawal = await WithdrawalRequest.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      payment_method: paymentMethod || 'Cash App',
      payment_info: paymentInfo.trim(),
      amount: parsedAmount,
      service_fee: serviceFee,
      received_amount: receivedAmount,
      status: 'Pending',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Management will verify the withdraw and if eligible it will be processed.',
      orderNo: withdrawal.order_no,
      amount: parsedAmount,
      serviceFee,
      receivedAmount,
      newBalance: balanceAfter,
    });
  } catch (error) {
    console.error('[API Withdrawal Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
