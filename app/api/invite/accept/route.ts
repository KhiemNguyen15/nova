import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { verifyInviteToken, isInviteExpired } from '@/lib/jwt-invite';
import { addMemberToOrganization, addMemberToGroup, checkUserAccessToGroup, checkUserAccessToOrganization } from '@/lib/db/queries';

// POST /api/invite/accept - Accept invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - please login first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const invite = await verifyInviteToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    // Check if expired
    if (isInviteExpired(invite)) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user is already a member of the group
    const isMember = await checkUserAccessToGroup(user.id, invite.groupId);
    if (isMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user to organization only if they're not already a member
    const isOrgMember = await checkUserAccessToOrganization(user.id, invite.organizationId);
    if (!isOrgMember) {
      await addMemberToOrganization(user.id, invite.organizationId, 'member');
    }

    // Add user to the specific group
    await addMemberToGroup(user.id, invite.groupId);

    return NextResponse.json({
      success: true,
      organization: {
        id: invite.organizationId,
        name: invite.organizationName,
      },
      group: {
        id: invite.groupId,
        name: invite.groupName,
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
