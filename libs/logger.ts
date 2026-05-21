type LogDetails = Record<string, unknown>;

function serializeDetails(details?: LogDetails) {
  if (!details) return "";

  try {
    return JSON.stringify(details);
  } catch {
    return "[unserializable details]";
  }
}

export const appLogger = {
  error(scope: string, message: string, details?: LogDetails) {
    // Do not use console.error here. Expo LogBox treats console.error as an
    // in-app red error overlay, while API errors are already shown via flash
    // messages. Keep the ERROR level in text so terminal/file logs stay useful.
    console.log(`[${new Date().toISOString()}] [ERROR] [${scope}] ${message}`, serializeDetails(details));
  },

  warn(scope: string, message: string, details?: LogDetails) {
    console.log(`[${new Date().toISOString()}] [WARN] [${scope}] ${message}`, serializeDetails(details));
  }
};
