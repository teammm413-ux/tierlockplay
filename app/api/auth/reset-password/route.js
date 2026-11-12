import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User, Otp } from '@/lib/mongodb';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const token = (body.token || body.code || '').trim();
    const newPassword = body.newPassword || '';

    if (!email || !token || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'Email, 6-digit code, and new password are required',
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const record = await Otp.findOne({
      identifier: email,
      code: token,
      type: 'password_reset',
    }).sort({ created_at: -1 });

    if (!record) {
      return NextResponse.json({ success: false, message: 'Invalid or incorrect reset code' }, { status: 400 });
    }

    if (Date.now() > record.expires_at) {
      return NextResponse.json({ success: false, message: 'Reset code expired. Request a new code.' }, { status: 400 });
    }

    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    await Otp.findByIdAndDelete(record._id);

    return NextResponse.json({
      success: true,
      message: 'Password updated! You can sign in with your new password.',
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
