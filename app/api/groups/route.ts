import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { groups, organizations, organizationMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0Id = session.user.sub;

    // First, get the user's database ID from Auth0 ID
    const user = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all organizations the user is a member of
    const userOrgMemberships = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id));

    const orgIds = userOrgMemberships.map(m => m.organizationId);

    if (orgIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Get all groups from user's organizations
    const allGroups = [];
    for (const orgId of orgIds) {
      const orgGroups = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          organizationId: groups.organizationId,
          createdAt: groups.createdAt,
        })
        .from(groups)
        .where(eq(groups.organizationId, orgId));

      allGroups.push(...orgGroups);
    }

    return NextResponse.json({ groups: allGroups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0Id = session.user.sub;

    // First, get the user's database ID from Auth0 ID
    const user = await db.query.users.findFirst({
      where: eq(users.auth0Id, auth0Id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, organizationId } = body;

    if (!name || !organizationId) {
      return NextResponse.json(
        { error: "Name and organization ID are required" },
        { status: 400 }
      );
    }

    // Check if user is admin of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationId, organizationId)
      ))
      .limit(1);

    if (membership.length === 0 || membership[0].role !== "admin") {
      return NextResponse.json(
        { error: "Only organization admins can create groups" },
        { status: 403 }
      );
    }

    // Create the group
    const [newGroup] = await db
      .insert(groups)
      .values({
        name,
        description,
        organizationId,
      })
      .returning();

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
