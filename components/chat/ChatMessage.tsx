import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 hover:bg-accent/5 transition-colors",
        isUser ? "" : ""
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {isUser ? "You" : "Nova"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(timestamp)}
            </span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="animate-pulse">●</span>
              Thinking...
            </span>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MessageContent content={content} />
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Extract language and code
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          const language = match?.[1] || "";
          const code = match?.[2] || part.slice(3, -3);

          return (
            <pre
              key={index}
              className="bg-muted/10 backdrop-blur-sm rounded-lg p-4 overflow-x-auto border border-border/30 my-4"
            >
              {language && (
                <div className="text-xs text-muted-foreground mb-2 font-mono">
                  {language}
                </div>
              )}
              <code className="text-sm font-mono">{code.trim()}</code>
            </pre>
          );
        }

        // Regular text with basic formatting
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      })}
    </>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
