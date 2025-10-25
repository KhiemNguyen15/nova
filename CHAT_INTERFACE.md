# Nova Chat Interface - Implementation Guide

## Overview

The chat interface has been successfully implemented with the following features:

- Real-time streaming AI responses using Cloudflare AI Search AutoRAG
- Collapsible sidebar with conversation history grouped by organization/group
- Beautiful space-themed UI with cosmic gradients
- Mobile-responsive design
- Message history persistence with Neon Postgres
- Auto-scrolling and loading states

## Project Structure

```
nova/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts                    # POST endpoint for sending messages
│   │   │   └── [conversationId]/route.ts   # GET endpoint for conversation history
│   │   └── conversations/
│   │       └── route.ts                     # GET endpoint for user conversations
│   └── chat/
│       ├── layout.tsx                       # Chat layout with sidebar
│       ├── page.tsx                         # New conversation page
│       └── [conversationId]/
│           └── page.tsx                     # Existing conversation page
├── components/
│   └── chat/
│       ├── ChatSidebar.tsx                  # Left sidebar with navigation
│       ├── ChatHeader.tsx                   # Top header with group context
│       ├── ChatMessage.tsx                  # Message bubble component
│       ├── ChatInput.tsx                    # Input area with auto-resize
│       └── ConversationList.tsx             # Grouped conversation list
├── hooks/
│   ├── useChat.ts                           # Chat state management
│   └── useConversations.ts                 # Conversation list management
├── lib/
│   ├── cloudflare-ai.ts                     # Cloudflare AI Search client
│   └── db/
│       ├── schema.ts                        # Drizzle ORM schema
│       ├── index.ts                         # Database client
│       └── queries.ts                       # Database query functions
└── drizzle.config.ts                        # Drizzle configuration
```

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Neon Postgres Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Cloudflare AutoRAG
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_KEY="your-api-key"
CLOUDFLARE_DEFAULT_RAG_ID="your-default-rag-id"

