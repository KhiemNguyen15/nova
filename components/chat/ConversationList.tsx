"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupedConversations } from "@/hooks/useConversations";

export interface ConversationListProps {
  groupedConversations: GroupedConversations[];
  isLoading?: boolean;
}

export function ConversationList({
  groupedConversations,
  isLoading,
}: ConversationListProps) {
  const pathname = usePathname();
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(
    new Set(groupedConversations.map((org) => org.organizationId))
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (groupedConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a new conversation to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-2">
        {groupedConversations.map((org) => (
          <div key={org.organizationId} className="space-y-1">
            {/* Organization Header */}
            <Button
              variant="ghost"
              className="w-full justify-start px-2 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => toggleOrg(org.organizationId)}
            >
              {expandedOrgs.has(org.organizationId) ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              {org.organizationName}
            </Button>

            {/* Groups */}
            {expandedOrgs.has(org.organizationId) && (
              <div className="ml-2 space-y-1">
                {org.groups.map((group) => (
                  <div key={group.groupId} className="space-y-1">
                    {/* Group Header */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => toggleGroup(group.groupId)}
                    >
                      {expandedGroups.has(group.groupId) ? (
                        <ChevronDown className="h-3 w-3 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mr-1" />
                      )}
                      {group.groupName}
                    </Button>

                    {/* Conversations */}
                    {expandedGroups.has(group.groupId) && (
                      <div className="ml-4 space-y-1">
                        {group.conversations.map((conversation) => {
                          const isActive = pathname === `/chat/${conversation.id}`;
                          const displayTitle =
                            conversation.title ||
                            conversation.lastMessage?.content.slice(0, 50) ||
                            "New conversation";

                          return (
                            <Link
                              key={conversation.id}
                              href={`/chat/${conversation.id}`}
                            >
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start px-2 h-9 text-xs text-left font-normal",
                                  isActive &&
                                    "bg-accent/20 backdrop-blur-sm text-accent-foreground font-medium"
                                )}
                              >
                                <MessageSquare className="h-3 w-3 mr-2 shrink-0" />
                                <span className="truncate">{displayTitle}</span>
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
