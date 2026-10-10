import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);

    let user = null;
    if (session && session.id) {
      user = await User.findById(session.id);
    }
    if (!user) {
      // Fallback for demo/active player
      user = await User.findOne({ username: 'alex' }) || await User.findOne({});
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const legalName = formData.get('legal_name')?.toString()?.trim();
    const dob = formData.get('dob')?.toString()?.trim() || '';
    const idType = formData.get('id_type')?.toString()?.trim() || 'Driver License';
    const idNumber = formData.get('id_number')?.toString()?.trim() || '';

    const frontFile = formData.get('front_image');
    const backFile = formData.get('back_image');
    const selfieFile = formData.get('selfie_image');

    if (!legalName) {
      return NextResponse.json({ success: false, message: 'Full legal name is required' }, { status: 400 });
    }
    if (!idNumber) {
      return NextResponse.json({ success: false, message: 'ID document number is required' }, { status: 400 });
    }
    if (!frontFile || typeof frontFile === 'string') {
      return NextResponse.json({ success: false, message: 'Front photo of your ID document is required' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
    await fs.mkdir(uploadDir, { recursive: true });

    const saveFile = async (file, prefix) => {
      if (!file || typeof file === 'string') return null;
      const mime = file.type || '';
      if (!mime.startsWith('image/')) {
        throw new Error(`File ${file.name || prefix} must be an image format (JPG, PNG, WebP)`);
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name || '') || '.jpg';
      const fileName = `${prefix}-${user._id}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      return `/uploads/kyc/${fileName}`;
    };

    const frontPath = await saveFile(frontFile, 'id-front');
    let backPath = user.kyc_back_image || '';
    if (backFile && typeof backFile !== 'string') {
      backPath = await saveFile(backFile, 'id-back');
    }

    let selfiePath = user.kyc_selfie_image || '';
    if (selfieFile && typeof selfieFile !== 'string') {
      selfiePath = await saveFile(selfieFile, 'id-selfie');
    }

    user.kyc_name = legalName;
    user.kyc_dob = dob;
    user.kyc_id_type = idType;
    user.kyc_id_number = idNumber;
    user.kyc_front_image = frontPath;
    user.kyc_back_image = backPath;
    user.kyc_selfie_image = selfiePath;
    user.kyc_status = 'PENDING';
    user.kyc_submitted_at = new Date();
    user.kyc_rejection_reason = '';
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'KYC documents successfully submitted! Your verification is now pending admin review.',
      kyc_status: 'PENDING',
      kyc: {
        legal_name: user.kyc_name,
        id_type: user.kyc_id_type,
        id_number: user.kyc_id_number,
        front_image: user.kyc_front_image,
        back_image: user.kyc_back_image,
        selfie_image: user.kyc_selfie_image,
        status: user.kyc_status,
        submitted_at: user.kyc_submitted_at,
      }
    });
  } catch (error) {
    console.error('KYC Submit Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
