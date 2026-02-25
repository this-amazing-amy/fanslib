import type { Media } from '@fanslib/server/schemas';
import { useEffect } from 'react';
import { useMediaSelectionStore } from '~/stores/mediaSelectionStore';

export const useMediaSelectionSetup = (media: Media[] | Map<string, Media[]>) => {
  const setMedia = useMediaSelectionStore((s) => s.setMedia);
  const setShiftPressed = useMediaSelectionStore((s) => s.setShiftPressed);
  const clearSelection = useMediaSelectionStore((s) => s.clearSelection);
  const selectAll = useMediaSelectionStore((s) => s.selectAll);

  useEffect(() => { setMedia(media); }, [media, setMedia]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftPressed(true);

      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      }
      if (e.key === "Escape" && useMediaSelectionStore.getState().selectedIds.size > 0) {
        e.preventDefault();
        clearSelection();
      }
    };
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftPressed(false); };
    const blur = () => setShiftPressed(false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [setShiftPressed, clearSelection, selectAll]);
};
