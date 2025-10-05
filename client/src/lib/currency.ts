// Currency conversion and formatting utilities for Twealth

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimals: number;
}

export const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2 },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2 },
  VND: { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0 },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2 },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2 },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2 },
};

// Exchange rates - fetched from backend API with fallback to static rates
let EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  THB: 33.50,
  EUR: 0.85,
  IDR: 15200,
  INR: 83.10,
  BRL: 5.20,
  MXN: 18.00,
  GBP: 0.78,
  JPY: 150.00,
  CAD: 1.35,
  AUD: 1.50,
  VND: 24000,
  PHP: 56.00,
  MYR: 4.65,
  TRY: 29.50,
};

let ratesLastFetched = 0;
const RATES_FETCH_INTERVAL = 60 * 60 * 1000; // Fetch every hour

/**
 * Fetch live exchange rates from backend API
 * @returns Promise that resolves when rates are updated
 */
export async function fetchLiveExchangeRates(): Promise<void> {
  // Skip if rates were fetched recently
  if (Date.now() - ratesLastFetched < RATES_FETCH_INTERVAL) {
    return;
  }

  try {
    const response = await fetch('/api/currency/rates');
    if (response.ok) {
      const data = await response.json();
      EXCHANGE_RATES = data.rates;
      ratesLastFetched = Date.now();
      console.log('💱 Exchange rates updated:', data.lastUpdated);
    }
  } catch (error) {
    console.warn('Failed to fetch live exchange rates, using fallback:', error);
  }
}

// Auto-fetch rates on module load
fetchLiveExchangeRates();

/**
 * Convert amount from one currency to another
 * @param amount Amount in source currency
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = usdAmount * EXCHANGE_RATES[toCurrency];
  
  return convertedAmount;
}

/**
 * Format currency amount with proper symbol and decimals
 * @param amount Amount to format
 * @param currencyCode Currency code
 * @param options Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    compact = false,
    locale = 'en-US'
  } = options;

  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    console.warn(`Unknown currency code: ${currencyCode}`);
    return amount.toString();
  }

  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
    notation: compact ? 'compact' : 'standard',
  });

  if (showSymbol) {
    return formatter.format(amount);
  } else {
    // Return without currency symbol
    const formatted = formatter.format(amount);
    return formatted.replace(/[^\d.,\s-]/g, '').trim();
  }
}

/**
 * Get localized pricing for different markets
 * @param baseAmountUSD Base price in USD
 * @param targetCurrency Target currency
 * @returns Localized price object
 */
export function getLocalizedPrice(
  baseAmountUSD: number,
  targetCurrency: string
): {
  amount: number;
  formatted: string;
  currency: Currency;
  isDiscounted: boolean;
  originalAmount?: number;
} {
  const currency = CURRENCIES[targetCurrency];
  if (!currency) {
    throw new Error(`Unsupported currency: ${targetCurrency}`);
  }

  let convertedAmount = convertCurrency(baseAmountUSD, 'USD', targetCurrency);
  let isDiscounted = false;
  let originalAmount: number | undefined;

  // Apply purchasing power parity adjustments for emerging markets
  const pppAdjustments: Record<string, number> = {
    IDR: 0.6,   // 40% discount for Indonesia
    VND: 0.6,   // 40% discount for Vietnam
    INR: 0.65,  // 35% discount for India  
    PHP: 0.7,   // 30% discount for Philippines
    BRL: 0.7,   // 30% discount for Brazil
    MYR: 0.75,  // 25% discount for Malaysia
    MXN: 0.75,  // 25% discount for Mexico
    THB: 0.8,   // 20% discount for Thailand
    TRY: 0.85,  // 15% discount for Turkey
  };

  if (pppAdjustments[targetCurrency]) {
    originalAmount = convertedAmount;
    convertedAmount = convertedAmount * pppAdjustments[targetCurrency];
    isDiscounted = true;
  }

  // Round to sensible increments for each currency
  convertedAmount = roundToNicePricing(convertedAmount, targetCurrency);

  return {
    amount: convertedAmount,
    formatted: formatCurrency(convertedAmount, targetCurrency),
    currency,
    isDiscounted,
    originalAmount
  };
}

/**
 * Round prices to nice, psychological pricing points
 * @param amount Raw converted amount
 * @param currency Currency code
 * @returns Rounded amount
 */
function roundToNicePricing(amount: number, currency: string): number {
  const roundingRules: Record<string, (amount: number) => number> = {
    THB: (amt) => Math.round(amt / 10) * 10,        // Round to nearest 10 THB
    IDR: (amt) => Math.round(amt / 1000) * 1000,    // Round to nearest 1000 IDR  
    VND: (amt) => Math.round(amt / 1000) * 1000,    // Round to nearest 1000 VND
    INR: (amt) => Math.round(amt / 10) * 10,        // Round to nearest 10 INR
    PHP: (amt) => Math.round(amt),                  // Round to nearest peso
    BRL: (amt) => Math.round(amt * 2) / 2,          // Round to nearest 0.5 BRL
    MYR: (amt) => Math.round(amt * 2) / 2,          // Round to nearest 0.5 MYR
    MXN: (amt) => Math.round(amt),                  // Round to nearest peso
    TRY: (amt) => Math.round(amt),                  // Round to nearest lira
    JPY: (amt) => Math.round(amt / 10) * 10,        // Round to nearest 10 JPY
    default: (amt) => Math.round(amt * 100) / 100   // Round to nearest cent
  };

  const rounder = roundingRules[currency] || roundingRules.default;
  return rounder(amount);
}

/**
 * Get currency symbol for a given currency code
 * @param currencyCode Currency code
 * @returns Currency symbol or code if not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol || currencyCode;
}

/**
 * Get all supported currencies as array
 * @returns Array of currency objects
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES);
}

/**
 * Determine best currency based on user location/preferences
 * @param userCountry User's country code (ISO 2-letter)
 * @returns Recommended currency code
 */
export function getRecommendedCurrency(userCountry?: string): string {
  const countryToCurrency: Record<string, string> = {
    'TH': 'THB',
    'ID': 'IDR', 
    'IN': 'INR',
    'BR': 'BRL',
    'MX': 'MXN',
    'GB': 'GBP',
    'JP': 'JPY',
    'CA': 'CAD',
    'AU': 'AUD',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'VN': 'VND',
    'PH': 'PHP',
    'MY': 'MYR',
    'TR': 'TRY',
  };

  return countryToCurrency[userCountry || ''] || 'USD';
}