/**
 * JWT Service - Token generation and refresh token rotation
 * 
 * Features:
 * - Access tokens: 15 minute expiry
 * - Refresh tokens: 7 day expiry, hashed server-side, rotation on use
 * - Secure token generation with crypto
 */

import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { db } from '../db';
import { refreshTokens } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

// Token configuration
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

// JWT_SECRET handling - warn if not set, but don't crash the server
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        // In production without JWT_SECRET, generate a random one
        // Mobile auth won't persist across restarts, but web auth still works
        console.warn('[JWT] WARNING: JWT_SECRET not set in production! Mobile auth tokens will not persist across restarts. Add JWT_SECRET to your environment variables.');
        JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
    } else {
        // Dev mode - use a static dev secret
        JWT_SECRET = 'dev-secret-change-in-production';
    }
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds until access token expires
}

export interface DecodedToken {
    userId: string;
    type: 'access';
    iat: number;
    exp: number;
}

/**
 * Generate an access token
 */
export function generateAccessToken(userId: string): string {
    return jwt.sign(
        { userId, type: 'access' },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );
}

/**
 * Hash a refresh token for secure storage
 */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new token pair (access + refresh)
 * Stores hashed refresh token in database
 */
export async function generateTokenPair(userId: string): Promise<TokenPair> {
    const accessToken = generateAccessToken(userId);
    const refreshToken = randomBytes(64).toString('hex');
    const hashedToken = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    // Store hashed refresh token in database
    await db.insert(refreshTokens).values({
        userId,
        tokenHash: hashedToken,
        expiresAt,
    });

    console.log(`[JWT] Generated token pair for user: ${userId}`);

    return {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
    };
}

/**
 * Rotate a refresh token
 * - Validates the old token
 * - Deletes it (single-use)
 * - Issues a new token pair
 * 
 * Returns null if token is invalid or expired
 */
export async function rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair | null> {
    const hashedOld = hashToken(oldRefreshToken);

    // Find the token
    const [existingToken] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, hashedOld))
        .limit(1);

    if (!existingToken) {
        console.log('[JWT] Refresh token not found');
        return null;
    }

    // Check expiry
    if (existingToken.expiresAt < new Date()) {
        // Clean up expired token
        await db.delete(refreshTokens).where(eq(refreshTokens.id, existingToken.id));
        console.log('[JWT] Refresh token expired');
        return null;
    }

    // Delete old token (rotation - invalidates old token)
    await db.delete(refreshTokens).where(eq(refreshTokens.id, existingToken.id));
    console.log('[JWT] Old refresh token deleted (rotation)');

    // Generate new token pair
    return generateTokenPair(existingToken.userId);
}

/**
 * Verify an access token
 * Returns decoded payload or null if invalid
 */
export function verifyAccessToken(token: string): { userId: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        if (decoded.type !== 'access') {
            console.log('[JWT] Token type mismatch');
            return null;
        }

        return { userId: decoded.userId };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log('[JWT] Token expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.log('[JWT] Invalid token');
        }
        return null;
    }
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    console.log(`[JWT] Revoked all tokens for user: ${userId}`);
}

/**
 * Clean up expired refresh tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await db
        .delete(refreshTokens)
        .where(lt(refreshTokens.expiresAt, new Date()))
        .returning();

    if (result.length > 0) {
        console.log(`[JWT] Cleaned up ${result.length} expired tokens`);
    }

    return result.length;
}
