"use client";

import { useState, useEffect, useCallback } from "react";

export interface OrganizationMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  joinedAt: Date;
  membershipId: string;
}

export function useOrganizationMembers(organizationId: string | null) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');

      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateMemberRole = async (membershipId: string, newRole: 'admin' | 'manager' | 'member' | 'viewer') => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, newRole }),
      });

      if (!response.ok) throw new Error('Failed to update member role');

      await fetchMembers(); // Refresh list
      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      throw err;
    }
  };

  const removeMember = async (membershipId: string) => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members?membershipId=${membershipId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove member');

      await fetchMembers(); // Refresh list
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  };

  return {
    members,
    isLoading,
    error,
    refresh: fetchMembers,
    updateMemberRole,
    removeMember,
  };
}
