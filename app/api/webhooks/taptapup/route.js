import { NextResponse } from 'next/server';
import { connectToDatabase, DepositRequest, User, ChromeNotification } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Healthcheck / Verification for Revsol gateway
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'active',
    message: 'Revsol / TapTapUp Webhook endpoint is healthy and ready to receive events.',
    endpoint: 'https://app.tierlockplay.com/api/webhooks/taptapup',
    timestamp: new Date().toISOString(),
  });
}

/**
 * TapTapUp / Revsol Webhook Endpoint
 * Receives payment.completed events from gateway servers
 */
export async function POST(request) {
  try {
    const rawHeaders = Object.fromEntries(request.headers.entries());
    const eventHeader = rawHeaders['x-taptapup-event'] || rawHeaders['x-revsol-event'] || '';
    const merchantRefHeader = rawHeaders['x-merchant-reference'] || rawHeaders['x-order-no'] || '';

    let body = {};
    const contentType = request.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('form')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        const text = await request.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = Object.fromEntries(new URLSearchParams(text).entries());
        }
      }
    } catch (e) {
      console.warn('[Revsol Webhook Body Parse Warning]', e.message);
    }

    console.log('[Revsol / TapTapUp Webhook Received]', {
      eventHeader,
      merchantRefHeader,
      body,
    });

    const merchantReference =
      body.merchant_reference ||
      body.merchantReference ||
      body.merchant_ref ||
      body.order_no ||
      body.orderNo ||
      body.reference ||
      merchantRefHeader;

    const rawStatus = (body.status || body.payment_status || body.order_status || '').toLowerCase();
    const event = (body.event || body.event_type || eventHeader || '').toLowerCase();
    const orderId = body.order_id || body.order_number || body.transaction_id || '';

    if (!merchantReference) {
      return NextResponse.json({ success: false, message: 'Missing merchant_reference parameter' }, { status: 400 });
    }

    await connectToDatabase();

    // Look up deposit record by order_no (merchant reference)
    const deposit = await DepositRequest.findOne({ order_no: String(merchantReference) });
    if (!deposit) {
      console.warn(`[Revsol Webhook] No matching deposit found for order_no: ${merchantReference}`);
      return NextResponse.json({ success: false, message: 'Deposit order not found' }, { status: 404 });
    }

    // Check if event is completed / paid / approved
    const isCompleted =
      rawStatus === 'completed' ||
      rawStatus === 'paid' ||
      rawStatus === 'success' ||
      rawStatus === 'approved' ||
      event === 'payment.completed' ||
      event === 'payment.success';

    if (isCompleted) {
      if (deposit.status !== 'Approved') {
        const user = (await User.findById(deposit.user_id)) || (await User.findOne({ username: deposit.username }));
        if (user) {
          const balanceBefore = user.wallet_balance || 0;
          const balanceAfter = parseFloat((balanceBefore + deposit.received_amount).toFixed(2));

          user.wallet_balance = balanceAfter;
          await user.save();

          deposit.status = 'Approved';
          deposit.wallet_balance_before = balanceBefore;
          deposit.wallet_balance_after = balanceAfter;
          if (orderId) deposit.gateway_order_id = String(orderId);
          deposit.processed_at = new Date();
          await deposit.save();

          // Create notification for user
          await ChromeNotification.create({
            user_id: user._id.toString(),
            title: 'Revsol Deposit Completed! 💰',
            message: `Your payment of $${deposit.received_amount.toFixed(2)} via Revsol (Order #${orderId || deposit.order_no}) has been credited!`,
          });

          console.log(`[Revsol Webhook] Successfully approved deposit ${deposit.order_no} for user ${user.username}, new balance: $${balanceAfter}`);
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
    if (rawStatus) {
      deposit.status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      if (orderId) deposit.gateway_order_id = String(orderId);
      await deposit.save();
    }

    return NextResponse.json({ success: true, message: 'Webhook acknowledged' }, { status: 200 });
  } catch (error) {
    console.error('[Revsol Webhook Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
