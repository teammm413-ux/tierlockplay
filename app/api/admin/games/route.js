import { NextResponse } from 'next/server';
import { connectToDatabase, GamePlatform } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function checkAdmin(request) {
  const session = getSessionFromRequest(request);
  if (!session || !session.isAdmin) {
    return null;
  }
  return session;
}

// GET all game platforms for admin
export async function GET(request) {
  try {
    const admin = checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const games = await GamePlatform.find(filter).sort({ order_priority: 1, created_at: -1 });

    return NextResponse.json({
      success: true,
      games: games.map(g => ({
        id: g._id.toString(),
        _id: g._id.toString(),
        name: g.name,
        slug: g.slug,
        download_url: g.download_url,
        logo_url: g.logo_url,
        banner_image: g.banner_image,
        tagline: g.tagline,
        category: g.category,
        min_deposit: g.min_deposit,
        rtp: g.rtp,
        is_active: g.is_active,
        order_priority: g.order_priority,
        created_at: g.created_at,
      })),
      total: games.length
    });
  } catch (error) {
    console.error('Admin get games error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Add new game platform
export async function POST(request) {
  try {
    const admin = checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const {
      name,
      slug,
      download_url,
      logo_url,
      banner_image,
      tagline,
      category,
      min_deposit,
      rtp,
      is_active
    } = body;

    if (!name || !download_url) {
      return NextResponse.json({ success: false, message: 'Game name and download URL are required' }, { status: 400 });
    }

    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    // Check if game name or slug exists
    const existing = await GamePlatform.findOne({
      $or: [{ name: name.trim() }, { slug: finalSlug }]
    });
    if (existing) {
      return NextResponse.json({ success: false, message: 'A game platform with this name or slug already exists' }, { status: 400 });
    }

    const newGame = await GamePlatform.create({
      name: name.trim(),
      slug: finalSlug,
      download_url: download_url.trim(),
      logo_url: logo_url || '/images/games/juwa.jpg',
      banner_image: banner_image || '',
      tagline: tagline || '',
      category: category || 'Fish & Slots',
      min_deposit: Number(min_deposit) || 10,
      rtp: rtp || '97.0%',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      order_priority: (await GamePlatform.countDocuments()) + 1
    });

    return NextResponse.json({
      success: true,
      message: `Game platform "${newGame.name}" added successfully! It is now live on the player portal.`,
      game: newGame
    });
  } catch (error) {
    console.error('Admin create game error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Update game platform
export async function PUT(request) {
  try {
    const admin = checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { id, name, slug, download_url, logo_url, banner_image, tagline, category, min_deposit, rtp, is_active, order_priority } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Game ID is required' }, { status: 400 });
    }

    const game = await GamePlatform.findById(id);
    if (!game) {
      return NextResponse.json({ success: false, message: 'Game platform not found' }, { status: 404 });
    }

    if (name) game.name = name.trim();
    if (slug) game.slug = slug.trim();
    if (download_url) game.download_url = download_url.trim();
    if (logo_url !== undefined) game.logo_url = logo_url;
    if (banner_image !== undefined) game.banner_image = banner_image;
    if (tagline !== undefined) game.tagline = tagline;
    if (category !== undefined) game.category = category;
    if (min_deposit !== undefined) game.min_deposit = Number(min_deposit);
    if (rtp !== undefined) game.rtp = rtp;
    if (is_active !== undefined) game.is_active = Boolean(is_active);
    if (order_priority !== undefined) game.order_priority = Number(order_priority);

    await game.save();

    return NextResponse.json({
      success: true,
      message: `Game platform "${game.name}" updated successfully!`,
      game
    });
  } catch (error) {
    console.error('Admin update game error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete game platform
export async function DELETE(request) {
  try {
    const admin = checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Game ID is required' }, { status: 400 });
    }

    const deleted = await GamePlatform.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Game platform not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Game platform "${deleted.name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Admin delete game error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
