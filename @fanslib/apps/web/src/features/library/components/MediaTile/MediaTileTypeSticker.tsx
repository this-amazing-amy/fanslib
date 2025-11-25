import { Sticker } from "~/components/ui/Sticker";
import { ImageIcon, Video } from "lucide-react";
import type { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;

export const MediaTileTypeSticker = ({ media }: { media: Media }) =>
  !media.type ? null : (
    <Sticker>
      {media.type === "video" ? <Video className="size-3" /> : <ImageIcon className="size-3" />}
    </Sticker>
  );
