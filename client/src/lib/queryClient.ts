import { QueryClient, QueryFunction } from"@tanstack/react-query";

// Cache version - increment to force cache clear on deploy
// v4: Conservative sanitization that preserves data structure + mutation sanitization
const CACHE_VERSION = 4;
const CACHE_VERSION_KEY = 'twealth_cache_version';

/**
 * Deep sanitizes API response data to prevent React Error #300.
 * CONSERVATIVE: Preserves data structure, only ensures values are proper types.
 * The actual protection from objects-as-React-children happens at render time
 * via safeString/SafeText in components.
 * 
 * This function ensures:
 * - null/undefined stay as-is (React handles these)
 * - primitives stay as-is
 * - arrays are recursively sanitized
 * - objects are recursively sanitized to ensure nested values are clean
 * - Date objects are converted to ISO strings
 */
function sanitizeResponseData(data: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > 50) {
    console.warn('[QueryClient] Max recursion depth reached in sanitizeResponseData');
    return data;
  }
  
  // null/undefined are safe
  if (data === null || data === undefined) return data;
  
  // Primitives are safe
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
  
  // Date objects - convert to ISO string
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Arrays: sanitize each element
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item, depth + 1));
  }
  
  // Objects: recursively sanitize all properties
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeResponseData(value, depth + 1);
    }
    
    return sanitized;
  }
  
  // Fallback for symbols, functions, etc: convert to string
  return String(data);
}

/**
 * Check cache version and clear if outdated.
 * Called on app initialization to prevent stale cache issues.
 * Must be called after queryClient is initialized.
 */
export function checkAndClearStaleCache(client: QueryClient): void {
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const currentVersion = String(CACHE_VERSION);
    
    if (storedVersion !== currentVersion) {
      console.log('[QueryClient] Cache version mismatch, clearing stale cache');
      // Clear React Query cache
      client.clear();
      // Update version
      localStorage.setItem(CACHE_VERSION_KEY, currentVersion);
    }
  } catch (e) {
    console.warn('[QueryClient] Error checking cache version:', e);
  }
}

export class RateLimitError extends Error {
 retryAfter: number;
 constructor(message: string, retryAfter: number = 60) {
  super(message);
  this.name = 'RateLimitError';
  this.retryAfter = retryAfter;
 }
}

async function throwIfResNotOk(res: Response) {
 if (!res.ok) {
  let errorMessage = res.statusText;
  let retryAfter = 60; // Default 1 minute
  
  try {
   const text = await res.text();
   if (text) {
    // Try to parse as JSON first
    try {
     const json = JSON.parse(text);
     errorMessage = json.message || json.error || text;
     retryAfter = json.retryAfter || retryAfter;
    } catch {
     errorMessage = text;
    }
   }
  } catch (e) {
   console.error('Error parsing response:', e);
  }
  
  // Handle rate limiting specifically
  if (res.status === 429) {
   const retryAfterHeader = res.headers.get('Retry-After');
   if (retryAfterHeader) {
    retryAfter = parseInt(retryAfterHeader, 10);
   }
   const rateLimitMessage = `You've made too many requests. Please wait ${retryAfter} seconds and try again.`;
   throw new RateLimitError(rateLimitMessage, retryAfter);
  }
  
  // Create user-friendly error messages
  const userFriendlyMessage = res.status === 401 
   ? 'Please sign in to continue'
   : res.status === 403
   ? 'You don\'t have permission to access this resource'
   : res.status === 404
   ? 'The requested resource was not found'
   : res.status >= 500
   ? 'Server error. Please try again later'
   : errorMessage;
  
  throw new Error(userFriendlyMessage);
 }
}

export async function apiRequest(
 method: string,
 url: string,
 data?: unknown | undefined,
): Promise<Response> {
 const res = await fetch(url, {
  method,
  headers: data ? {"Content-Type":"application/json" } : {},
  body: data ? JSON.stringify(data) : undefined,
  credentials:"include",
 });

 await throwIfResNotOk(res);
 return res;
}

/**
 * Helper to parse and sanitize JSON response from mutations.
 * Use this instead of response.json() to prevent React Error #300.
 */
export async function parseJsonSafely<T = unknown>(response: Response): Promise<T> {
 const data = await response.json();
 return sanitizeResponseData(data) as T;
}

type UnauthorizedBehavior ="returnNull" |"throw";
export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> {
 const { on401: unauthorizedBehavior } = options;
 return async ({ queryKey }) => {
  const res = await fetch(queryKey.join("/") as string, {
   credentials:"include",
  });

  if (unauthorizedBehavior ==="returnNull" && res.status === 401) {
   return null as T;
  }

  await throwIfResNotOk(res);
  const data = await res.json();
  // Sanitize response data to prevent React Error #300
  // The sanitizeResponseData function ensures all string fields are actually strings
  // to prevent React Error #300 ("Objects are not valid as React child")
  return sanitizeResponseData(data) as T;
 };
}

export const queryClient = new QueryClient({
 defaultOptions: {
  queries: {
   queryFn: getQueryFn({ on401:"throw" }),
   refetchInterval: false,
   refetchOnWindowFocus: false,
   staleTime: 5 * 60 * 1000, // 5 minutes - balance between freshness and performance
   gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache longer (formerly cacheTime)
   retry: (failureCount, error) => {
    // Don't retry on rate limit errors - let user wait
    if (error instanceof RateLimitError) return false;
    
    // Don't retry on 4xx errors (client errors)
    if (error instanceof Error && error.message.includes('401')) return false;
    if (error instanceof Error && error.message.includes('403')) return false;
    if (error instanceof Error && error.message.includes('404')) return false;
    
    // Retry up to 2 times for other errors with exponential backoff
    return failureCount < 2;
   },
   retryDelay: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * 2 ** attemptIndex, 30000);
   },
  },
  mutations: {
   retry: (failureCount, error) => {
    // Don't retry on rate limit errors
    if (error instanceof RateLimitError) return false;
    
    // Don't retry mutations on client errors
    if (error instanceof Error && error.message.includes('40')) return false;
    
    // Retry once for network errors with exponential backoff
    return failureCount < 1;
   },
   retryDelay: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s...
    return Math.min(1000 * 2 ** attemptIndex, 30000);
   },
  },
 },
});
