import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getOrganizationGroups } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    const { organizationId } = await params;

    // Get groups for the organization that the user has access to
    const groups = await getOrganizationGroups(user.id, organizationId);

    return NextResponse.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
      })),
    });
  } catch (error) {
    console.error('Get organization groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
