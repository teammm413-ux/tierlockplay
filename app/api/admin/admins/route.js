import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, Admin } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const admins = await Admin.find({}).sort({ created_at: 1 });

    const safeAdmins = admins.map(a => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      username: a.username,
      email: a.email,
      role: a.role || 'admin',
      created_at: a.created_at,
    }));

    return NextResponse.json({ success: true, admins: safeAdmins });
  } catch (error) {
    console.error('get admins error:', error);
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
    const { username, email, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, message: 'Username, email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectToDatabase();

    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username/email exists
    const check = await Admin.findOne({
      $or: [
        { username: new RegExp(`^${cleanUser}$`, 'i') },
        { email: cleanEmail }
      ]
    });

    if (check) {
      return NextResponse.json({ success: false, message: 'An admin with this username or email already exists' }, { status: 400 });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const newAdmin = await Admin.create({
      username: cleanUser,
      email: cleanEmail,
      password: hashed,
      role: role || 'admin',
    });

    return NextResponse.json({
      success: true,
      message: `Admin '${cleanUser}' created successfully!`,
      admin: {
        id: newAdmin._id.toString(),
        _id: newAdmin._id.toString(),
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role || 'admin',
      },
    });
  } catch (error) {
    console.error('create admin error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
