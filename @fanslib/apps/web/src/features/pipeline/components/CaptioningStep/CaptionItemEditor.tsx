import type { CaptionQueueItem, Media } from "@fanslib/server/schemas";
import type { KeyboardEvent } from "react";
import { SnippetSelector } from "~/components/SnippetSelector";
import { HashtagButton } from "~/components/HashtagButton";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/Textarea";
import { CaptionSyncControl } from "~/features/pipeline/components/CaptionSyncControl";
import { RelatedCaptionsPanel } from "~/features/pipeline/components/RelatedCaptionsPanel";
import type { MediaTagResult } from "./MediaPreviewWithTags";
import { MediaPreviewWithTags } from "./MediaPreviewWithTags";

type CaptionItemEditorProps = {
  item: CaptionQueueItem;
  postMedia: Array<{ id: string; media: Media }>;
  mediaTagQueries: { data?: MediaTagResult[] | undefined }[];
  localCaption: string;
  updateCaption: (caption: string) => void;
  showTitleInput: boolean;
  localTitle: string;
  updateTitle: (title: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  selectedLinkedPostIds: string[];
  onLinkedPostSelectionChange: (ids: string[]) => void;
  onAdvance: () => void;
  onSaveAndAdvance: () => void;
};

export const CaptionItemEditor = ({
  item,
  postMedia,
  mediaTagQueries,
  localCaption,
  updateCaption,
  showTitleInput,
  localTitle,
  updateTitle,
  onKeyDown,
  selectedLinkedPostIds,
  onLinkedPostSelectionChange,
  onAdvance,
  onSaveAndAdvance,
}: CaptionItemEditorProps) => (
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <MediaPreviewWithTags postMedia={postMedia} mediaTagQueries={mediaTagQueries} />
        {showTitleInput && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Add a title..."
              className="input input-bordered w-full input-sm"
            />
          </div>
        )}
        <div className="relative">
          <Textarea
            value={localCaption}
            onChange={updateCaption}
            onKeyDown={onKeyDown}
            rows={10}
            className="pr-10"
            placeholder="Write a caption..."
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <SnippetSelector
              channelId={item.post.channel.id}
              caption={localCaption}
              onCaptionChange={updateCaption}
              className="text-base-content/60 hover:text-base-content"
            />
            <HashtagButton
              channel={item.post.channel}
              caption={localCaption}
              onCaptionChange={updateCaption}
              className="text-base-content/60 hover:text-base-content"
            />
          </div>
        </div>
        <CaptionSyncControl
          linkedPosts={item.linkedPosts}
          selectedPostIds={selectedLinkedPostIds}
          onSelectionChange={onLinkedPostSelectionChange}
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onAdvance}>
            Skip
          </Button>
          <Button size="sm" onClick={onSaveAndAdvance}>
            Save & Next
          </Button>
        </div>
      </div>
      <RelatedCaptionsPanel
        relatedByMedia={item.relatedByMedia}
        relatedByShoot={item.relatedByShoot}
        currentCaption={localCaption}
        onUseCaption={updateCaption}
      />
    </div>
  </div>
);
