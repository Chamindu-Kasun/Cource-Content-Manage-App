import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware - checking path:', request.nextUrl.pathname);
    
    // Simple session check - just look for the auth cookie
    const sessionCookie = request.cookies.get('admin-session')?.value;
    console.log('Middleware - session exists:', !!sessionCookie);

    if (!sessionCookie || sessionCookie !== 'authenticated') {
      console.log('Middleware - no valid session, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Middleware - session valid, allowing access');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};