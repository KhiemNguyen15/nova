"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useOrganizationRole } from "@/hooks/useOrganizationRole";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  role: string;
}

export function OrganizationSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/organizations");
      if (!response.ok) throw new Error("Failed to fetch organizations");

      const data = await response.json();
      setOrganizations(data.organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create organization");

      setNewOrgName("");
      setNewOrgDescription("");
      setIsCreating(false);
      await fetchOrganizations();
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Failed to create organization");
    }
  };

  const updateOrganization = async (id: string, name: string, description: string) => {
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error("Failed to update organization");

      setEditingId(null);
      await fetchOrganizations();
    } catch (error) {
      console.error("Error updating organization:", error);
      alert("Failed to update organization");
    }
  };

  const deleteOrganization = async (id: string) => {
    if (!confirm("Are you sure you want to delete this organization? This will delete all groups, conversations, and documents.")) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete organization");

      await fetchOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Failed to delete organization");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organizations</h2>
          <p className="text-muted-foreground">Manage your organizations</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-desc">Description (optional)</Label>
              <Input
                id="org-desc"
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createOrganization}>Create</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            isEditing={editingId === org.id}
            onEdit={() => setEditingId(org.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={updateOrganization}
            onDelete={deleteOrganization}
          />
        ))}

        {organizations.length === 0 && !isCreating && (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization to get started
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function OrganizationCard({
  organization,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  organization: Organization;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, name: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description || "");
  const { isAdmin } = useOrganizationRole(organization.id);

  const handleUpdate = async () => {
    await onUpdate(organization.id, name, description);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Organization name"
                />
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                />
              </div>
            ) : (
              <>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {organization.name}
                </CardTitle>
                {organization.description && (
                  <CardDescription>{organization.description}</CardDescription>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {organization.role}
            </span>
            {isAdmin && (
              <>
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleUpdate}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(organization.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
