import { createFileRoute } from "@tanstack/react-router";

const SchedulesIndex = () => (
  <div className="flex items-center justify-center h-full text-base-content/50">
    <p className="text-lg">Select a schedule from the sidebar to view details</p>
  </div>
);

export const Route = createFileRoute("/schedules/")({
  component: SchedulesIndex,
});
