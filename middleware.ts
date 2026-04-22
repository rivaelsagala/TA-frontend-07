import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false // Sesuai dengan useSecureCookies
  });

  // Debugging penting
  console.log('Session in middleware:', session);
  console.log('Cookies:', request.cookies.getAll());

  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"]
};