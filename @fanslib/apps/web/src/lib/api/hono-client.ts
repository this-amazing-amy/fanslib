import { hc } from "hono/client";
import * as devalue from "devalue";
import type { AppType } from "@fanslib/server";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:6970";

/**
 * Custom fetch wrapper that handles devalue deserialization.
 * Checks for X-Serialization header and parses response accordingly.
 */
const customFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  // Check if response should be devalue-deserialized
  const serialization = response.headers.get("X-Serialization");

  if (serialization === "devalue" && response.ok) {
    const text = await response.text();
    const data = devalue.parse(text);

    // Create a new response with parsed data
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return response;
};

/**
 * Typed Hono client for making API requests.
 * Uses devalue deserialization for responses with X-Serialization: devalue header.
 */
export const api = hc<AppType>(baseUrl, {
  fetch: customFetch,
});
