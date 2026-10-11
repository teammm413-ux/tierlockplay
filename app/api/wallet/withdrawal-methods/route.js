import { NextResponse } from 'next/server';
import { connectToDatabase, WithdrawalMethodConfig } from '@/lib/mongodb';

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

export async function GET() {
  try {
    await connectToDatabase();
    let methods = await WithdrawalMethodConfig.find({ is_active: true }).sort({ order_priority: 1, created_at: 1 }).lean();

    if (!methods || methods.length === 0) {
      // Check if any exist at all
      const totalCount = await WithdrawalMethodConfig.countDocuments();
      if (totalCount === 0) {
        await WithdrawalMethodConfig.insertMany(DEFAULT_METHODS);
        methods = await WithdrawalMethodConfig.find({ is_active: true }).sort({ order_priority: 1, created_at: 1 }).lean();
      } else {
        // All were disabled, fallback to empty array
        methods = [];
      }
    }

    return NextResponse.json({
      success: true,
      methods: (methods && methods.length > 0 ? methods : DEFAULT_METHODS).map((m, idx) => ({
        id: m._id ? m._id.toString() : `default-${idx}`,
        name: m.name,
        field_label: m.field_label || 'Account / Tag',
        field_placeholder: m.field_placeholder || 'Enter account detail',
        instructions: m.instructions || '',
      }))
    });
  } catch (error) {
    console.error('[Public Withdrawal Methods GET]', error);
    // Graceful fallback to default 5 methods
    return NextResponse.json({
      success: true,
      methods: DEFAULT_METHODS.map((m, idx) => ({
        id: `fallback-${idx}`,
        name: m.name,
        field_label: m.field_label,
        field_placeholder: m.field_placeholder,
        instructions: m.instructions,
      }))
    });
  }
}
