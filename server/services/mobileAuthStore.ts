/**
 * Mobile Auth Store - Redis-based one-time code storage
 * 
 * Uses Upstash Redis for production-ready multi-instance deployments.
 * Codes are single-use, TTL 60 seconds, deleted after redemption.
 * 
 * Falls back to in-memory store if Redis is not configured.
 */

// In-memory fallback for local development (DO NOT USE IN PRODUCTION)
const localStore = new Map<string, { userId: string; expiresAt: number }>();

const CODE_PREFIX = 'mobile_auth_code:';
const CODE_TTL_SECONDS = 60; // 60 seconds

// Lazy-loaded Redis client to prevent top-level import errors
let redisClient: any = null;
let redisInitialized = false;

async function getRedis() {
    if (redisInitialized) return redisClient;

    redisInitialized = true;

    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
        try {
            const { Redis } = await import('@upstash/redis');
            redisClient = new Redis({
                url: process.env.UPSTASH_REDIS_URL,
                token: process.env.UPSTASH_REDIS_TOKEN,
            });
            console.log('[MobileAuth] Redis client initialized');
        } catch (error) {
            console.log('[MobileAuth] Redis initialization failed, using memory store:', error);
            redisClient = null;
        }
    } else {
        console.log('[MobileAuth] No Redis configured, using memory store');
    }

    return redisClient;
}

/**
 * Store a one-time auth code
 * @param code - The one-time code
 * @param userId - The user ID to associate with the code
 */
export async function storeAuthCode(code: string, userId: string): Promise<void> {
    const redis = await getRedis();

    if (redis) {
        // Production: Use Redis with TTL
        await redis.set(`${CODE_PREFIX}${code}`, userId, { ex: CODE_TTL_SECONDS });
        console.log(`[MobileAuth] Stored code in Redis, TTL: ${CODE_TTL_SECONDS}s`);
    } else {
        // Local dev fallback
        localStore.set(code, {
            userId,
            expiresAt: Date.now() + CODE_TTL_SECONDS * 1000,
        });
        console.log('[MobileAuth] Stored code in local memory (dev only)');
    }
}

/**
 * Redeem a one-time auth code
 * Returns the userId if valid, null if invalid/expired
 * Code is deleted after successful redemption (single-use)
 * 
 * @param code - The one-time code to redeem
 * @returns The user ID or null
 */
export async function redeemAuthCode(code: string): Promise<string | null> {
    const redis = await getRedis();

    if (redis) {
        // Production: Use Redis
        const key = `${CODE_PREFIX}${code}`;

        // Get and delete atomically (single-use)
        const userId = await redis.getdel<string>(key);

        if (userId) {
            console.log('[MobileAuth] Code redeemed and deleted from Redis');
            return userId;
        }

        console.log('[MobileAuth] Code not found or already used');
        return null;
    } else {
        // Local dev fallback
        const entry = localStore.get(code);

        if (!entry) {
            console.log('[MobileAuth] Code not found');
            return null;
        }

        // Check expiry
        if (entry.expiresAt < Date.now()) {
            localStore.delete(code);
            console.log('[MobileAuth] Code expired');
            return null;
        }

        // Delete after use (single-use)
        localStore.delete(code);
        console.log('[MobileAuth] Code redeemed and deleted');

        return entry.userId;
    }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
    const redis = await getRedis();
    return redis !== null;
}

/**
 * Clean up expired codes from local store (for dev only)
 * In production, Redis TTL handles this automatically
 */
export function cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [code, entry] of localStore.entries()) {
        if (entry.expiresAt < now) {
            localStore.delete(code);
        }
    }
}
