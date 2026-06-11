type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const DEFAULT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module?: string;
  userId?: string;
  requestId?: string;
  data?: Record<string, unknown>;
  error?: { message: string; stack?: string; code?: string; };
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (meta) {
    const { userId, requestId, module, error, ...data } = meta;
    if (module) entry.module = String(module);
    if (userId) entry.userId = String(userId);
    if (requestId) entry.requestId = String(requestId);
    if (error && typeof error === 'object') {
      entry.error = {
        message: (error as Error).message || String(error),
        stack: (error as Error).stack,
        code: (error as any)?.code,
      };
    }
    if (Object.keys(data).length > 0) entry.data = data;
  }

  return JSON.stringify(entry);
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = (process.env.LOG_LEVEL as LogLevel) || DEFAULT_LOG_LEVEL;
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const formatted = formatLog(level, message, meta);
  if (level === 'error') console.error(formatted);
  else if (level === 'warn') console.warn(formatted);
  else console.log(formatted);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
