import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    let isAllowed = false;
    let senderName = 'user';

    if (session) {
      isAllowed = true;
      senderName = session.username || (session.isAdmin ? 'admin' : 'user');
    } else {
      const host = request.headers.get('host') || '';
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        isAllowed = true;
        senderName = 'dev-user';
      }
    }

    if (!isAllowed) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const mime = file.type || '';
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ success: false, message: 'Only image files (JPG, PNG, WebP, GIF) are allowed.' }, { status: 400 });
    }

    // Limit size to 15MB
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image size must be under 15MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    const origName = file.name || 'image.png';
    const ext = path.extname(origName) || '.png';
    const cleanBase = path.basename(origName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 35);
    const fileName = `${Date.now()}-${senderName.replace(/[^a-z0-9_-]/gi, '')}-${cleanBase}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/chat/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully!',
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('[Chat Upload Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
