import type { ShootSummary, ShootSummarySchema, UpdateShootRequestBody, UpdateShootRequestBodySchema } from '@fanslib/server/schemas';
import { format } from "date-fns";
import { type FC } from "react";
import { DateTimePicker } from "~/components/DateTimePicker";


type UpdateShootRequest = UpdateShootRequestBody;

type ShootDetailDateProps = {
  shoot: ShootSummary;
  isEditing: boolean;
  onUpdate: (payload: UpdateShootRequest) => Promise<void>;
};

export const ShootDetailDate: FC<ShootDetailDateProps> = ({ shoot, isEditing, onUpdate }) => {
  if (isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <DateTimePicker
          date={new Date(shoot.shootDate)}
          setDate={(date) => onUpdate({ shootDate: date })}
        />
      </div>
    );
  }

  return <span>{format(new Date(shoot.shootDate), "PPP")}</span>;
};
