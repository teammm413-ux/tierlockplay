import { NextResponse } from 'next/server';
import { connectToDatabase, User, Otp } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    const body = await request.json().catch(() => ({}));
    let email = body.email;
    let username = body.username || 'Player';

    if (session && session.id) {
      const user = await User.findById(session.id);
      if (user) {
        email = user.email;
        username = user.username;
      }
    }

    if (!email) {
      const defaultUser = await User.findOne({ username: 'alex' }) || await User.findOne({});
      if (defaultUser) {
        email = defaultUser.email;
        username = defaultUser.username;
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address is required' }, { status: 400 });
    }

    // Generate 6-digit token (e.g. 900866 as shown in screenshot)
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Invalidate previous tokens in MongoDB
    await Otp.deleteMany({ identifier: email.trim().toLowerCase(), type: 'email' });
    await Otp.create({
      identifier: email.trim().toLowerCase(),
      code: token,
      type: 'email',
      expires_at: expiresAt,
    });

    const mailRes = await sendVerificationEmail(email.trim().toLowerCase(), username, token);

    if (!mailRes.success && !mailRes.simulated) {
      return NextResponse.json({
        success: false,
        message: `SMTP Delivery Failed: ${mailRes.error}. Please check Hostinger SMTP settings in .env.local`,
        error: mailRes.error,
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: mailRes.simulated ? token : undefined,
      message: mailRes.simulated
        ? `[Dev Mode] Real SMTP credentials not set yet. Verification code: ${token}`
        : `Verification code successfully sent to ${email} via Hostinger Business Email in real-time!`,
      email,
      simulated: !!mailRes.simulated,
    });
  } catch (error) {
    console.error('send-email-token error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
