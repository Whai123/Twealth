/**
 * Structured Logger for Production Observability
 * 
 * Features:
 * - JSON-structured logs for easy parsing
 * - Log levels (debug, info, warn, error)
 * - Request context tracking
 * - Performance timing utilities
 * - Environment-aware formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  data?: Record<string, unknown>;
}

// Log level priority for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
function getMinLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in LOG_LEVELS) {
    return env as LogLevel;
  }
  // Default to 'info' in production, 'debug' in development
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const minLogLevel = getMinLogLevel();
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (easy to parse by log aggregators)
    return JSON.stringify(entry);
  }
  
  // Pretty format for development
  const { timestamp, level, context, message, duration, error, data, userId, requestId } = entry;
  const levelColor = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  }[level];
  const reset = '\x1b[0m';
  
  let output = `${timestamp} ${levelColor}[${level.toUpperCase()}]${reset}`;
  if (context) output += ` [${context}]`;
  if (requestId) output += ` (req:${requestId.slice(0, 8)})`;
  if (userId) output += ` (user:${userId.slice(0, 8)})`;
  output += ` ${message}`;
  if (duration !== undefined) output += ` (${duration}ms)`;
  if (data) output += ` ${JSON.stringify(data)}`;
  if (error) output += `\n  Error: ${error.message}${error.stack ? '\n' + error.stack : ''}`;
  
  return output;
}

/**
 * Write log entry
 */
function writeLog(entry: LogEntry): void {
  // Filter by minimum log level
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[minLogLevel]) {
    return;
  }
  
  const formatted = formatLogEntry(entry);
  
  if (entry.level === 'error') {
    console.error(formatted);
  } else if (entry.level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Create a scoped logger with context
 */
export function createLogger(context: string) {
  const log = (level: LogLevel, message: string, options?: Partial<LogEntry>) => {
    writeLog({
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...options,
    });
  };
  
  return {
    debug: (message: string, options?: Partial<LogEntry>) => log('debug', message, options),
    info: (message: string, options?: Partial<LogEntry>) => log('info', message, options),
    warn: (message: string, options?: Partial<LogEntry>) => log('warn', message, options),
    error: (message: string, error?: Error | unknown, options?: Partial<LogEntry>) => {
      const errorData = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error ? { message: String(error) } : undefined;
      
      log('error', message, { ...options, error: errorData as any });
    },
  };
}

/**
 * Request-scoped logger with timing
 */
export function createRequestLogger(context: string, requestId?: string, userId?: string) {
  const startTime = Date.now();
  const baseLogger = createLogger(context);
  
  return {
    ...baseLogger,
    requestId,
    userId,
    
    // Automatically include request context in all logs
    debug: (message: string, data?: Record<string, unknown>) => 
      baseLogger.debug(message, { requestId, userId, data }),
    info: (message: string, data?: Record<string, unknown>) => 
      baseLogger.info(message, { requestId, userId, data }),
    warn: (message: string, data?: Record<string, unknown>) => 
      baseLogger.warn(message, { requestId, userId, data }),
    error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => 
      baseLogger.error(message, error, { requestId, userId, data }),
    
    // Log with timing since request started
    timed: (level: LogLevel, message: string, data?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      writeLog({
        timestamp: new Date().toISOString(),
        level,
        context,
        message,
        requestId,
        userId,
        duration,
        data,
      });
    },
    
    // Get duration since request started
    getDuration: () => Date.now() - startTime,
  };
}

/**
 * Performance timing utility
 */
export function createTimer(label: string) {
  const start = Date.now();
  
  return {
    label,
    elapsed: () => Date.now() - start,
    end: () => {
      const duration = Date.now() - start;
      return { label, duration };
    },
  };
}

// Pre-configured loggers for common contexts
export const aiLogger = createLogger('AI');
export const authLogger = createLogger('Auth');
export const stripeLogger = createLogger('Stripe');
export const dbLogger = createLogger('Database');
export const apiLogger = createLogger('API');

// Default export for quick usage
export default createLogger;
