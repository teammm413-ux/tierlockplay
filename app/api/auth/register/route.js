import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { signUserToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, email, phone, password, inviteCode, captcha } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: 'Username, email and password are required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ success: false, message: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await User.findOne({
      $or: [
        { username: new RegExp(`^${cleanUsername}$`, 'i') },
        { email: cleanEmail }
      ]
    });

    if (existing) {
      if (existing.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Username is already taken' }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'Email is already registered' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let formattedPhone = phone ? phone.trim() : '';
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      const clean = formattedPhone.replace(/\D/g, '');
      formattedPhone = clean.startsWith('1') ? `+${clean}` : `+1${clean}`;
    }

    const newUserDoc = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      phone: formattedPhone,
      password: hashedPassword,
      wallet_balance: 0.00,
      account_status: 'Active',
      is_email_verified: false,
      is_phone_verified: false,
      kyc_status: 'INCOMPLETE',
      kyc_name: '',
      invite_code: inviteCode || 'VIP777',
      is_subscribed: true,
      last_login_time: now,
      last_login_ip: '127.0.0.1',
      last_login_device: 'Macos',
    });

    const newUser = {
      id: newUserDoc._id.toString(),
      _id: newUserDoc._id.toString(),
      username: newUserDoc.username,
      email: newUserDoc.email,
      wallet_balance: 0.00,
      account_status: 'Active',
      is_email_verified: false,
      is_phone_verified: false,
    };

    const token = signUserToken(newUser);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to TRP Game Wallet.',
      user: newUser,
    });

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
