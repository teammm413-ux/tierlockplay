import { NextResponse } from 'next/server';
import { connectToDatabase, DepositMethodConfig } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    let methods = await DepositMethodConfig.find().sort({ order_priority: 1, created_at: 1 }).lean();

    // If empty, auto-seed defaults
    if (!methods || methods.length === 0) {
      await DepositMethodConfig.insertMany([
        {
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
      ]);
      methods = await DepositMethodConfig.find().sort({ order_priority: 1, created_at: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      methods: methods.map(m => ({
        id: m._id.toString(),
        name: m.name,
        type: m.type || 'manual',
        pay_url: m.pay_url || '',
        qr_image: m.qr_image || '',
        account_tag: m.account_tag || '',
        instructions: m.instructions || '',
        is_active: Boolean(m.is_active),
        min_deposit: m.min_deposit ?? 2.00,
        max_deposit: m.max_deposit ?? 1000.00,
        order_priority: m.order_priority ?? 0,
      }))
    });
  } catch (error) {
    console.error('[Admin Get Deposit Methods Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { id, name, pay_url, qr_image, account_tag, instructions, is_active, min_deposit, max_deposit, order_priority } = body;

    let method = null;
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      method = await DepositMethodConfig.findById(id);
    }
    if (!method && name) {
      method = await DepositMethodConfig.findOne({ name });
    }

    if (method) {
      if (name !== undefined) method.name = name.trim();
      if (pay_url !== undefined) method.pay_url = pay_url.trim();
      if (qr_image !== undefined) method.qr_image = qr_image.trim();
      if (account_tag !== undefined) method.account_tag = account_tag.trim();
      if (instructions !== undefined) method.instructions = instructions.trim();
      if (is_active !== undefined) method.is_active = Boolean(is_active);
      if (min_deposit !== undefined) method.min_deposit = parseFloat(min_deposit) || 2.00;
      if (max_deposit !== undefined) method.max_deposit = parseFloat(max_deposit) || 1000.00;
      if (order_priority !== undefined) method.order_priority = parseInt(order_priority) || 0;
      method.updated_at = new Date();
      await method.save();

      return NextResponse.json({
        success: true,
        message: `${method.name} deposit settings updated successfully!`,
        method: {
          id: method._id.toString(),
          name: method.name,
          type: method.type,
          pay_url: method.pay_url,
          qr_image: method.qr_image,
          account_tag: method.account_tag,
          instructions: method.instructions,
          is_active: method.is_active,
          min_deposit: method.min_deposit,
          max_deposit: method.max_deposit,
          order_priority: method.order_priority,
        }
      });
    } else {
      if (!name) {
        return NextResponse.json({ success: false, message: 'Payment method name is required' }, { status: 400 });
      }

      const newMethod = await DepositMethodConfig.create({
        name: name.trim(),
        type: 'manual',
        pay_url: (pay_url || '').trim(),
        qr_image: (qr_image || '').trim(),
        account_tag: (account_tag || '').trim(),
        instructions: (instructions || '').trim(),
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        min_deposit: parseFloat(min_deposit) || 2.00,
        max_deposit: parseFloat(max_deposit) || 1000.00,
        order_priority: parseInt(order_priority) || 0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: `${newMethod.name} deposit method created!`,
        method: {
          id: newMethod._id.toString(),
          name: newMethod.name,
          type: newMethod.type,
          pay_url: newMethod.pay_url,
          qr_image: newMethod.qr_image,
          account_tag: newMethod.account_tag,
          instructions: newMethod.instructions,
          is_active: newMethod.is_active,
          min_deposit: newMethod.min_deposit,
          max_deposit: newMethod.max_deposit,
          order_priority: newMethod.order_priority,
        }
      });
    }
  } catch (error) {
    console.error('[Admin Save Deposit Method Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
