import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { updateGroup, deleteGroup, getGroupById, getUserRole } from '@/lib/db/queries';

// PATCH /api/groups/[groupId] - Update group (admin only)
export async function PATCH(
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
        { error: 'Only admins can update groups' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, cloudflareRagId } = body;

    const updatedGroup = await updateGroup(groupId, {
      name,
      description,
      cloudflareRagId,
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId] - Delete group (admin only)
export async function DELETE(
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
        { error: 'Only admins can delete groups' },
        { status: 403 }
      );
    }

    await deleteGroup(groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
