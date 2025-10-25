import { NextRequest, NextResponse } from "next/server";
import { getCloudflareAIClient } from "@/lib/cloudflare-ai";
import {
  createConversation,
  createMessage,
  updateConversationTimestamp,
  checkUserAccessToGroup,
  getConversationMessages,
  checkUserAccessToConversation,
  updateConversationTitle,
} from "@/lib/db/queries";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }

    const body = await request.json();
    const { message, conversationId, groupId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    const userId = user.id;

    // Check user access to group
    const hasAccess = await checkUserAccessToGroup(userId, groupId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this group" },
        { status: 403 }
      );
    }

    let currentConversationId = conversationId;

    // Create new conversation if needed
    if (!currentConversationId) {
      const newConversation = await createConversation({
        userId,
        groupId,
        title: null,
      });
      currentConversationId = newConversation.id;
    } else {
      // Verify user owns this conversation
      const hasConversationAccess = await checkUserAccessToConversation(
        userId,
        currentConversationId
      );
      if (!hasConversationAccess) {
        return NextResponse.json(
          { error: "Access denied to this conversation" },
          { status: 403 }
        );
      }
    }

    // Save user message
    await createMessage({
      conversationId: currentConversationId,
      content: message,
      role: "user",
    });

    // Get conversation history for context
    const conversationMessages = await getConversationMessages(
      currentConversationId
    );

    // Get Cloudflare AI client
    const aiClient = getCloudflareAIClient();

    // TODO: Get the actual Cloudflare RAG ID for this group from the database
    // Each group should have its own RAG instance with its documents
    const ragId = process.env.CLOUDFLARE_DEFAULT_RAG_ID || "default-rag-id";

    // Build context from conversation history (last 5 exchanges for brevity)
    const recentMessages = conversationMessages.slice(-10);
    let contextQuery = message;

    // If there's conversation history, prepend it to provide context
    if (recentMessages.length > 0) {
      const conversationContext = recentMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
      contextQuery = `Previous conversation:\n${conversationContext}\n\nCurrent question: ${message}`;
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID in first chunk
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId: currentConversationId })}\n\n`
            )
          );

          let fullResponse = "";

          // Stream AI response using AutoRAG
          for await (const chunk of aiClient.streamQuery(ragId, contextQuery)) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }

          // Save assistant message
          await createMessage({
            conversationId: currentConversationId!,
            content: fullResponse,
            role: "assistant",
          });

          // Update conversation timestamp
          await updateConversationTimestamp(currentConversationId!);

          // Auto-generate title if this is the first exchange
          if (conversationMessages.length === 0) {
            const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
            await updateConversationTitle(currentConversationId!, title);
          }

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
