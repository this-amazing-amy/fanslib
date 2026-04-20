import { format } from "date-fns";
import { useNavigate } from "@tanstack/react-router";
import { Film, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/Button";
import { DeleteConfirmDialog } from "~/components/ui/DeleteConfirmDialog";
import { EmptyState } from "~/components/ui/EmptyState";
import {
  useCompositionsByShootQuery,
  useCreateCompositionMutation,
  useDeleteCompositionMutation,
  useUpdateCompositionMutation,
} from "~/lib/queries/compositions";

type ShootCompositionsProps = {
  shootId: string;
};

export const ShootCompositions = ({ shootId }: ShootCompositionsProps) => {
  const navigate = useNavigate();
  const { data: compositions, isLoading, error } = useCompositionsByShootQuery(shootId);
  const createMutation = useCreateCompositionMutation();
  const updateMutation = useUpdateCompositionMutation();
  const deleteMutation = useDeleteCompositionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    const composition = await createMutation.mutateAsync({
      shootId,
      name: "Untitled Composition",
    });
    navigate({
      to: "/shoots/$shootId/compositions/$compositionId",
      params: { shootId, compositionId: composition.id },
    });
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
    // Focus the input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveRename = async () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }
    await updateMutation.mutateAsync({
      id: editingId,
      body: { name: editingName.trim() },
    });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
  };

  const openComposition = (compositionId: string) =>
    navigate({
      to: "/shoots/$shootId/compositions/$compositionId",
      params: { shootId, compositionId },
    });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading compositions...</div>;
  }

  if (error) {
    return <div className="text-destructive">Failed to load compositions</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onPress={handleCreate}
          isDisabled={createMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Composition
        </Button>
      </div>

      {!compositions || compositions.length === 0 ? (
        <EmptyState icon={<Film className="h-12 w-12" />} title="No compositions yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {compositions.map((composition) => (
            <div
              key={composition.id}
              className="group flex items-center justify-between rounded-lg border border-black bg-base-100 px-4 py-3 cursor-pointer"
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('[data-composition-action="true"]')) return;
                openComposition(composition.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                const target = event.target as HTMLElement;
                if (target.closest('[data-composition-action="true"]')) return;
                event.preventDefault();
                openComposition(composition.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open ${composition.name}`}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                {editingId === composition.id ? (
                  <input
                    ref={inputRef}
                    className="text-sm font-medium bg-transparent border-b border-base-content/30 outline-none px-0 py-0.5"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-medium truncate">{composition.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-composition-action="true"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      onPress={() => handleStartRename(composition.id, composition.name)}
                      aria-label={`Rename ${composition.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <span className="text-xs text-base-content/50">
                  {format(new Date(composition.createdAt), "MMM d, yyyy")}
                  {Array.isArray(composition.segments) && composition.segments.length > 0 && (
                    <> &middot; {composition.segments.length} segment{composition.segments.length !== 1 ? "s" : ""}</>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  data-composition-action="true"
                  onPress={() => setDeleteTarget({ id: composition.id, name: composition.name })}
                  aria-label={`Delete ${composition.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        itemType="composition"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
