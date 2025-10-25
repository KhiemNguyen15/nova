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

// TODO: Replace with actual Auth0 user session
function getMockUserId(): string {
  return "mock-user-id";
}

export async function POST(request: NextRequest) {
  try {
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

    const userId = getMockUserId();

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

    // Prepare messages for AI (limit to last 10 for context)
    const aiMessages = conversationMessages
      .slice(-10)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Add the new message to the context
    aiMessages.push({ role: "user", content: message });

    // Get Cloudflare AI client
    const aiClient = getCloudflareAIClient();

    // TODO: Get the actual Cloudflare index ID for this group from the database
    const indexId = process.env.CLOUDFLARE_DEFAULT_INDEX_ID || "default-index";

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

          // Stream AI response
          for await (const chunk of aiClient.streamChatCompletion({
            messages: aiMessages,
            indexId,
            stream: true,
          })) {
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
