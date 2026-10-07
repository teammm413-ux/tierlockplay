import { NextResponse } from 'next/server';
import { connectToDatabase, ChatMessage, User, ChromeNotification } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    let isAdmin = session && (session.isAdmin || session.role === 'admin' || session.role === 'superadmin');

    if (!isAdmin) {
      const host = request.headers.get('host') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search') || '';

    // 1. If fetching specific conversation
    if (userId) {
      // Mark messages read by admin
      await ChatMessage.updateMany(
        { user_id: userId, sender_type: 'user' },
        { $set: { is_read_by_admin: true } }
      );

      const messages = await ChatMessage.find({ user_id: userId }).sort({ created_at: 1 });
      const user = await User.findById(userId);

      const safeMessages = messages.map(m => ({
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

      return NextResponse.json({
        success: true,
        messages: safeMessages,
        user: user ? {
          id: user._id.toString(),
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          phone: user.phone || '',
          wallet_balance: user.wallet_balance || 0,
          account_status: user.account_status || 'Active',
        } : null,
      });
    }

    // 2. Listing users / Searching by username or email
    const userFilter = {};
    if (search.trim()) {
      userFilter.$or = [
        { username: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') }
      ];
    }

    const users = await User.find(userFilter);
    const conversations = [];

    for (const u of users) {
      const uId = u._id.toString();
      const lastMsg = await ChatMessage.findOne({ user_id: uId }).sort({ created_at: -1 });
      const unreadCount = await ChatMessage.countDocuments({
        user_id: uId,
        sender_type: 'user',
        is_read_by_admin: false,
      });

      conversations.push({
        id: uId,
        _id: uId,
        username: u.username,
        email: u.email,
        phone: u.phone || '',
        wallet_balance: u.wallet_balance || 0,
        account_status: u.account_status || 'Active',
        last_message: lastMsg ? lastMsg.message : '',
        last_message_time: lastMsg ? lastMsg.created_at : '',
        unread_count: unreadCount,
      });
    }

    conversations.sort((a, b) => {
      if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
      if (b.last_message_time && a.last_message_time) {
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      }
      return 0;
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('admin chat error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    let isAdmin = session && (session.isAdmin || session.role === 'admin' || session.role === 'superadmin');

    if (!isAdmin) {
      const host = request.headers.get('host') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message || message.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'User ID and message text are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const adminName = session.username || 'TRP Support';

    // Insert chat message in MongoDB
    const newMsg = await ChatMessage.create({
      user_id: user._id.toString(),
      sender_type: 'admin',
      sender_name: adminName,
      message: message.trim(),
      is_read_by_user: false,
      is_read_by_admin: true,
    });

    // Also insert a chrome notification alert for the user so they get notified on the website
    await ChromeNotification.create({
      user_id: user._id.toString(),
      title: 'Support Message from Admin 💬',
      message: `${adminName}: "${message.trim().substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
    });

    return NextResponse.json({
      success: true,
      message: 'Support message delivered to player!',
      chatMessage: {
        id: newMsg._id.toString(),
        _id: newMsg._id.toString(),
        user_id: newMsg.user_id,
        sender_type: newMsg.sender_type,
        sender_name: newMsg.sender_name,
        message: newMsg.message,
        created_at: newMsg.created_at,
      },
    });
  } catch (error) {
    console.error('admin send message error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
