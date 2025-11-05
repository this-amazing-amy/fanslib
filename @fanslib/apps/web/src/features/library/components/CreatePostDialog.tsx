import type { Media } from "@fanslib/types";

type CreatePostDialogProps = {
  media: Media[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// TODO: Port this component from electron-legacy/src/renderer/src/pages/MediaDetail/CreatePostDialog.tsx
export const CreatePostDialog = ({ media: _media, open: _open, onOpenChange: _onOpenChange }: CreatePostDialogProps) => null;