# Auth0 (TODO: To be integrated)
AUTH0_SECRET="your-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
```

**Note:** The `CLOUDFLARE_DEFAULT_RAG_ID` is a fallback. Each group should have its own `cloudflareRagId` stored in the database.

## Database Setup

1. **Generate migrations:**
   ```bash
   pnpm db:generate
   ```

2. **Push schema to database:**
   ```bash
   pnpm db:push
   ```

3. **Open Drizzle Studio (optional):**
   ```bash
   pnpm db:studio
   ```

## Database Schema

The schema includes the following tables:

- `users` - User profiles linked to Auth0
- `organizations` - Organization entities
- `organization_members` - User-org relationships with roles (admin, manager, member, viewer)
- `groups` - Knowledge base groups within organizations
- `group_members` - User-group relationships
- `conversations` - Chat conversation metadata
- `messages` - Individual chat messages
- `documents` - Uploaded document metadata
- `document_groups` - Document-group relationships (many-to-many)

## Features Implemented

### 1. Chat Interface
- ✅ New conversation page (`/chat`)
- ✅ Existing conversation page (`/chat/[conversationId]`)
- ✅ Real-time streaming responses
- ✅ Auto-scrolling to latest message
- ✅ Loading states with skeleton loaders
- ✅ Message timestamps with relative formatting
- ✅ Code block syntax highlighting in messages

### 2. Sidebar
- ✅ Organization/group selector dropdown
- ✅ Conversation history grouped by org/group
- ✅ Collapsible sections for organizations and groups
- ✅ New conversation button
- ✅ Navigation links (Dashboard, Documents, Team, Settings)
- ✅ Mobile responsive with overlay

### 3. API Routes
- ✅ `POST /api/chat` - Send messages with streaming response
- ✅ `GET /api/chat/[conversationId]` - Get conversation history
- ✅ `GET /api/conversations` - Get all user conversations

### 4. Database Integration
- ✅ Drizzle ORM setup with Neon Postgres
- ✅ Complete schema with relations
- ✅ Query functions for all operations
- ✅ Access control checks

### 5. Cloudflare AutoRAG Integration
- ✅ AutoRAG client using correct API structure (`/autorag/rags/$ID/ai-search`)
- ✅ Simulated streaming (word-by-word delivery of responses)
- ✅ Conversation context handling (last 10 messages)
- ✅ Proper error handling with Cloudflare API response format
- ✅ Retrieved document access method

**Note:** The implementation uses simulated streaming since Cloudflare AutoRAG may not support true SSE streaming. If streaming becomes available, update the `streamQuery` method in `lib/cloudflare-ai.ts`.

## TODO: Remaining Integrations

### Auth0 Integration
The following files have mock user IDs that need to be replaced with Auth0 sessions:

- `app/api/chat/route.ts` - Replace `getMockUserId()`
- `app/api/chat/[conversationId]/route.ts` - Replace `getMockUserId()`
- `app/api/conversations/route.ts` - Replace `getMockUserId()`

**Integration steps:**
1. Install Auth0 SDK: `pnpm add @auth0/nextjs-auth0`
2. Set up Auth0 middleware
3. Replace mock user functions with `getSession()` from Auth0
4. Update sidebar to show actual user info

### Group Context Selection
The chat pages currently use a hardcoded `groupId`. Update:

- `app/chat/page.tsx:28` - Get groupId from context
- `app/chat/[conversationId]/page.tsx:26` - Get groupId from conversation or context
- `components/chat/ChatSidebar.tsx:39-48` - Replace `mockGroups` with actual user groups

### Cloudflare AutoRAG Management
- Update `app/api/chat/route.ts:89` to fetch the actual Cloudflare RAG ID for each group from the database
  - Use `group.cloudflareRagId` instead of the default environment variable
- Implement RAG instance creation when groups are created
- Link documents to group RAG instances
- Store the RAG ID in the `groups.cloudflareRagId` field

### Additional Features to Consider
- Message editing/deletion
- Conversation renaming
- Conversation deletion
- Message reactions
- File attachment support in chat (if needed)
- Export conversation to PDF/Markdown
- Search within conversations
- Keyboard shortcuts
- Toast notifications for errors
- Markdown rendering improvements
- Typing indicators

## Running the Application

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with required variables (see Environment Variables section above)

3. **Test Cloudflare API connection:**
   ```bash
   pnpm test:cloudflare
   ```
   This verifies your Cloudflare credentials are correct before running the full app.

4. **Push database schema:**
   ```bash
   pnpm db:push
   ```

5. **Run development server:**
   ```bash
   pnpm dev
   ```

6. **Access the chat interface:**
   Navigate to `http://localhost:3000/chat`

**Note:** See `TESTING_CLOUDFLARE.md` for comprehensive testing instructions and troubleshooting.

## Component API Reference

### useChat Hook
```typescript
const {
  messages,           // Array of messages
  input,             // Current input value
  setInput,          // Update input value
  isLoading,         // Loading conversation
  isStreaming,       // AI is streaming response
  conversationId,    // Current conversation ID
  sendMessage,       // Send a message
  stop,              // Stop streaming
  reload,            // Reload last message
} = useChat({
  conversationId?: string,
  groupId: string,
  onError?: (error: Error) => void,
});
```

### useConversations Hook
```typescript
const {
  conversations,         // Flat list of conversations
  groupedConversations, // Grouped by org/group
  isLoading,
  error,
  refresh,              // Reload conversations
} = useConversations();
```

## Styling

The interface uses a space/nebula theme with:
- Cosmic gradients (`from-primary to-accent`)
- Semi-transparent cards with backdrop blur
- Smooth transitions and animations
- Consistent border styling with `border-border/50`
- Responsive spacing and typography

## Performance Considerations

- Messages are streamed chunk-by-chunk for better UX
- Conversation history is paginated (last 10 messages for AI context)
- Auto-scroll only triggers on new messages
- Sidebar conversations lazy-load with scroll areas
- Database queries are optimized with indexes

## Security

- User access is checked for all operations
- Conversations are scoped to users
- Groups require membership for access
- Environment variables for sensitive data
- SQL injection prevention via Drizzle ORM

---

**Status:** ✅ Chat interface fully implemented and ready for testing

**Next Steps:**
1. Set up Neon Postgres database
2. Configure Cloudflare AI Search
3. Integrate Auth0 authentication
4. Seed test data
5. Test all features
