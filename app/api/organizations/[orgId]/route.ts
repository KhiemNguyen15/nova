import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { updateOrganization, deleteOrganization, getUserRole } from '@/lib/db/queries';

// PATCH /api/organizations/[orgId] - Update organization (admin only)
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
        { error: 'Only admins can update organizations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const organization = await updateOrganization(orgId, {
      name,
      description,
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[orgId] - Delete organization (admin only)
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
        { error: 'Only admins can delete organizations' },
        { status: 403 }
      );
    }

    await deleteOrganization(orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
