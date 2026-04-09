import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateCompositionMutation } from "~/lib/queries/compositions";
import { useEditorStore } from "~/stores/editorStore";

const DEBOUNCE_MS = 1500;

export const useCompositionAutoSave = (compositionId: string | null) => {
  const mutation = useUpdateCompositionMutation();
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compositionIdRef = useRef(compositionId);
  compositionIdRef.current = compositionId;

  const performSave = useCallback(async () => {
    const id = compositionIdRef.current;
    if (!id) return;

    const state = useEditorStore.getState();
    if (!state.isDirty) return;

    try {
      setLastSaveError(null);
      await mutation.mutateAsync({
        id,
        body: {
          segments: state.segments,
          tracks: state.tracks,
        },
      });
      useEditorStore.getState().markClean();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setLastSaveError(message);
    }
  }, [mutation]);

  const saveNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    performSave();
  }, [performSave]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (!compositionIdRef.current) return;
      if (!state.isDirty) return;
      // Only trigger on actual data changes (isDirty transition or tracks/segments change)
      if (state.tracks === prevState.tracks && state.segments === prevState.segments) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        performSave();
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [performSave]);

  return {
    isSaving: mutation.isPending,
    lastSaveError,
    saveNow,
  };
};
