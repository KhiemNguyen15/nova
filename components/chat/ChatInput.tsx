"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Square } from "lucide-react";

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  isStreaming,
  placeholder = "Ask Nova anything...",
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const maxRows = 6;
      const newRows = Math.min(Math.ceil(scrollHeight / lineHeight), maxRows);
      setRows(newRows);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming && !disabled) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !isStreaming && !disabled) {
      onSubmit();
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  return (
    <div className="border-t border-border/30 bg-background/10 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={rows}
            className="min-h-[48px] max-h-[144px] resize-none pr-12 bg-muted/10 backdrop-blur-sm border-border/30 focus:border-primary/50 transition-colors"
          />

          <div className="absolute right-2 bottom-2">
            {isStreaming ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleStop}
                className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!value.trim() || disabled}
                className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground mt-2 animate-pulse">
            Nova is thinking...
          </p>
        )}
      </div>
    </div>
  );
}
