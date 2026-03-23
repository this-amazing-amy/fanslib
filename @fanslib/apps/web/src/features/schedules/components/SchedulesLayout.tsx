import { Outlet } from "@tanstack/react-router";
import { ScheduleHoverProvider } from "./ScheduleHoverContext";
import { SchedulesSidebar } from "./SchedulesSidebar";

export const SchedulesLayout = () => (
  <ScheduleHoverProvider>
    <div className="flex h-full">
      <SchedulesSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  </ScheduleHoverProvider>
);
