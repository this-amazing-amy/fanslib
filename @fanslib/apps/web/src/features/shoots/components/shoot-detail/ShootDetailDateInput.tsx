import type { ShootSummary, ShootSummarySchema } from '@fanslib/server/schemas';
import { useState } from "react";
import { DateTimePicker } from "~/components/DateTimePicker";
import { useDebounce } from "~/hooks/useDebounce";
import { useUpdateShootMutation } from "~/lib/queries/shoots";


type ShootDetailDateInputProps = {
  shoot: ShootSummary;
};

export const ShootDetailDateInput = ({ shoot }: ShootDetailDateInputProps) => {
  const [localDate, setLocalDate] = useState(new Date(shoot.shootDate));
  const [isSaving, setIsSaving] = useState(false);
  const updateShootMutation = useUpdateShootMutation();

  const saveDate = async (date: Date) => {
    setIsSaving(true);
    try {
      await updateShootMutation.mutateAsync({
        id: shoot.id,
        updates: {
          shootDate: date,
        },
      });
    } catch (error) {
      console.error("Failed to update date:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSaveDate = useDebounce(saveDate, 300);

  const updateDate = (newDate: Date) => {
    setLocalDate(newDate);
    debouncedSaveDate(newDate);
  };

  return (
    <div className="relative max-w-xs">
      <DateTimePicker date={localDate} setDate={updateDate} />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="text-xs">Updating...</div>
        </div>
      )}
    </div>
  );
};

