"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useChat } from "@/hooks/useChat";
import { Loader2 } from "lucide-react";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groupName, setGroupName] = useState<string>("Loading...");
  const [organizationName, setOrganizationName] = useState<string>("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push('/api/auth/login');
    }
  }, [isLoadingUser, user, router]);

  const {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    sendMessage,
    stop,
  } = useChat({
    conversationId,
    groupId: groupId || '', // Will be set when conversation loads
    onError: (error) => {
      console.error("Chat error:", error);
      // TODO: Show error toast
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation details for header
  useEffect(() => {
    if (conversationId) {
      fetch(`/api/chat/${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.conversation) {
            setGroupName(data.conversation.group.name);
            setOrganizationName(data.conversation.group.organizationName);
            setGroupId(data.conversation.groupId);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch conversation details:", error);
        });
    }
  }, [conversationId]);

  const handleSubmit = () => {
    if (input.trim()) {
      sendMessage(input);
    }
  };

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        groupName={groupName}
        organizationName={organizationName}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <ScrollArea className="flex-1 overflow-auto" ref={scrollAreaRef}>
        {isLoading && messages.length === 0 ? (
          <div className="max-w-4xl mx-auto space-y-6 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.createdAt}
                isStreaming={
                  isStreaming &&
                  index === messages.length - 1 &&
                  message.role === "assistant"
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={isLoading}
      />
    </div>
  );
}
