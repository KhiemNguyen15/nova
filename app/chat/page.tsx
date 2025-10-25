"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { Sparkles, Loader2 } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Get groupId from selected context
  const groupId = "group-1";

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
    isStreaming,
    conversationId,
    sendMessage,
    stop,
  } = useChat({
    groupId,
    onError: (error) => {
      console.error("Chat error:", error);
      // TODO: Show error toast
    },
  });

  // Redirect to conversation URL when a new conversation is created
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      router.push(`/chat/${conversationId}`);
    }
  }, [conversationId, messages.length, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-full">
      <ChatHeader
        groupName="Engineering Team"
        organizationName="Acme Corp"
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Start a Conversation with Nova
            </h2>
            <p className="text-muted-foreground max-w-md">
              Ask questions about your organization's knowledge base. Nova will help you find
              the information you need using AI-powered search.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl w-full">
              <button
                onClick={() => setInput("What documents are available in our knowledge base?")}
                className="p-4 text-left border border-border/50 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Explore Documents</div>
                <div className="text-xs text-muted-foreground">
                  What documents are available in our knowledge base?
                </div>
              </button>
              <button
                onClick={() => setInput("Can you summarize our latest project guidelines?")}
                className="p-4 text-left border border-border/50 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Get Summaries</div>
                <div className="text-xs text-muted-foreground">
                  Can you summarize our latest project guidelines?
                </div>
              </button>
              <button
                onClick={() => setInput("How do I set up the development environment?")}
                className="p-4 text-left border border-border/50 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Technical Questions</div>
                <div className="text-xs text-muted-foreground">
                  How do I set up the development environment?
                </div>
              </button>
              <button
                onClick={() => setInput("What are our team's best practices?")}
                className="p-4 text-left border border-border/50 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Best Practices</div>
                <div className="text-xs text-muted-foreground">
                  What are our team's best practices?
                </div>
              </button>
            </div>
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
      />
    </div>
  );
}
