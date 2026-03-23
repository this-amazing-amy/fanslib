import { Outlet } from "@tanstack/react-router";
import { SchedulesSidebar } from "./SchedulesSidebar";

export const SchedulesLayout = () => (
  <div className="flex h-full">
    <SchedulesSidebar />
    <div className="flex-1 overflow-auto">
      <Outlet />
    </div>
  </div>
);
