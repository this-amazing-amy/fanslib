import { hc } from 'hono/client';
import * as devalue from 'devalue';
import type { AppType } from '@fanslib/server';

/**
 * Custom fetch wrapper that handles devalue deserialization.
 * Checks for X-Serialization header and parses response accordingly.
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  // Check if response should be devalue-deserialized
  const serialization = response.headers.get('X-Serialization');

  if (serialization === 'devalue' && response.ok) {
    const text = await response.text();
    const data = devalue.parse(text);

    // Extend Response with custom json() method that returns the parsed devalue data
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
export const eden = (apiUrl: string) =>
  hc<AppType>(apiUrl, {
    fetch: customFetch,
  });
