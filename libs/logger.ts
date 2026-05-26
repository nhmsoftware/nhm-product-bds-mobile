type LogMeta = Record<string, unknown> | undefined;

function log(level: "debug" | "info" | "warn" | "error", scope: string, message: string, meta?: LogMeta) {
  const payload = meta ? [message, meta] : [message];
  console[level](`[${scope}]`, ...payload);
}

export const appLogger = {
  debug(scope: string, message: string, meta?: LogMeta) {
    log("debug", scope, message, meta);
  },
  info(scope: string, message: string, meta?: LogMeta) {
    log("info", scope, message, meta);
  },
  warn(scope: string, message: string, meta?: LogMeta) {
    log("warn", scope, message, meta);
  },
  error(scope: string, message: string, meta?: LogMeta) {
    log("error", scope, message, meta);
  }
};
