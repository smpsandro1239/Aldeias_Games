import crypto from 'crypto';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  requestId?: string;
  userId?: string;
  aldeiaId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: { name: string; message: string; stack?: string };
}

function generateRequestId(): string {
  return `req_${crypto.randomBytes(8).toString('hex')}`;
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
    };
  } else if (error) {
    entry.error = { name: 'Unknown', message: String(error) };
  }

  return entry;
}

function writeLog(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line);
  } else if (entry.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(defaultContext?: LogContext) {
  const requestId = defaultContext?.requestId || generateRequestId();

  const ctx: LogContext = { ...defaultContext, requestId };

  return {
    requestId,

    info(message: string, extra?: LogContext) {
      writeLog(formatLog('info', message, { ...ctx, ...extra }));
    },

    warn(message: string, extra?: LogContext) {
      writeLog(formatLog('warn', message, { ...ctx, ...extra }));
    },

    error(message: string, error?: unknown, extra?: LogContext) {
      writeLog(formatLog('error', message, { ...ctx, ...extra }, error));
    },

    debug(message: string, extra?: LogContext) {
      if (process.env.NODE_ENV !== 'production') {
        writeLog(formatLog('debug', message, { ...ctx, ...extra }));
      }
    },

    child(extra: LogContext) {
      return createLogger({ ...ctx, ...extra });
    },
  };
}

export function extractRequestContext(request: Request): LogContext {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export function generateRequestId(): string {
  return `req_${crypto.randomBytes(8).toString('hex')}`;
}
