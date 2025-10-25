"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { UserNav } from "./user-nav";
import { useUser } from "@auth0/nextjs-auth0/client";

export function MainNav() {
  const { user, isLoading } = useUser();

  return (
    <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Nova
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/documents"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documents
              </Link>
            </>
          )}
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>

          {/* Auth0 user logic */}
          {isLoading ? (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Link href="/chat">Chat Now</Link>
              </Button>
              <UserNav />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/login">Sign In</a>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
