/**
 * Country Detection Utility
 * 
 * Auto-detects user's country from:
 * 1. Browser language/locale (navigator.language)
 * 2. Timezone (Intl.DateTimeFormat)
 * 3. Falls back to 'US' if detection fails
 * 
 * Also provides matching currency for detected country
 */

interface CountryInfo {
    code: string;
    name: string;
    currency: string;
    currencySymbol: string;
    language: string;
}

// Comprehensive mapping of countries to currencies and languages
const COUNTRY_DATA: Record<string, CountryInfo> = {
    // Asia Pacific
    TH: { code: 'TH', name: 'Thailand', currency: 'THB', currencySymbol: '฿', language: 'th' },
    JP: { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥', language: 'ja' },
    KR: { code: 'KR', name: 'South Korea', currency: 'KRW', currencySymbol: '₩', language: 'ko' },
    CN: { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥', language: 'zh' },
    TW: { code: 'TW', name: 'Taiwan', currency: 'TWD', currencySymbol: 'NT$', language: 'zh' },
    HK: { code: 'HK', name: 'Hong Kong', currency: 'HKD', currencySymbol: 'HK$', language: 'zh' },
    SG: { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$', language: 'en' },
    MY: { code: 'MY', name: 'Malaysia', currency: 'MYR', currencySymbol: 'RM', language: 'ms' },
    ID: { code: 'ID', name: 'Indonesia', currency: 'IDR', currencySymbol: 'Rp', language: 'id' },
    PH: { code: 'PH', name: 'Philippines', currency: 'PHP', currencySymbol: '₱', language: 'tl' },
    VN: { code: 'VN', name: 'Vietnam', currency: 'VND', currencySymbol: '₫', language: 'vi' },
    IN: { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', language: 'hi' },
    AU: { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$', language: 'en' },
    NZ: { code: 'NZ', name: 'New Zealand', currency: 'NZD', currencySymbol: 'NZ$', language: 'en' },

    // North America
    US: { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', language: 'en' },
    CA: { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$', language: 'en' },
    MX: { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$', language: 'es' },

    // Europe
    GB: { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', language: 'en' },
    DE: { code: 'DE', name: 'Germany', currency: 'EUR', currencySymbol: '€', language: 'de' },
    FR: { code: 'FR', name: 'France', currency: 'EUR', currencySymbol: '€', language: 'fr' },
    IT: { code: 'IT', name: 'Italy', currency: 'EUR', currencySymbol: '€', language: 'it' },
    ES: { code: 'ES', name: 'Spain', currency: 'EUR', currencySymbol: '€', language: 'es' },
    PT: { code: 'PT', name: 'Portugal', currency: 'EUR', currencySymbol: '€', language: 'pt' },
    NL: { code: 'NL', name: 'Netherlands', currency: 'EUR', currencySymbol: '€', language: 'nl' },
    BE: { code: 'BE', name: 'Belgium', currency: 'EUR', currencySymbol: '€', language: 'nl' },
    AT: { code: 'AT', name: 'Austria', currency: 'EUR', currencySymbol: '€', language: 'de' },
    CH: { code: 'CH', name: 'Switzerland', currency: 'CHF', currencySymbol: 'CHF', language: 'de' },
    SE: { code: 'SE', name: 'Sweden', currency: 'SEK', currencySymbol: 'kr', language: 'sv' },
    NO: { code: 'NO', name: 'Norway', currency: 'NOK', currencySymbol: 'kr', language: 'no' },
    DK: { code: 'DK', name: 'Denmark', currency: 'DKK', currencySymbol: 'kr', language: 'da' },
    FI: { code: 'FI', name: 'Finland', currency: 'EUR', currencySymbol: '€', language: 'fi' },
    IE: { code: 'IE', name: 'Ireland', currency: 'EUR', currencySymbol: '€', language: 'en' },
    PL: { code: 'PL', name: 'Poland', currency: 'PLN', currencySymbol: 'zł', language: 'pl' },
    CZ: { code: 'CZ', name: 'Czech Republic', currency: 'CZK', currencySymbol: 'Kč', language: 'cs' },
    GR: { code: 'GR', name: 'Greece', currency: 'EUR', currencySymbol: '€', language: 'el' },
    RU: { code: 'RU', name: 'Russia', currency: 'RUB', currencySymbol: '₽', language: 'ru' },
    TR: { code: 'TR', name: 'Turkey', currency: 'TRY', currencySymbol: '₺', language: 'tr' },

    // Middle East
    AE: { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'د.إ', language: 'ar' },
    SA: { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'ر.س', language: 'ar' },
    IL: { code: 'IL', name: 'Israel', currency: 'ILS', currencySymbol: '₪', language: 'he' },

    // Latin America
    BR: { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', language: 'pt' },
    AR: { code: 'AR', name: 'Argentina', currency: 'ARS', currencySymbol: '$', language: 'es' },
    CL: { code: 'CL', name: 'Chile', currency: 'CLP', currencySymbol: '$', language: 'es' },
    CO: { code: 'CO', name: 'Colombia', currency: 'COP', currencySymbol: '$', language: 'es' },
    PE: { code: 'PE', name: 'Peru', currency: 'PEN', currencySymbol: 'S/', language: 'es' },

    // Africa
    ZA: { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', language: 'en' },
    NG: { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', language: 'en' },
    EG: { code: 'EG', name: 'Egypt', currency: 'EGP', currencySymbol: 'E£', language: 'ar' },
    KE: { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh', language: 'en' },
};

// Map timezone to country code
const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
    // Asia
    'Asia/Bangkok': 'TH',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Shanghai': 'CN',
    'Asia/Beijing': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Taipei': 'TW',
    'Asia/Singapore': 'SG',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Asia/Ho_Chi_Minh': 'VN',
    'Asia/Saigon': 'VN',
    'Asia/Kolkata': 'IN',
    'Asia/Mumbai': 'IN',
    'Asia/Dubai': 'AE',
    'Asia/Riyadh': 'SA',
    'Asia/Jerusalem': 'IL',

    // Australia/Pacific
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU',
    'Pacific/Auckland': 'NZ',

    // Americas
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Buenos_Aires': 'AR',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Lima': 'PE',

    // Europe
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Lisbon': 'PT',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Vienna': 'AT',
    'Europe/Zurich': 'CH',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Dublin': 'IE',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Athens': 'GR',
    'Europe/Moscow': 'RU',
    'Europe/Istanbul': 'TR',

    // Africa
    'Africa/Johannesburg': 'ZA',
    'Africa/Lagos': 'NG',
    'Africa/Cairo': 'EG',
    'Africa/Nairobi': 'KE',
};

// Map language code to most likely country
const LANGUAGE_COUNTRY_MAP: Record<string, string> = {
    'th': 'TH',
    'th-TH': 'TH',
    'ja': 'JP',
    'ja-JP': 'JP',
    'ko': 'KR',
    'ko-KR': 'KR',
    'zh': 'CN',
    'zh-CN': 'CN',
    'zh-TW': 'TW',
    'zh-HK': 'HK',
    'id': 'ID',
    'id-ID': 'ID',
    'ms': 'MY',
    'ms-MY': 'MY',
    'vi': 'VN',
    'vi-VN': 'VN',
    'hi': 'IN',
    'hi-IN': 'IN',
    'tl': 'PH',
    'fil': 'PH',
    'en-US': 'US',
    'en-GB': 'GB',
    'en-AU': 'AU',
    'en-NZ': 'NZ',
    'en-CA': 'CA',
    'en-SG': 'SG',
    'en-IN': 'IN',
    'en-ZA': 'ZA',
    'es': 'ES',
    'es-ES': 'ES',
    'es-MX': 'MX',
    'es-AR': 'AR',
    'es-CL': 'CL',
    'es-CO': 'CO',
    'pt': 'PT',
    'pt-PT': 'PT',
    'pt-BR': 'BR',
    'de': 'DE',
    'de-DE': 'DE',
    'de-AT': 'AT',
    'de-CH': 'CH',
    'fr': 'FR',
    'fr-FR': 'FR',
    'fr-CA': 'CA',
    'fr-CH': 'CH',
    'it': 'IT',
    'it-IT': 'IT',
    'nl': 'NL',
    'nl-NL': 'NL',
    'nl-BE': 'BE',
    'sv': 'SE',
    'sv-SE': 'SE',
    'no': 'NO',
    'nb': 'NO',
    'da': 'DK',
    'da-DK': 'DK',
    'fi': 'FI',
    'fi-FI': 'FI',
    'pl': 'PL',
    'pl-PL': 'PL',
    'ru': 'RU',
    'ru-RU': 'RU',
    'tr': 'TR',
    'tr-TR': 'TR',
    'ar': 'SA',
    'ar-SA': 'SA',
    'ar-AE': 'AE',
    'ar-EG': 'EG',
    'he': 'IL',
    'he-IL': 'IL',
};

/**
 * Detect user's country from browser environment
 * Priority: 1. Timezone, 2. Language/Locale, 3. Default (US)
 */
export function detectCountry(): CountryInfo {
    try {
        // Method 1: Try timezone first (most accurate)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone && TIMEZONE_COUNTRY_MAP[timezone]) {
            const countryCode = TIMEZONE_COUNTRY_MAP[timezone];
            if (COUNTRY_DATA[countryCode]) {
                console.log(`[CountryDetection] Detected from timezone: ${timezone} → ${countryCode}`);
                return COUNTRY_DATA[countryCode];
            }
        }

        // Method 2: Try navigator.language
        const browserLang = navigator.language || (navigator as any).userLanguage;
        if (browserLang) {
            // First try exact match (e.g., "th-TH")
            if (LANGUAGE_COUNTRY_MAP[browserLang]) {
                const countryCode = LANGUAGE_COUNTRY_MAP[browserLang];
                if (COUNTRY_DATA[countryCode]) {
                    console.log(`[CountryDetection] Detected from language: ${browserLang} → ${countryCode}`);
                    return COUNTRY_DATA[countryCode];
                }
            }

            // Try base language (e.g., "th" from "th-TH")
            const baseLang = browserLang.split('-')[0];
            if (LANGUAGE_COUNTRY_MAP[baseLang]) {
                const countryCode = LANGUAGE_COUNTRY_MAP[baseLang];
                if (COUNTRY_DATA[countryCode]) {
                    console.log(`[CountryDetection] Detected from base language: ${baseLang} → ${countryCode}`);
                    return COUNTRY_DATA[countryCode];
                }
            }

            // Try region from locale (e.g., "US" from "en-US")
            const parts = browserLang.split('-');
            if (parts.length > 1) {
                const region = parts[1].toUpperCase();
                if (COUNTRY_DATA[region]) {
                    console.log(`[CountryDetection] Detected from locale region: ${region}`);
                    return COUNTRY_DATA[region];
                }
            }
        }

        // Method 3: Default to US
        console.log('[CountryDetection] No detection, defaulting to US');
        return COUNTRY_DATA['US'];
    } catch (error) {
        console.error('[CountryDetection] Error:', error);
        return COUNTRY_DATA['US'];
    }
}

/**
 * Get country info by code
 */
export function getCountryInfo(countryCode: string): CountryInfo | null {
    return COUNTRY_DATA[countryCode.toUpperCase()] || null;
}

/**
 * Get all available countries
 */
export function getAllCountries(): CountryInfo[] {
    return Object.values(COUNTRY_DATA);
}

/**
 * Detect and return all regional settings at once
 */
export function detectRegionalSettings(): {
    countryCode: string;
    currency: string;
    language: string;
} {
    const country = detectCountry();
    return {
        countryCode: country.code,
        currency: country.currency,
        language: country.language,
    };
}
