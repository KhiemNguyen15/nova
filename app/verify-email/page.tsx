'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresManagementApi) {
          // Show a more helpful message when Management API is not configured
          setError(data.message);
        } else {
          throw new Error(data.error || 'Failed to resend verification email');
        }
      } else {
        setResendSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setError(null);

    try {
      // Force reload the session to get updated email_verified status
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.email_verified) {
        // Email is now verified, redirect to continue
        router.push('/dashboard');
      } else {
        setError('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            To continue using Nova, please verify your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2">
              We've sent a verification email to:
            </p>
            <p className="font-semibold">{user.email}</p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Please check your inbox and click the verification link to continue.</p>
            <p>If you don't see the email, check your spam folder.</p>
          </div>

          {resendSuccess && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              Verification email sent successfully! Please check your inbox.
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleCheckVerification}
              className="w-full"
              disabled={isCheckingVerification}
            >
              {isCheckingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  I've Verified My Email
                </>
              )}
            </Button>

            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={isResending || resendSuccess}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendSuccess ? (
                'Email Sent!'
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/auth/logout"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out and use a different email
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
