import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AssignMediaResponseSchema } from "@fanslib/server/schemas";
import { Button } from "~/components/ui/Button";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery, useVirtualPostsQuery } from "~/lib/queries/content-schedules";
import { useAssignMediaMutation } from "~/lib/queries/pipeline";
import { eden } from "~/lib/api/eden";
import { AssignmentDateRange } from "./AssignmentDateRange";
import { AssignmentChannelSelection } from "./AssignmentChannelSelection";
import { ScheduleBreakdown } from "./ScheduleBreakdown";
import { UnfilledSlotsList } from "./UnfilledSlotsList";
import { CreatedDraftsList } from "./CreatedDraftsList";

type AssignmentStepProps = {
  selectedChannelIds: string[];
  onSelectedChannelIdsChange: (ids: string[]) => void;
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
  onAssignmentComplete: () => void;
};

type AssignmentResult = typeof AssignMediaResponseSchema.static;

type ManualSlot = {
  scheduleId: string;
  channelId: string;
  date: string;
};

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
  const channels = channelsData ?? [];
  const schedules = schedulesData ?? [];

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

  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [manualSlot, setManualSlot] = useState<ManualSlot | null>(null);
  const [draftToAssignMedia, setDraftToAssignMedia] = useState<{ id: string; channelId: string; date: string; scheduleId: string | null } | null>(null);

  const shouldFetchDrafts = assignmentResult !== null && selectedChannelIds.length > 0;

  const { data: draftsData, refetch: refetchDrafts } = useQuery({
    queryKey: ['posts', 'list', 'drafts', selectedChannelIds, fromDate.toISOString(), toDate.toISOString()],
    queryFn: async () => {
      const result = await eden.api.posts.all.get({
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
      return result.data?.posts ?? [];
    },
    enabled: shouldFetchDrafts,
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
    setAssignmentResult(result ?? null);
    onAssignmentComplete();

    setTimeout(() => {
      refetchDrafts();
    }, 500);
  };

  const unfilledSlots = assignmentResult?.unfilled ?? [];
  const hasUnfilledSlots = unfilledSlots.length > 0;

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
        schedules={schedules}
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
              drafts={draftsData}
              fromDate={fromDate}
              toDate={toDate}
              assignmentResult={assignmentResult}
              onAssignMedia={(draftId) => {
                const draft = draftsData.find((d) => d.id === draftId);
                if (draft) {
                  setDraftToAssignMedia({
                    id: draft.id,
                    channelId: draft.channelId,
                    date: draft.date,
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
              onSlotAssign={(slot) =>
                setManualSlot({
                  scheduleId: slot.scheduleId,
                  channelId: slot.channelId,
                  date: slot.date,
                })
              }
            />
          )}
        </div>
      )}
      {manualSlot && (
        <CreatePostDialog
          open={Boolean(manualSlot)}
          onOpenChange={(open) => {
            if (!open) {
              setManualSlot(null);
              setTimeout(() => {
                refetchDrafts();
              }, 500);
            }
          }}
          media={[]}
          initialDate={new Date(manualSlot.date)}
          initialChannelId={manualSlot.channelId}
          scheduleId={manualSlot.scheduleId}
          initialStatus="draft"
          initialMediaSelectionExpanded
          initialShouldRedirect={false}
          title="Assign Media"
        />
      )}
      {draftToAssignMedia && (
        <CreatePostDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDraftToAssignMedia(null);
              setTimeout(() => {
                refetchDrafts();
              }, 500);
            }
          }}
          media={[]}
          initialDate={new Date(draftToAssignMedia.date)}
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
