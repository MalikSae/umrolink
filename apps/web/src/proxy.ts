import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const response = NextResponse.next();

  // 1. Referral Cookie (Last-click, 30 hari)
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref) {
    // Clone URL to remove ref query param
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('ref');
    
    // Create redirect response
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    
    // Set cookie on the redirect response
    redirectResponse.cookies.set('umrolink_ref', ref, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    });
    
    return redirectResponse;
  }

  // 2. Dashboard Auth Check
  if (url.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('umrolink_token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
