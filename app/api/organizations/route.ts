import { NextRequest, NextResponse } from "next/server";
import { getUserOrganizations } from "@/lib/db/queries";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.redirect(new URL("/api/auth/login", request.url));
    }

    // Get all organizations the user belongs to
    const organizations = await getUserOrganizations(user.id);

    return NextResponse.json({
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        description: org.description,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        role: org.role,
      })),
    });
  } catch (error) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
