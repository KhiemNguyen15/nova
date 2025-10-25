import { auth0 } from '@/lib/auth0';
import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = handleAuth({
  callback: handleCallback(async (req: NextRequest, session) => {
    // Check if user exists in database
    const auth0Id = session.user.sub;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
    });

    // If user doesn't exist, they need to complete onboarding
    if (!existingUser) {
      return {
        ...session,
        user: {
          ...session.user,
          needsOnboarding: true,
        },
      };
    }

    return session;
  }),
});
