import { NextResponse } from 'next/server';
import { connectToDatabase, User, DepositRequest } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { initiateTapTapUpPayment } from '@/lib/taptapup';

function generateOrderNo() {
  // 12-digit format like in screenshot: 141865521058
  const rand = Math.floor(100000000000 + Math.random() * 900000000000);
  return String(rand);
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { paymentMethod, paidAmount, receivedAmount, senderCashtag } = body;

    const paid = parseFloat(paidAmount);
    const received = parseFloat(receivedAmount || paidAmount);

    if (isNaN(paid) || paid <= 0) {
      return NextResponse.json({ success: false, message: 'Valid deposit amount required' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const orderNo = generateOrderNo();
    const balanceBefore = user.wallet_balance || 0;
    const balanceAfter = balanceBefore;

    // Call TapTapUp payment gateway to get secure hosted checkout redirect URL
    // TapTapUp requires integer whole numbers (e.g. 20, 25, 50) and min $20 for sandbox
    let gatewayData = null;
    let gatewayError = null;

    try {
      const gatewayAmount = Math.max(20, Math.round(paid));
      gatewayData = await initiateTapTapUpPayment({
        amount: gatewayAmount,
        email: user.email || 'customer@example.com',
        merchantReference: orderNo,
      });
    } catch (err) {
      console.warn('[TapTapUp Gateway Warning]', err.message);
      gatewayError = err.message;
    }

    const deposit = await DepositRequest.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      payment_method: paymentMethod || 'Cash App',
      paid_amount: paid,
      received_amount: received,
      service_fee: 0.00,
      status: gatewayData && gatewayData.success ? 'Pending' : 'Created',
      wallet_balance_before: balanceBefore,
      wallet_balance_after: balanceAfter,
      transaction_proof: senderCashtag || '',
      payment_gateway: gatewayData && gatewayData.success ? 'TapTapUp' : 'Manual',
      payment_token: gatewayData?.token || '',
      redirect_url: gatewayData?.redirectUrl || '',
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: gatewayData && gatewayData.success
        ? 'TapTapUp payment checkout initialized successfully!'
        : 'Order created successfully! Please complete payment to credit your balance.',
      orderNo: deposit.order_no,
      paidAmount: deposit.paid_amount,
      receivedAmount: deposit.received_amount,
      status: deposit.status,
      redirectUrl: gatewayData?.redirectUrl || null,
      token: gatewayData?.token || null,
      paymentGateway: deposit.payment_gateway,
      gatewayError: gatewayError || null,
    });
  } catch (error) {
    console.error('[API Deposit Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

