import type { Media } from '@fanslib/server/schemas';


import { format, formatDistanceToNow } from "date-fns";
import { formatBytes } from "~/lib/format";

type MediaDetailMetadataProps = {
  media: Media;
};

export const MediaDetailMetadata = ({ media }: MediaDetailMetadataProps) => <div className="grid grid-cols-[1fr_3fr] gap-x-4 gap-y-2 text-sm">
      <h3 className="text-lg font-medium col-span-2">Metadata</h3>
      <span className="text-muted-foreground">Type</span>
      <span className="capitalize">{media.type}</span>

      <span className="text-muted-foreground">Size</span>
      <span>{formatBytes(media.size)}</span>

      {media.duration && (
        <>
          <span className="text-muted-foreground">Duration</span>
          <span>{Math.round(media.duration)}s</span>
        </>
      )}

      <span className="text-muted-foreground">Path</span>
      <span className="truncate" title={media.relativePath}>
        {media.relativePath}
      </span>

      <span className="text-muted-foreground">Created</span>
      <span title={format(media.fileCreationDate, "PPpp")}>
        {formatDistanceToNow(media.fileCreationDate, { addSuffix: true })}
      </span>

      <span className="text-muted-foreground">Modified</span>
      <span title={format(media.fileModificationDate, "PPpp")}>
        {formatDistanceToNow(media.fileModificationDate, { addSuffix: true })}
      </span>

      <span className="text-muted-foreground">Added to Library</span>
      <span title={format(media.createdAt, "PPpp")}>
        {formatDistanceToNow(media.createdAt, { addSuffix: true })}
      </span>
    </div>;

