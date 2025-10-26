"use client";

import { useState, useEffect } from "react";

export function useOrganizationRole(organizationId: string | null) {
  const [role, setRole] = useState<'admin' | 'manager' | 'member' | 'viewer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    async function fetchRole() {
      setIsLoading(true);
      try {
        // Fetch organizations to get role
        const response = await fetch('/api/organizations');
        if (!response.ok) throw new Error('Failed to fetch organizations');

        const data = await response.json();
        const org = data.organizations.find((o: any) => o.id === organizationId);

        setRole(org?.role || null);
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [organizationId]);

  const isAdmin = role === 'admin';
  const canManage = role === 'admin' || role === 'manager';

  return { role, isAdmin, canManage, isLoading };
}
