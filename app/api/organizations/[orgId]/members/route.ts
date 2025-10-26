import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getOrganizationMembers, getUserRole, updateMemberRole, removeMemberFromOrganization } from '@/lib/db/queries';

// GET /api/organizations/[orgId]/members - Get organization members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check if user has access to this organization
    const role = await getUserRole(user.id, orgId);
    if (!role) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const members = await getOrganizationMembers(orgId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[orgId]/members - Update member role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check if user is admin
    const role = await getUserRole(user.id, orgId);
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update member roles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { membershipId, newRole } = body;

    if (!membershipId || !newRole) {
      return NextResponse.json(
        { error: 'membershipId and newRole are required' },
        { status: 400 }
      );
    }

    const member = await updateMemberRole(membershipId, newRole);

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[orgId]/members - Remove member (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orgId } = await params;

    // Check if user is admin
    const role = await getUserRole(user.id, orgId);
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('membershipId');

    if (!membershipId) {
      return NextResponse.json(
        { error: 'membershipId is required' },
        { status: 400 }
      );
    }

    await removeMemberFromOrganization(membershipId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
