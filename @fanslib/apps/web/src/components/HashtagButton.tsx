import type { Channel } from '@fanslib/server/schemas';
import { Hash } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";


type HashtagButtonProps = {
  channel: Channel;
  caption: string;
  onCaptionChange: (caption: string) => void;
  className?: string;
};

const toast = () => {};

export const HashtagButton = ({
  channel,
  caption = "",
  onCaptionChange,
  className,
}: HashtagButtonProps) => {
  const collectHashtags = () => {
    const channelHashtags = channel?.defaultHashtags ?? [];

    const uniqueHashtags = Array.from(new Set(channelHashtags as unknown as Iterable<{ name: string }>));

    return uniqueHashtags.map((hashtag) =>
      hashtag.name.startsWith("#") ? hashtag.name : `#${hashtag.name}`
    );
  };

  const addHashtags = () => {
    const hashtags = collectHashtags();
    if (hashtags.length === 0) {
      toast();
      return;
    }

    const newHashtags = hashtags.filter((hashtag) => !caption.includes(hashtag));
    if (newHashtags.length === 0) {
      toast();
      return;
    }

    const hashtagString = newHashtags.join(" ");
    const lastHashtagIndex = caption.lastIndexOf("#");

    if (lastHashtagIndex === -1) {
      const newCaption = caption ? `${caption}\n\n${hashtagString}` : hashtagString;
      onCaptionChange(newCaption);
      return;
    }

    const afterLastHashtag = caption.slice(lastHashtagIndex);
    const endOfLastHashtagBlock = afterLastHashtag.search(/[^\s#\w]/);
    const insertPosition =
      endOfLastHashtagBlock === -1 ? caption.length : lastHashtagIndex + endOfLastHashtagBlock;

    const newCaption = `${caption.slice(0, insertPosition)} ${hashtagString}${caption.slice(insertPosition)}`;
    onCaptionChange(newCaption);
  };

  if (collectHashtags().length === 0) return null;

  return (
    <Tooltip content="Adds all channel default hashtags to the caption" placement="top" openDelayMs={0}>
      <Button variant="ghost" size="icon" className={className} onPress={addHashtags}>
        <Hash className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
};
