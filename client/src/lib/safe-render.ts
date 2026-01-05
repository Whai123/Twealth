/**
 * Safe rendering utilities to prevent React Error #300 on mobile Safari.
 * 
 * React Error #300 occurs when an object is passed as a React child.
 * These utilities ensure all API data is safely converted to primitives before rendering.
 */

/**
 * Safely converts any value to a string for React rendering.
 * Prevents objects from being passed as React children.
 */
export function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    console.warn('[SafeRender] Unexpected object in safeString:', value);
    return '';
  }
  return String(value);
}

/**
 * Safely converts any value to a number for calculations and rendering.
 * Returns 0 for invalid values.
 */
export function safeNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value !== null && value !== undefined) {
    console.warn('[SafeRender] Unexpected value in safeNumber:', value);
  }
  return 0;
}

/**
 * Safely parses a date string and returns a Date object or null.
 */
export function safeDate(dateStr: unknown): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  try {
    const date = new Date(String(dateStr));
    if (isNaN(date.getTime())) {
      console.warn('[SafeRender] Invalid date:', dateStr);
      return null;
    }
    return date;
  } catch (e) {
    console.warn('[SafeRender] Date parsing error:', e);
    return null;
  }
}

/**
 * Safely formats a date for display.
 */
export function formatDate(
  dateStr: unknown, 
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
  const date = safeDate(dateStr);
  if (!date) return '';
  try {
    return date.toLocaleDateString('en-US', options);
  } catch {
    return '';
  }
}

/**
 * Safely formats a date as relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(dateStr: unknown): string {
  const date = safeDate(dateStr);
  if (!date) return '';
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Safely gets a boolean value with a default.
 */
export function safeBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

/**
 * Safely gets an array, returning empty array for non-arrays.
 */
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value !== null && value !== undefined) {
    console.warn('[SafeRender] Expected array, got:', typeof value);
  }
  return [];
}

/**
 * Checks if a value is safe to render as a React child.
 * React can render: string, number, boolean (ignored), null, undefined, React elements.
 */
export function isSafeForReact(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  // Check if it's a React element
  if (typeof value === 'object' && value !== null && '$$typeof' in value) return true;
  return false;
}

/**
 * Renders any value safely for React, converting objects to strings.
 * Use this for any dynamic content that might be an object.
 */
export function safeRender(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : null;
  
  // For objects/arrays, log warning and return safe representation
  if (typeof value === 'object') {
    console.warn('[SafeRender] Caught object in render:', JSON.stringify(value).slice(0, 200));
    // Try to extract a text value
    const obj = value as Record<string, unknown>;
    if ('text' in obj && typeof obj.text === 'string') return obj.text;
    if ('message' in obj && typeof obj.message === 'string') return obj.message;
    if ('title' in obj && typeof obj.title === 'string') return obj.title;
    if ('content' in obj && typeof obj.content === 'string') return obj.content;
    if ('value' in obj && (typeof obj.value === 'string' || typeof obj.value === 'number')) {
      return typeof obj.value === 'string' ? obj.value : obj.value;
    }
    // Last resort: return empty or stringified
    return '';
  }
  
  return String(value);
}
