import { NextResponse } from 'next/server';
import { connectToDatabase, User, Otp } from '@/lib/mongodb';
import { sendSmsOtp } from '@/lib/twilio';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    const body = await request.json();
    let { phone } = body;

    if (!phone && session && session.id) {
      const user = await User.findById(session.id);
      if (user && user.phone) phone = user.phone;
    }

    if (!phone) {
      const defaultUser = await User.findOne({ username: 'alex' }) || await User.findOne({});
      if (defaultUser && defaultUser.phone) phone = defaultUser.phone;
    }

    if (!phone) {
      return NextResponse.json({ success: false, message: 'USA phone number is required (e.g. +1 202-555-0192)' }, { status: 400 });
    }

    // Format phone to E.164
    let clean = phone.replace(/\D/g, '');
    if (!clean.startsWith('1') && clean.length === 10) {
      clean = '1' + clean;
    }
    const e164Phone = `+${clean}`;

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Invalidate prior OTPs
    await Otp.deleteMany({ identifier: e164Phone, type: 'phone' });
    await Otp.create({
      identifier: e164Phone,
      code,
      type: 'phone',
      expires_at: expiresAt,
    });

    const smsRes = await sendSmsOtp(e164Phone, code);

    return NextResponse.json({
      success: true,
      message: smsRes.message,
      phone: e164Phone,
      simulated: smsRes.simulated,
      debugCode: smsRes.simulated ? code : undefined,
    });
  } catch (error) {
    console.error('send-phone-otp error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
