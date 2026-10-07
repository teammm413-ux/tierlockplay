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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = user._id.toString();

    // Mark admin messages as read for this user
    await ChatMessage.updateMany(
      { user_id: userId, sender_type: 'admin', is_read_by_user: false },
      { $set: { is_read_by_user: true } }
    );

    const rawMessages = await ChatMessage.find({ user_id: userId }).sort({ created_at: 1 });
    const messages = rawMessages.map(m => ({
      id: m._id.toString(),
      _id: m._id.toString(),
      user_id: m.user_id,
      sender_type: m.sender_type,
      sender_name: m.sender_name,
      message: m.message,
      is_read_by_user: !!m.is_read_by_user,
      is_read_by_admin: !!m.is_read_by_admin,
      created_at: m.created_at,
    }));

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('get chat messages error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Message content cannot be empty' }, { status: 400 });
    }

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
      return NextResponse.json({ success: false, message: 'User not found. Please log in.' }, { status: 401 });
    }

    const newMsg = await ChatMessage.create({
      user_id: user._id.toString(),
      sender_type: 'user',
      sender_name: user.username,
      message: message.trim(),
      is_read_by_user: true,
      is_read_by_admin: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent!',
      chatMessage: {
        id: newMsg._id.toString(),
        _id: newMsg._id.toString(),
        user_id: newMsg.user_id,
        sender_type: newMsg.sender_type,
        sender_name: newMsg.sender_name,
        message: newMsg.message,
        is_read_by_user: true,
        is_read_by_admin: false,
        created_at: newMsg.created_at,
      },
    });
  } catch (error) {
    console.error('send chat message error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
