import { Camera } from "lucide-react";
import type { FC } from "react";
import { EmptyState } from "~/components/ui/EmptyState";
import { ErrorState } from "~/components/ui/ErrorState";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { useShootContext } from "~/contexts/ShootContext";
import { ShootPreferencesProvider } from "~/contexts/ShootPreferencesContext";
import { ShootCreateDropZone } from "~/features/shoots/components/ShootCreateDropZone";
import { ShootDetail } from "~/features/shoots/components/ShootDetail";
import { useScrollPosition } from "~/hooks/useScrollPosition";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { useShootsMedia } from "./useShootsMedia";
import { ShootsFilter } from "~/components/ShootsFilter";

type ShootsProps = {
  className?: string;
};

const ShootsContent: FC<ShootsProps> = ({ className }) => {
  const { refetch: refetchLibrary } = useMediaListQuery();
  const { shoots, isLoading, error, refetch } = useShootContext();
  const { isDragging } = useMediaDrag();
  const scrollRef = useScrollPosition<HTMLDivElement>(!isLoading);
  const { allMedia, shootsMedia } = useShootsMedia(shoots);

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
        <div className="mb-6 px-6">
          <ShootsFilter />
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="flex flex-col px-6 pt-4 gap-2 pb-48">
              {shoots.length === 0
                ? !isDragging && (
                    <EmptyState
                      icon={<Camera className="h-12 w-12" />}
                      title="No shoots created"
                      description="Drag media here to create your first shoot and organize your content."
                    />
                  )
                : shoots.map((shoot) => (
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
                  ))}
              <ShootCreateDropZone className="h-24" />
            </div>
          </ScrollArea>
        </div>
      </div>
    </MediaSelectionProvider>
  );
};

export const Shoots: FC<ShootsProps> = (props) => <ShootPreferencesProvider>
      <ShootsContent {...props} />
    </ShootPreferencesProvider>;
