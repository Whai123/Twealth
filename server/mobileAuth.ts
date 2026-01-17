/**
 * Mobile Auth Routes
 * 
 * Handles JWT-based authentication for React Native mobile app.
 * Separate from web cookie auth - both work simultaneously.
 * 
 * Endpoints:
 * - GET  /api/auth/google/mobile - Initiate Google OAuth with state + PKCE
 * - GET  /api/auth/google/mobile/callback - Handle OAuth callback
 * - POST /api/auth/mobile/token - Exchange one-time code for JWT tokens
 * - POST /api/auth/mobile/refresh - Refresh access token (with rotation)
 * - POST /api/auth/mobile/logout - Revoke all tokens
 */

import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { storeAuthCode, redeemAuthCode } from './services/mobileAuthStore';
import { generateTokenPair, rotateRefreshToken, revokeAllUserTokens, verifyAccessToken } from './services/jwtService';

const router = Router();

// Rate limiter for token endpoints (prevent brute force)
const tokenRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window per IP
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Store for PKCE and state verification (use Redis in production for multi-instance)
const stateStore = new Map<string, { codeChallenge?: string; createdAt: number }>();

// Clean up old state entries every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [state, entry] of stateStore.entries()) {
        if (entry.createdAt < fiveMinutesAgo) {
            stateStore.delete(state);
        }
    }
}, 5 * 60 * 1000);

/**
 * Initiate Google OAuth for mobile
 * Requires state parameter, optionally supports PKCE code_challenge
 */
router.get('/google/mobile', (req: Request, res: Response, next: NextFunction) => {
    const { state, code_challenge, code_challenge_method } = req.query;

    if (!state || typeof state !== 'string') {
        return res.status(400).json({ error: 'State parameter required for security' });
    }

    // Store state and optional PKCE challenge
    stateStore.set(state, {
        codeChallenge: code_challenge as string | undefined,
        createdAt: Date.now(),
    });

    console.log(`[MobileAuth] OAuth initiated with state: ${state.substring(0, 8)}...`);

    // Redirect to Google with custom callback
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state,
        callbackURL: `${process.env.APP_URL || 'http://localhost:5000'}/api/auth/google/mobile/callback`,
    } as any)(req, res, next);
});

/**
 * Google OAuth callback for mobile
 * Generates one-time code and redirects to app
 */
router.get('/google/mobile/callback',
    passport.authenticate('google', { session: false, failureRedirect: 'twealth://auth?error=oauth_failed' }),
    async (req: Request, res: Response) => {
        const { state } = req.query;
        const user = req.user as any;

        if (!user?.id) {
            console.log('[MobileAuth] Callback: No user from OAuth');
            return res.redirect('twealth://auth?error=no_user');
        }

        // Verify state matches
        if (!state || typeof state !== 'string' || !stateStore.has(state)) {
            console.log('[MobileAuth] Callback: State mismatch or missing');
            return res.redirect('twealth://auth?error=state_mismatch');
        }

        // Get and delete state entry
        const stateEntry = stateStore.get(state);
        stateStore.delete(state);

        // Generate one-time code (60 second TTL, single-use)
        const code = randomBytes(32).toString('hex');
        await storeAuthCode(code, user.id);

        console.log(`[MobileAuth] Callback: Generated code for user ${user.id}`);

        // Redirect to app with code
        // Include code_challenge if PKCE was used (for verification in token exchange)
        const redirectUrl = stateEntry?.codeChallenge
            ? `twealth://auth?code=${code}&pkce=true`
            : `twealth://auth?code=${code}`;

        res.redirect(redirectUrl);
    }
);

/**
 * Exchange one-time code for JWT tokens
 * Rate-limited to prevent brute force
 */
router.post('/mobile/token', tokenRateLimit, async (req: Request, res: Response) => {
    const { code, code_verifier } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
    }

    // Redeem one-time code (automatically deleted after use)
    const userId = await redeemAuthCode(code);

    if (!userId) {
        console.log('[MobileAuth] Token: Invalid or expired code');
        return res.status(401).json({ error: 'Invalid or expired authorization code' });
    }

    // TODO: Verify PKCE code_verifier if code_challenge was stored
    // For now, we skip PKCE verification (can be added with Redis state store)

    // Generate token pair
    const tokens = await generateTokenPair(userId);

    console.log(`[MobileAuth] Token: Issued tokens for user ${userId}`);

    res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
    });
});

/**
 * Refresh access token
 * Implements refresh token rotation (old token invalidated, new one issued)
 */
router.post('/mobile/refresh', tokenRateLimit, async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    // Rotate refresh token (returns new pair or null if invalid)
    const newTokens = await rotateRefreshToken(refreshToken);

    if (!newTokens) {
        console.log('[MobileAuth] Refresh: Invalid or expired refresh token');
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    console.log('[MobileAuth] Refresh: Token rotated successfully');

    res.json({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        tokenType: 'Bearer',
    });
});

/**
 * Logout - revoke all refresh tokens for user
 * Requires valid access token
 */
router.post('/mobile/logout', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid access token' });
    }

    // Revoke all refresh tokens for this user
    await revokeAllUserTokens(decoded.userId);

    console.log(`[MobileAuth] Logout: Revoked all tokens for user ${decoded.userId}`);

    res.json({ success: true, message: 'Logged out from all devices' });
});

/**
 * Middleware to authenticate mobile requests with JWT
 * Use this on routes that should accept mobile auth
 */
export function authenticateMobile(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // Check for Bearer token
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = verifyAccessToken(token);

        if (decoded) {
            // Set user on request (compatible with existing routes)
            (req as any).user = { id: decoded.userId };
            (req as any).userId = decoded.userId;
            return next();
        }
    }

    return res.status(401).json({ error: 'Invalid or missing access token' });
}

/**
 * Hybrid middleware that accepts both cookie auth (web) and JWT auth (mobile)
 */
export function authenticateHybrid(req: Request, res: Response, next: NextFunction) {
    // Method 1: Cookie auth (web) - check if Passport session exists
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // Method 2: JWT Bearer token (mobile)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = verifyAccessToken(token);

        if (decoded) {
            (req as any).user = { id: decoded.userId };
            (req as any).userId = decoded.userId;
            return next();
        }
    }

    return res.status(401).json({ error: 'Unauthorized' });
}

export default router;
