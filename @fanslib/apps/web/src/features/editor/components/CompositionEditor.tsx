import { useEffect } from "react";
import { useCompositionByIdQuery } from "~/lib/queries/compositions";
import { useEditorStore } from "~/stores/editorStore";

type CompositionEditorProps = {
  shootId: string;
  compositionId: string;
};

export const CompositionEditor = ({ shootId, compositionId }: CompositionEditorProps) => {
  const { data: composition, isLoading, error } = useCompositionByIdQuery(compositionId);
  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);

  useEffect(() => {
    if (!composition) return;
    // The API returns JSONValue[] for tracks/segments; runtime shapes match the store types.
    hydrate({
      tracks: composition.tracks,
      segments: composition.segments,
    } as Parameters<typeof hydrate>[0]);
  }, [composition, hydrate]);

  useEffect(() => () => {
    reset();
  }, [reset]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="composition-loading">
        <p className="text-muted-foreground">Loading composition...</p>
      </div>
    );
  }

  if (error || !composition) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="composition-error">
        <p className="text-destructive">
          {error?.message ?? "Composition not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" data-testid="composition-editor">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">{composition.name}</h1>
        <p className="text-muted-foreground text-sm">
          Shoot: {shootId} &middot; {composition.segments.length} segment{composition.segments.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};
