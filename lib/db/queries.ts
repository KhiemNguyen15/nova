import { db } from "./index";
import {
  users,
  organizations,
  organizationMembers,
  groups,
  groupMembers,
  conversations,
  messages,
  documents,
  documentGroups,
  type NewUser,
  type NewConversation,
  type NewMessage,
  type NewOrganization,
  type NewGroup,
} from "./schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

// ============= User Queries =============

export async function getUserByAuth0Id(auth0Id: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.auth0Id, auth0Id),
  });
  return result;
}

export async function createUser(data: NewUser) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function upsertUser(data: NewUser) {
  const result = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.auth0Id,
      set: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

// ============= Organization Queries =============

export async function getUserOrganizations(userId: string) {
  const result = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: {
      organization: true,
    },
  });
  return result.map(om => ({ ...om.organization, role: om.role }));
}

export async function createOrganization(data: NewOrganization & { userId: string }) {
  const { userId, ...orgData } = data;

  const result = await db.transaction(async (tx) => {
    // Create organization
    const [newOrg] = await tx
      .insert(organizations)
      .values(orgData)
      .returning();

    // Add creator as admin
    await tx.insert(organizationMembers).values({
      userId,
      organizationId: newOrg.id,
      role: 'admin',
    });

    return newOrg;
  });

  return result;
}

export async function updateOrganization(organizationId: string, data: Partial<NewOrganization>) {
  const result = await db
    .update(organizations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();
  return result[0];
}

export async function deleteOrganization(organizationId: string) {
  const result = await db
    .delete(organizations)
    .where(eq(organizations.id, organizationId))
    .returning();
  return result[0];
}

export async function getUserRole(userId: string, organizationId: string) {
  const result = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
  });
  return result?.role || null;
}

// ============= Group Queries =============

export async function getUserGroups(userId: string) {
  const result = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, userId),
    with: {
      group: {
        with: {
          organization: true,
        },
      },
    },
  });
  return result.map(gm => ({
    ...gm.group,
    organization: gm.group.organization,
  }));
}

export async function getGroupById(groupId: string) {
  const result = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: {
      organization: true,
    },
  });
  return result;
}

export async function getGroupsByOrganization(organizationId: string) {
  const result = await db.query.groups.findMany({
    where: eq(groups.organizationId, organizationId),
  });
  return result;
}

export async function getOrganizationGroups(userId: string, organizationId: string) {
  // Get groups in the organization where the user is a member
  const result = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, userId),
    with: {
      group: {
        with: {
          organization: true,
        },
      },
    },
  });

  // Filter to only groups in the specified organization
  return result
    .filter((gm) => gm.group.organizationId === organizationId)
    .map((gm) => gm.group);
}

export async function createGroup(data: NewGroup & { userId: string }) {
  const { userId, ...groupData } = data;

  const result = await db.transaction(async (tx) => {
    // Create group
    const [newGroup] = await tx
      .insert(groups)
      .values(groupData)
      .returning();

    // Add creator to the group
    await tx.insert(groupMembers).values({
      userId,
      groupId: newGroup.id,
    });

    return newGroup;
  });

  return result;
}

export async function updateGroup(groupId: string, data: Partial<NewGroup>) {
  const result = await db
    .update(groups)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(groups.id, groupId))
    .returning();
  return result[0];
}

export async function deleteGroup(groupId: string) {
  const result = await db
    .delete(groups)
    .where(eq(groups.id, groupId))
    .returning();
  return result[0];
}

// ============= Conversation Queries =============

export async function getUserConversations(userId: string) {
  const result = await db.query.conversations.findMany({
    where: eq(conversations.userId, userId),
    with: {
      group: {
        with: {
          organization: true,
        },
      },
      messages: {
        orderBy: [desc(messages.createdAt)],
        limit: 1,
      },
    },
    orderBy: [desc(conversations.updatedAt)],
  });

  return result.map(conv => ({
    ...conv,
    lastMessage: conv.messages[0] || null,
  }));
}

export async function getConversationById(conversationId: string, userId: string) {
  const result = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ),
    with: {
      group: {
        with: {
          organization: true,
        },
      },
      messages: {
        orderBy: [messages.createdAt],
      },
    },
  });
  return result;
}

export async function createConversation(data: NewConversation) {
  const result = await db.insert(conversations).values(data).returning();
  return result[0];
}

export async function updateConversationTitle(conversationId: string, title: string) {
  const result = await db
    .update(conversations)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId))
    .returning();
  return result[0];
}

