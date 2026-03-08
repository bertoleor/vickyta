import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for authentication and route protection
 * 
 * IMPORTANT: This middleware uses ZERO external dependencies (no @supabase/ssr)
 * to guarantee compatibility with Vercel's Edge Runtime.
 * 
 * Auth check is done by inspecting the Supabase session cookie directly.
 * Deep session validation happens inside Server Components/Actions.
 */

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
];

// Routes that should bypass middleware entirely
const BYPASS_ROUTES = [
  '/api/telegram',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/manifest.json',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for bypass routes
  if (BYPASS_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Lightweight auth check: look for ANY Supabase auth cookie
  // Supabase stores session tokens in cookies prefixed with 'sb-'
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Redirect logic
  if (!hasAuthCookie && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasAuthCookie && pathname === '/login') {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
