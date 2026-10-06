import { NextResponse } from 'next/server';
import { connectToDatabase, GameTransaction } from '@/lib/mongodb';
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
    const type = searchParams.get('type') || '';
    const query = searchParams.get('q') || '';

    const filter = {};
    if (type) {
      filter.type = type;
    }
    if (query) {
      filter.$or = [
        { order_no: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
        { platform_name: new RegExp(query, 'i') },
        { game_account: new RegExp(query, 'i') }
      ];
    }

    const transactions = await GameTransaction.find(filter).sort({ created_at: -1 });

    const safeTransactions = transactions.map(t => ({
      id: t._id.toString(),
      _id: t._id.toString(),
      order_no: t.order_no,
      user_id: t.user_id,
      username: t.username,
      platform_name: t.platform_name,
      game_account: t.game_account,
      type: t.type,
      amount: t.amount,
      status: t.status,
      wallet_balance_before: t.wallet_balance_before || 0,
      wallet_balance_after: t.wallet_balance_after || 0,
      game_balance_before: t.game_balance_before || 0,
      game_balance_after: t.game_balance_after || 0,
      created_at: t.created_at,
    }));

    return NextResponse.json({ success: true, transactions: safeTransactions });
  } catch (error) {
    console.error('admin game-transactions error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
