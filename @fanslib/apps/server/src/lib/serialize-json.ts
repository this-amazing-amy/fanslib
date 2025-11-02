export const serializeJson = ({ responseValue }: { responseValue: unknown }) => {
  const serialized = JSON.stringify(responseValue);
  return new Response(serialized, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};