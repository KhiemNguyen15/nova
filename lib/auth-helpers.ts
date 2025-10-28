import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export interface AuthenticatedUser {
  id: string;
  auth0Id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Gets the authenticated user from Auth0 session and database
 * @returns The authenticated user or null if not authenticated or email not verified
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth0.getSession();

  if (!session?.user) {
    return null;
  }

  // Check email verification from Auth0
  if (!session.user.email_verified) {
    return null;
  }

  const auth0Id = session.user.sub;

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, auth0Id))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    auth0Id: user.auth0Id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Requires authentication and returns the authenticated user
 * Redirects to login if not authenticated
 * Redirects to verify-email if email not verified
 * Redirects to onboarding if user not found in database
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check email verification from Auth0
  if (!session.user.email_verified) {
    redirect('/verify-email');
  }

  const auth0Id = session.user.sub;

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.auth0Id, auth0Id))
    .limit(1);

  // If user not in database, redirect to onboarding
  if (!user) {
    redirect('/onboarding');
  }

  return {
    id: user.id,
    auth0Id: user.auth0Id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Gets Auth0 session (without database lookup)
 * Useful for pages that need to check authentication but don't need full user data
 */
export async function getSession() {
  return auth0.getSession();
}
