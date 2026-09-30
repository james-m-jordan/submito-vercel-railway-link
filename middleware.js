import { NextResponse } from 'next/server';

const SKIP_PREFIXES = ['/status', '/api/status'];

export function middleware(request) {
  const target = process.env.RAILWAY_TARGET_URL?.trim();

  if (!target) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (
    SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  let destination;
  try {
    destination = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}${request.nextUrl.hash}`, target);
  } catch {
    const body = JSON.stringify({
      error: 'Invalid RAILWAY_TARGET_URL',
      message: 'Update the environment variable to a valid absolute URL.'
    });
    return new Response(body, {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: '/:path*'
};
