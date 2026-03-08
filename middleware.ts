import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware for authentication and route protection
 * 
 * Public routes:
 * - /login - Authentication page
 * - /auth/callback - OAuth callback
 * - /api/telegram - Telegram webhook (must be public)
 * 
 * Protected routes:
 * - / (dashboard)
 * - /inbox
 * - /deudas
 * - /configuracion
 * - /historial
 */

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
];

// Routes that should bypass middleware entirely (API webhooks, static files, etc.)
const BYPASS_ROUTES = [
  '/api/telegram',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/manifest.json',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for bypass routes
  if (BYPASS_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Instead of an expensive `await supabase.auth.getSession()` which often crashes 
  // the Vercel Edge Runtime (500 Invocation Failed) due to timeouts,
  // we lightly check if the session cookie payload exists.
  const sessionToken = request.cookies.get('sb-xbxqhnqyybpxbbjvjjdo-auth-token')?.value;
  const isAuthenticated = !!sessionToken;

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Redirect logic
  if (!isAuthenticated && !isPublicRoute) {
    // Not authenticated and trying to access protected route
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === '/login') {
    // Already authenticated and trying to access login
    // Redirect to dashboard
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * But we handle bypass routes in the middleware itself for more control
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
