import { ScrollArea } from "~/components/ui/ScrollArea";
import { Skeleton } from "~/components/ui/Skeleton";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { cn } from "~/lib/cn";

export const GallerySkeleton = () => {
  const { preferences } = useLibraryPreferences();

  const gridClasses =
    preferences.view.gridSize === "large"
      ? "@[48rem]:grid-cols-4 @[72rem]:grid-cols-6 @[128rem]:grid-cols-8"
      : "@[48rem]:grid-cols-4 @[72rem]:grid-cols-8 @[128rem]:grid-cols-12";

  const items = Array.from({ length: 16 }, (_, index) => index);

  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(100%-3rem)] @container">
        <div
          className={cn(
            "grid gap-4 p-0 grid-cols-3",
            gridClasses,
          )}
        >
          {items.map((index) => (
            <div key={`gallery-skeleton-${index}`} className="space-y-3">
              <Skeleton className="w-full aspect-square rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-3/6" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};


