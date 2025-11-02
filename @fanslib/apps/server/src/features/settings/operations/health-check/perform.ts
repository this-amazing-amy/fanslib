import type { HealthCheckResult } from "@fanslib/types";

export const performHealthCheck = async (serverUrl: string): Promise<HealthCheckResult> => {
  if (!serverUrl.trim()) {
    return {
      status: "error",
      message: "Server URL is required",
    };
  }

  const normalizedUrl = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  const healthUrl = `${normalizedUrl}/health`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "unhealthy",
        message: `Server responded with status ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      status: data.status === "healthy" ? "healthy" : "unhealthy",
      message: data.status === "healthy" ? "Server is responding" : "Server status unknown",
      timestamp: data.timestamp,
      uptime: data.uptime,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          status: "error",
          message: "Health check timed out",
        };
      }

      return {
        status: "error",
        message: `Connection failed: ${error.message}`,
      };
    }

    return {
      status: "error",
      message: "Unknown error occurred",
    };
  }
};

