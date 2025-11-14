import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "~/features/plan/components/CalendarPage";

export const Route = createFileRoute("/content/calendar")({
  component: CalendarPage,
});

