import { NextResponse } from 'next/server';
import { connectToDatabase, GameTransaction, User, UserGameAccount } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const query = searchParams.get('q') || '';

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (query) {
      filter.$or = [
        { order_no: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
        { platform_name: new RegExp(query, 'i') },
        { game_username: new RegExp(query, 'i') },
      ];
    }

    // Fetch latest 200 game operations
    const transactions = await GameTransaction.find(filter).sort({ created_at: -1 }).limit(200);

    // Collect all user IDs to attach current live wallet balance
    const userIds = [...new Set(transactions.map((t) => t.user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id username wallet_balance email phone');
    const userBalanceMap = {};
    for (const u of users) {
      userBalanceMap[u._id.toString()] = {
        balance: u.wallet_balance || 0,
        email: u.email || '',
        phone: u.phone || '',
      };
    }

    const safeTransactions = transactions.map((t) => {
      const uInfo = userBalanceMap[t.user_id] || { balance: 0, email: '', phone: '' };
      return {
        id: t._id.toString(),
        _id: t._id.toString(),
        order_no: t.order_no,
        user_id: t.user_id,
        username: t.username,
        user_current_balance: uInfo.balance,
        user_email: uInfo.email,
        user_phone: uInfo.phone,
        platform_name: t.platform_name,
        game_account: t.game_account || t.game_username || '',
        game_username: t.game_username || '',
        game_password: t.game_password || '',
        type: t.type,
        amount: t.amount,
        status: t.status || 'Pending',
        admin_notes: t.admin_notes || '',
        failure_reason: t.failure_reason || '',
        wallet_balance_before: t.wallet_balance_before || 0,
        wallet_balance_after: t.wallet_balance_after || 0,
        created_at: t.created_at,
      };
    });

    const pendingCount = safeTransactions.filter((t) => t.status === 'Pending').length;
    const approvedCount = safeTransactions.filter((t) => t.status === 'Approved').length;

    return NextResponse.json({
      success: true,
      transactions: safeTransactions,
      stats: {
        totalOperations: safeTransactions.length,
        pendingCount,
        approvedCount,
      },
    });
  } catch (error) {
    console.error('admin game-transactions GET error:', error);
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
    const { action, transactionId, gameUsername, gamePassword, adminNotes, rejectReason } = body;

    // ACTION 1: APPROVE DEPOSIT & CREATE/SAVE GAME CREDENTIALS
    if (action === 'approve_deposit') {
      if (!transactionId) {
        return NextResponse.json({ success: false, message: 'Transaction ID is required' }, { status: 400 });
      }
      if (!gameUsername || !gameUsername.trim()) {
        return NextResponse.json({ success: false, message: 'In-Game Username is required' }, { status: 400 });
      }
      if (!gamePassword || !gamePassword.trim()) {
        return NextResponse.json({ success: false, message: 'In-Game Password is required' }, { status: 400 });
      }

      const tx = await GameTransaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
      }

      if (tx.status !== 'Pending') {
        return NextResponse.json({ success: false, message: `Transaction already processed (Status: ${tx.status})` }, { status: 400 });
      }

      const user = await User.findById(tx.user_id);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User account not found' }, { status: 404 });
      }

      // Check user still has sufficient balance to deduct
      if (user.wallet_balance < tx.amount) {
        return NextResponse.json({
          success: false,
          message: `User has insufficient balance ($${Number(user.wallet_balance).toFixed(2)}). Cannot deduct $${Number(tx.amount).toFixed(2)}.`,
        }, { status: 400 });
      }

      const balanceBefore = user.wallet_balance;
      const balanceAfter = parseFloat((balanceBefore - tx.amount).toFixed(2));

      // 1. Deduct balance from user wallet
      user.wallet_balance = balanceAfter;
      await user.save();

      // 2. Update transaction
      tx.status = 'Approved';
      tx.game_username = gameUsername.trim();
      tx.game_password = gamePassword.trim();
      tx.game_account = gameUsername.trim();
      tx.admin_notes = adminNotes || '';
      tx.wallet_balance_before = balanceBefore;
      tx.wallet_balance_after = balanceAfter;
      tx.updated_at = new Date();
      await tx.save();

      // 3. Upsert into UserGameAccount (permanent credentials for player)
      await UserGameAccount.findOneAndUpdate(
        {
          user_id: user._id.toString(),
          platform_name: tx.platform_name
        },
        {
          username: user.username,
          platform_name: tx.platform_name,
          game_username: gameUsername.trim(),
          game_password: gamePassword.trim(),
          status: 'Active',
          $inc: { total_loaded: tx.amount },
          updated_at: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully loaded $${tx.amount.toFixed(2)} to ${tx.platform_name} for ${user.username}! $${tx.amount.toFixed(2)} deducted from player wallet. Credentials saved.`,
        transaction: tx,
        newBalance: balanceAfter,
      });
    }

    // ACTION 2: REJECT DEPOSIT (NO DEDUCTION)
    if (action === 'reject_deposit') {
      if (!transactionId) {
        return NextResponse.json({ success: false, message: 'Transaction ID is required' }, { status: 400 });
      }

      const tx = await GameTransaction.findById(transactionId);
      if (!tx) {
        return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
      }

      if (tx.status !== 'Pending') {
        return NextResponse.json({ success: false, message: `Transaction already processed (Status: ${tx.status})` }, { status: 400 });
      }

      tx.status = 'Rejected';
      tx.failure_reason = rejectReason || 'Declined by Administrator';
      tx.updated_at = new Date();
      await tx.save();

      return NextResponse.json({
        success: true,
        message: `Game deposit request ${tx.order_no} has been rejected. No funds deducted.`,
        transaction: tx,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error('admin game-transactions POST error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
