import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { groups, organizations, organizationMembers, users, groupMembers } from "@/lib/db/schema";
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

    // Get only groups where the user is explicitly a member
    const userGroupMemberships = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        organizationId: groups.organizationId,
        createdAt: groups.createdAt,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, user.id));

    return NextResponse.json({ groups: userGroupMemberships });
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

    // Create the group and add creator as a member
    const result = await db.transaction(async (tx) => {
      // Create the group
      const [newGroup] = await tx
        .insert(groups)
        .values({
          name,
          description,
          organizationId,
        })
        .returning();

      // Add creator as a member of the group
      await tx.insert(groupMembers).values({
        userId: user.id,
        groupId: newGroup.id,
      });

      return newGroup;
    });

    return NextResponse.json({ group: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
