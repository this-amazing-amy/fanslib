import { createFileRoute } from "@tanstack/react-router";

import { FanslyFypRoute } from "./-fyp-page";

export const Route = createFileRoute("/fansly/fyp")({
  component: FanslyFypRoute,
});
