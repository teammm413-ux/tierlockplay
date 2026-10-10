import { NextResponse } from 'next/server';
import { connectToDatabase, GamePlatform, UserGameAccount, GameTransaction } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    // Only active platforms for players
    const platforms = await GamePlatform.find({ is_active: true }).sort({ order_priority: 1, created_at: 1 });

    let userAccountsByPlatform = {};
    let pendingRequestsByPlatform = {};

    if (session && (session.id || session._id)) {
      const userId = (session.id || session._id).toString();

      // Fetch user's approved game accounts with credentials
      const accounts = await UserGameAccount.find({ user_id: userId });
      for (const acc of accounts) {
        userAccountsByPlatform[acc.platform_name] = {
          game_username: acc.game_username || acc.in_game_account_id || '',
          game_password: acc.game_password || '',
          total_loaded: acc.total_loaded || 0,
          status: acc.status || 'Active',
        };
      }

      // Check if user has any pending game deposit requests
      const pendingTxs = await GameTransaction.find({
        user_id: userId,
        status: 'Pending',
      }).sort({ created_at: -1 });

      for (const tx of pendingTxs) {
        pendingRequestsByPlatform[tx.platform_name] = {
          order_no: tx.order_no,
          amount: tx.amount,
          created_at: tx.created_at,
        };
      }

      var activePendingTx = pendingTxs.length > 0 ? {
        platform_name: pendingTxs[0].platform_name,
        order_no: pendingTxs[0].order_no,
        amount: pendingTxs[0].amount,
        type: pendingTxs[0].type,
        created_at: pendingTxs[0].created_at,
      } : null;
    }

    const result = platforms.map((p) => {
      const pid = p._id.toString();
      const account = userAccountsByPlatform[p.name] || null;
      const pending = pendingRequestsByPlatform[p.name] || null;

      return {
        id: pid,
        _id: pid,
        name: p.name,
        slug: p.slug,
        download_url: p.download_url,
        logo_url: p.logo_url,
        banner_image: p.banner_image,
        tagline: p.tagline,
        category: p.category,
        min_deposit: p.min_deposit,
        rtp: p.rtp,
        // Game Account Credentials
        hasAccount: !!(account && account.game_username),
        game_username: account?.game_username || null,
        game_password: account?.game_password || null,
        total_loaded: account?.total_loaded || 0,
        // Pending Load Request
        hasPendingRequest: !!pending,
        pendingAmount: pending?.amount || null,
        pendingOrderNo: pending?.order_no || null,
      };
    });

    return NextResponse.json({
      success: true,
      platforms: result,
      hasAnyPendingRequest: Boolean(activePendingTx),
      activePendingRequest: activePendingTx || null,
    });
  } catch (error) {
    console.error('get platforms error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
