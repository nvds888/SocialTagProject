import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Add debug logging
    console.log('Incoming request:', request.nextUrl.pathname);
  
    if (request.nextUrl.pathname.startsWith('/api/auth/twitter/callback')) {
      // Remove the /api prefix when forwarding to backend
      const pathWithoutApi = request.nextUrl.pathname.replace('/api', '');
      const url = new URL(
        pathWithoutApi + request.nextUrl.search, 
        'https://socialtagbackend.onrender.com'
      );
  
      console.log('Rewriting to:', url.toString());
      return NextResponse.rewrite(url);
    }
  
    // For other API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const pathWithoutApi = request.nextUrl.pathname.replace('/api', '');
      const url = new URL(
        pathWithoutApi + request.nextUrl.search,
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