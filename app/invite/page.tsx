"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Users, Building2 } from "lucide-react";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useUser();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("pending");
  const [message, setMessage] = useState("");
  const [inviteDetails, setInviteDetails] = useState<{
    organizationName: string;
    groupName: string;
  } | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    if (isLoadingUser) {
      return;
    }

    if (!user) {
      const returnUrl = "/invite?token=" + encodeURIComponent(token);
      router.push("/auth/login?returnTo=" + encodeURIComponent(returnUrl));
      return;
    }

    acceptInvitation();
  }, [token, user, isLoadingUser, router]);

  const acceptInvitation = async () => {
    if (!token) return;

    setStatus("loading");
    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      setInviteDetails({
        organizationName: data.organization.name,
        groupName: data.group.name,
      });
      setStatus("success");
      setMessage("You have successfully joined the group!");

      setTimeout(() => {
        router.push("/chat");
      }, 3000);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to accept invitation");
    }
  };

  if (isLoadingUser || status === "pending") {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <CardTitle>Accepting Invitation</CardTitle>
              <CardDescription>Please wait while we process your invitation...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle>Welcome Aboard!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle>Invitation Error</CardTitle>
              <CardDescription className="text-destructive">{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && inviteDetails && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="font-medium">{inviteDetails.organizationName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Group</p>
                  <p className="font-medium">{inviteDetails.groupName}</p>
                </div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center text-sm text-muted-foreground">
              Redirecting you to chat...
            </div>
          )}

          {status === "error" && (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
