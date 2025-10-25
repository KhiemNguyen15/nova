# Cloudflare AutoRAG API Integration Update

## Summary of Changes

The Cloudflare AI client has been updated to use the correct AutoRAG API structure based on the official API documentation.

## Changes Made

### 1. Updated `lib/cloudflare-ai.ts`

**Previous Implementation:**
- Used incorrect endpoint: `/ai/search/chat`
- Expected OpenAI-style chat completion format
- Attempted to use multi-message conversations

**Current Implementation:**
- Uses correct endpoint: `/autorag/rags/$ID/ai-search`
- Simple query-response format matching Cloudflare's API
- Single query string per request

**API Structure:**
```typescript
// Request
POST /autorag/rags/$ID/ai-search
{
  "query": "Your question here"
}

// Response
{
  "success": true,
  "result": {
    "object": "vector_store.search_results.page",
    "search_query": "Your question here",
    "response": "AI-generated response based on retrieved documents",
    "data": [],  // Retrieved document chunks
    "has_more": false,
    "next_page": null
  }
}
```

**New Methods:**
- `query(ragId, query)` - Get AI response for a query
- `streamQuery(ragId, query)` - Simulate streaming by word-chunking
- `getRetrievedDocuments(ragId, query)` - Get source documents only

### 2. Updated `app/api/chat/route.ts`

**Changes:**
- Switched from `indexId` to `ragId` (line 89)
- Changed from multi-message array to single context query
- Prepends conversation history to current query for context
- Uses `streamQuery()` instead of `streamChatCompletion()`

**Conversation Context Handling:**
```typescript
// Builds a single query string with conversation context
const contextQuery = `
Previous conversation:
User: How do I...
Assistant: You can...
User: Thanks!

Current question: ${message}
`;
```

### 3. Updated Database Schema

**Added to `groups` table:**
- `cloudflareRagId` (text, nullable) - Stores the RAG instance ID for each group

This allows each group to have its own RAG instance with group-specific documents.

### 4. Updated Environment Variables

**Changed:**
- `CLOUDFLARE_API_TOKEN` → `CLOUDFLARE_API_KEY`
- `CLOUDFLARE_DEFAULT_INDEX_ID` → `CLOUDFLARE_DEFAULT_RAG_ID`

**New `.env.local` structure:**
```bash
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_KEY="your-api-key"
CLOUDFLARE_DEFAULT_RAG_ID="your-default-rag-id"
```

## Streaming Behavior

**Important Note:** The current implementation simulates streaming by splitting the response into words and yielding them with small delays (30ms between words).

This provides a better user experience than waiting for the entire response, but it's not true server-sent event (SSE) streaming from Cloudflare.

**If Cloudflare adds SSE support in the future:**
1. Check their API documentation for streaming parameters
2. Update the `streamQuery` method in `lib/cloudflare-ai.ts`
3. Handle SSE events properly instead of simulating

## Testing the Integration

### 1. Set Environment Variables
```bash
# In .env.local
CLOUDFLARE_ACCOUNT_ID="your-actual-account-id"
CLOUDFLARE_API_KEY="your-api-key-with-autorag-access"
CLOUDFLARE_DEFAULT_RAG_ID="your-rag-instance-id"
```

### 2. Test the API Directly

You can test your RAG instance using curl:
```bash
curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/autorag/rags/$RAG_ID/ai-search \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CLOUDFLARE_API_KEY" \
  -d '{"query": "Hello, can you help me?"}'
```

Expected response should have `success: true` and a `result.response` field with the AI answer.

### 3. Push Database Changes
```bash
pnpm db:push
```

This will add the `cloudflareRagId` column to the `groups` table.

### 4. Update Group Records

After creating a RAG instance in Cloudflare, update your groups:
```sql
UPDATE groups
SET cloudflare_rag_id = 'your-rag-instance-id'
WHERE id = 'your-group-id';
```

## TODO: RAG Instance Management

The following features should be implemented:

1. **Automatic RAG Creation**
   - When a new group is created, automatically create a RAG instance in Cloudflare
   - Store the returned RAG ID in `groups.cloudflareRagId`

2. **Document Upload Integration**
   - When documents are uploaded to a group, add them to the group's RAG instance
   - Use Cloudflare's document upload API (needs to be researched)

3. **RAG Configuration**
   - Allow configuration of RAG settings per group (if supported by Cloudflare)
   - Model selection, temperature, max tokens, etc.

4. **Fallback Handling**
   - If a group doesn't have a RAG ID, use the default from environment
   - Show warning to admins that the group needs RAG setup

## API Methods Reference

### CloudflareAIClient

```typescript
const client = getCloudflareAIClient();

// Get AI response
const response = await client.query(ragId, "What is the capital of France?");
console.log(response.result.response); // AI answer
console.log(response.result.data); // Retrieved documents

// Stream response word by word
for await (const chunk of client.streamQuery(ragId, "Tell me about...")) {
  process.stdout.write(chunk);
}

// Get only retrieved documents
const docs = await client.getRetrievedDocuments(ragId, "Search query");
```

## Differences from Original Implementation

| Aspect | Original | Updated |
|--------|----------|---------|
| **Endpoint** | `/ai/search/chat` | `/autorag/rags/$ID/ai-search` |
| **Auth Header** | `Bearer $TOKEN` | `Bearer $API_KEY` |
| **Request Format** | `{messages: [...]}` | `{query: "..."}` |
| **Response Format** | OpenAI-style | Cloudflare AutoRAG format |
| **Streaming** | Expected SSE | Simulated word-by-word |
| **Conversation** | Native multi-turn | Manual context prepending |
| **ID Type** | Index ID | RAG ID |

## Migration Checklist

- [x] Update Cloudflare AI client to use AutoRAG API
- [x] Update chat API route to use new client methods
- [x] Add `cloudflareRagId` to groups table schema
- [x] Update environment variable names
- [x] Update documentation
- [ ] Test with actual Cloudflare AutoRAG instance
- [ ] Implement RAG instance creation on group creation
- [ ] Implement document upload to RAG instances
- [ ] Update group creation UI to handle RAG setup

---

**Status:** ✅ API integration updated and ready for testing with real Cloudflare AutoRAG instances
