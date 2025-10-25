import { NextRequest, NextResponse } from "next/server";
import { getUserConversations } from "@/lib/db/queries";

// TODO: Replace with actual Auth0 user session
function getMockUserId(): string {
  return "mock-user-id";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getMockUserId();

    // Get all user conversations
    const conversations = await getUserConversations(userId);

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        groupId: conv.groupId,
        group: {
          id: conv.group.id,
          name: conv.group.name,
          organizationId: conv.group.organizationId,
          organizationName: conv.group.organization.name,
        },
        lastMessage: conv.lastMessage
          ? {
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
            }
          : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
