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

    // Update last login
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    user.last_login_time = now;
    await user.save();

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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
