import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/Button/Button";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { ScheduleCard } from "./ScheduleCard";

export const SchedulesSidebar = () => {
  const { data: schedules, isLoading } = useContentSchedulesQuery();

  return (
    <div className="w-84 border-r border-base-300 bg-base-200/30 flex flex-col h-full">
      <div className="p-4 pt-6 space-y-4">
        <h2 className="text-2xl font-bold px-3">Schedules</h2>
        <div className="px-3">
          <Link to="/schedules/$id" params={{ id: "new" }}>
            <Button variant="primary" size="sm" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4 space-y-2">
          {isLoading && (
            <div className="text-sm text-base-content/50 px-3 py-4">Loading schedules...</div>
          )}

          {!isLoading && schedules && schedules.length === 0 && (
            <div className="text-sm text-base-content/50 px-3 py-4">
              No schedules yet. Create one to get started.
            </div>
          )}

          {schedules?.map((schedule) => (
            <Link
              key={schedule.id}
              to="/schedules/$id"
              params={{ id: schedule.id }}
              className="block rounded-md transition-colors hover:bg-base-300/50 [&.active]:bg-base-300"
            >
              <ScheduleCard schedule={schedule} />
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
