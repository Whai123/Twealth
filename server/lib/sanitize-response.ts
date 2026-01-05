/**
 * Server-side response sanitizer to prevent React Error #300.
 * 
 * This utility recursively processes API responses to ensure all values
 * are primitive types (string, number, boolean, null) before sending to the client.
 * 
 * Objects that should remain as objects (like arrays) are preserved,
 * but nested object values within string fields are converted to strings.
 */

type Primitive = string | number | boolean | null | undefined;
type SanitizedValue = Primitive | SanitizedObject | SanitizedArray;
interface SanitizedObject { [key: string]: SanitizedValue }
type SanitizedArray = SanitizedValue[];

/**
 * List of keys that are expected to contain string values.
 * If these contain objects, they will be converted to JSON strings.
 */
const STRING_FIELD_NAMES = [
  'title', 'name', 'label', 'message', 'description', 'text', 'content',
  'firstName', 'lastName', 'email', 'summary', 'recommendation', 'action',
  'topPriority', 'grade', 'status', 'type', 'category', 'icon', 'href',
  'value', 'display', 'hint', 'placeholder', 'error', 'warning', 'info',
  'subtitle', 'heading', 'body', 'footer', 'caption', 'alt', 'tooltip'
];

/**
 * List of keys that are expected to contain numeric values.
 */
const NUMBER_FIELD_NAMES = [
  'score', 'count', 'amount', 'total', 'progress', 'percentage', 'rate',
  'limit', 'used', 'remaining', 'price', 'cost', 'balance', 'income',
  'expenses', 'savings', 'target', 'current', 'months', 'days', 'hours',
  'minutes', 'id', 'userId', 'goalId', 'transactionId', 'notificationId'
];

/**
 * Checks if a value is a plain object (not array, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Converts a value to a string safely.
 */
function toSafeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    try {
      // For objects in string fields, try to extract meaningful text
      const obj = value as Record<string, unknown>;
      if ('text' in obj && typeof obj.text === 'string') return obj.text;
      if ('content' in obj && typeof obj.content === 'string') return obj.content;
      if ('value' in obj && typeof obj.value === 'string') return obj.value;
      if ('message' in obj && typeof obj.message === 'string') return obj.message;
      if ('title' in obj && typeof obj.title === 'string') return obj.title;
      // Last resort: stringify
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Converts a value to a number safely.
 */
function toSafeNumber(value: unknown): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if ('value' in obj && typeof obj.value === 'number') return obj.value;
    if ('amount' in obj && typeof obj.amount === 'number') return obj.amount;
    if ('score' in obj && typeof obj.score === 'number') return obj.score;
  }
  return 0;
}

/**
 * Recursively sanitizes a value for safe client-side rendering.
 * 
 * @param value - The value to sanitize
 * @param key - The key name (used to determine expected type)
 * @param depth - Current recursion depth (safety limit)
 */
function sanitizeValue(value: unknown, key?: string, depth: number = 0): SanitizedValue {
  // Safety: prevent infinite recursion
  if (depth > 20) {
    console.warn('[Sanitizer] Max depth exceeded for key:', key);
    return null;
  }

  // Handle primitives directly
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(item, `${key}[${idx}]`, depth + 1));
  }

  // Handle objects
  if (isPlainObject(value)) {
    // If this key is expected to be a string but contains an object, flatten it
    if (key && STRING_FIELD_NAMES.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      return toSafeString(value);
    }
    
    // If this key is expected to be a number but contains an object, extract it
    if (key && NUMBER_FIELD_NAMES.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      return toSafeNumber(value);
    }

    // Recursively sanitize object properties
    const result: SanitizedObject = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v, k, depth + 1);
    }
    return result;
  }

  // Fallback: convert to string
  return String(value);
}

/**
 * Sanitizes an API response object to ensure all values are React-safe.
 * 
 * @param response - The API response to sanitize
 * @returns A sanitized copy of the response
 */
export function sanitizeResponse<T>(response: T): T {
  if (response === null || response === undefined) return response;
  
  try {
    const sanitized = sanitizeValue(response, 'root', 0);
    return sanitized as T;
  } catch (error) {
    console.error('[Sanitizer] Error sanitizing response:', error);
    return response;
  }
}

/**
 * Express middleware to sanitize all JSON responses.
 */
export function sanitizeResponseMiddleware() {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
      try {
        const sanitized = sanitizeResponse(body);
        return originalJson(sanitized);
      } catch (error) {
        console.error('[Sanitizer] Middleware error:', error);
        return originalJson(body);
      }
    };
    
    next();
  };
}

export default sanitizeResponse;
