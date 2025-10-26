"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Pencil, Trash2, Loader2, Copy, Check, Link as LinkIcon, Shield, User } from "lucide-react";
import { useOrganizationRole } from "@/hooks/useOrganizationRole";
import { Badge } from "@/components/ui/badge";

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
}

export function GroupSettings() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedInDialog, setCopiedInDialog] = useState(false);

  const { isAdmin } = useOrganizationRole(selectedOrgId);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchGroups(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (!response.ok) throw new Error("Failed to fetch organizations");

      const data = await response.json();
      setOrganizations(data.organizations);
      
      if (data.organizations.length > 0 && !selectedOrgId) {
        setSelectedOrgId(data.organizations[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async (orgId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");

      const data = await response.json();
      // Filter groups by organization
      const orgGroups = data.groups?.filter((g: Group) => g.organizationId === orgId) || [];
      setGroups(orgGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !selectedOrgId) return;

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          organizationId: selectedOrgId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create group");

      setNewGroupName("");
      setNewGroupDescription("");
      setIsCreating(false);
      await fetchGroups(selectedOrgId);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  const updateGroup = async (id: string, name: string, description: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error("Failed to update group");

      setEditingId(null);
      if (selectedOrgId) {
        await fetchGroups(selectedOrgId);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group");
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group? This will delete all conversations.")) return;

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete group");

      if (selectedOrgId) {
        await fetchGroups(selectedOrgId);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const generateInvite = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate invite");

      const data = await response.json();

      // Show dialog with invite URL
      setInviteUrl(data.inviteUrl);
      setInviteDialogOpen(true);
      setCopiedInDialog(false);
    } catch (error) {
      console.error("Error generating invite:", error);
      alert("Failed to generate invite link");
    }
  };

  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInDialog(true);
      setTimeout(() => setCopiedInDialog(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  if (isLoading && organizations.length === 0) {
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
          <h2 className="text-2xl font-bold">Groups</h2>
          <p className="text-muted-foreground">Manage groups within your organizations</p>
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations</h3>
            <p className="text-muted-foreground">
              Create an organization first to manage groups
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Label>Select Organization:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start">
                  {selectedOrg?.name || "Select organization"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[200px]">
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && selectedOrgId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            )}
          </div>

          {isCreating && isAdmin && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Create New Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Engineering Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-desc">Description (optional)</Label>
                  <Input
                    id="group-desc"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createGroup}>Create</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isEditing={editingId === group.id}
                  onEdit={() => setEditingId(group.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={updateGroup}
                  onDelete={deleteGroup}
                  onGenerateInvite={generateInvite}
                  isGroupAdmin={group.role === 'admin'}
                />
              ))}

              {groups.length === 0 && !isCreating && selectedOrgId && (
                <Card className="border-border/50">
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isAdmin
                        ? "Create your first group to get started"
                        : "Contact an admin to create groups"}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Invitation Link Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Invitation Link</DialogTitle>
            <DialogDescription>
              Share this link with people you want to invite to this group.
              The link will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input
                  id="link"
                  value={inviteUrl}
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Close
              </Button>
              <Button onClick={copyInviteUrl}>
                {copiedInDialog ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupCard({
  group,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onGenerateInvite,
  isGroupAdmin,
}: {
  group: Group;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, name: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onGenerateInvite: (id: string) => Promise<void>;
  isGroupAdmin: boolean;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");

  const handleUpdate = async () => {
    await onUpdate(group.id, name, description);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'default' as const, icon: Shield },
      manager: { label: 'Manager', variant: 'secondary' as const, icon: Shield },
      member: { label: 'Member', variant: 'outline' as const, icon: User },
      viewer: { label: 'Viewer', variant: 'outline' as const, icon: User },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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
                  placeholder="Group name"
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
                  <Users className="h-5 w-5" />
                  {group.name}
                  {getRoleBadge(group.role)}
                </CardTitle>
                {group.description && (
                  <CardDescription>{group.description}</CardDescription>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isGroupAdmin ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateInvite(group.id)}
                  title="Generate invite link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
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
                      onClick={() => onDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Badge variant="outline" className="text-xs">
                View Only
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
