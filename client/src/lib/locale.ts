// Locale utilities for date/time formatting and number display
import { format, formatDistance, formatRelative } from 'date-fns';
import { enUS, es, id as idLocale, th, ptBR, hi, vi, tr, type Locale } from 'date-fns/locale';

// Map language codes to date-fns locales
const DATE_LOCALES: Record<string, Locale> = {
  'en': enUS,
  'es': es,
  'id': idLocale,
  'th': th,
  'pt': ptBR,
  'hi': hi,
  'vi': vi,
  'tl': enUS, // Tagalog uses English formatting
  'ms': enUS, // Malay uses English formatting  
  'tr': tr,
};

// Map language codes to Intl.NumberFormat locales
const NUMBER_LOCALES: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'id': 'id-ID',
  'th': 'th-TH',
  'pt': 'pt-BR',
  'hi': 'hi-IN',
  'vi': 'vi-VN',
  'tl': 'fil-PH', // Filipino
  'ms': 'ms-MY',
  'tr': 'tr-TR',
};

// Map language codes to currency formatting locales
const CURRENCY_LOCALES: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'id': 'id-ID',
  'th': 'th-TH',
  'pt': 'pt-BR',
  'hi': 'hi-IN',
  'vi': 'vi-VN',
  'tl': 'en-PH',
  'ms': 'ms-MY',
  'tr': 'tr-TR',
};

/**
 * Get date-fns locale for a language code
 */
export function getDateLocale(languageCode: string): Locale {
  return DATE_LOCALES[languageCode] || enUS;
}

/**
 * Get Intl.NumberFormat locale for a language code
 */
export function getNumberLocale(languageCode: string): string {
  return NUMBER_LOCALES[languageCode] || 'en-US';
}

/**
 * Get currency formatting locale for a language code
 */
export function getCurrencyLocale(languageCode: string): string {
  return CURRENCY_LOCALES[languageCode] || 'en-US';
}

/**
 * Format a date with locale-specific format
 */
export function formatDateLocale(
  date: Date | string | number,
  formatStr: string,
  languageCode: string = 'en'
): string {
  const locale = getDateLocale(languageCode);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale });
}

/**
 * Format relative time with locale (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date(),
  languageCode: string = 'en'
): string {
  const locale = getDateLocale(languageCode);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatDistance(dateObj, baseDate, { addSuffix: true, locale });
}

/**
 * Format relative date with locale (e.g., "yesterday at 3:54 PM")
 */
export function formatRelativeDate(
  date: Date | string | number,
  baseDate: Date = new Date(),
  languageCode: string = 'en'
): string {
  const locale = getDateLocale(languageCode);
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return formatRelative(dateObj, baseDate, { locale });
}

/**
 * Format number with locale-specific separators
 */
export function formatNumber(
  value: number,
  languageCode: string = 'en',
  options: Intl.NumberFormatOptions = {}
): string {
  const locale = getNumberLocale(languageCode);
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency with locale-specific format and symbol positioning
 */
export function formatCurrencyLocale(
  amount: number,
  currencyCode: string,
  languageCode: string = 'en',
  options: Intl.NumberFormatOptions = {}
): string {
  const locale = getCurrencyLocale(languageCode);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    ...options,
  }).format(amount);
}

/**
 * Format percentage with locale-specific format
 */
export function formatPercentage(
  value: number,
  languageCode: string = 'en',
  decimals: number = 0
): string {
  const locale = getNumberLocale(languageCode);
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Get locale-specific date format patterns
 */
export function getDateFormatPattern(
  languageCode: string,
  formatType: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const patterns: Record<string, Record<string, string>> = {
    'en': {
      'short': 'MM/dd/yyyy',
      'medium': 'MMM d, yyyy',
      'long': 'MMMM d, yyyy',
      'full': 'EEEE, MMMM d, yyyy',
    },
    'es': {
      'short': 'dd/MM/yyyy',
      'medium': 'd MMM yyyy',
      'long': 'd \'de\' MMMM \'de\' yyyy',
      'full': 'EEEE, d \'de\' MMMM \'de\' yyyy',
    },
    'id': {
      'short': 'dd/MM/yyyy',
      'medium': 'd MMM yyyy',
      'long': 'd MMMM yyyy',
      'full': 'EEEE, d MMMM yyyy',
    },
    'th': {
      'short': 'dd/MM/yyyy',
      'medium': 'd MMM yyyy',
      'long': 'd MMMM yyyy',
      'full': 'EEEE d MMMM yyyy',
    },
    'pt': {
      'short': 'dd/MM/yyyy',
      'medium': 'd \'de\' MMM \'de\' yyyy',
      'long': 'd \'de\' MMMM \'de\' yyyy',
      'full': 'EEEE, d \'de\' MMMM \'de\' yyyy',
    },
    'vi': {
      'short': 'dd/MM/yyyy',
      'medium': 'd \'thg\' M, yyyy',
      'long': 'd \'tháng\' M \'năm\' yyyy',
      'full': 'EEEE, d \'tháng\' M \'năm\' yyyy',
    },
    'tr': {
      'short': 'dd.MM.yyyy',
      'medium': 'd MMM yyyy',
      'long': 'd MMMM yyyy',
      'full': 'd MMMM yyyy EEEE',
    },
  };

  const localePatterns = patterns[languageCode] || patterns['en'];
  return localePatterns[formatType];
}

/**
 * Get locale-specific time format (12h vs 24h)
 */
export function getTimeFormatPattern(languageCode: string): string {
  // Countries that use 12-hour format
  const use12Hour = ['en', 'tl', 'ms'];
  
  if (use12Hour.includes(languageCode)) {
    return 'h:mm a'; // 12-hour with AM/PM
  }
  
  return 'HH:mm'; // 24-hour
}
