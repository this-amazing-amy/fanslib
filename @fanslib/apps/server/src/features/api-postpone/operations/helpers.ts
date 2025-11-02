import { loadSettings } from "../../settings/operations/setting/load";

type PostponeResponseType<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export const fetchPostpone = async <T, V = unknown>(
  query: string,
  variables: V
): Promise<T> => {
  const settings = await loadSettings();

  if (!settings.postponeToken) {
    throw new Error("Postpone token not configured. Please add it in Settings.");
  }

  const body = JSON.stringify({
    query,
    variables,
  });

  const response = await fetch("https://api.postpone.app/gql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.postponeToken}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const result = (await response.json()) as PostponeResponseType<T>;

  if (result.errors) {
    throw new Error(`GraphQL Error: ${result.errors[0]?.message ?? "Unknown error"}`);
  }

  if (!result.data) {
    throw new Error("No data returned from Postpone API");
  }

  return result.data;
};

