import { NextResponse } from 'next/server';
import { connectToDatabase, GameTransaction } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || ''; // 'Deposit' or 'Withdrawal'
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const orderNo = searchParams.get('orderNo');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter = {
      $or: [{ user_id: session.id }, { username: session.username || 'alex' }],
    };

    if (type) {
      filter.type = type;
    }

    if (status && status !== 'All' && status !== 'All Statuses') {
      filter.status = status;
    }

    if (platform && platform !== 'All') {
      filter.platform_name = new RegExp(platform, 'i');
    }

    if (orderNo && orderNo.trim()) {
      filter.order_no = new RegExp(orderNo.trim(), 'i');
    }

    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) {
        filter.created_at.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.created_at.$lte = to;
      }
    }

    const records = await GameTransaction.find(filter).sort({ created_at: -1 }).lean();

    return NextResponse.json({
      success: true,
      records: records.map((r) => ({
        id: r._id.toString(),
        order_no: r.order_no,
        username: r.username,
        type: r.type,
        platform_name: r.platform_name,
        game_account: r.game_account,
        amount: r.amount,
        status: r.status,
        failure_reason: r.failure_reason || '',
        wallet_balance_before: r.wallet_balance_before || 0,
        wallet_balance_after: r.wallet_balance_after || 0,
        created_at: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').substring(0, 19) : '',
        operation_time: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').substring(0, 19) : '',
      })),
    });
  } catch (error) {
    console.error('game records error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
