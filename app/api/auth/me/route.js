import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    let user = null;
    if (session && session.id) {
      user = await User.findById(session.id);
      if (!user && session.username) {
        user = await User.findOne({ username: session.username });
      }
    }

    // Fallback to default player 'alex' if no active session
    if (!user) {
      user = await User.findOne({ username: 'alex' }) || await User.findOne({});
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        phone: user.phone,
        wallet_balance: user.wallet_balance || 0,
        account_status: user.account_status || 'Active',
        is_email_verified: !!user.is_email_verified,
        is_phone_verified: !!user.is_phone_verified,
        kyc_status: user.kyc_status || 'INCOMPLETE',
        kyc_name: user.kyc_name || '',
        invite_code: user.invite_code || 'VIP777',
        referred_by: user.referred_by || '',
        is_subscribed: !!user.is_subscribed,
        last_login_time: user.last_login_time || '2026-10-02 12:10',
        last_login_ip: user.last_login_ip || '182.190.183.135',
        last_login_device: user.last_login_device || 'Macos',
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
