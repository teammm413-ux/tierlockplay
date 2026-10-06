import { NextResponse } from 'next/server';
import { connectToDatabase, GamePlatform, UserGameAccount } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const userId = session && (session.id || session._id);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const { platformId, inGameAccountId } = body;

    if (!platformId || !inGameAccountId || inGameAccountId.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Platform ID and In-Game Account ID are required' }, { status: 400 });
    }

    await connectToDatabase();
    const platform = await GamePlatform.findById(platformId);
    if (!platform) {
      return NextResponse.json({ success: false, message: 'Invalid platform selected' }, { status: 404 });
    }

    // Upsert user game account binding in MongoDB
    await UserGameAccount.findOneAndUpdate(
      { user_id: userId.toString(), platform_id: platform._id.toString() },
      {
        user_id: userId.toString(),
        platform_id: platform._id.toString(),
        platform_name: platform.name,
        in_game_account_id: inGameAccountId.trim()
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${platform.name} ID: ${inGameAccountId.trim()}`,
      platformId: platform._id.toString(),
      inGameAccountId: inGameAccountId.trim(),
    });
  } catch (error) {
    console.error('bind game account error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
