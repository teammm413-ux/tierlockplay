import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { signUserToken } from '@/lib/auth';
import { checkInviteCode } from '@/app/api/auth/validate-invite/route';

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

    let sponsorCode = '';
    // If an invite code is provided, validate it against system & user codes
    if (inviteCode && typeof inviteCode === 'string' && inviteCode.trim()) {
      const inviteResult = await checkInviteCode(inviteCode.trim());
      if (!inviteResult || !inviteResult.valid) {
        return NextResponse.json({
          success: false,
          message: 'Invalid invite code. Leave it blank if you do not have one, or check with your sponsor.'
        }, { status: 400 });
      }
      sponsorCode = inviteResult.code;
    }

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

    // Single Device Enforcement Policy
    const cookieDeviceId = request.cookies.get('trp_device_id')?.value || '';
    const deviceId = ((body.deviceId || cookieDeviceId) || '').trim();

    if (deviceId) {
      const existingDeviceUser = await User.findOne({
        device_id: deviceId
      });

      if (existingDeviceUser) {
        return NextResponse.json({
          success: false,
          message: `Registration blocked: This device is already registered to account "${existingDeviceUser.username}". Only 1 account is allowed per device. Multiple accounts on a single device are prohibited.`
        }, { status: 403 });
      }
    }

    // Generate unique 6-character referral code for new user
    let generatedInviteCode = '';
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 5; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const codeExists = await User.findOne({ invite_code: code });
      if (!codeExists) {
        generatedInviteCode = code;
        break;
      }
    }
    if (!generatedInviteCode) {
      generatedInviteCode = 'TRP' + Math.floor(100 + Math.random() * 900);
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
      invite_code: generatedInviteCode,
      referred_by: sponsorCode || 'DIRECT',
      is_subscribed: true,
      last_login_time: now,
      last_login_ip: '127.0.0.1',
      last_login_device: 'Macos',
      device_id: deviceId,
      last_device_id: deviceId,
    });

    if (deviceId) {
      await User.updateOne({ _id: newUserDoc._id }, { $set: { device_id: deviceId, last_device_id: deviceId } });
    }

    const newUser = {
      id: newUserDoc._id.toString(),
      _id: newUserDoc._id.toString(),
      username: newUserDoc.username,
      email: newUserDoc.email,
      wallet_balance: 0.00,
      account_status: 'Active',
      is_email_verified: false,
      is_phone_verified: false,
      invite_code: generatedInviteCode,
      referred_by: sponsorCode || 'DIRECT',
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
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
