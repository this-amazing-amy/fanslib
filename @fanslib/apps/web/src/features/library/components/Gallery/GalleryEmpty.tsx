import { FolderOpen, Settings } from "lucide-react";
import { EmptyState } from "~/components/ui/EmptyState/EmptyState";

type GalleryEmptyProps = {
  libraryPath?: string;
  onScan?: () => void;
};

export const GalleryEmpty = ({ libraryPath, onScan }: GalleryEmptyProps) => {
  if (!libraryPath) {
    return (
      <div className="col-span-full">
        <EmptyState
          icon={<Settings className="h-12 w-12" />}
          title="No library path set"
          description="Please configure your library path in settings to view media files."
        />
      </div>
    );
  }

  return (
    <div className="col-span-full">
      <EmptyState
        icon={<FolderOpen className="h-12 w-12" />}
        title="No media files found"
        description="No media files found in the library matching the selected filters."
        action={
          onScan ? {
            label: "Scan Library",
            onClick: onScan,
          } : undefined
        }
      />
    </div>
  );
};
