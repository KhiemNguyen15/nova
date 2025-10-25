# Testing Cloudflare AutoRAG Integration

This guide will help you test the Cloudflare AutoRAG API integration.

## Prerequisites

1. **Cloudflare Account** with AutoRAG access
2. **AutoRAG Instance** (RAG) created in your Cloudflare dashboard
3. **API Key** with AutoRAG permissions
4. **Documents uploaded** to your RAG instance (optional but recommended for meaningful responses)

## Step 1: Set Up Environment Variables

Create or update your `.env.local` file with the following:

```bash
# Cloudflare AutoRAG Configuration
CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
CLOUDFLARE_API_KEY="your-cloudflare-api-key"
CLOUDFLARE_DEFAULT_RAG_ID="your-rag-instance-id"

# Database (for full app testing)
DATABASE_URL="postgresql://user:password@host/database"
```

### How to Find These Values:

1. **CLOUDFLARE_ACCOUNT_ID**:
   - Log into Cloudflare Dashboard
   - Navigate to any page
   - Look in the URL: `https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>/...`

2. **CLOUDFLARE_API_KEY**:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Create a new API Token with "AutoRAG" permissions
   - Or use an existing token with appropriate permissions

3. **CLOUDFLARE_DEFAULT_RAG_ID**:
   - Navigate to your AutoRAG dashboard
   - Select your RAG instance
   - The ID should be visible in the URL or instance details

## Step 2: Test the API Connection

Run the standalone test script:

```bash
pnpm test:cloudflare
```

This will:
- ✅ Verify environment variables are set
- ✅ Make a test query to your RAG instance
- ✅ Test the streaming functionality
- ✅ Show retrieved documents

### Expected Output:

```
🚀 Testing Cloudflare AutoRAG API...

✓ Environment variables loaded
  Account ID: abc123...
  RAG ID: rag-xyz...
  API Key: sk_abc123...

📤 Sending test query: "Hello! Can you help me?"

Test 1: Basic Query
──────────────────────────────────────────────────
✅ Request successful!
   Search Query: Hello! Can you help me?
   Response: Of course! I'd be happy to help you...
   Retrieved Docs: 3 documents
   Has More: false

Test 2: Streaming Query
──────────────────────────────────────────────────
📡 Streaming response:

Of course! I'd be happy to help you. What do you need assistance with?

✅ Streaming completed!
   Total length: 67 characters

Test 3: Retrieved Documents
──────────────────────────────────────────────────
✅ Retrieved 3 documents:

   Document 1:
     ID: doc-123
     Score: 0.95
     Text: This is the content from your knowledge base...
     Metadata: {"source":"user-guide.pdf"}

🎉 All tests passed!

✅ Cloudflare AutoRAG API is working correctly!
```

### Common Errors and Solutions:

#### Error: 404 Not Found
```
❌ Cloudflare AutoRAG API error (404): RAG not found
```
**Solution**: Your RAG ID is incorrect. Verify it in the Cloudflare dashboard.

#### Error: 401 Unauthorized
```
❌ Cloudflare AutoRAG API error (401): Unauthorized
```
**Solution**: Your API key is invalid or expired. Generate a new one.

#### Error: 403 Forbidden
```
❌ Cloudflare AutoRAG API error (403): Forbidden
```
**Solution**: Your API key doesn't have AutoRAG permissions. Update the token permissions.

#### Error: Missing Environment Variables
```
❌ Missing required environment variables:
   - CLOUDFLARE_ACCOUNT_ID: ✗
   - CLOUDFLARE_API_KEY: ✗
   - CLOUDFLARE_DEFAULT_RAG_ID: ✗
```
**Solution**: Create a `.env.local` file with the required variables.

## Step 3: Test via cURL

Test directly with cURL to verify your credentials:

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/autorag/rags/$CLOUDFLARE_DEFAULT_RAG_ID/ai-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLOUDFLARE_API_KEY" \
  -d '{"query": "Hello, can you help me?"}'
```

Expected response:
```json
{
  "success": true,
  "result": {
    "object": "vector_store.search_results.page",
    "search_query": "Hello, can you help me?",
    "response": "Of course! I'd be happy to help...",
    "data": [],
    "has_more": false,
    "next_page": null
  }
}
```

## Step 4: Test the Full Chat Interface

Once the standalone test passes, test the full application:

### 4.1: Set Up Database

```bash
# Push database schema
pnpm db:push

