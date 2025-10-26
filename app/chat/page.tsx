"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useGroups } from "@/hooks/useGroups";
import { Sparkles, Loader2 } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const { groups, isLoading: isLoadingGroups } = useGroups();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use first available group as default
  const groupId = groups.length > 0 ? groups[0].id : null;
  const selectedGroup = groups.length > 0 ? groups[0] : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push('/auth/login');
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
    groupId: groupId || '', // Pass empty string if no group yet
    onError: (error) => {
      console.error("Chat error:", error);
      // TODO: Show error toast
    },
  });

  // Redirect to conversation URL when a new conversation is created
  // Only redirect after streaming is complete (not while streaming)
  useEffect(() => {
    if (conversationId && messages.length > 0 && !isStreaming) {
      router.push(`/chat/${conversationId}`);
    }
  }, [conversationId, messages.length, isStreaming, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim()) {
      sendMessage(input);
    }
  };

  // Show loading state while checking authentication or loading groups
  if (isLoadingUser || isLoadingGroups) {
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

  // Show message if no groups available
  if (!groupId || !selectedGroup) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Groups Available</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need to be a member of at least one group to start chatting.
          Please contact your organization admin to be added to a group.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <ChatHeader
        groupName={selectedGroup.name}
        organizationName={selectedGroup.organizationName}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <ScrollArea className="flex-1 overflow-auto" ref={scrollAreaRef}>
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
                className="p-4 text-left border border-border/30 rounded-lg bg-card/10 backdrop-blur-sm hover:bg-accent/20 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Explore Documents</div>
                <div className="text-xs text-muted-foreground">
                  What documents are available in our knowledge base?
                </div>
              </button>
              <button
                onClick={() => setInput("Can you summarize our latest project guidelines?")}
                className="p-4 text-left border border-border/30 rounded-lg bg-card/10 backdrop-blur-sm hover:bg-accent/20 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Get Summaries</div>
                <div className="text-xs text-muted-foreground">
                  Can you summarize our latest project guidelines?
                </div>
              </button>
              <button
                onClick={() => setInput("How do I set up the development environment?")}
                className="p-4 text-left border border-border/30 rounded-lg bg-card/10 backdrop-blur-sm hover:bg-accent/20 transition-colors"
              >
                <div className="text-sm font-medium mb-1">Technical Questions</div>
                <div className="text-xs text-muted-foreground">
                  How do I set up the development environment?
                </div>
              </button>
              <button
                onClick={() => setInput("What are our team's best practices?")}
                className="p-4 text-left border border-border/30 rounded-lg bg-card/10 backdrop-blur-sm hover:bg-accent/20 transition-colors"
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
