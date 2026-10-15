import { NextResponse } from 'next/server';
import { connectToDatabase, DepositMethodConfig } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    let methods = await DepositMethodConfig.find({ is_active: true }).sort({ order_priority: 1, created_at: 1 }).lean();

    if (!methods || methods.length === 0) {
      // Return defaults if none in DB yet
      methods = [
        {
          _id: 'chime-default',
          name: 'Chime',
          type: 'manual',
          pay_url: 'https://chime.com',
          qr_image: '',
          account_tag: '$TierlockChime',
          instructions: 'Send deposit to our Chime tag or click the payment link. After transferring, upload your payment screenshot and enter your Chime tag below.',
          is_active: true,
          min_deposit: 2.00,
          max_deposit: 1000.00,
          order_priority: 1
        },
        {
          _id: 'paypal-default',
          name: 'PayPal',
          type: 'manual',
          pay_url: 'https://paypal.me',
          qr_image: '',
          account_tag: 'payments@tierlock.com',
          instructions: 'Send via Friends & Family to our PayPal account or click the link. After payment, upload confirmation screenshot and enter your PayPal username/email.',
          is_active: true,
          min_deposit: 2.00,
          max_deposit: 1000.00,
          order_priority: 2
        }
      ];
    }

    return NextResponse.json({
      success: true,
      methods: methods.map(m => ({
        id: m._id ? m._id.toString() : m.name,
        name: m.name,
        type: m.type || 'manual',
        pay_url: m.pay_url || '',
        qr_image: m.qr_image || '',
        account_tag: m.account_tag || '',
        instructions: m.instructions || '',
        min_deposit: m.min_deposit ?? 2.00,
        max_deposit: m.max_deposit ?? 1000.00,
      }))
    });
  } catch (error) {
    console.error('[Get Deposit Methods Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
