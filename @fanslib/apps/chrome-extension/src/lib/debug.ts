type DebugLevel = "info" | "warn" | "error";

export const createDebugLogger = (prefix: string) =>
  (level: DebugLevel, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    const logArgs =
      data !== undefined
        ? [`[${timestamp}] ${prefix} ${message}`, data]
        : [`[${timestamp}] ${prefix} ${message}`];

    switch (level) {
      case "info":
        console.log(...logArgs);
        break;
      case "warn":
        console.warn(...logArgs);
        break;
      case "error":
        console.error(...logArgs);
        break;
    }
  };
