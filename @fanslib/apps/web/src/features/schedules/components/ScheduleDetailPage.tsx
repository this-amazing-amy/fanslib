import { useNavigate, useParams } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useContentScheduleQuery,
  useCreateContentScheduleMutation,
  useUpdateContentScheduleMutation,
  useDeleteContentScheduleMutation,
} from "~/lib/queries/content-schedules";
import { ContentScheduleForm } from "~/features/channels/components/ContentScheduleForm";

export const ScheduleDetailPage = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const isNew = id === "new";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: scheduleData, isLoading } = useContentScheduleQuery(isNew ? "" : id);
  // The query may return { error: string } on failure — narrow to actual schedule data
  const schedule = scheduleData && "name" in scheduleData ? scheduleData : undefined;
  const createMutation = useCreateContentScheduleMutation();
  const updateMutation = useUpdateContentScheduleMutation();
  const deleteMutation = useDeleteContentScheduleMutation();

  const handleSubmit = async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
    if (isNew) {
      const result = await createMutation.mutateAsync(data);
      navigate({ to: "/schedules/$id", params: { id: (result as { id: string }).id } });
    } else {
      await updateMutation.mutateAsync({ id, updates: data });
    }
  };

  const handleCancel = () => {
    navigate({ to: "/schedules" });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate({ to: "/schedules" });
  };

  if (!isNew && isLoading) {
    return (
      <div className="p-14 max-w-5xl">
        <div className="text-base-content/60">Loading schedule...</div>
      </div>
    );
  }

  if (!isNew && !schedule) {
    return (
      <div className="p-14 max-w-5xl">
        <h1 className="text-2xl font-semibold">Schedule not found</h1>
        <button className="btn btn-ghost mt-4" onClick={handleCancel}>
          Back to Schedules
        </button>
      </div>
    );
  }

  return (
    <div className="p-14 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">
          {isNew ? "New Schedule" : `Edit: ${schedule?.name ?? "Schedule"}`}
        </h1>
        {!isNew && (
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-error">Are you sure?</span>
                <button className="btn btn-error btn-sm" onClick={handleDelete}>
                  Confirm Delete
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-ghost btn-sm text-error"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <ContentScheduleForm
        // The API returns dates as strings but the form type expects Date objects;
        // the form only accesses id/channelId/mediaFilterOverrides/sortOrder, so the cast is safe.
        schedule={
          isNew ? undefined : (schedule as Parameters<typeof ContentScheduleForm>[0]["schedule"])
        }
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};
