import type { ShootSummary } from '@fanslib/server/schemas';
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Input } from "~/components/ui/Input";
import { useUpdateShootMutation } from "~/lib/queries/shoots";


type ShootDetailTitleInputProps = {
  shoot: ShootSummary;
};

export const ShootDetailTitleInput = ({ shoot }: ShootDetailTitleInputProps) => {
  const [localName, setLocalName] = useState(shoot.name);
  const [isSaving, setIsSaving] = useState(false);
  const updateShootMutation = useUpdateShootMutation();

  const saveName = async (name: string) => {
    if (name.trim() === "" || name === shoot.name) return;
    
    setIsSaving(true);
    try {
      await updateShootMutation.mutateAsync({
        id: shoot.id,
        updates: {
          name,
        },
      });
    } catch (error) {
      console.error("Failed to update name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    saveName(localName);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setLocalName(shoot.name);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative">
      <Input
        value={localName}
        onChange={setLocalName}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-3xl font-semibold tracking-tight border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Shoot name"
      />
      {isSaving && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Updating...
        </div>
      )}
    </div>
  );
};

