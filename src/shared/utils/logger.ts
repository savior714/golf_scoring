const LOG_PREFIX = '[GolfApp]';

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(`\x1b[36m${LOG_PREFIX}[DEBUG]\x1b[0m ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    console.log(`\x1b[32m${LOG_PREFIX}[INFO]\x1b[0m ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.log(`\x1b[33m${LOG_PREFIX}[WARN]\x1b[0m ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.log(`\x1b[31m${LOG_PREFIX}[ERROR]\x1b[0m ${message}`, ...args);
  },
  sync: (message: string, ...args: unknown[]) => {
    console.log(`\x1b[35m${LOG_PREFIX}[SYNC]\x1b[0m ${message}`, ...args);
  },
};
