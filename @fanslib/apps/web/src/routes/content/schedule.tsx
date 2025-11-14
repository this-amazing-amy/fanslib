import { createFileRoute } from "@tanstack/react-router";
import { PlanPage } from "~/features/plan/components/PlanPage";

export const Route = createFileRoute("/content/schedule")({
  component: PlanPage,
});