# (Optional) Open Drizzle Studio to manage data
pnpm db:studio
```

### 4.2: Create Test Data

You'll need to manually create test data in the database:

1. **User**: Create a user with `auth0_id = "mock-user-id"`
2. **Organization**: Create an organization
3. **Organization Member**: Link the user to the organization
4. **Group**: Create a group with your RAG ID:
   ```sql
   INSERT INTO groups (organization_id, name, cloudflare_rag_id)
   VALUES ('org-id-here', 'Test Group', 'your-rag-id-here');
   ```
5. **Group Member**: Add the user to the group

### 4.3: Run the Application

```bash
pnpm dev
```

Navigate to: http://localhost:3000/chat

### 4.4: Test the Chat

1. The sidebar should show your test group
2. Click "New Conversation"
3. Type a message and send it
4. You should see:
   - A streaming response appear word by word
   - The message saved to the database
   - A new conversation created

## Debugging

### Enable Verbose Logging

The Cloudflare client already includes detailed logging. Check your terminal for:

```
[Cloudflare AutoRAG] Making request to: https://api.cloudflare.com/...
[Cloudflare AutoRAG] Query: Hello! Can you help me?...
[Cloudflare AutoRAG] Response status: 200
[Cloudflare AutoRAG] Success: true
[Cloudflare AutoRAG] Response length: 145 chars
```

### Check Network Tab

In your browser's Developer Tools:
1. Open Network tab
2. Send a message in the chat
3. Look for the request to `/api/chat`
4. Check the response is streaming properly (Transfer-Encoding: chunked)

### Common Issues

#### "Response is empty"
- Your RAG instance may not have any documents
- Upload some documents to your RAG instance first

#### "Streaming not working"
- Check the browser console for errors
- Verify the API route is returning `text/event-stream` content type
- Check that the response isn't being buffered

#### "User has no access to group"
- The mock user ID doesn't exist in the database
- The user isn't added to the group
- The group doesn't exist

## API Request Flow

Here's what happens when you send a message:

1. **Frontend** (`useChat` hook):
   ```typescript
   sendMessage("Hello") → POST /api/chat
   ```

2. **API Route** (`app/api/chat/route.ts`):
   ```typescript
   - Validate user access
   - Create/get conversation
   - Save user message to DB
   - Get conversation history
   - Build context query
   - Call Cloudflare AutoRAG
   ```

3. **Cloudflare Client** (`lib/cloudflare-ai.ts`):
   ```typescript
   - POST to /autorag/rags/$ID/ai-search
   - Receive response
   - Simulate streaming
   - Return chunks to API route
   ```

4. **API Route** (continued):
   ```typescript
   - Stream chunks to frontend
   - Save assistant message to DB
   - Update conversation timestamp
   ```

5. **Frontend** (continued):
   ```typescript
   - Receive streamed chunks
   - Update UI in real-time
   - Display complete message
   ```

## Next Steps

Once testing is successful:

1. ✅ **Integrate Auth0** - Replace mock user ID with real authentication
2. ✅ **Add RAG Management** - Create RAG instances when groups are created
3. ✅ **Document Upload** - Implement document upload to RAG instances
4. ✅ **Error Handling** - Add user-friendly error messages and toasts
5. ✅ **Rate Limiting** - Add rate limiting to prevent API abuse
6. ✅ **Caching** - Cache responses for identical queries

## Troubleshooting Checklist

- [ ] Environment variables are set correctly
- [ ] RAG instance exists in Cloudflare
- [ ] API key has correct permissions
- [ ] Database schema is pushed
- [ ] Test data is created (user, org, group)
- [ ] Group has `cloudflareRagId` set
- [ ] User is member of the group
- [ ] Network connectivity is working
- [ ] No firewall blocking Cloudflare API

## Support

If you encounter issues:

1. Check the logs in your terminal
2. Review the Cloudflare API documentation
3. Verify your RAG instance is active
4. Test with the cURL command to isolate the issue
5. Check the browser console for frontend errors

---

**Happy Testing! 🚀**
