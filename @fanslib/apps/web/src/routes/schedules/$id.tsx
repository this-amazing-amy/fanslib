import { createFileRoute } from "@tanstack/react-router";

const ScheduleDetail = () => {
  const { id } = Route.useParams();

  return (
    <div className="p-14 max-w-5xl">
      <h1 className="text-2xl font-semibold">Schedule Detail</h1>
      <p className="text-base-content/60 mt-2">Schedule ID: {id}</p>
    </div>
  );
};

export const Route = createFileRoute("/schedules/$id")({
  component: ScheduleDetail,
});
