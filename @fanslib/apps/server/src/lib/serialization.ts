import * as devalue from "devalue";

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
    const body = devalue.stringify(responseValue);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  return responseValue;
};


