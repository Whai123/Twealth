/**
 * Auth Hook for Twealth Mobile
 * 
 * Provides authentication state and methods for login/logout.
 */

import { useEffect, useState, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
    API_URL,
    getTokens,
    setTokens,
    clearTokens,
    isAuthenticated as checkAuth
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

// Complete auth session when app returns
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    userId: string | null;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        userId: null,
    });

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const authenticated = await checkAuth();
            setAuthState({
                isAuthenticated: authenticated,
                isLoading: false,
                userId: null, // Could decode from token if needed
            });
        } catch {
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                userId: null,
            });
        }
    };

    /**
     * Sign in with Google
     */
    const signInWithGoogle = useCallback(async (): Promise<boolean> => {
        try {
            // Generate random state for CSRF protection
            const state = generateRandomString(32);

            // Create redirect URI for the app
            const redirectUri = AuthSession.makeRedirectUri({
                scheme: 'twealth',
                path: 'auth',
            });

            console.log('[Auth] Starting Google OAuth, redirect:', redirectUri);

            // Open OAuth flow in browser
            const authUrl = `${API_URL}/api/auth/google/mobile?state=${state}`;
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

            console.log('[Auth] OAuth result type:', result.type);

            if (result.type === 'success' && result.url) {
                // Parse the callback URL
                const url = new URL(result.url);
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');

                if (error) {
                    console.error('[Auth] OAuth error:', error);
                    return false;
                }

                if (code) {
                    // Exchange code for tokens
                    const response = await fetch(`${API_URL}/api/auth/mobile/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code }),
                    });

                    if (!response.ok) {
                        console.error('[Auth] Token exchange failed:', response.status);
                        return false;
                    }

                    const tokens = await response.json();

                    // Store tokens
                    await setTokens({
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresAt: Date.now() + tokens.expiresIn * 1000,
                    });

                    // Update auth state
                    setAuthState({
                        isAuthenticated: true,
                        isLoading: false,
                        userId: null,
                    });

                    console.log('[Auth] Sign in successful');
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('[Auth] Sign in error:', error);
            return false;
        }
    }, []);

    /**
     * Sign out
     */
    const signOut = useCallback(async (): Promise<void> => {
        try {
            const tokens = await getTokens();

            if (tokens?.accessToken) {
                // Revoke tokens on server
                await fetch(`${API_URL}/api/auth/mobile/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tokens.accessToken}`,
                    },
                }).catch(() => { });
            }
        } catch {
            // Ignore errors, just clear local tokens
        }

        // Clear local state
        await clearTokens();
        queryClient.clear();

        setAuthState({
            isAuthenticated: false,
            isLoading: false,
            userId: null,
        });

        console.log('[Auth] Signed out');
    }, []);

    return {
        ...authState,
        signInWithGoogle,
        signOut,
        checkAuthStatus,
    };
}

/**
 * Generate a random string for OAuth state parameter
 */
function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    for (let i = 0; i < length; i++) {
        result += chars[randomArray[i] % chars.length];
    }
    return result;
}
