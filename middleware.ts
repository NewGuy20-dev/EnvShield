import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Ensure cookies work properly for Better Auth OAuth flow
  // This helps with state persistence across redirects
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  
  if (isAuthRoute) {
    // Set cookie headers to be more permissive for OAuth flows
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Ensure state cookies are preserved
    const cookies = request.cookies.getAll();
    cookies.forEach((cookie) => {
      if (cookie.name.includes('state') || cookie.name.includes('envshield')) {
        response.cookies.set(cookie.name, cookie.value, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
