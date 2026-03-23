import { createFileRoute } from "@tanstack/react-router";
import { ScheduleCalendarOverview } from "~/features/schedules/components/ScheduleCalendarOverview";

const SchedulesIndex = () => <ScheduleCalendarOverview />;

export const Route = createFileRoute("/schedules/")({
  component: SchedulesIndex,
});
