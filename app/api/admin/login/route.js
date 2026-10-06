import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, Admin } from '@/lib/mongodb';
import { signAdminToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
    }

    await connectToDatabase();
    const trimmedUser = username.trim();

    // 1. Check against ENV credentials first
    const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
    const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (trimmedUser === envAdminUser && password === envAdminPass) {
      // Find or create admin record in MongoDB
      let admin = await Admin.findOne({ username: envAdminUser });
      if (!admin) {
        const hashed = bcrypt.hashSync(envAdminPass, 10);
        admin = await Admin.create({
          username: envAdminUser,
          email: process.env.ADMIN_EMAIL || 'admin@vegasvault.com',
          password: hashed,
          role: 'superadmin',
        });
      }

      const safeAdmin = {
        id: admin._id.toString(),
        _id: admin._id.toString(),
        username: admin.username,
        email: admin.email,
        role: admin.role,
      };

      const token = signAdminToken(safeAdmin);
      const response = NextResponse.json({
        success: true,
        message: 'Admin authentication successful! (Authenticated via ENV/Master)',
        admin: safeAdmin,
      });

      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 2. Check against MongoDB admins table (for admins created via Admin Panel UI)
    const admin = await Admin.findOne({
      $or: [
        { username: new RegExp(`^${trimmedUser}$`, 'i') },
        { email: trimmedUser.toLowerCase() }
      ]
    });

    if (!admin) {
      return NextResponse.json({ success: false, message: 'Invalid admin credentials' }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid admin credentials' }, { status: 401 });
    }

    const safeAdmin = {
      id: admin._id.toString(),
      _id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role,
    };

    const token = signAdminToken(safeAdmin);
    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful!',
      admin: safeAdmin,
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
