import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth/twitter/callback')) {
    console.log('Middleware intercepting Twitter callback:', request.nextUrl.toString());
    
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search, 
      'https://socialtagbackend.onrender.com'
    );

    console.log('Redirecting to:', url.toString());
    
    return NextResponse.rewrite(url);
  }

  // For all other API routes, use the existing rewrite
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const url = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      'https://socialtagbackend.onrender.com'
    );
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ]
}