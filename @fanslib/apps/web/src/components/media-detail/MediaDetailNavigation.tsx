import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useMediaAdjacentQuery } from "~/lib/queries/library";

export const MediaDetailNavigation = () => {
  const navigate = useNavigate();
  const { mediaId } = useParams({ from: "/content/library/media/$mediaId" });
  const { preferences } = useLibraryPreferences();

  const adjacentParams = {
    filters: preferences.filter,
    sort: preferences.sort,
  };

  const { data: adjacentMedia, isLoading } = useMediaAdjacentQuery(
    { id: mediaId },
    {
      filters: adjacentParams.filters,
      sort: adjacentParams.sort,
    }
  );

  const navigateToPrevious = useCallback(() => {
    if (adjacentMedia?.previous) {
      navigate({
        to: "/content/library/media/$mediaId",
        params: { mediaId: adjacentMedia.previous.id },
      });
    }
  }, [adjacentMedia?.previous, navigate]);

  const navigateToNext = useCallback(() => {
    if (adjacentMedia?.next) {
      navigate({
        to: "/content/library/media/$mediaId",
        params: { mediaId: adjacentMedia.next.id },
      });
    }
  }, [adjacentMedia?.next, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;

      if ((event.key === "ArrowLeft" || event.key === "h") && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        navigateToPrevious();
      } else if (
        (event.key === "ArrowRight" || event.key === "l") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        navigateToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateToPrevious, navigateToNext]);

  if (isLoading) {
    return null;
  }

  const hasPrevious = !!adjacentMedia?.previous;
  const hasNext = !!adjacentMedia?.next;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={navigateToPrevious}
        disabled={!hasPrevious}
        title={hasPrevious ? `Previous media (Ctrl+←)` : undefined}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={navigateToNext}
        disabled={!hasNext}
        title={hasNext ? `Next media (Ctrl+→)` : undefined}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

