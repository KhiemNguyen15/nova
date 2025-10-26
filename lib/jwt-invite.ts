/**
 * JWT-based invitation system
 *
 * This module handles creating and verifying JWT tokens for group invitations.
 * Invitations are signed tokens that contain group/org info and expiration.
 */

import { SignJWT, jwtVerify } from 'jose';

// Secret key for signing JWT tokens
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH0_SECRET || 'your-secret-key-for-invites'
);

const INVITE_EXPIRATION = '7d'; // 7 days

export interface InvitePayload {
  groupId: string;
  organizationId: string;
  organizationName: string;
  groupName: string;
  invitedBy: string; // User ID who created the invite
  invitedByName: string; // Name of inviter for display
}

export interface InviteToken extends InvitePayload {
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Generate an invitation JWT token
 */
export async function generateInviteToken(payload: InvitePayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(INVITE_EXPIRATION)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode an invitation token
 */
export async function verifyInviteToken(token: string): Promise<InviteToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload as InviteToken;
  } catch (error) {
    console.error('Invalid invite token:', error);
    return null;
  }
}

/**
 * Generate a full invitation URL
 */
export function generateInviteUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/invite?token=${encodeURIComponent(token)}`;
}

/**
 * Check if an invite token is expired
 */
export function isInviteExpired(token: InviteToken): boolean {
  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}
