import superjson from "superjson";

export const mapResponse = ({
  responseValue,
  path,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseValue: any;
  path: string;
}) => {
  if (path.match(/^\/api\/swagger(\/|$)/)) {
    return responseValue;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctor = (responseValue?.constructor as any) ?? null;
  if (ctor && [Array, Object].includes(ctor)) {
    const body = superjson.stringify(responseValue);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Serialization": "superjson",
      },
    });
  }

  return responseValue;
};


