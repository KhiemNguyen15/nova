import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";

export interface ChatHeaderProps {
  groupName?: string;
  organizationName?: string;
  onMenuClick?: () => void;
}

export function ChatHeader({ groupName, organizationName, onMenuClick }: ChatHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/40 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4 px-4 py-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Nova</span>
            {groupName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{organizationName}</span>
                <span>•</span>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0 h-5 border-primary/30 bg-primary/5"
                >
                  {groupName}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
