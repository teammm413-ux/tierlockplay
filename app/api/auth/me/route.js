import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { getClientIp, parseDeviceFromUserAgent } from '@/lib/device';

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

    // Detect real device & IP from current browser request
    const ua = request.headers.get('user-agent') || '';
    const currentDevice = parseDeviceFromUserAgent(ua);
    const currentIp = getClientIp(request);

    let effectiveDevice = user.last_login_device;
    let effectiveIp = user.last_login_ip;

    if (!effectiveDevice || effectiveDevice.toLowerCase() === 'macos') {
      effectiveDevice = currentDevice;
    }
    if (!effectiveIp || effectiveIp === '182.190.183.135' || effectiveIp === '127.0.0.1') {
      effectiveIp = currentIp !== '127.0.0.1' ? currentIp : (user.last_login_ip || '127.0.0.1');
    }

    // Asynchronously sync device details in background
    if (user._id && (user.last_login_device !== effectiveDevice || (currentIp !== '127.0.0.1' && user.last_login_ip !== currentIp))) {
      User.updateOne(
        { _id: user._id },
        { $set: { last_login_device: effectiveDevice, last_login_ip: effectiveIp } }
      ).catch(() => {});
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
        kyc_dob: user.kyc_dob || '',
        kyc_id_type: user.kyc_id_type || 'Driver License',
        kyc_id_number: user.kyc_id_number || '',
        kyc_front_image: user.kyc_front_image || '',
        kyc_back_image: user.kyc_back_image || '',
        kyc_selfie_image: user.kyc_selfie_image || '',
        kyc_rejection_reason: user.kyc_rejection_reason || '',
        kyc_submitted_at: user.kyc_submitted_at || null,
        invite_code: user.invite_code || 'VIP777',
        referred_by: user.referred_by || '',
        is_subscribed: !!user.is_subscribed,
        last_login_time: user.last_login_time || new Date().toISOString().replace('T', ' ').substring(0, 19),
        last_login_ip: effectiveIp,
        last_login_device: effectiveDevice,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
