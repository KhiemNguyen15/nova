import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST() {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If already verified, no need to resend
    if (session.user.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    const auth0UserId = session.user.sub;

    // Use Auth0 Management API to send verification email
    const managementApiUrl = `https://${process.env.AUTH0_DOMAIN}/api/v2/jobs/verification-email`;

    try {
      // Get Management API access token using the existing Auth0 credentials
      const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to get Management API token:', errorText);

        // Return fallback message
        return NextResponse.json({
          success: false,
          message: 'Unable to resend verification email automatically. Please check your email for the original verification link.',
          requiresManagementApi: true,
        }, { status: 501 });
      }

      const { access_token } = await tokenResponse.json();

      // Send verification email
      const verificationResponse = await fetch(managementApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          user_id: auth0UserId,
        }),
      });

      if (!verificationResponse.ok) {
        const errorData = await verificationResponse.text();
        console.error('Failed to send verification email:', errorData);

        return NextResponse.json({
          success: false,
          message: 'Unable to resend verification email. Please check your email for the original verification link.',
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (apiError) {
      console.error('Management API error:', apiError);
      return NextResponse.json({
        success: false,
        message: 'Unable to resend verification email. Please check your email for the original verification link.',
        requiresManagementApi: true,
      }, { status: 501 });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
