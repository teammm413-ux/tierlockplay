import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please sign in.' }, { status: 401 });
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

    // Limit size to 10MB
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image size must be under 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(bytes);

    const origName = file.name || 'proof.png';
    const ext = path.extname(origName) || '.png';
    const cleanBase = path.basename(origName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30);
    const fileName = `${Date.now()}-${session.username || 'user'}-${cleanBase}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'deposits');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/deposits/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully!',
      url: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('[Upload Proof Error]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
