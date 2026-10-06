import { NextResponse } from 'next/server';
import { connectToDatabase, ChromeNotification, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    let userId = null;
    if (session && session.id) {
      userId = session.id;
    } else {
      const defaultUser = await User.findOne({ username: 'alex' }) || await User.findOne({});
      if (defaultUser) userId = defaultUser._id.toString();
    }

    const filter = userId
      ? { $or: [{ user_id: userId }, { user_id: null }, { user_id: '' }] }
      : { user_id: null };

    const rawNotifs = await ChromeNotification.find(filter).sort({ created_at: -1 }).limit(20);

    const notifications = rawNotifs.map(n => ({
      id: n._id.toString(),
      _id: n._id.toString(),
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      promo_code: n.promo_code || '',
      is_read: !!n.is_read,
      created_at: n.created_at,
    }));

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('get chrome notifications error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id } = body;

    if (id) {
      await ChromeNotification.findByIdAndUpdate(id, { $set: { is_read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
