import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 파비콘 관련 요청은 무시
  if (request.nextUrl.pathname.includes('favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isRootPage = request.nextUrl.pathname === '/';

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/license', request.url));
  }

  if (token && isRootPage) {
    return NextResponse.redirect(new URL('/license', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.ico|.*\\.png).*)'
  ]
}