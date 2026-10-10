import { NextResponse } from 'next/server';
import { connectToDatabase, Promotion } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const latestPromo = await Promotion.findOne({}).sort({ created_at: -1 });

    if (!latestPromo) {
      return NextResponse.json({ success: true, promo: null });
    }

    return NextResponse.json({
      success: true,
      promo: {
        id: latestPromo._id.toString(),
        _id: latestPromo._id.toString(),
        title: latestPromo.title,
        message: latestPromo.message,
        promoCode: latestPromo.promo_code || '',
        bonusAmount: latestPromo.bonus_amount || 0,
        createdAt: latestPromo.created_at,
      },
    });
  } catch (error) {
    console.error('get latest promo error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
