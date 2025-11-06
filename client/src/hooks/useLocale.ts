// React hook for locale-aware formatting
import { useTranslation } from 'react-i18next';
import { 
 formatDateLocale, 
 formatRelativeTime, 
 formatRelativeDate,
 formatNumber,
 formatCurrencyLocale,
 formatPercentage,
 getDateFormatPattern,
 getTimeFormatPattern 
} from '@/lib/locale';

export function useLocale() {
 const { i18n } = useTranslation();
 const currentLanguage = i18n.language || 'en';

 return {
  /**
   * Current language code
   */
  language: currentLanguage,

  /**
   * Format a date with locale-specific format
   */
  formatDate: (
   date: Date | string | number,
   formatStr: string = getDateFormatPattern(currentLanguage, 'medium')
  ) => formatDateLocale(date, formatStr, currentLanguage),

  /**
   * Format relative time (e.g.,"2 days ago")
   */
  formatRelativeTime: (date: Date | string | number, baseDate?: Date) =>
   formatRelativeTime(date, baseDate, currentLanguage),

  /**
   * Format relative date (e.g.,"yesterday at 3:54 PM")
   */
  formatRelativeDate: (date: Date | string | number, baseDate?: Date) =>
   formatRelativeDate(date, baseDate, currentLanguage),

  /**
   * Format number with locale-specific separators
   */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
   formatNumber(value, currentLanguage, options),

  /**
   * Format currency with locale-specific format
   */
  formatCurrency: (
   amount: number,
   currencyCode: string,
   options?: Intl.NumberFormatOptions
  ) => formatCurrencyLocale(amount, currencyCode, currentLanguage, options),

  /**
   * Format percentage with locale-specific format
   */
  formatPercentage: (value: number, decimals?: number) =>
   formatPercentage(value, currentLanguage, decimals),

  /**
   * Get locale-specific date format pattern
   */
  getDatePattern: (type: 'short' | 'medium' | 'long' | 'full' = 'medium') =>
   getDateFormatPattern(currentLanguage, type),

  /**
   * Get locale-specific time format pattern
   */
  getTimePattern: () => getTimeFormatPattern(currentLanguage),
 };
}
