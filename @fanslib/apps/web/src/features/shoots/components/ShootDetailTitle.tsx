import type { ShootSummarySchema, UpdateShootRequestBodySchema } from "@fanslib/server/schemas";
import { type FC, useState } from "react";
import { Input } from "~/components/ui/Input";

type ShootSummary = typeof ShootSummarySchema.static;
type UpdateShootRequest = typeof UpdateShootRequestBodySchema.static;

type ShootDetailTitleProps = {
  shoot: ShootSummary;
  isEditing: boolean;
  onUpdate: (payload: UpdateShootRequest) => Promise<void>;
  onCancel: () => void;
};

export const ShootDetailTitle: FC<ShootDetailTitleProps> = ({
  shoot,
  isEditing,
  onUpdate,
  onCancel,
}) => {
  const [newName, setNewName] = useState(shoot.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (newName.trim() === "") return;
      onUpdate({ name: newName });
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Input
          value={newName}
          onChange={setNewName}
          aria-label="Shoot name"
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (newName.trim() === "") return;
            if (newName === shoot.name) return;
            onUpdate({ name: newName });
          }}
          autoFocus
          className="font-normal"
        />
      </div>
    );
  }

  return shoot.name;
};
