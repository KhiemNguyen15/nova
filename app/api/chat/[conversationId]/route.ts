import { NextRequest, NextResponse } from "next/server";
import { getConversationById, checkUserAccessToConversation } from "@/lib/db/queries";

// TODO: Replace with actual Auth0 user session
function getMockUserId(): string {
  return "mock-user-id";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const userId = getMockUserId();

    // Check user access
    const hasAccess = await checkUserAccessToConversation(userId, conversationId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this conversation" },
        { status: 403 }
      );
    }

    // Get conversation with messages
    const conversation = await getConversationById(conversationId, userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        groupId: conversation.groupId,
        group: {
          id: conversation.group.id,
          name: conversation.group.name,
          organizationId: conversation.group.organizationId,
          organizationName: conversation.group.organization.name,
        },
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
