"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { GroupSettings } from "@/components/settings/GroupSettings";
import { MemberManagement } from "@/components/settings/MemberManagement";
import { Loader2, Building2, Users, UserCog } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoading: isLoadingUser } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("organizations");

  // Redirect if not authenticated
  if (!isLoadingUser && !user) {
    router.push("/auth/login");
    return null;
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-transparent">
        <MainNav />
        <div className="flex flex-col h-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <MainNav />

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your organizations, groups, and members
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="organizations" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groups
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Members
                </TabsTrigger>
              </TabsList>

              <TabsContent value="organizations">
                <OrganizationSettings />
              </TabsContent>

              <TabsContent value="groups">
                <GroupSettings />
              </TabsContent>

              <TabsContent value="members">
                <MemberManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
