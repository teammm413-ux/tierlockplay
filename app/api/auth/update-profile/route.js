import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const { kyc_name, kyc_status, phone, email, is_subscribed } = body;

    let user = null;
    if (session && session.id) {
      user = await User.findById(session.id);
    }
    if (!user) {
      user = await User.findOne({ username: 'alex' }) || await User.findOne({});
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (kyc_name !== undefined) {
      user.kyc_name = kyc_name.trim();
    }

    if (kyc_status !== undefined) {
      user.kyc_status = kyc_status;
    }

    if (email !== undefined && email.trim()) {
      user.email = email.trim().toLowerCase();
      user.is_email_verified = false;
    }

    if (phone !== undefined) {
      let clean = phone.replace(/\D/g, '');
      if (clean && !clean.startsWith('1') && clean.length === 10) clean = '1' + clean;
      user.phone = clean ? `+${clean}` : '';
    }

    if (is_subscribed !== undefined) {
      user.is_subscribed = !!is_subscribed;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        phone: user.phone,
        kyc_name: user.kyc_name,
        kyc_status: user.kyc_status,
        is_email_verified: user.is_email_verified,
        is_phone_verified: user.is_phone_verified,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
