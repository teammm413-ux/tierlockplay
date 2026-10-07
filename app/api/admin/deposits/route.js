import { NextResponse } from 'next/server';
import { connectToDatabase, DepositRequest, User, ChromeNotification, expireStaleDeposits } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    await expireStaleDeposits();
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
        { payment_method: new RegExp(query, 'i') }
      ];
    }

    const deposits = await DepositRequest.find(filter).sort({ created_at: -1 });

    const safeDeposits = deposits.map(d => ({
      id: d._id.toString(),
      _id: d._id.toString(),
      order_no: d.order_no,
      user_id: d.user_id,
      username: d.username,
      payment_method: d.payment_method,
      paid_amount: d.paid_amount,
      received_amount: d.received_amount,
      service_fee: d.service_fee || 0,
      status: d.status,
      wallet_balance_before: d.wallet_balance_before || 0,
      wallet_balance_after: d.wallet_balance_after || 0,
      transaction_proof: d.transaction_proof || '',
      payment_gateway: d.payment_gateway || 'TapTapUp',
      payment_token: d.payment_token || '',
      gateway_order_id: d.gateway_order_id || '',
      redirect_url: d.redirect_url || '',
      created_at: d.created_at,
      expires_at: d.expires_at || null,
      processed_at: d.processed_at || '',
    }));

    return NextResponse.json({ success: true, deposits: safeDeposits });
  } catch (error) {
    console.error('admin get deposits error:', error);
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

    let deposit = null;
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      deposit = await DepositRequest.findById(id);
    }
    if (!deposit) {
      deposit = await DepositRequest.findOne({ order_no: id });
    }
    if (!deposit) {
      return NextResponse.json({ success: false, message: 'Deposit request not found' }, { status: 404 });
    }

    if (deposit.status !== 'Pending' && deposit.status !== 'Created') {
      return NextResponse.json({ success: false, message: `Deposit has already been ${deposit.status.toLowerCase()}` }, { status: 400 });
    }

    const user = await User.findById(deposit.user_id) || await User.findOne({ username: deposit.username });
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (action === 'approve') {
      const balanceBefore = user ? (user.wallet_balance || 0) : (deposit.wallet_balance_before || 0);
      const balanceAfter = parseFloat((balanceBefore + deposit.received_amount).toFixed(2));

      // Update user wallet balance in MongoDB
      if (user) {
        user.wallet_balance = balanceAfter;
        await user.save();
      }

      // Update deposit request in MongoDB
      deposit.status = 'Approved';
      deposit.wallet_balance_before = balanceBefore;
      deposit.wallet_balance_after = balanceAfter;
      deposit.processed_at = now;
      await deposit.save();

      // Create Chrome notification for user
      await ChromeNotification.create({
        user_id: deposit.user_id,
        title: 'Deposit Approved! 💰',
        message: `Your deposit of $${deposit.received_amount.toFixed(2)} via ${deposit.payment_method} has been credited to your wallet.`,
      });

      return NextResponse.json({
        success: true,
        message: `Deposit #${deposit.order_no} of $${deposit.received_amount.toFixed(2)} approved!`,
      });
    } else if (action === 'reject') {
      deposit.status = 'Rejected';
      deposit.processed_at = now;
      if (reason) deposit.transaction_proof = `Reason: ${reason}`;
      await deposit.save();

      return NextResponse.json({
        success: true,
        message: `Deposit #${deposit.order_no} has been rejected.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('admin post deposit error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
