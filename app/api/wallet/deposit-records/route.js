import { NextResponse } from 'next/server';
import { connectToDatabase, DepositRequest, expireStaleDeposits } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await expireStaleDeposits();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const orderNo = searchParams.get('orderNo');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter = {
      $or: [{ user_id: session.id }, { username: session.username || 'alex' }],
    };

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      filter.payment_method = new RegExp(paymentMethod, 'i');
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

    const records = await DepositRequest.find(filter).sort({ created_at: -1 }).lean();

    return NextResponse.json({
      success: true,
      records: records.map((r) => ({
        id: r._id.toString(),
        order_no: r.order_no,
        username: r.username,
        payment_method: r.payment_method,
        paid_amount: r.paid_amount,
        received_amount: r.received_amount,
        service_fee: r.service_fee || 0.0,
        status: r.status,
        wallet_balance_before: r.wallet_balance_before || 0,
        wallet_balance_after: r.wallet_balance_after || 0,
        transaction_proof: r.transaction_proof || '',
        created_at: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').substring(0, 19) : '',
        operation_time: r.processed_at
          ? new Date(r.processed_at).toISOString().replace('T', ' ').substring(0, 19)
          : r.created_at
          ? new Date(r.created_at).toISOString().replace('T', ' ').substring(0, 19)
          : '',
      })),
    });
  } catch (error) {
    console.error('deposit-records error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
