import { NextResponse } from 'next/server';
import { connectToDatabase, PaymentMethod } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const methods = await PaymentMethod.find({ user_id: session.id }).sort({ created_at: -1 }).lean();

    return NextResponse.json({
      success: true,
      methods: methods.map((m) => ({
        id: m._id.toString(),
        type: m.type,
        account_identifier: m.account_identifier,
        is_default: m.is_default ? 1 : 0,
      })),
    });
  } catch (error) {
    console.error('get payment-methods error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, accountIdentifier, isDefault } = body;

    if (!type || !accountIdentifier) {
      return NextResponse.json({ success: false, message: 'Payment type and account identifier are required' }, { status: 400 });
    }

    await connectToDatabase();

    if (isDefault) {
      await PaymentMethod.updateMany({ user_id: session.id }, { is_default: false });
    }

    const newMethod = await PaymentMethod.create({
      user_id: session.id,
      type,
      account_identifier: accountIdentifier.trim(),
      is_default: !!isDefault,
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method saved successfully!',
      id: newMethod._id.toString(),
    });
  } catch (error) {
    console.error('add payment-method error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
