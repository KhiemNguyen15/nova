"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface UseChatOptions {
  conversationId?: string;
  groupId: string;
  onError?: (error: Error) => void;
}

export function useChat({ conversationId, groupId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation messages on mount or when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/${convId}`);
      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }
      const data = await response.json();
      setMessages(
        data.messages.map((msg: { id: string; role: string; content: string; createdAt: string }) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        }))
      );
      setCurrentConversationId(convId);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);

      // Create assistant message placeholder
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: currentConversationId,
            groupId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is null");
        }

        let streamedContent = "";
        let newConversationId = currentConversationId;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                // Check for conversation ID in the first chunk
                if (parsed.conversationId && !newConversationId) {
                  newConversationId = parsed.conversationId;
                  setCurrentConversationId(parsed.conversationId);
                }

                // Handle content chunks
                if (parsed.content) {
                  streamedContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: streamedContent }
                        : msg
                    )
                  );
                }

                // Handle errors
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof Error) {
                  throw e;
                }
                // Skip invalid JSON
                continue;
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, do nothing
          return;
        }

        // Remove the assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        onError?.(error as Error);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [currentConversationId, groupId, isStreaming, onError]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const reload = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((msg) => msg.role === "user");

      if (lastUserMessage) {
        // Remove the last assistant message if it exists
        setMessages((prev) => {
          const lastAssistantIndex = prev
            .map((msg, idx) => (msg.role === "assistant" ? idx : -1))
            .filter((idx) => idx !== -1)
            .pop();

          if (lastAssistantIndex !== undefined) {
            return prev.slice(0, lastAssistantIndex);
          }
          return prev;
        });

        sendMessage(lastUserMessage.content);
      }
    }
  }, [messages, sendMessage]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    conversationId: currentConversationId,
    sendMessage,
    stop,
    reload,
  };
}
