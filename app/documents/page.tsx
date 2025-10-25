"use client";

import { useState } from "react";
import { FileText, Building2, Loader2, Upload, Sparkles } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { useDocuments } from "@/hooks/useDocuments";
import { useOrganizations } from "@/hooks/useOrganizations";
import { MainNav } from "@/components/navigation/main-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DocumentsPage() {
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const {
    documents,
    loading: docsLoading,
    refetch,
    deleteDocument,
  } = useDocuments(selectedOrgId);

  // Auto-select first organization when loaded
  if (
    !orgsLoading &&
    organizations.length > 0 &&
    !selectedOrgId
  ) {
    setSelectedOrgId(organizations[0].id);
  }

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-transparent">
      <MainNav />

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Document Management
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload and manage documents for your organization's knowledge base
          </p>
        </div>

        {/* Organization Selector */}
        {orgsLoading ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
            </CardContent>
          </Card>
        ) : organizations.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No Organizations
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You need to belong to an organization to upload documents. Please contact your administrator to be added to an organization.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Organization Selector Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Select Organization
                </CardTitle>
                <CardDescription>
                  Choose which organization's documents to manage
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[300px] justify-start"
                      size="lg"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {selectedOrg?.name || "Select organization"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[300px]">
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => setSelectedOrgId(org.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{org.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {org.role}
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedOrg && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{documents.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total document{documents.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedOrgId && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Document
                    </CardTitle>
                    <CardDescription>
                      Add new documents to your organization's knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentUpload
                      organizationId={selectedOrgId}
                      onUploadSuccess={refetch}
                    />
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{documents.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Across your organization
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
                      <Sparkles className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Completed</span>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            {documents.filter(d => d.embeddingStatus === 'completed').length}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Pending</span>
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            {documents.filter(d => d.embeddingStatus === 'pending').length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Documents List */}
            {selectedOrgId && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Your Documents</h2>
                    <p className="text-muted-foreground">
                      Manage and organize your uploaded documents
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    disabled={docsLoading}
                    className="gap-2"
                  >
                    {docsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
                <DocumentList
                  documents={documents}
                  loading={docsLoading}
                  onDelete={deleteDocument}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
