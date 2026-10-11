import { NextResponse } from 'next/server';
import { connectToDatabase, WithdrawalMethodConfig } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_METHODS = [
  {
    name: 'Cash App',
    field_label: '$Cashtag',
    field_placeholder: 'e.g. $JohnDoe',
    instructions: 'Start with $. Must begin with a letter, up to 20 characters.',
    is_active: true,
    order_priority: 1
  },
  {
    name: 'Chime',
    field_label: 'Chime Sign / Email / Phone',
    field_placeholder: 'e.g. $ChimeSign or email@example.com',
    instructions: 'Enter your registered Chime Sign, email, or mobile phone.',
    is_active: true,
    order_priority: 2
  },
  {
    name: 'Apple Pay',
    field_label: 'Apple Pay Phone / Email',
    field_placeholder: 'e.g. +1 555-0199 or appleid@icloud.com',
    instructions: 'Enter your Apple Pay registered phone number or Apple ID.',
    is_active: true,
    order_priority: 3
  },
  {
    name: 'Google Pay',
    field_label: 'Google Pay Phone / Email',
    field_placeholder: 'e.g. +1 555-0199 or gpay@gmail.com',
    instructions: 'Enter your Google Pay registered mobile phone or Gmail address.',
    is_active: true,
    order_priority: 4
  },
  {
    name: 'PayPal',
    field_label: 'PayPal Email / Phone',
    field_placeholder: 'e.g. paypal@example.com',
    instructions: 'Enter your registered PayPal email address or phone number.',
    is_active: true,
    order_priority: 5
  }
];

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    let methods = await WithdrawalMethodConfig.find({}).sort({ order_priority: 1, created_at: 1 }).lean();

    // If empty, auto-seed defaults
    if (!methods || methods.length === 0) {
      await WithdrawalMethodConfig.insertMany(DEFAULT_METHODS);
      methods = await WithdrawalMethodConfig.find({}).sort({ order_priority: 1, created_at: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      methods: methods.map(m => ({
        id: m._id.toString(),
        name: m.name,
        field_label: m.field_label || 'Account / Tag',
        field_placeholder: m.field_placeholder || 'Enter account detail',
        instructions: m.instructions || '',
        is_active: m.is_active !== false,
        order_priority: m.order_priority || 0,
        created_at: m.created_at
      }))
    });
  } catch (error) {
    console.error('[Admin Withdrawal Methods GET]', error);
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
    const { name, field_label, field_placeholder, instructions, order_priority } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Payment method name is required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await WithdrawalMethodConfig.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return NextResponse.json({ success: false, message: `Payment method '${name.trim()}' already exists` }, { status: 400 });
    }

    const newMethod = await WithdrawalMethodConfig.create({
      name: name.trim(),
      field_label: field_label?.trim() || 'Account / Tag',
      field_placeholder: field_placeholder?.trim() || 'Enter account details',
      instructions: instructions?.trim() || '',
      is_active: true,
      order_priority: typeof order_priority === 'number' ? order_priority : 10,
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal payment method '${newMethod.name}' added successfully!`,
      method: {
        id: newMethod._id.toString(),
        name: newMethod.name,
        field_label: newMethod.field_label,
        field_placeholder: newMethod.field_placeholder,
        instructions: newMethod.instructions,
        is_active: newMethod.is_active,
        order_priority: newMethod.order_priority
      }
    });
  } catch (error) {
    console.error('[Admin Withdrawal Methods POST]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { id, is_active, name, field_label, field_placeholder, instructions } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Method ID is required' }, { status: 400 });
    }

    const updateFields = {};
    if (typeof is_active === 'boolean') updateFields.is_active = is_active;
    if (name) updateFields.name = name.trim();
    if (field_label !== undefined) updateFields.field_label = field_label.trim();
    if (field_placeholder !== undefined) updateFields.field_placeholder = field_placeholder.trim();
    if (instructions !== undefined) updateFields.instructions = instructions.trim();

    const updated = await WithdrawalMethodConfig.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment method '${updated.name}' updated!`,
      method: {
        id: updated._id.toString(),
        name: updated.name,
        is_active: updated.is_active
      }
    });
  } catch (error) {
    console.error('[Admin Withdrawal Methods PATCH]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Method ID is required' }, { status: 400 });
    }

    const deleted = await WithdrawalMethodConfig.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Payment method '${deleted.name}' removed successfully!`
    });
  } catch (error) {
    console.error('[Admin Withdrawal Methods DELETE]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
