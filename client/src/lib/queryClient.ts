import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
