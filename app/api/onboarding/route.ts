import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { users, organizations, organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const auth0Id = session.user.sub;
    const body = await request.json();
    const { name, email, organizationName } = body;

    // Validate required fields
    if (!name || !email || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create user and organization in a transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const [newUser] = await tx
        .insert(users)
        .values({
          auth0Id,
          email,
          name,
          avatarUrl: session.user.picture || null,
        })
        .returning();

      // Check if organization exists
      let organization = await tx.query.organizations.findFirst({
        where: eq(organizations.name, organizationName),
      });

      // Create organization if it doesn't exist
      if (!organization) {
        const [newOrg] = await tx
          .insert(organizations)
          .values({
            name: organizationName,
            description: `${organizationName} organization`,
          })
          .returning();
        organization = newOrg;
      }

      // Add user to organization as admin (first member becomes admin)
      await tx.insert(organizationMembers).values({
        userId: newUser.id,
        organizationId: organization.id,
        role: 'admin',
      });

      return { user: newUser, organization };
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      organization: result.organization,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
