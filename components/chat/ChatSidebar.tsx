"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ConversationList } from "./ConversationList";
import { useConversations } from "@/hooks/useConversations";
import {
  ChevronDown,
  Plus,
  Sparkles,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedGroupId?: string;
  onGroupSelect?: (groupId: string) => void;
}

export function ChatSidebar({
  isOpen = true,
  onClose,
  selectedGroupId,
  onGroupSelect,
}: ChatSidebarProps) {
  const { groupedConversations, isLoading, refresh } = useConversations();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  // TODO: Replace with actual user groups from Auth0/database
  const mockGroups = [
    {
      id: "group-1",
      name: "Engineering Team",
      organizationId: "org-1",
      organizationName: "Acme Corp",
    },
    {
      id: "group-2",
      name: "Product Team",
      organizationId: "org-1",
      organizationName: "Acme Corp",
    },
  ];

  const selectedGroup = mockGroups.find((g) => g.id === selectedGroupId);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 w-80 flex flex-col bg-card border-r border-border/50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Nova
              </span>
            </Link>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="md:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Group Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-muted/50 hover:bg-muted border-border/50"
              >
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-xs text-muted-foreground">
                    {selectedGroup?.organizationName || "Select Organization"}
                  </span>
                  <span className="text-sm font-medium truncate w-full text-left">
                    {selectedGroup?.name || "Choose a group"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              {mockGroups.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => onGroupSelect?.(group.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {group.organizationName}
                    </span>
                    <span className="text-sm font-medium">{group.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* New Conversation Button */}
          <Button
            asChild
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Link href="/chat">
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Link>
          </Button>
        </div>

        <Separator className="bg-border/50" />

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            groupedConversations={groupedConversations}
            isLoading={isLoading}
          />
        </div>

        <Separator className="bg-border/50" />

        {/* Navigation Links */}
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href="/documents/sources">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href="/team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
