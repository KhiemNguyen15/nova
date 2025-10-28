import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need any authentication checks
  const publicPathsNoAuth = [
    '/api/auth/resend-verification',
    '/api/auth/me',
  ];

  // Paths that need auth but bypass email verification check
  const authOnlyPaths = [
    '/verify-email',
    '/onboarding',
    '/api/onboarding',
    '/auth/', // Auth0 auth routes
  ];

  // Allow API endpoints without any middleware
  if (publicPathsNoAuth.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Run Auth0 middleware for authentication
  const auth0Response = await auth0.middleware(request);

  // If Auth0 middleware returns a redirect or error, pass it through
  if (auth0Response.status !== 200) {
    return auth0Response;
  }

  // Allow auth-only paths to proceed without email verification check
  if (authOnlyPaths.some(path => pathname.startsWith(path))) {
    return auth0Response;
  }

  // Check if user is authenticated and email is verified
  try {
    const session = await auth0.getSession();

    if (session?.user) {
      // Check email verification status from Auth0
      const emailVerified = session.user.email_verified;

      if (!emailVerified) {
        // Redirect to verify-email page if not verified
        const url = request.nextUrl.clone();
        url.pathname = '/verify-email';
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error('Error checking email verification:', error);
  }

  return auth0Response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};