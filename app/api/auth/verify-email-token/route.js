import { NextResponse } from 'next/server';
import { connectToDatabase, User, Otp } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    const body = await request.json();
    let { email, token } = body;

    if (!email && session && session.id) {
      const user = await User.findById(session.id);
      if (user) email = user.email;
    }

    if (!email) {
      const defaultUser = await User.findOne({ username: 'alex' }) || await User.findOne({});
      if (defaultUser) email = defaultUser.email;
    }

    if (!email || !token) {
      return NextResponse.json({ success: false, message: 'Email and 6-digit token are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    const record = await Otp.findOne({
      identifier: cleanEmail,
      code: cleanToken,
      type: 'email'
    }).sort({ created_at: -1 });

    if (!record) {
      return NextResponse.json({ success: false, message: 'Invalid or incorrect verification token' }, { status: 400 });
    }

    if (Date.now() > record.expires_at) {
      return NextResponse.json({ success: false, message: 'Verification token has expired. Please request a new one.' }, { status: 400 });
    }

    // Mark email as verified in MongoDB User collection
    await User.updateMany(
      { email: new RegExp(`^${cleanEmail}$`, 'i') },
      { $set: { is_email_verified: true } }
    );

    // Delete used OTP
    await Otp.findByIdAndDelete(record._id);

    return NextResponse.json({
      success: true,
      message: 'Email address successfully verified! Your account is now fully secured.',
      email: cleanEmail,
    });
  } catch (error) {
    console.error('verify-email-token error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
