import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = auth0.handleAuth({
  async callback(req, ctx) {
    try {
      const res = await auth0.handleCallback(req, ctx, {
        async afterCallback(req, session) {
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
        }
      });

      return res;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  }
});
