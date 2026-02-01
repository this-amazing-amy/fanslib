import type { Media, MediaSchema } from '@fanslib/server/schemas';
import { useState } from "react";
import type { VirtualPost } from "~/lib/virtual-posts";


type VirtualPostClickData = {
  media: Media[];
  initialDate: Date;
  initialChannelId: string;
  scheduleId?: string;
  initialMediaSelectionExpanded: boolean;
};

type UseVirtualPostClickOptions = {
  post: VirtualPost;
  onOpenCreateDialog?: (data: VirtualPostClickData) => void;
};

export const useVirtualPostClick = ({ post, onOpenCreateDialog }: UseVirtualPostClickOptions) => {
  const [createPostData, setCreatePostData] = useState<VirtualPostClickData | null>(null);

  const handleClick = () => {
    const data: VirtualPostClickData = {
      media: [],
      initialDate: new Date(post.date),
      initialChannelId: post.channelId,
      scheduleId: post.scheduleId ?? undefined,
      initialMediaSelectionExpanded: true,
    };

    if (onOpenCreateDialog) {
      onOpenCreateDialog(data);
    } else {
      setCreatePostData(data);
    }
  };

  const handleCloseDialog = () => {
    setCreatePostData(null);
  };

  return {
    handleClick,
    createPostData,
    handleCloseDialog,
  };
};
