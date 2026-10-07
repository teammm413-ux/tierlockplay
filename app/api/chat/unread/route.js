import { NextResponse } from 'next/server';
import { connectToDatabase, ChatMessage, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    await connectToDatabase();

    let user = null;
    if (session && session.id) {
      try {
        user = await User.findById(session.id);
      } catch (e) {}
      if (!user && session.username) {
        user = await User.findOne({ username: session.username });
      }
    }

    if (!user) {
      user = (await User.findOne({ username: 'alex' })) || (await User.findOne({}));
    }

    if (!user) {
      return NextResponse.json({ success: true, count: 0, hasUnread: false });
    }

    const userId = user._id.toString();

    const unread = await ChatMessage.find({
      user_id: userId,
      sender_type: 'admin',
      is_read_by_user: false,
    }).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      count: unread.length,
      hasUnread: unread.length > 0,
      latestMessage: unread.length > 0 ? unread[0].message : null,
      senderName: unread.length > 0 ? unread[0].sender_name : null,
      timestamp: unread.length > 0 ? unread[0].created_at : null,
    });
  } catch (error) {
    console.error('unread chat error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
