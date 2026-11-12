import { NextResponse } from 'next/server';

/**
 * Redirect marketing/root domain to the player app subdomain.
 * tierlockplay.com / www.tierlockplay.com → https://app.tierlockplay.com
 */
export function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];

  if (host === 'tierlockplay.com' || host === 'www.tierlockplay.com') {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const target = new URL(`https://app.tierlockplay.com${pathname}${search}`);
    return NextResponse.redirect(target, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
