import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/Dialog";
import type {
  CreateTagDimensionRequestBodySchema,
  UpdateTagDimensionRequestBodySchema,
} from "@fanslib/server/schemas";
import { DimensionForm } from "./DimensionForm";

export type EditingDimension =
  | {
      dimension: any;
      mode: "edit";
    }
  | {
      mode: "create";
    };

type DimensionDialogProps = {
  editingDimension: EditingDimension | null;
  onClose: () => void;
  onSubmit: (
    data:
      | typeof CreateTagDimensionRequestBodySchema.static
      | { id: number; updates: typeof UpdateTagDimensionRequestBodySchema.static }
  ) => void;
  isSubmitting: boolean;
};

export const DimensionDialog = ({
  editingDimension,
  onClose,
  onSubmit,
  isSubmitting,
}: DimensionDialogProps) => {
  const getDialogTitle = () =>
    editingDimension?.mode === "edit" ? "Edit Tag Dimension" : "Create New Tag Dimension";

  const getDialogDescription = () => {
    const action = editingDimension?.mode === "edit" ? "Update" : "Create";
    return editingDimension?.mode === "edit"
      ? `${action} the "${editingDimension.dimension.name}" dimension settings.`
      : `${action} a new dimension to organize your tags. Choose the data type that best fits the kind of information you want to track.`;
  };

  const handleFormSubmit = (
    data: typeof CreateTagDimensionRequestBodySchema.static | typeof UpdateTagDimensionRequestBodySchema.static
  ) => {
    if (editingDimension?.mode === "edit") {
      onSubmit({
        id: editingDimension.dimension.id,
        updates: data as typeof UpdateTagDimensionRequestBodySchema.static,
      });
    } else {
      onSubmit(data as typeof CreateTagDimensionRequestBodySchema.static);
    }
  };

  return (
    <Dialog open={!!editingDimension} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <DimensionForm
          initialData={editingDimension?.mode === "edit" ? editingDimension.dimension : undefined}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};
