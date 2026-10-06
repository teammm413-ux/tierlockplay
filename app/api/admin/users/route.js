import { NextResponse } from 'next/server';
import { connectToDatabase, User, DepositRequest } from '@/lib/mongodb';
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
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const filter = {};
    if (query) {
      filter.$or = [
        { username: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') }
      ];
    }
    if (status) {
      filter.account_status = status;
    }

    const users = await User.find(filter).sort({ created_at: -1 });

    const safeUsers = users.map(u => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      username: u.username,
      email: u.email,
      phone: u.phone || '',
      wallet_balance: u.wallet_balance || 0,
      account_status: u.account_status || 'Active',
      is_email_verified: !!u.is_email_verified,
      is_phone_verified: !!u.is_phone_verified,
      kyc_status: u.kyc_status || 'INCOMPLETE',
      kyc_name: u.kyc_name || '',
      invite_code: u.invite_code || 'VIP777',
      is_subscribed: !!u.is_subscribed,
      last_login_time: u.last_login_time || '',
      last_login_ip: u.last_login_ip || '',
      created_at: u.created_at,
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('admin get users error:', error);
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
    const { action, userId } = body;

    const user = await User.findById(userId) || await User.findOne({ username: userId });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (action === 'adjust_balance') {
      const { amount, reason, adjustmentType } = body; // adjustmentType: 'add' or 'deduct'
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ success: false, message: 'Invalid adjustment amount' }, { status: 400 });
      }

      const balanceBefore = user.wallet_balance || 0;
      let newBalance = balanceBefore;
      if (adjustmentType === 'add') {
        newBalance = parseFloat((balanceBefore + parsedAmount).toFixed(2));
      } else {
        newBalance = parseFloat(Math.max(0, balanceBefore - parsedAmount).toFixed(2));
      }

      user.wallet_balance = newBalance;
      await user.save();

      // Record adjustment as a deposit record in MongoDB for audit trail
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await DepositRequest.create({
        order_no: `ADJ${Date.now()}`,
        user_id: user._id.toString(),
        username: user.username,
        payment_method: 'Admin Adjustment',
        paid_amount: adjustmentType === 'add' ? parsedAmount : -parsedAmount,
        received_amount: adjustmentType === 'add' ? parsedAmount : -parsedAmount,
        service_fee: 0.00,
        status: 'Approved',
        wallet_balance_before: balanceBefore,
        wallet_balance_after: newBalance,
        transaction_proof: reason || 'Manual Admin Balance Adjustment',
        processed_at: now,
      });

      return NextResponse.json({
        success: true,
        message: `Balance adjusted for ${user.username}. New balance: $${newBalance.toFixed(2)}`,
        newBalance,
      });
    }

    if (action === 'update_status') {
      const { status } = body;
      user.account_status = status;
      await user.save();
      return NextResponse.json({ success: true, message: `Account status updated to ${status}` });
    }

    if (action === 'update_kyc') {
      const { kyc_status } = body;
      user.kyc_status = kyc_status;
      await user.save();
      return NextResponse.json({ success: true, message: `KYC status updated to ${kyc_status}` });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('admin post user error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
