import { NextResponse } from 'next/server';
import { connectToDatabase, User, Promotion } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export const SYSTEM_INVITE_CODES = [
  'VIP777',
  'VEGAS100',
  'TIERLOCK',
  'BONUS50',
  'PLAY777',
  'VEGAS777',
  '1AZU1O',
  '1AZU10',
];

export async function checkInviteCode(code) {
  if (!code || typeof code !== 'string') return null;
  const clean = code.trim().toUpperCase();
  if (!clean) return null;

  // 1. Check system default master codes
  if (SYSTEM_INVITE_CODES.includes(clean)) {
    return {
      valid: true,
      code: clean,
      sponsor: 'Official VIP Sponsor',
      isSystemCode: true,
    };
  }

  await connectToDatabase();

  // 2. Check existing user referral codes
  const user = await User.findOne({
    $or: [
      { invite_code: new RegExp(`^${clean}$`, 'i') },
      { username: new RegExp(`^${clean}$`, 'i') }
    ]
  });

  if (user) {
    return {
      valid: true,
      code: user.invite_code || clean,
      sponsor: user.username,
      sponsorId: user._id.toString(),
      isSystemCode: false,
    };
  }

  // 3. Check active promotions
  const promo = await Promotion.findOne({ promo_code: new RegExp(`^${clean}$`, 'i') });
  if (promo) {
    return {
      valid: true,
      code: promo.promo_code.toUpperCase(),
      sponsor: promo.title || 'VIP Promotion',
      isSystemCode: true,
    };
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || searchParams.get('ref') || searchParams.get('invite') || '';

    if (!code.trim()) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Please provide an invite code to validate.',
      }, { status: 400 });
    }

    const result = await checkInviteCode(code);
    if (result) {
      return NextResponse.json({
        success: true,
        valid: true,
        code: result.code,
        sponsor: result.sponsor,
        message: `Invite code verified! Sponsor: ${result.sponsor}`,
      });
    }

    return NextResponse.json({
      success: false,
      valid: false,
      message: 'Invalid invite code. Please enter a valid VIP invite code from your sponsor.',
    }, { status: 404 });
  } catch (error) {
    console.error('validate-invite GET error:', error);
    return NextResponse.json({ success: false, valid: false, message: 'Server error validating invite code.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const code = body.code || body.inviteCode || body.ref || '';

    if (!code.trim()) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Please enter an invite code.',
      }, { status: 400 });
    }

    const result = await checkInviteCode(code);
    if (result) {
      return NextResponse.json({
        success: true,
        valid: true,
        code: result.code,
        sponsor: result.sponsor,
        message: `Invite code verified! Sponsor: ${result.sponsor}`,
      });
    }

    return NextResponse.json({
      success: false,
      valid: false,
      message: 'Invalid invite code. Please enter a valid VIP invite code from your sponsor.',
    }, { status: 400 });
  } catch (error) {
    console.error('validate-invite POST error:', error);
    return NextResponse.json({ success: false, valid: false, message: 'Server error validating invite code.' }, { status: 500 });
  }
}
