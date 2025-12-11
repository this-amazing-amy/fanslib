import type { SubredditSchema } from '@fanslib/server/schemas';
import { BarChart3, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input/Input';
import { VERIFICATION_STATUS, type VerificationStatusType } from '~/components/VerificationStatus';
import { FilterPresetProvider } from '~/contexts/FilterPresetContext';
import { FilterActions } from '~/features/library/components/MediaFilters/FilterActions';
import { MediaFilters as MediaFiltersComponent } from '~/features/library/components/MediaFilters/MediaFilters';
import { MediaFiltersProvider } from '~/features/library/components/MediaFilters/MediaFiltersContext';
import { RedditChannelFilterPreset } from '~/features/library/components/MediaFilters/RedditChannelFilterPreset';
import { formatViewCount, parseViewCount } from '~/lib/format-views';
import { useAnalyzePostingTimesMutation, useUpdateSubredditMutation } from '~/lib/queries/subreddits';
import { SubredditPostingTimesHeatmap } from './SubredditPostingTimesHeatmap';

type Subreddit = typeof SubredditSchema.static;

type EditingSubreddit = Subreddit;

type EditingSubredditRowProps = {
  subreddit: Subreddit;
  onUpdate: () => void;
};

// Simple sanitizer for filter input
const sanitizeFilterInput = (filter: unknown) => {
  if (!filter) return null;
  return filter;
};

export const EditingSubredditRow = ({ subreddit, onUpdate }: EditingSubredditRowProps) => {
  const updateSubredditMutation = useUpdateSubredditMutation();
  const analyzePostingTimesMutation = useAnalyzePostingTimesMutation();

  const [editingSubreddit, setEditingSubreddit] = useState<EditingSubreddit>({
    ...subreddit,
    eligibleMediaFilter: sanitizeFilterInput(subreddit.eligibleMediaFilter),
  });

  const [unparsedMemberCount, setUnparsedMemberCount] = useState<string>(
    subreddit.memberCount ? formatViewCount(subreddit.memberCount) : ''
  );

  const updateSubreddit = async () => {
    try {
      await updateSubredditMutation.mutateAsync({
        id: subreddit.id,
        updates: {
          name: editingSubreddit.name,
          maxPostFrequencyHours: editingSubreddit.maxPostFrequencyHours ?? undefined,
          notes: editingSubreddit.notes ?? undefined,
          memberCount: parseViewCount(unparsedMemberCount.replaceAll(',', '.')) ?? undefined,
          verificationStatus: editingSubreddit.verificationStatus,
          eligibleMediaFilter: editingSubreddit.eligibleMediaFilter ?? undefined,
          defaultFlair: editingSubreddit.defaultFlair ?? undefined,
          captionPrefix: editingSubreddit.captionPrefix ?? undefined,
          postingTimesData: editingSubreddit.postingTimesData ?? undefined,
          postingTimesLastFetched: editingSubreddit.postingTimesLastFetched ?? undefined,
          postingTimesTimezone: editingSubreddit.postingTimesTimezone ?? undefined,
        },
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update subreddit', error);
    }
  };

  const analyzePostingTimes = async () => {
    try {
      const result = await analyzePostingTimesMutation.mutateAsync({
        subredditId: subreddit.id,
        subredditName: subreddit.name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Update local state with the new posting times data
      setEditingSubreddit({
        ...editingSubreddit,
        postingTimesData: result.postingTimes ?? null,
        postingTimesLastFetched: null,
        postingTimesTimezone: result.timezone ?? null,
      });
    } catch (error) {
      console.error('Failed to analyze posting times', error);
    }
  };

  return (
    <div className="contents">
      {/* Name */}
      <div className="p-2 pl-4 min-h-12 flex items-center">
        <Input
          value={editingSubreddit.name}
          onChange={(value) => setEditingSubreddit({ ...editingSubreddit, name: value as string })}
          className="h-8"
        />
      </div>

      {/* Members */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <Input
          value={unparsedMemberCount}
          onChange={(value) => setUnparsedMemberCount(value as string)}
          className="h-8"
          placeholder="e.g., 120K"
        />
      </div>

      {/* Post Frequency */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <Input
          type="number"
          value={editingSubreddit.maxPostFrequencyHours?.toString() ?? ''}
          onChange={(value) =>
            setEditingSubreddit({
              ...editingSubreddit,
              maxPostFrequencyHours: value ? parseInt(value as string) : null,
            })
          }
          className="h-8"
        />
      </div>

      {/* Post Status (empty in edit mode) */}
      <div />

      {/* Verification */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <select
          value={editingSubreddit.verificationStatus}
          onChange={(e) =>
            setEditingSubreddit({ ...editingSubreddit, verificationStatus: e.target.value as VerificationStatusType })
          }
          className="select select-bordered select-sm w-full h-8"
        >
          {Object.values(VERIFICATION_STATUS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Default Flair */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <Input
          value={editingSubreddit.defaultFlair ?? ''}
          onChange={(value) =>
            setEditingSubreddit({ ...editingSubreddit, defaultFlair: value as string })
          }
          className="h-8"
          placeholder="Default flair"
        />
      </div>

      {/* Caption Prefix */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <Input
          value={editingSubreddit.captionPrefix ?? ''}
          onChange={(value) =>
            setEditingSubreddit({ ...editingSubreddit, captionPrefix: value as string })
          }
          className="h-8"
          placeholder="Caption prefix"
        />
      </div>

      {/* Notes */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <Input
          value={editingSubreddit.notes ?? ''}
          onChange={(value) => setEditingSubreddit({ ...editingSubreddit, notes: value as string })}
          className="h-8"
        />
      </div>

      {/* Actions */}
      <div className="p-2 pr-4 min-h-12 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onPress={() => updateSubreddit()}>
          <Check className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded section (full width) */}
      <div className="col-span-full p-4 border-t border-base-300">
        <div className="space-y-6">
          {/* Media Filters Section */}
          <div>
            <MediaFiltersProvider
              value={editingSubreddit.eligibleMediaFilter}
              onChange={(filter) =>
                setEditingSubreddit({ ...editingSubreddit, eligibleMediaFilter: filter })
              }
            >
              <FilterPresetProvider
                onFiltersChange={(filter) => {
                  setEditingSubreddit({ ...editingSubreddit, eligibleMediaFilter: filter });
                }}
              >
                <div className="flex items-center justify-end gap-2">
                  <RedditChannelFilterPreset
                    onApplyFilter={(filter) =>
                      setEditingSubreddit({
                        ...editingSubreddit,
                        eligibleMediaFilter: sanitizeFilterInput(filter),
                      })
                    }
                  />
                  <FilterActions />
                </div>
                <MediaFiltersComponent />
              </FilterPresetProvider>
            </MediaFiltersProvider>
          </div>

          <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onPress={analyzePostingTimes}
              isDisabled={analyzePostingTimesMutation.isPending}
            >
              {analyzePostingTimesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              {analyzePostingTimesMutation.isPending ? 'Analyzing...' : 'Analyze Posting Times'}
            </Button>
          </div>

            <SubredditPostingTimesHeatmap
              postingTimes={editingSubreddit.postingTimesData ?? []}
              timezone={editingSubreddit.postingTimesTimezone ?? undefined}
            />

            {editingSubreddit.postingTimesLastFetched && (
              <p className="text-xs text-base-content/60 text-center">
                Last updated: {new Date(editingSubreddit.postingTimesLastFetched).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
