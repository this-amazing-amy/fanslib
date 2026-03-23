const DEBUG_PREFIX = "[FansLib:Interceptor:MainWorld]";

export const debug = (level: "info" | "warn" | "error", message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logArgs =
    data !== undefined
      ? [`[${timestamp}] ${DEBUG_PREFIX} ${message}`, data]
      : [`[${timestamp}] ${DEBUG_PREFIX} ${message}`];

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
