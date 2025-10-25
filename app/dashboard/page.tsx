import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0'; // your Auth0 client
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainNav } from '@/components/navigation/main-nav';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, FileText, MessageSquare } from 'lucide-react';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  // Get the session from Auth0
  const session = await auth0.getSession();

  // If no session, redirect to login
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  // Check if user exists in database
  const auth0Id = session.user.sub;
  const existingUser = await db.query.users.findFirst({
    where: eq(users.auth0Id, auth0Id),
  });

  // Redirect to onboarding if user not in database
  if (!existingUser) {
    redirect('/onboarding');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <MainNav />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {user.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's an overview of your Nova workspace
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Organizations */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No organizations yet</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Upload your first document</p>
            </CardContent>
          </Card>

          {/* Conversations */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Start chatting</p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Sparkles className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>
              <p className="text-xs text-muted-foreground mt-2">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {/* ... keep your cards here ... */}
      </div>
    </div>
  );
}
