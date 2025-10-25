# Nova Chat Interface - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment Variables

Create `.env.local`:
```bash
# Required: Cloudflare AutoRAG
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_KEY="your-api-key"
CLOUDFLARE_DEFAULT_RAG_ID="your-rag-id"

# Required: Neon Database
DATABASE_URL="postgresql://user:pass@host/db"
```

### Step 3: Test Cloudflare Connection
```bash
pnpm test:cloudflare
```

✅ If this passes, you're ready to go!

### Step 4: Set Up Database
```bash
pnpm db:push
```

### Step 5: Run the App
```bash
pnpm dev
```

Visit: http://localhost:3000/chat

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test:cloudflare` | Test Cloudflare API connection |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |

---

## 🔧 What's Implemented

✅ **Chat Interface**
- Streaming AI responses
- Conversation history
- Auto-scrolling
- Mobile responsive

✅ **Database**
- Complete schema with Drizzle ORM
- Neon Postgres integration
- Access control

✅ **Cloudflare AutoRAG**
- Real API integration
- Simulated streaming
- Error handling

✅ **Components**
- Sidebar with navigation
- Message bubbles
- Input with auto-resize
- Loading states

---

## 🚧 TODO: Before Production

- [ ] Integrate Auth0 authentication
- [ ] Replace mock user IDs
- [ ] Add group-specific RAG IDs
- [ ] Implement RAG instance creation
- [ ] Add document upload to RAG
- [ ] Add error toasts
- [ ] Add rate limiting
- [ ] Add conversation export

---

## 📖 Documentation

- **CHAT_INTERFACE.md** - Complete implementation guide
- **TESTING_CLOUDFLARE.md** - Testing and troubleshooting
- **CLOUDFLARE_AUTORAG_UPDATE.md** - API migration notes

---

## 🆘 Quick Troubleshooting

### Test script fails?
→ Check your environment variables are correct

### Chat not responding?
→ Check browser console and terminal logs

### Database errors?
→ Run `pnpm db:push` to update schema

### Access denied errors?
→ You need to seed test data (user, org, group)

---

## 💡 Key Files

```
lib/cloudflare-ai.ts          # Cloudflare API client
app/api/chat/route.ts         # Chat API endpoint
hooks/useChat.ts              # Chat state management
components/chat/              # Chat UI components
lib/db/schema.ts              # Database schema
```

---

**Need help?** Check the detailed guides in the docs folder!
