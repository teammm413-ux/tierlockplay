import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { signUserToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ success: false, message: 'Please enter your username/email and password' }, { status: 400 });
    }

    await connectToDatabase();
    const target = usernameOrEmail.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${target}$`, 'i') },
        { email: new RegExp(`^${target}$`, 'i') }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid username/email or password' }, { status: 401 });
    }

    if (user.account_status === 'Suspended' || user.account_status === 'Banned') {
      return NextResponse.json({ success: false, message: 'Your account is suspended. Please contact Live Chat Support.' }, { status: 403 });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid username/email or password' }, { status: 401 });
    }

    // Single Device Enforcement Policy
    const cookieDeviceId = request.cookies.get('trp_device_id')?.value || '';
    const deviceId = ((body.deviceId || cookieDeviceId) || '').trim();

    if (deviceId) {
      // Check if this device is already bound to a DIFFERENT account
      const conflictingUser = await User.findOne({
        device_id: deviceId,
        _id: { $ne: user._id }
      });

      if (conflictingUser) {
        return NextResponse.json({
          success: false,
          message: `Single Device Policy: This device is already linked to account "${conflictingUser.username}". Multiple accounts are not allowed on one device. Only 1 account is permitted per device.`
        }, { status: 403 });
      }

      // Bind device to current user if not bound yet
      if (!user.device_id) {
        user.device_id = deviceId;
      }
      user.last_device_id = deviceId;
    }

    // Update last login & persist device_id directly to database
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.last_login_time = now;
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          last_login_time: now,
          ...(deviceId ? { device_id: user.device_id || deviceId, last_device_id: deviceId } : {})
        }
      }
    );

    const safeUser = {
      id: user._id.toString(),
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      wallet_balance: user.wallet_balance || 0,
      account_status: user.account_status || 'Active',
      is_email_verified: !!user.is_email_verified,
      is_phone_verified: !!user.is_phone_verified,
      kyc_status: user.kyc_status || 'INCOMPLETE',
      kyc_name: user.kyc_name || '',
      invite_code: user.invite_code || 'VIP777',
      is_subscribed: !!user.is_subscribed,
      last_login_time: now,
      last_login_ip: user.last_login_ip || '182.190.183.135',
      last_login_device: user.last_login_device || 'Macos',
    };

    const token = signUserToken(safeUser);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful! Welcome back.',
      user: safeUser,
    });

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (deviceId) {
      response.cookies.set('trp_device_id', deviceId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
