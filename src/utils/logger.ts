export const logger = {
  info: (message: string, extra?: unknown): void => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, extra ?? '');
  },
  warn: (message: string, extra?: unknown): void => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, extra ?? '');
  },
  error: (message: string, extra?: unknown): void => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, extra ?? '');
  }
};
