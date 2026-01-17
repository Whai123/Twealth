/**
 * useCountryDetection Hook
 * 
 * Automatically detects and sets user's country on first app load.
 * Only runs once if user hasn't manually set a country.
 * Also sets matching currency and language.
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { detectRegionalSettings, getCountryInfo } from '@/lib/countryDetection';

interface UserPreferences {
    countryCode?: string;
    currency?: string;
    language?: string;
    hasCompletedOnboarding?: boolean;
}

export function useCountryDetection() {
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

    // Fetch current user preferences
    const { data: preferences, isLoading } = useQuery<UserPreferences>({
        queryKey: ['/api/user-preferences'],
    });

    // Mutation to update preferences
    const updatePreferences = useMutation({
        mutationFn: (updates: Partial<UserPreferences>) =>
            apiRequest('PUT', '/api/user-preferences', updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
        },
    });

    useEffect(() => {
        // Don't run if:
        // - Still loading preferences
        // - Already detecting
        // - User has already set a country (not default US)
        // - Country was previously auto-detected (stored in localStorage)
        if (
            isLoading ||
            isDetecting ||
            updatePreferences.isPending
        ) {
            return;
        }

        // Check if we've already auto-detected for this user
        const hasAutoDetected = localStorage.getItem('twealth_country_autodetected');
        if (hasAutoDetected === 'true') {
            return;
        }

        // Only auto-detect if user hasn't manually changed from default
        // We check if countryCode is exactly "US" (the default) or undefined
        const isDefaultCountry = !preferences?.countryCode || preferences.countryCode === 'US';

        // Also check if currency is default USD
        const isDefaultCurrency = !preferences?.currency || preferences.currency === 'USD';

        // If both are defaults, the user likely hasn't configured yet - run detection
        if (isDefaultCountry && isDefaultCurrency) {
            setIsDetecting(true);

            try {
                const detected = detectRegionalSettings();
                setDetectedCountry(detected.countryCode);

                console.log('[useCountryDetection] Auto-detected:', detected);

                // Only update if we detected something different from US
                if (detected.countryCode !== 'US') {
                    updatePreferences.mutate({
                        countryCode: detected.countryCode,
                        currency: detected.currency,
                        // Don't override language - let user choose AI response language
                    }, {
                        onSuccess: () => {
                            console.log('[useCountryDetection] Successfully set country to:', detected.countryCode);
                            // Mark as auto-detected so we don't do it again
                            localStorage.setItem('twealth_country_autodetected', 'true');
                        },
                        onError: (error) => {
                            console.error('[useCountryDetection] Failed to update preferences:', error);
                        }
                    });
                } else {
                    // Even if US, mark as detected so we don't re-run
                    localStorage.setItem('twealth_country_autodetected', 'true');
                }
            } catch (error) {
                console.error('[useCountryDetection] Detection error:', error);
            } finally {
                setIsDetecting(false);
            }
        }
    }, [isLoading, preferences, isDetecting, updatePreferences.isPending]);

    return {
        isDetecting,
        detectedCountry,
        currentCountry: preferences?.countryCode,
        currentCurrency: preferences?.currency,
    };
}

/**
 * Hook to manually trigger country re-detection
 * Useful if user wants to reset to auto-detected settings
 */
export function useRedetectCountry() {
    const updatePreferences = useMutation({
        mutationFn: (updates: Partial<UserPreferences>) =>
            apiRequest('PUT', '/api/user-preferences', updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
        },
    });

    const redetect = () => {
        const detected = detectRegionalSettings();

        updatePreferences.mutate({
            countryCode: detected.countryCode,
            currency: detected.currency,
        });

        return detected;
    };

    return {
        redetect,
        isPending: updatePreferences.isPending,
    };
}
