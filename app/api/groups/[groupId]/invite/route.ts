import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { getGroupById, getUserRole } from '@/lib/db/queries';
import { generateInviteToken, generateInviteUrl } from '@/lib/jwt-invite';

// POST /api/groups/[groupId]/invite - Generate invite link (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { groupId } = await params;

    // Get group to check organization
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is admin of the organization
    const role = await getUserRole(user.id, group.organizationId);
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create invitations' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await generateInviteToken({
      groupId: group.id,
      organizationId: group.organizationId,
      organizationName: group.organization.name,
      groupName: group.name,
      invitedBy: user.id,
      invitedByName: user.name || user.email,
    });

    // Generate full URL
    const baseUrl = process.env.AUTH0_BASE_URL || request.nextUrl.origin;
    const inviteUrl = generateInviteUrl(token, baseUrl);

    return NextResponse.json({ inviteUrl, token });
  } catch (error) {
    console.error('Generate invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
