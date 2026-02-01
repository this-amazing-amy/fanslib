import type { AssignMediaResponse, PostWithRelations } from '@fanslib/server/schemas';
import { useQuery } from "@tanstack/react-query";
import { isSameMinute } from "date-fns";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useCreatePostFromVirtualSlot } from "~/features/posts/hooks/useCreatePostFromVirtualSlot";
import { api } from "~/lib/api/hono-client";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery, useVirtualPostsQuery } from "~/lib/queries/content-schedules";
import { useAssignMediaMutation } from "~/lib/queries/pipeline";
import type { VirtualPost } from "~/lib/virtual-posts";
import { AssignmentChannelSelection } from "./AssignmentChannelSelection";
import { AssignmentDateRange } from "./AssignmentDateRange";
import { CreatedDraftsList } from "./CreatedDraftsList";
import { ScheduleBreakdown } from "./ScheduleBreakdown";
import { UnfilledSlotsList } from "./UnfilledSlotsList";

type AssignmentStepProps = {
  selectedChannelIds: string[];
  onSelectedChannelIdsChange: (ids: string[]) => void;
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
  onAssignmentComplete: () => void;
};

type AssignmentResult = AssignMediaResponse;
export const AssignmentStep = ({
  selectedChannelIds,
  onSelectedChannelIdsChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onAssignmentComplete,
}: AssignmentStepProps) => {
  const { data: channelsData } = useChannelsQuery();
  const { data: schedulesData } = useContentSchedulesQuery();
  const channels = useMemo(() => channelsData ?? [], [channelsData]);
  const schedules = (schedulesData ?? []).filter(
    (schedule): schedule is (typeof schedule & { channelId: string }) => schedule.channelId !== null
  );
  const schedulesForBreakdown = schedules.map((schedule) => ({
    ...schedule,
    skippedSlots: schedule.skippedSlots?.map((slot) => ({
      date: (slot.date as unknown as Date).toISOString?.() ?? (slot.date as unknown as string),
    })),
  }));

  // Always calculate slot counts for all channels, regardless of selection
  const allChannelIds = useMemo(
    () => channels.map((channel) => channel.id),
    [channels]
  );

  const { data: virtualPosts = [] } = useVirtualPostsQuery({
    channelIds: allChannelIds,
    fromDate,
    toDate,
  });

  const { mutateAsync: assignMedia, isPending } = useAssignMediaMutation();
  const { createPostFromVirtualSlot } = useCreatePostFromVirtualSlot();

  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [unfilledSlotsState, setUnfilledSlotsState] = useState<AssignmentResult["unfilled"]>([]);
  const [draftToAssignMedia, setDraftToAssignMedia] = useState<{
    id: string;
    channelId: string;
    date: Date;
    scheduleId: string | null;
  } | null>(null);

  const shouldFetchDrafts = assignmentResult !== null && selectedChannelIds.length > 0;

  const { data: draftsData, refetch: refetchDrafts } = useQuery({
    queryKey: ['posts', 'list', 'drafts', selectedChannelIds, fromDate.toISOString(), toDate.toISOString()],
    queryFn: async () => {
      const result = await api.api.posts.all.$get({
        query: {
          filters: JSON.stringify({
            channels: selectedChannelIds,
            statuses: ["draft"],
            dateRange: {
              startDate: fromDate.toISOString(),
              endDate: toDate.toISOString(),
            },
          }),
        },
      });
      const data = await result.json();
      return data.posts ?? [];
    },
    enabled: false,
  });

  const channelSlotCounts = useMemo(
    () =>
      virtualPosts.reduce<Record<string, number>>(
        (acc, post) => ({
          ...acc,
          [post.channelId]: (acc[post.channelId] ?? 0) + 1,
        }),
        {}
      ),
    [virtualPosts]
  );

  const toggleChannelSelection = (channelId: string) => {
    onSelectedChannelIdsChange(
      selectedChannelIds.includes(channelId)
        ? selectedChannelIds.filter((id) => id !== channelId)
        : [...selectedChannelIds, channelId]
    );
  };

  const runAssignment = async () => {
    if (selectedChannelIds.length === 0) return;
    const result = await assignMedia({
      channelIds: selectedChannelIds,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });
    const normalizedResult = result ? {
      ...result,
      unfilled: result.unfilled.map(slot => ({
        ...slot,
        date: typeof slot.date === 'string' ? new Date(slot.date) : slot.date
      }))
    } : null;
    setAssignmentResult(normalizedResult);
    onAssignmentComplete();

    setTimeout(() => {
      if (shouldFetchDrafts) {
        refetchDrafts();
      }
    }, 500);
  };

  useEffect(() => {
    setUnfilledSlotsState(assignmentResult?.unfilled ?? []);
  }, [assignmentResult]);

  const unfilledSlots = unfilledSlotsState;
  const hasUnfilledSlots = unfilledSlots.length > 0;
  const virtualSlotPosts = virtualPosts.map(post => ({
    ...post,
    date: typeof post.date === 'string' ? new Date(post.date) : post.date
  })) as unknown as VirtualPost[];
  const removeUnfilledSlot = (slot: AssignmentResult["unfilled"][number]) => {
    setUnfilledSlotsState((prev) =>
      prev.filter(
        (item) =>
          !(item.channelId === slot.channelId &&
            item.scheduleId === slot.scheduleId &&
            isSameMinute(new Date(item.date), new Date(slot.date)))
      )
    );
  };

  return (
    <div className="space-y-6">
      <AssignmentDateRange
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
      />
      <AssignmentChannelSelection
        selectedChannelIds={selectedChannelIds}
        channelSlotCounts={channelSlotCounts}
        onChannelToggle={toggleChannelSelection}
      />
      <ScheduleBreakdown
        selectedChannelIds={selectedChannelIds}
        schedules={schedulesForBreakdown}
        fromDate={fromDate}
        toDate={toDate}
      />
      <div className="flex justify-center">
        <Button
          onClick={runAssignment}
          isDisabled={selectedChannelIds.length === 0 || isPending || hasUnfilledSlots}
          size="xl"
        >
          {isPending ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : (
            <Sparkles className="w-12 h-12 text-white" />
          )}
        </Button>
      </div>
      {assignmentResult && (
        <div className="space-y-4">
          {draftsData && (
            <CreatedDraftsList
              drafts={draftsData.map(draft => ({
                ...draft,
                date: typeof draft.date === 'string' ? new Date(draft.date) : draft.date,
                createdAt: typeof draft.createdAt === 'string' ? new Date(draft.createdAt) : draft.createdAt,
                updatedAt: typeof draft.updatedAt === 'string' ? new Date(draft.updatedAt) : draft.updatedAt,
                postMedia: draft.postMedia.map(pm => ({
                  ...pm,
                  createdAt: typeof pm.createdAt === 'string' ? new Date(pm.createdAt) : pm.createdAt,
                  updatedAt: typeof pm.updatedAt === 'string' ? new Date(pm.updatedAt) : pm.updatedAt,
                  media: {
                    ...pm.media,
                    createdAt: typeof pm.media.createdAt === 'string' ? new Date(pm.media.createdAt) : pm.media.createdAt,
                    updatedAt: typeof pm.media.updatedAt === 'string' ? new Date(pm.media.updatedAt) : pm.media.updatedAt,
                    fileCreationDate: typeof pm.media.fileCreationDate === 'string' ? new Date(pm.media.fileCreationDate) : pm.media.fileCreationDate,
                    fileModificationDate: typeof pm.media.fileModificationDate === 'string' ? new Date(pm.media.fileModificationDate) : pm.media.fileModificationDate,
                  },
                })),
                schedule: draft.schedule ? {
                  ...draft.schedule,
                  createdAt: typeof draft.schedule.createdAt === 'string' ? new Date(draft.schedule.createdAt) : draft.schedule.createdAt,
                  updatedAt: typeof draft.schedule.updatedAt === 'string' ? new Date(draft.schedule.updatedAt) : draft.schedule.updatedAt,
                } : null,
                subreddit: draft.subreddit ? {
                  ...draft.subreddit,
                  postingTimesLastFetched: draft.subreddit.postingTimesLastFetched && typeof draft.subreddit.postingTimesLastFetched === 'string' 
                    ? new Date(draft.subreddit.postingTimesLastFetched) 
                    : draft.subreddit.postingTimesLastFetched,
                } : null,
              })) as unknown as PostWithRelations[]}
              fromDate={fromDate}
              toDate={toDate}
              assignmentResult={assignmentResult}
              onAssignMedia={(draftId) => {
                const draft = draftsData.find((d) => d.id === draftId);
                if (draft) {
                  setDraftToAssignMedia({
                    id: draft.id,
                    channelId: draft.channelId,
                    date: typeof draft.date === 'string' ? new Date(draft.date) : draft.date,
                    scheduleId: draft.scheduleId,
                  });
                }
              }}
            />
          )}
          {unfilledSlots.length > 0 && (
            <UnfilledSlotsList
              slots={unfilledSlots}
              schedules={schedules}
              channels={channels}
              onSlotAssign={async (slot, media) => {
                const matchingVirtualPost = virtualSlotPosts.find(
                  (post) =>
                    post.channelId === slot.channelId &&
                    post.scheduleId === slot.scheduleId &&
                    isSameMinute(new Date(post.date), new Date(slot.date))
                );

                if (!matchingVirtualPost) return;

                await createPostFromVirtualSlot({
                  virtualPost: matchingVirtualPost,
                  mediaIds: media.map((item) => item.id),
                });
                removeUnfilledSlot(slot);
              }}
            />
          )}
        </div>
      )}
      {draftToAssignMedia && (
        <CreatePostDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDraftToAssignMedia(null);
              setTimeout(() => {
                if (shouldFetchDrafts) {
                  refetchDrafts();
                }
              }, 500);
            }
          }}
          media={[]}
          initialDate={draftToAssignMedia.date}
          initialChannelId={draftToAssignMedia.channelId}
          scheduleId={draftToAssignMedia.scheduleId ?? undefined}
          initialStatus="draft"
          initialMediaSelectionExpanded
          initialShouldRedirect={false}
          title="Assign Media"
        />
      )}
    </div>
  );
};
