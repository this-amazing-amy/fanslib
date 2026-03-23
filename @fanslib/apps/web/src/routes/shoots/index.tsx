import { createFileRoute } from "@tanstack/react-router";

import { ShootsPage } from "./-shoots-page";

export const Route = createFileRoute("/shoots/")({
  component: ShootsPage,
});
