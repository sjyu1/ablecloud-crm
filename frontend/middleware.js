import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.[^/]+$/.test(pathname);

  if (isStaticAsset || isApiRoute) {
    return NextResponse.next();
  }

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
