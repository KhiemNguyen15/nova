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
