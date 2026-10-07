import { NextResponse } from 'next/server';
import { connectToDatabase, DepositRequest, User, ChromeNotification } from '@/lib/mongodb';
import { checkTapTapUpStatus, verifyTapTapUpToken } from '@/lib/taptapup';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { orderNo, token } = body;

    let deposit = null;
    if (orderNo) {
      deposit = await DepositRequest.findOne({ order_no: orderNo, user_id: session.id });
    } else if (token) {
      deposit = await DepositRequest.findOne({ payment_token: token, user_id: session.id });
    }

    if (!deposit) {
      return NextResponse.json({ success: false, message: 'Deposit order not found' }, { status: 404 });
    }

    // If already approved, return success
    if (deposit.status === 'Approved') {
      const user = await User.findById(session.id);
      return NextResponse.json({
        success: true,
        status: 'Approved',
        message: 'Deposit already approved and credited!',
        walletBalance: user ? user.wallet_balance : 0,
        deposit,
      });
    }

    if (deposit.status === 'Expired') {
      return NextResponse.json({
        success: false,
        status: 'Expired',
        message: 'This deposit order has expired (30-minute limit exceeded). Please generate a new deposit order.',
        deposit,
      });
    }

    const isPastExpiry = deposit.expires_at
      ? new Date() > new Date(deposit.expires_at)
      : (Date.now() - new Date(deposit.created_at).getTime() > 30 * 60 * 1000);

    if (deposit.status === 'Created' && isPastExpiry) {
      deposit.status = 'Expired';
      deposit.processed_at = new Date();
      await deposit.save();
      return NextResponse.json({
        success: false,
        status: 'Expired',
        message: 'This deposit order has expired (30-minute limit exceeded). Please generate a new deposit order.',
        deposit,
      });
    }

    const checkToken = token || deposit.payment_token;
    if (!checkToken) {
      return NextResponse.json({
        success: true,
        status: deposit.status,
        message: 'Order created, awaiting gateway payment',
        deposit,
      });
    }

    // Call TapTapUp status check API
    const gatewayStatus = await checkTapTapUpStatus(checkToken);

    if (gatewayStatus && gatewayStatus.success && gatewayStatus.status === 'completed') {
      const user = await User.findById(session.id);
      if (user && deposit.status !== 'Approved') {
        const balanceBefore = user.wallet_balance || 0;
        const balanceAfter = parseFloat((balanceBefore + deposit.received_amount).toFixed(2));

        user.wallet_balance = balanceAfter;
        await user.save();

        deposit.status = 'Approved';
        deposit.wallet_balance_before = balanceBefore;
        deposit.wallet_balance_after = balanceAfter;
        if (gatewayStatus.order_id) deposit.gateway_order_id = String(gatewayStatus.order_id);
        deposit.processed_at = new Date();
        await deposit.save();

        await ChromeNotification.create({
          user_id: user._id.toString(),
          title: 'TapTapUp Deposit Approved! 💰',
          message: `Your deposit of $${deposit.received_amount.toFixed(2)} has been credited to your wallet!`,
        });

        return NextResponse.json({
          success: true,
          status: 'Approved',
          message: 'Payment completed on TapTapUp! Balance credited.',
          walletBalance: balanceAfter,
          deposit,
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: deposit.status,
      gatewayStatus: gatewayStatus ? gatewayStatus.status : 'pending',
      message: 'Payment is pending completion on TapTapUp',
      deposit,
    });
  } catch (error) {
    console.error('verify deposit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
