import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CaptionQueueItem } from '@fanslib/server/schemas';
import { EmptyState } from "~/components/ui/EmptyState";
import { useCaptionQueueQuery } from "~/lib/queries/pipeline";
import { CaptionItem } from "./CaptionItem";
import { LinkedPostsProvider } from "./LinkedPostsContext";

type CaptioningStepProps = {
  channelIds: string[];
  fromDate: Date;
  toDate: Date;
  refreshKey: number;
};

export const CaptioningStep = ({
  channelIds,
  fromDate: _fromDate,
  toDate: _toDate,
  refreshKey,
}: CaptioningStepProps) => {
  const queryParams = useMemo(
    () => ({
      channelIds: channelIds.join(","),
      // Don't filter by date - show all drafts
    }),
    [channelIds]
  );

  const { data: queue = [], isLoading } = useCaptionQueueQuery(queryParams, refreshKey);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [shouldAutoExpand, setShouldAutoExpand] = useState(false);

  useEffect(() => {
    if (queue.length === 0) {
      setExpandedPostId(null);
      return;
    }

    // Auto-expand first item if no item is expanded (initial load or when shouldAutoExpand is true)
    if (!expandedPostId || shouldAutoExpand) {
      setExpandedPostId(queue[0]?.post.id ?? null);
      setShouldAutoExpand(false);
    }
    
    // If the currently expanded item no longer exists in the queue, expand the first available item
    if (expandedPostId && !queue.some((item) => item.post.id === expandedPostId)) {
      setExpandedPostId(queue[0]?.post.id ?? null);
    }
  }, [expandedPostId, queue, shouldAutoExpand]);

  const advanceFrom = (postId: string) => {
    const currentIndex = queue.findIndex((item) => item.post.id === postId);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < queue.length) {
      // Move to next item in queue
      setExpandedPostId(queue[nextIndex].post.id);
    } else {
      // No more items, clear expansion
      setExpandedPostId(null);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-base-content/60">Loading captions...</div>;
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-16 h-16" />}
        title="No draft posts"
        description="There are no draft posts. Create drafts in the Draft tab to add captions."
      />
    );
  }

type CaptionItemDateCasted = CaptionQueueItem & {
  post: {
    date: Date;
    postMedia: Array<{
      createdAt: Date;
      updatedAt: Date;
      media: {
        createdAt: Date;
        updatedAt: Date;
        fileCreationDate: Date;
        fileModificationDate: Date;
        shoots: Array<{
          createdAt: Date;
          updatedAt: Date;
          shootDate: Date;
        }>;
      };
    }>;
  };
};

  return (
    <LinkedPostsProvider>
    <div className="space-y-3">
      {queue.map((item) => (
        <CaptionItem
          key={item.post.id}
          item={item as unknown as CaptionItemDateCasted}
          isExpanded={item.post.id === expandedPostId}
          onExpand={() => setExpandedPostId(item.post.id)}
          onAdvance={() => advanceFrom(item.post.id)}
        />
      ))}
    </div>
    </LinkedPostsProvider>
  );
};
