import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('user_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
  return response;
}
