import { createFileRoute } from "@tanstack/react-router";
import { ScheduleDetailPage } from "~/features/schedules/components/ScheduleDetailPage";

export const Route = createFileRoute("/schedules/$id")({
  component: ScheduleDetailPage,
});
