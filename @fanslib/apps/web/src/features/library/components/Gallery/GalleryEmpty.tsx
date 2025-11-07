import { FolderOpen } from "lucide-react";
import { EmptyState } from "~/components/ui/EmptyState/EmptyState";

type GalleryEmptyProps = {
  onScan?: () => void;
};

export const GalleryEmpty = ({ onScan }: GalleryEmptyProps) => (
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
