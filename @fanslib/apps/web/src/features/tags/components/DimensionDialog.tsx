import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import type { CreateTagDimensionRequestBody, TagDimension, UpdateTagDimensionRequestBody } from '@fanslib/server/schemas';
import { DimensionForm } from "./DimensionForm";


export type EditingDimension =
  | {
      dimension: TagDimension;
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
      | CreateTagDimensionRequestBody
      | { id: number; updates: UpdateTagDimensionRequestBody }
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
    data: CreateTagDimensionRequestBody | UpdateTagDimensionRequestBody
  ) => {
    if (editingDimension?.mode === "edit") {
      onSubmit({
        id: editingDimension.dimension.id,
        updates: data as UpdateTagDimensionRequestBody,
      });
    } else {
      onSubmit(data as CreateTagDimensionRequestBody);
    }
  };

  return (
    <DialogTrigger isOpen={!!editingDimension} onOpenChange={(open) => !open && onClose()}>
      <DialogModal>
        <Dialog maxWidth="3xl" className="max-h-[90vh] overflow-y-auto">
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogDescription>{getDialogDescription()}</DialogDescription>
              </DialogHeader>

              <DimensionForm
                initialData={editingDimension?.mode === "edit" ? editingDimension.dimension : undefined}
                onSubmit={handleFormSubmit}
                onCancel={close}
                isSubmitting={isSubmitting}
              />
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