export async function updateConversationTimestamp(conversationId: string) {
  const result = await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))
    .returning();
  return result[0];
}

// ============= Message Queries =============

export async function getConversationMessages(conversationId: string) {
  const result = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [messages.createdAt],
  });
  return result;
}

export async function createMessage(data: NewMessage) {
  const result = await db.insert(messages).values(data).returning();
  return result[0];
}

// ============= Document Queries =============

export async function getGroupDocuments(groupId: string) {
  const result = await db
    .select({
      document: documents,
    })
    .from(documentGroups)
    .innerJoin(documents, eq(documentGroups.documentId, documents.id))
    .where(eq(documentGroups.groupId, groupId));

  return result.map(r => r.document);
}

export async function getDocumentsByOrganization(organizationId: string) {
  const result = await db.query.documents.findMany({
    where: eq(documents.organizationId, organizationId),
    with: {
      uploader: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(documents.uploadedAt)],
  });
  return result;
}

export async function getUserDocumentsCount(userId: string): Promise<number> {
  // Get all organizations the user belongs to
  const userOrgs = await getUserOrganizations(userId);
  const orgIds = userOrgs.map(org => org.id);

  if (orgIds.length === 0) return 0;

  // Count documents across all user's organizations in a single query
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents)
    .where(inArray(documents.organizationId, orgIds));

  return result[0]?.count || 0;
}

export async function getDocumentById(documentId: string) {
  const result = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    with: {
      uploader: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      organization: true,
    },
  });
  return result;
}

export async function createDocument(data: {
  organizationId: string;
  uploadedBy: string;
  filename: string;
  fileType: string;
  fileSize: number;
  r2Key: string;
}) {
  const result = await db.insert(documents).values(data).returning();
  return result[0];
}

export async function deleteDocument(documentId: string) {
  const result = await db
    .delete(documents)
    .where(eq(documents.id, documentId))
    .returning();
  return result[0];
}

export async function assignDocumentToGroups(
  documentId: string,
  groupIds: string[]
) {
  if (groupIds.length === 0) return [];

  const values = groupIds.map((groupId) => ({
    documentId,
    groupId,
  }));

  const result = await db.insert(documentGroups).values(values).returning();
  return result;
}

export async function checkUserAccessToOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
  });
  return !!result;
}

// ============= Helper Functions =============

export async function checkUserAccessToGroup(userId: string, groupId: string): Promise<boolean> {
  const result = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.userId, userId),
      eq(groupMembers.groupId, groupId)
    ),
  });
  return !!result;
}

export async function checkUserAccessToConversation(userId: string, conversationId: string): Promise<boolean> {
  const result = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ),
  });
  return !!result;
}

// ============= Member Management Queries =============

export async function getOrganizationMembers(organizationId: string) {
  const result = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.organizationId, organizationId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: [desc(organizationMembers.joinedAt)],
  });

  return result.map(om => ({
    ...om.user,
    role: om.role,
    joinedAt: om.joinedAt,
    membershipId: om.id,
  }));
}

export async function getGroupMembers(groupId: string) {
  const result = await db.query.groupMembers.findMany({
    where: eq(groupMembers.groupId, groupId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [desc(groupMembers.joinedAt)],
  });

  return result.map(gm => ({
    ...gm.user,
    joinedAt: gm.joinedAt,
    membershipId: gm.id,
  }));
}

export async function updateMemberRole(membershipId: string, role: 'admin' | 'manager' | 'member' | 'viewer') {
  const result = await db
    .update(organizationMembers)
    .set({ role })
    .where(eq(organizationMembers.id, membershipId))
    .returning();
  return result[0];
}

export async function removeMemberFromOrganization(membershipId: string) {
  const result = await db
    .delete(organizationMembers)
    .where(eq(organizationMembers.id, membershipId))
    .returning();
  return result[0];
}

export async function removeMemberFromGroup(membershipId: string) {
  const result = await db
    .delete(groupMembers)
    .where(eq(groupMembers.id, membershipId))
    .returning();
  return result[0];
}

export async function addMemberToOrganization(userId: string, organizationId: string, role: 'admin' | 'manager' | 'member' | 'viewer' = 'member') {
  const result = await db
    .insert(organizationMembers)
    .values({
      userId,
      organizationId,
      role,
    })
    .returning();
  return result[0];
}

export async function addMemberToGroup(userId: string, groupId: string) {
  const result = await db
    .insert(groupMembers)
    .values({
      userId,
      groupId,
    })
    .returning();
  return result[0];
}
