import { NextResponse } from 'next/server';
import { connectToDatabase, User, Otp } from '@/lib/mongodb';
import { sendPasswordResetEmail } from '@/lib/mailer';

const GENERIC_OK =
  'If an account exists with that username or email, we sent a 6-digit reset code to the registered email address.';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const raw = (body.usernameOrEmail || body.email || '').trim();

    if (!raw) {
      return NextResponse.json({ success: false, message: 'Username or email is required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [{ username: new RegExp(`^${escapeRegex(raw)}$`, 'i') }, { email: new RegExp(`^${escapeRegex(raw)}$`, 'i') }],
    });

    if (!user || !user.email) {
      return NextResponse.json({
        success: true,
        message: GENERIC_OK,
        maskedEmail: null,
      });
    }

    const email = user.email.trim().toLowerCase();
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await Otp.deleteMany({ identifier: email, type: 'password_reset' });
    await Otp.create({
      identifier: email,
      code: token,
      type: 'password_reset',
      expires_at: expiresAt,
    });

    const mailRes = await sendPasswordResetEmail(email, user.username, token);

    if (!mailRes.success && !mailRes.simulated) {
      return NextResponse.json({
        success: false,
        message: `Could not send reset email. ${mailRes.error || 'Check SMTP settings.'}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: mailRes.simulated
        ? `[Dev Mode] Reset code generated. Check server logs or response.`
        : `Reset code sent to ${maskEmail(email)}.`,
      email,
      maskedEmail: maskEmail(email),
      simulated: !!mailRes.simulated,
      token: mailRes.simulated ? token : undefined,
    });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.length <= 2 ? '*' : local.slice(0, 2);
  return `${visible}***@${domain}`;
}
