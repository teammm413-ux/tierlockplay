import { NextResponse } from 'next/server';
import { connectToDatabase, GamePlatform, UserGameAccount } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    // Only active platforms for players
    const platforms = await GamePlatform.find({ is_active: true }).sort({ order_priority: 1, created_at: 1 });

    let userAccounts = {};
    if (session && (session.id || session._id)) {
      const userId = session.id || session._id;
      const accounts = await UserGameAccount.find({ user_id: userId.toString() });
      for (const acc of accounts) {
        userAccounts[acc.platform_id] = acc.in_game_account_id;
      }
    }

    const result = platforms.map((p) => {
      const pid = p._id.toString();
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
        boundAccountId: userAccounts[pid] || null,
      };
    });

    return NextResponse.json({ success: true, platforms: result });
  } catch (error) {
    console.error('get platforms error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
