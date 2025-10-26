import { auth0 } from '@/lib/auth0';
import { NextRequest } from 'next/server';

// This route handler delegates all auth routes to Auth0's middleware
// It handles /auth/login, /auth/logout, /auth/callback, and /auth/profile
export async function GET(request: NextRequest) {
  return auth0.middleware(request);
}
