import { NextResponse } from 'next/server';
import { connectToDatabase, DepositRequest, User, ChromeNotification } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * TapTapUp Webhook Endpoint
 * Receives payment.completed events from TapTapUp servers
 */
export async function POST(request) {
  try {
    const rawHeaders = Object.fromEntries(request.headers.entries());
    const eventHeader = rawHeaders['x-taptapup-event'] || '';
    const merchantRefHeader = rawHeaders['x-merchant-reference'] || '';

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('[TapTapUp Webhook Received]', {
      eventHeader,
      merchantRefHeader,
      body,
    });

    const merchantReference = body.merchant_reference || merchantRefHeader;
    const status = (body.status || '').toLowerCase();
    const event = body.event || eventHeader;
    const orderId = body.order_id || body.order_number || '';

    if (!merchantReference) {
      return NextResponse.json({ success: false, message: 'Missing merchant_reference' }, { status: 400 });
    }

    await connectToDatabase();

    // Look up deposit record by order_no (merchant reference)
    const deposit = await DepositRequest.findOne({ order_no: merchantReference });
    if (!deposit) {
      console.warn(`[TapTapUp Webhook] No matching deposit found for order_no: ${merchantReference}`);
      return NextResponse.json({ success: false, message: 'Deposit order not found' }, { status: 404 });
    }

    // Check if event is completed
    if (status === 'completed' || event === 'payment.completed') {
      if (deposit.status !== 'Approved') {
        const user = await User.findById(deposit.user_id) || await User.findOne({ username: deposit.username });
        if (user) {
          const balanceBefore = user.wallet_balance || 0;
          const balanceAfter = parseFloat((balanceBefore + deposit.received_amount).toFixed(2));

          user.wallet_balance = balanceAfter;
          await user.save();

          deposit.status = 'Approved';
          deposit.wallet_balance_before = balanceBefore;
          deposit.wallet_balance_after = balanceAfter;
          deposit.gateway_order_id = String(orderId);
          deposit.processed_at = new Date();
          await deposit.save();

          // Create notification for user
          await ChromeNotification.create({
            user_id: user._id.toString(),
            title: 'TapTapUp Deposit Completed! 💰',
            message: `Your payment of $${deposit.received_amount.toFixed(2)} via TapTapUp (Order #${orderId || deposit.order_no}) has been credited!`,
          });

          console.log(`[TapTapUp Webhook] Successfully approved deposit ${deposit.order_no} for user ${user.username}, new balance: $${balanceAfter}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and balance credited successfully',
        order_no: deposit.order_no,
        status: 'Approved',
      }, { status: 200 });
    }

    // If other status (e.g. pending / processing)
    if (status) {
      deposit.status = status.charAt(0).toUpperCase() + status.slice(1);
      if (orderId) deposit.gateway_order_id = String(orderId);
      await deposit.save();
    }

    return NextResponse.json({ success: true, message: 'Webhook acknowledged' }, { status: 200 });
  } catch (error) {
    console.error('[TapTapUp Webhook Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
