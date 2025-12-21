import { Camera, LayoutGrid, LayoutList } from "lucide-react";
import { useMemo, type FC } from "react";
import { EmptyState } from "~/components/ui/EmptyState";
import { ErrorState } from "~/components/ui/ErrorState";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { useShootContext } from "~/contexts/ShootContext";
import { useShootPreferences, type ShootViewType } from "~/contexts/ShootPreferencesContext";
import { ShootCard } from "~/features/shoots/components/ShootCard";
import { ShootCreateDropZone } from "~/features/shoots/components/ShootCreateDropZone";
import { ShootDetail } from "~/features/shoots/components/ShootDetail";
import { ShootViewSettings } from "~/features/shoots/components/ShootViewSettings";
import { useScrollPosition } from "~/hooks/useScrollPosition";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { ShootsFilter } from "~/components/ShootsFilter";
import { ShootsSortOptions } from "~/features/shoots/components/ShootsSortOptions";
import { useShootsMedia } from "./useShootsMedia";

type ShootsContentProps = {
  className?: string;
};

export const ShootsContent: FC<ShootsContentProps> = ({ className }) => {
  const { refetch: refetchLibrary } = useMediaListQuery();
  const { shoots, isLoading, error, refetch } = useShootContext();
  const { isDragging } = useMediaDrag();
  const { preferences, updatePreferences } = useShootPreferences();
  const scrollRef = useScrollPosition<HTMLDivElement>(!isLoading);
  const { allMedia, shootsMedia } = useShootsMedia(shoots);

  const sortedShoots = useMemo(() => {
    const sorted = [...shoots];
    const { field, direction } = preferences.sort;

    sorted.sort((a, b) => {
      let comparison = 0;

      if (field === "name") {
        comparison = (a.name ?? "").localeCompare(b.name ?? "");
      } else if (field === "date") {
        comparison = new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime();
      } else if (field === "mediaCount") {
        comparison = (a.media?.length ?? 0) - (b.media?.length ?? 0);
      }

      return direction === "ASC" ? comparison : -comparison;
    });

    return sorted;
  }, [shoots, preferences.sort]);

  if (error) {
    return (
      <div className={className}>
        <ErrorState
          title="Failed to load shoots"
          description={error.message}
          retry={{
            onClick: () => refetch(),
          }}
        />
      </div>
    );
  }

  return (
    <MediaSelectionProvider
      media={new Map(Array.from(allMedia.entries()).map(([key, value]) => [key.viewIndex, value]))}
    >
      <div className={cn(className, "flex h-full flex-col")}>
        <div className="px-6 pb-4">
          <SectionHeader
            title=""
            actions={
              <div className="flex items-center gap-2">
                <ToggleGroup
                  value={preferences.view.viewType}
                  aria-label="Shoots view type"
                  onChange={(value) => {
                    if (!value) return;
                    updatePreferences({ view: { viewType: value as ShootViewType } });
                  }}
                  options={[
                    {
                      value: "list",
                      icon: <LayoutList className="h-4 w-4" />,
                      ariaLabel: "List view",
                    },
                    {
                      value: "grid",
                      icon: <LayoutGrid className="h-4 w-4" />,
                      ariaLabel: "Grid view",
                    },
                  ]}
                  size="sm"
                />
                <ShootsSortOptions
                  value={preferences.sort}
                  onChange={(sort) => {
                    updatePreferences({ sort });
                  }}
                />
                <ShootViewSettings />
              </div>
            }
          />
          <div className="mt-2">
            <ShootsFilter />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className={cn("flex flex-col gap-2 pb-48", preferences.view.viewType === "grid" && "pt-4")}>
              {sortedShoots.length === 0
                ? !isDragging && (
                    <EmptyState
                      icon={<Camera className="h-12 w-12" />}
                      title="No shoots created"
                      description="Drag media here to create your first shoot and organize your content."
                    />
                  )
                : preferences.view.viewType === "list"
                  ? sortedShoots.map((shoot) => (
                      <ShootDetail
                        key={shoot.id}
                        shoot={shoot}
                        groupedMedia={
                          shootsMedia.get(
                            Array.from(shootsMedia.keys()).find((k) => k.shootId === shoot.id) ?? {
                              shootId: shoot.id,
                              viewIndex: "0",
                            }
                          ) ?? new Map()
                        }
                        onUpdate={() => {
                          refetch();
                          refetchLibrary();
                        }}
                      />
                    ))
                  : (
                      <div className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {sortedShoots.map((shoot) => {
                            const groupedMedia =
                              shootsMedia.get(
                                Array.from(shootsMedia.keys()).find((k) => k.shootId === shoot.id) ?? {
                                  shootId: shoot.id,
                                  viewIndex: "0",
                                }
                              ) ?? new Map();
                            return (
                              <ShootCard
                                key={shoot.id}
                                shoot={shoot}
                                groupedMedia={groupedMedia}
                                onUpdate={() => {
                                  refetch();
                                  refetchLibrary();
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
              <ShootCreateDropZone className="h-24" />
            </div>
          </ScrollArea>
        </div>
      </div>
    </MediaSelectionProvider>
  );
};

