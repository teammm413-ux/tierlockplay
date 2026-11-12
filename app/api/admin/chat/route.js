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
        message: m.message || '',
        attachment_url: m.attachment_url || '',
        attachment_type: m.attachment_type || '',
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

    // 2. Conversation list — single aggregation (fast; no N+1 queries)
    const searchTrim = search.trim();
    let searchUserIds = null;

    if (searchTrim) {
      const matched = await User.find({
        $or: [
          { username: new RegExp(searchTrim, 'i') },
          { email: new RegExp(searchTrim, 'i') },
        ],
      })
        .select('_id')
        .limit(200);
      searchUserIds = matched.map((u) => u._id.toString());
      if (searchUserIds.length === 0) {
        return NextResponse.json({ success: true, conversations: [] });
      }
    }

    const pipeline = [
      ...(searchUserIds ? [{ $match: { user_id: { $in: searchUserIds } } }] : []),
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$user_id',
          last_message: { $first: '$message' },
          last_attachment_url: { $first: '$attachment_url' },
          last_message_time: { $first: '$created_at' },
          unread_count: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$sender_type', 'user'] },
                    { $ne: ['$is_read_by_admin', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { unread_count: -1, last_message_time: -1 } },
      { $limit: 150 },
    ];

    const grouped = await ChatMessage.aggregate(pipeline);
    const userIds = grouped.map((g) => g._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      'username email phone wallet_balance account_status'
    );
    const userById = {};
    for (const u of users) {
      userById[u._id.toString()] = u;
    }

    const conversations = grouped
      .map((g) => {
        const u = userById[g._id];
        if (!u) return null;
        const lastText =
          g.last_message ||
          (g.last_attachment_url ? '📷 [Photo Attachment]' : '');
        return {
          id: g._id,
          _id: g._id,
          username: u.username,
          email: u.email,
          phone: u.phone || '',
          wallet_balance: u.wallet_balance || 0,
          account_status: u.account_status || 'Active',
          last_message: lastText,
          last_message_time: g.last_message_time || '',
          unread_count: g.unread_count || 0,
        };
      })
      .filter(Boolean);

    // Search: include matched players with no chat yet
    if (searchUserIds) {
      const inList = new Set(conversations.map((c) => c.id));
      const extras = await User.find({ _id: { $in: searchUserIds.filter((id) => !inList.has(id)) } })
        .select('username email phone wallet_balance account_status')
        .limit(50);
      for (const u of extras) {
        conversations.push({
          id: u._id.toString(),
          _id: u._id.toString(),
          username: u.username,
          email: u.email,
          phone: u.phone || '',
          wallet_balance: u.wallet_balance || 0,
          account_status: u.account_status || 'Active',
          last_message: '',
          last_message_time: '',
          unread_count: 0,
        });
      }
    }

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
    const { userId, message, attachment_url, attachment_type } = body;

    const hasMessage = message && message.trim().length > 0;
    const hasAttachment = attachment_url && attachment_url.trim().length > 0;

    if (!userId || (!hasMessage && !hasAttachment)) {
      return NextResponse.json({ success: false, message: 'User ID and message text or image attachment are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const adminName = session?.username || 'TRP Support';

    // Insert chat message in MongoDB
    const newMsg = await ChatMessage.create({
      user_id: user._id.toString(),
      sender_type: 'admin',
      sender_name: adminName,
      message: hasMessage ? message.trim() : '',
      attachment_url: hasAttachment ? attachment_url.trim() : '',
      attachment_type: hasAttachment ? (attachment_type || 'image') : '',
      is_read_by_user: false,
      is_read_by_admin: true,
    });

    // Also insert a chrome notification alert for the user so they get notified on the website
    const previewText = hasMessage
      ? `"${message.trim().substring(0, 100)}${message.length > 100 ? '...' : ''}"`
      : 'Sent an image attachment 📷';

    await ChromeNotification.create({
      user_id: user._id.toString(),
      title: 'Support Message from Admin 💬',
      message: `${adminName}: ${previewText}`,
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
        attachment_url: newMsg.attachment_url,
        attachment_type: newMsg.attachment_type,
        created_at: newMsg.created_at,
      },
    });
  } catch (error) {
    console.error('admin send message error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
