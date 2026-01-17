/**
 * API Client for Twealth Mobile
 * 
 * Handles all HTTP requests to the backend with JWT authentication.
 * Automatically includes access token in headers.
 * Handles token refresh when access token expires.
 */

import * as SecureStore from 'expo-secure-store';

// Use environment variable or default for development
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://twealth.ltd';

const TOKENS_KEY = 'twealth_tokens';

interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * Get stored tokens from secure storage
 */
export async function getTokens(): Promise<Tokens | null> {
    try {
        const data = await SecureStore.getItemAsync(TOKENS_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

/**
 * Store tokens in secure storage
 */
export async function setTokens(tokens: Tokens): Promise<void> {
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

/**
 * Clear tokens from secure storage
 */
export async function clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
}

/**
 * Check if tokens exist and access token is not expired
 */
export async function isAuthenticated(): Promise<boolean> {
    const tokens = await getTokens();
    if (!tokens) return false;

    // Token is valid if it hasn't expired yet (with 60s buffer)
    return tokens.expiresAt > Date.now() + 60000;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
            // Refresh token is invalid, clear tokens
            await clearTokens();
            return false;
        }

        const data = await response.json();
        await setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: Date.now() + data.expiresIn * 1000,
        });

        return true;
    } catch {
        await clearTokens();
        return false;
    }
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(): Promise<string | null> {
    const tokens = await getTokens();
    if (!tokens) return null;

    // If token is expired or about to expire, refresh it
    if (tokens.expiresAt < Date.now() + 60000) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) return null;

        const newTokens = await getTokens();
        return newTokens?.accessToken || null;
    }

    return tokens.accessToken;
}

/**
 * API request with automatic auth handling
 */
export async function apiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    body?: object
): Promise<T> {
    const accessToken = await getValidAccessToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        // Token might have just expired, try to refresh and retry once
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            const newToken = await getValidAccessToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                });

                if (!retryResponse.ok) {
                    throw new Error(`API Error: ${retryResponse.status}`);
                }

                return retryResponse.json();
            }
        }

        // Refresh failed, clear tokens
        await clearTokens();
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}

/**
 * Convenience methods
 */
export const api = {
    get: <T>(endpoint: string) => apiRequest<T>('GET', endpoint),
    post: <T>(endpoint: string, body?: object) => apiRequest<T>('POST', endpoint, body),
    put: <T>(endpoint: string, body?: object) => apiRequest<T>('PUT', endpoint, body),
    patch: <T>(endpoint: string, body?: object) => apiRequest<T>('PATCH', endpoint, body),
    delete: <T>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
};
