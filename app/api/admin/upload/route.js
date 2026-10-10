import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const mime = file.type || '';
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ success: false, message: 'File must be an image (JPEG, PNG, WebP, etc.)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file name
    const origName = file.name || 'game-logo.png';
    const ext = path.extname(origName) || '.png';
    const cleanBase = path.basename(origName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
    const fileName = `${Date.now()}-${cleanBase}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'games');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/games/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully!',
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
