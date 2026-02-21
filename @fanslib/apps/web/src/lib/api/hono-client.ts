import { hc } from "hono/client";
import * as devalue from "devalue";
import type { AppType } from "@fanslib/server";

const baseUrl = "";

/**
 * Custom fetch wrapper that handles devalue deserialization.
 * Checks for X-Serialization header and parses response accordingly.
 * 
 * CRITICAL: We extend Response to include the parsed devalue data directly.
 * This preserves Date objects and other non-JSON types through the entire chain.
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  // Check if response should be devalue-deserialized
  const serialization = response.headers.get("X-Serialization");

  if (serialization === "devalue" && response.ok) {
    const text = await response.text();
    const data = devalue.parse(text);

    // Extend Response with custom json() method that returns the parsed devalue data
    // This preserves Date objects instead of converting them back to strings
    const extendedResponse = new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    // Override json() to return the already-parsed devalue data
    // @ts-ignore - we're intentionally extending Response
    extendedResponse.json = async () => data;
    
    return extendedResponse;
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
