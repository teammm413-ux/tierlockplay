import { NextResponse } from 'next/server';
import { connectToDatabase, Promotion } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const promotions = await Promotion.find({}).sort({ created_at: -1 });

    const safePromos = promotions.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      title: p.title,
      message: p.message,
      promo_code: p.promo_code || '',
      bonus_amount: Number(p.bonus_amount || 0),
      target_audience: p.target_audience || 'both',
      created_at: p.created_at,
    }));

    return NextResponse.json({ success: true, promotions: safePromos });
  } catch (error) {
    console.error('get client promotions error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
