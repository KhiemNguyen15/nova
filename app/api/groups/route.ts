import { NextRequest, NextResponse } from "next/server";
import { getUserGroups } from "@/lib/db/queries";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    // Get all groups the user has access to
    const groups = await getUserGroups(user.id);

    return NextResponse.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        cloudflareRagId: group.cloudflareRagId,
        organizationId: group.organizationId,
        organizationName: group.organization.name,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
