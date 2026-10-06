import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'New password must be at least 6 characters' }, { status: 400 });
    }

    let user = null;
    if (session && session.id) {
      user = await User.findById(session.id);
    }
    if (!user) {
      user = await User.findOne({ username: 'alex' }) || await User.findOne({});
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 400 });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
