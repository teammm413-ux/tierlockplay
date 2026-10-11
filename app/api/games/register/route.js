import { NextResponse } from 'next/server';
import { connectToDatabase, User, GameTransaction, UserGameAccount, GamePlatform } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

function generateOrderNo(prefix = 'REG') {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(100000000000 + Math.random() * 900000000000);
  return `${prefix}${y}${m}${day}${rand}`;
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { platformName } = body;

    if (!platformName || !platformName.trim()) {
      return NextResponse.json({ success: false, message: 'Game platform name is required' }, { status: 400 });
    }

    const platform = await GamePlatform.findOne({ name: platformName.trim() });
    if (!platform || platform.is_active === false) {
      return NextResponse.json({
        success: false,
        message: `Platform "${platformName}" is currently unavailable.`,
      }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 1. Check if user already has an existing account for this platform
    const existingAccount = await UserGameAccount.findOne({
      user_id: user._id.toString(),
      platform_name: platformName.trim()
    });

    if (existingAccount && existingAccount.game_username) {
      return NextResponse.json({
        success: false,
        message: `You already have an active account for ${platformName} (Username: ${existingAccount.game_username}). You can load credits directly.`,
      }, { status: 400 });
    }

    // 2. Check if user already has any pending request
    const existingPending = await GameTransaction.findOne({
      user_id: user._id.toString(),
      status: 'Pending',
    });

    if (existingPending) {
      return NextResponse.json({
        success: false,
        message: `You already have an active request in review (${existingPending.platform_name} - ${existingPending.type}). Please wait for admin approval before submitting another request.`,
      }, { status: 400 });
    }

    const orderNo = generateOrderNo('REG');

    // Create a pending Registration transaction
    const tx = await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Register',
      platform_name: platformName.trim(),
      game_account: '',
      game_username: '',
      game_password: '',
      amount: 0,
      status: 'Pending',
      api_dispatch_status: 'Manual',
      wallet_balance_before: user.wallet_balance || 0,
      wallet_balance_after: user.wallet_balance || 0,
      admin_notes: 'New player game account registration requested',
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Account creation request for ${platformName} submitted! Admin will create your game account and provide credentials.`,
      orderNo: tx.order_no,
      platformName: tx.platform_name,
      status: 'Pending',
    });
  } catch (error) {
    console.error('game registration request error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
