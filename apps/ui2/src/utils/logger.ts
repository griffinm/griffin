export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug';

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const logger = {
  debug: (message: string) => {
    if (logLevels['debug'] < logLevels[logLevel]) {
      return;
    }
    console.log(`[debug] ${message}`);
  },
  info: (message: string) => {
    if (logLevels['info'] < logLevels[logLevel]) {
      return;
    }
    console.log(`[info] ${message}`);
  },
  warn: (message: string) => {
    if (logLevels['warn'] < logLevels[logLevel]) {
      return;
    }
    console.log(`[warn] ${message}`);
  },
  error: (message: string) => {
    if (logLevels['error'] < logLevels[logLevel]) {
      return;
    }
    console.log(`[error] ${message}`);
  },
}
