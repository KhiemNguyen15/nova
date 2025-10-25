import { useState, useEffect } from 'react';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cloudflareRagId: string | null;
  organizationId: string;
  organizationName: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/groups');

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    error,
    refresh: fetchGroups,
  };
}
