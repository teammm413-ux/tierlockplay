import { NextResponse } from 'next/server';
import { connectToDatabase, WithdrawalRequest, User, ChromeNotification } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const query = searchParams.get('q') || '';

    const filter = {};
    if (status !== 'All') {
      filter.status = status;
    }
    if (query) {
      filter.$or = [
        { order_no: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
        { payment_method: new RegExp(query, 'i') },
        { payment_info: new RegExp(query, 'i') }
      ];
    }

    const withdrawals = await WithdrawalRequest.find(filter).sort({ created_at: -1 });

    const safeWithdrawals = withdrawals.map(w => ({
      id: w._id.toString(),
      _id: w._id.toString(),
      order_no: w.order_no,
      user_id: w.user_id,
      username: w.username,
      payment_method: w.payment_method,
      payment_info: w.payment_info,
      amount: w.amount,
      service_fee: w.service_fee || 0,
      received_amount: w.received_amount,
      status: w.status,
      failure_reason: w.failure_reason || '',
      wallet_balance_before: w.wallet_balance_before || 0,
      wallet_balance_after: w.wallet_balance_after || 0,
      created_at: w.created_at,
      processed_at: w.processed_at || '',
    }));

    return NextResponse.json({ success: true, withdrawals: safeWithdrawals });
  } catch (error) {
    console.error('admin get withdrawals error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: 'ID and action are required' }, { status: 400 });
    }

    let item = null;
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      item = await WithdrawalRequest.findById(id);
    }
    if (!item) {
      item = await WithdrawalRequest.findOne({ order_no: id });
    }
    if (!item) {
      return NextResponse.json({ success: false, message: 'Withdrawal request not found' }, { status: 404 });
    }

    if (item.status !== 'Pending') {
      return NextResponse.json({ success: false, message: `Withdrawal has already been ${item.status.toLowerCase()}` }, { status: 400 });
    }

    const user = await User.findById(item.user_id) || await User.findOne({ username: item.username });
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (action === 'approve') {
      item.status = 'Approved';
      item.processed_at = now;
      await item.save();

      // Chrome notification
      await ChromeNotification.create({
        user_id: item.user_id,
        title: 'Withdrawal Sent! 💸',
        message: `Your payout of $${item.received_amount.toFixed(2)} (${item.payment_method}: ${item.payment_info}) has been processed and sent!`,
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal #${item.order_no} for $${item.received_amount.toFixed(2)} approved & sent!`,
      });
    } else if (action === 'reject') {
      // Refund reserved amount back to user's wallet
      if (user) {
        user.wallet_balance = parseFloat(((user.wallet_balance || 0) + item.amount).toFixed(2));
        await user.save();
      }

      item.status = 'Rejected';
      item.failure_reason = reason || 'Rejected by Admin. Funds refunded to wallet balance.';
      item.processed_at = now;
      await item.save();

      await ChromeNotification.create({
        user_id: item.user_id,
        title: 'Withdrawal Update',
        message: `Your withdrawal #${item.order_no} was rejected (${reason || 'Check details'}). $${item.amount.toFixed(2)} has been refunded to your wallet.`,
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal #${item.order_no} rejected and $${item.amount.toFixed(2)} refunded to player wallet.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('admin post withdrawal error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
