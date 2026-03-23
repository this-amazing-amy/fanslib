import { createFileRoute } from "@tanstack/react-router";
import { SchedulesLayout } from "~/features/schedules/components/SchedulesLayout";

export const Route = createFileRoute("/schedules")({
  component: SchedulesLayout,
});
