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
    const {
      paymentMethod,
      paymentInfo,
      user_tag_name,
      userTagName,
      game_screenshot,
      gameScreenshot,
      qr_screenshot,
      qrScreenshot,
      amount
    } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Please enter a valid withdrawal amount' }, { status: 400 });
    }

    const finalTagName = (user_tag_name || userTagName || paymentInfo || '').trim();
    if (!finalTagName) {
      return NextResponse.json({ success: false, message: 'Please enter your payout tag name / handle' }, { status: 400 });
    }

    const finalGameScreenshot = (game_screenshot || gameScreenshot || '').trim();
    if (!finalGameScreenshot) {
      return NextResponse.json({ success: false, message: 'Game balance / win screenshot is required' }, { status: 400 });
    }

    const finalQrScreenshot = (qr_screenshot || qrScreenshot || '').trim();
    if (!finalQrScreenshot) {
      return NextResponse.json({ success: false, message: 'Your payout QR code or tag screenshot is required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Zero handling fee as per requirements
    const serviceFee = 0.00;
    const receivedAmount = parsedAmount;
    const currentBalance = user.wallet_balance || 0;

    const orderNo = generateOrderNo('WTH');

    // Create withdrawal request in MongoDB (wallet balance is NOT deducted because withdrawal is from game winnings)
    const withdrawal = await WithdrawalRequest.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      payment_method: paymentMethod || 'Cash App',
      payment_info: finalTagName,
      user_tag_name: finalTagName,
      game_screenshot: finalGameScreenshot,
      qr_screenshot: finalQrScreenshot,
      amount: parsedAmount,
      service_fee: serviceFee,
      received_amount: receivedAmount,
      status: 'Pending',
      wallet_balance_before: currentBalance,
      wallet_balance_after: currentBalance,
      admin_notes: 'Awaiting admin verification of game winnings & payout details',
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted! Management will verify your game screenshot & QR tag to process your payout.',
      orderNo: withdrawal.order_no,
      amount: parsedAmount,
      serviceFee,
      receivedAmount,
      userTagName: finalTagName,
      gameScreenshot: finalGameScreenshot,
      qrScreenshot: finalQrScreenshot,
    });
  } catch (error) {
    console.error('[API Withdrawal Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
