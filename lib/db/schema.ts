import { pgTable, text, timestamp, uuid, varchar, integer, pgEnum, index, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["admin", "manager", "member", "viewer"]);
export const embeddingStatusEnum = pgEnum("embedding_status", ["pending", "completed", "failed"]);

// Users table (linked to Auth0)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  auth0Id: varchar("auth0_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  auth0IdIdx: index("auth0_id_idx").on(table.auth0Id),
}));

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organization members junction table
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  userOrgIdx: index("user_org_idx").on(table.userId, table.organizationId),
}));

// Groups table (knowledge base groups within organizations)
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cloudflareRagId: text("cloudflare_rag_id"), // Cloudflare AutoRAG instance ID for this group
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("group_org_idx").on(table.organizationId),
}));

// Group members junction table
export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  userGroupIdx: index("user_group_idx").on(table.userId, table.groupId),
}));

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("conversation_user_idx").on(table.userId),
  groupIdx: index("conversation_group_idx").on(table.groupId),
  userGroupIdx: index("conversation_user_group_idx").on(table.userId, table.groupId),
}));

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("message_conversation_idx").on(table.conversationId),
  createdAtIdx: index("message_created_at_idx").on(table.createdAt),
}));

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  r2Key: text("r2_key").notNull(), // Cloudflare R2 object key
  embeddingStatus: embeddingStatusEnum("embedding_status").notNull().default("pending"),
  cloudflareIndexId: text("cloudflare_index_id"), // Cloudflare AI Search index ID
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("document_org_idx").on(table.organizationId),
  statusIdx: index("document_status_idx").on(table.embeddingStatus),
}));

// Document-Group junction table (many-to-many)
export const documentGroups = pgTable("document_groups", {
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.documentId, table.groupId] }),
  docIdx: index("doc_group_doc_idx").on(table.documentId),
  groupIdx: index("doc_group_group_idx").on(table.groupId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  groupMembers: many(groupMembers),
  conversations: many(conversations),
  documents: many(documents),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  groups: many(groups),
  documents: many(documents),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [groups.organizationId],
    references: [organizations.id],
  }),
  members: many(groupMembers),
  conversations: many(conversations),
  documentGroups: many(documentGroups),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [conversations.groupId],
    references: [groups.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  documentGroups: many(documentGroups),
}));

export const documentGroupsRelations = relations(documentGroups, ({ one }) => ({
  document: one(documents, {
    fields: [documentGroups.documentId],
    references: [documents.id],
  }),
  group: one(groups, {
    fields: [documentGroups.groupId],
    references: [groups.id],
  }),
}));

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
