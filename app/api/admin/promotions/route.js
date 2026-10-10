import { NextResponse } from 'next/server';
import { connectToDatabase, Promotion, User, ChromeNotification } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { sendPromoEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const campaigns = await Promotion.find({}).sort({ created_at: -1 });

    const totalSubscribers = await User.countDocuments({ is_subscribed: true });
    const totalUnsubscribers = await User.countDocuments({ is_subscribed: false });
    const totalPlayers = await User.countDocuments({});

    const stats = {
      totalSubscribers,
      totalUnsubscribers,
      totalPlayers,
    };

    const safeCampaigns = campaigns.map(c => ({
      id: c._id.toString(),
      _id: c._id.toString(),
      title: c.title,
      message: c.message,
      promo_code: c.promo_code || '',
      bonus_amount: c.bonus_amount || 0,
      target_audience: c.target_audience,
      delivery_channel: c.delivery_channel,
      total_sent: c.total_sent || 0,
      created_at: c.created_at,
    }));

    return NextResponse.json({ success: true, campaigns: safeCampaigns, stats });
  } catch (error) {
    console.error('get promotions error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, promoCode, bonusAmount, targetAudience, deliveryChannel } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and promo message are required' }, { status: 400 });
    }

    // targetAudience: 'subscribers' | 'unsubscribers' | 'both'
    // deliveryChannel: 'chrome' | 'email' | 'both'
    const audience = targetAudience || 'both';
    const channel = deliveryChannel || 'both';
    const bonus = parseFloat(bonusAmount) || 0.00;

    await connectToDatabase();

    // Query targeted users in MongoDB
    const userFilter = {};
    if (audience === 'subscribers') {
      userFilter.is_subscribed = true;
    } else if (audience === 'unsubscribers') {
      userFilter.is_subscribed = false;
    }

    const targetUsers = await User.find(userFilter);
    let totalSent = targetUsers.length;

    // 1. Delivery via Chrome Notifications (if channel is 'chrome' or 'both')
    if (channel === 'chrome' || channel === 'both') {
      for (const u of targetUsers) {
        await ChromeNotification.create({
          user_id: u._id.toString(),
          title: `🎁 ${title}`,
          message: `${message}${promoCode ? ` Use Code: ${promoCode}` : ''}${bonus > 0 ? ` | +$${bonus} Free Bonus!` : ''}`,
          promo_code: promoCode || '',
        });
      }
    }

    // 2. Delivery via Real SMTP Email (if channel is 'email' or 'both')
    if (channel === 'email' || channel === 'both') {
      const emailDispatches = [];
      for (const u of targetUsers) {
        if (u.email) {
          emailDispatches.push(
            sendPromoEmail(
              u.email,
              `🎁 Vegas Vault VIP Bonus: ${title}`,
              title,
              message,
              promoCode,
              bonus
            )
          );
        }
      }
      await Promise.allSettled(emailDispatches);
    }

    // Record promotion in MongoDB
    const promoDoc = await Promotion.create({
      title,
      message,
      promo_code: promoCode || '',
      bonus_amount: bonus,
      target_audience: audience,
      delivery_channel: channel,
      total_sent: totalSent,
    });

    return NextResponse.json({
      success: true,
      message: `Promotional campaign successfully dispatched to ${totalSent} players!`,
      campaign: {
        id: promoDoc._id.toString(),
        _id: promoDoc._id.toString(),
        title,
        audience,
        channel,
        totalSent,
      },
    });
  } catch (error) {
    console.error('dispatch promo error:', error);
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
      return NextResponse.json({ success: false, message: 'Promotion ID is required' }, { status: 400 });
    }

    const deleted = await Promotion.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Promotion not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Promotion "${deleted.title}" deleted successfully.`
    });
  } catch (error) {
    console.error('delete promo error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
