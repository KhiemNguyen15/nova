"use client";

import { useState, useEffect, useCallback } from "react";

export interface ConversationGroup {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  groupId: string;
  group: ConversationGroup;
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedConversations {
  organizationId: string;
  organizationName: string;
  groups: Array<{
    groupId: string;
    groupName: string;
    conversations: Conversation[];
  }>;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupedConversations, setGroupedConversations] = useState<GroupedConversations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data.conversations);

      // Group conversations by organization and group
      const grouped = groupConversationsByOrganization(data.conversations);
      setGroupedConversations(grouped);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const refresh = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    groupedConversations,
    isLoading,
    error,
    refresh,
  };
}

function groupConversationsByOrganization(
  conversations: Conversation[]
): GroupedConversations[] {
  const grouped = new Map<string, GroupedConversations>();

  for (const conversation of conversations) {
    const orgId = conversation.group.organizationId;
    const orgName = conversation.group.organizationName;
    const groupId = conversation.groupId;
    const groupName = conversation.group.name;

    if (!grouped.has(orgId)) {
      grouped.set(orgId, {
        organizationId: orgId,
        organizationName: orgName,
        groups: [],
      });
    }

    const org = grouped.get(orgId)!;
    let group = org.groups.find((g) => g.groupId === groupId);

    if (!group) {
      group = {
        groupId,
        groupName,
        conversations: [],
      };
      org.groups.push(group);
    }

    group.conversations.push(conversation);
  }

  return Array.from(grouped.values());
}
