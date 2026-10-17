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
      user_tag_name: w.user_tag_name || w.payment_info || '',
      game_screenshot: w.game_screenshot || '',
      qr_screenshot: w.qr_screenshot || '',
      amount: w.amount,
      service_fee: w.service_fee || 0,
      received_amount: w.received_amount,
      status: w.status,
      admin_notes: w.admin_notes || '',
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
    const { id, action, reason, note } = body;
    const finalNote = (note || reason || '').trim();

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

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (action === 'approve') {
      item.status = 'Approved';
      item.admin_notes = finalNote || 'Payout verified and sent by management';
      item.processed_at = now;
      await item.save();

      // Chrome notification
      await ChromeNotification.create({
        user_id: item.user_id,
        title: 'Withdrawal Sent! 💸',
        message: `Your payout of $${item.received_amount.toFixed(2)} (${item.payment_method}: ${item.user_tag_name || item.payment_info}) has been processed! ${finalNote ? `Note: ${finalNote}` : ''}`,
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal #${item.order_no} for $${item.received_amount.toFixed(2)} approved & sent!`,
      });
    } else if (action === 'reject') {
      if (!finalNote) {
        return NextResponse.json({ success: false, message: 'Please provide a rejection note explaining why this withdrawal was rejected.' }, { status: 400 });
      }

      item.status = 'Rejected';
      item.admin_notes = finalNote;
      item.failure_reason = finalNote;
      item.processed_at = now;
      await item.save();

      await ChromeNotification.create({
        user_id: item.user_id,
        title: 'Withdrawal Rejected ⚠️',
        message: `Your withdrawal #${item.order_no} was rejected. Reason: ${finalNote}`,
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal #${item.order_no} rejected with note: "${finalNote}".`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('admin post withdrawal error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
