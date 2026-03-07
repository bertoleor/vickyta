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

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isAuthenticated = !!session;

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

  return response;
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
