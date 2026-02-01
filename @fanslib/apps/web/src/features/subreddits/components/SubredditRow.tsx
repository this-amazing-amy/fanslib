import type { Subreddit } from '@fanslib/server/schemas';
import { BarChart3, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import { VerificationStatus } from '~/components/VerificationStatus';
import { usePostFrequencyStatus } from '~/hooks/usePostFrequencyStatus';
import { formatViewCount } from '~/lib/format-views';
import { PostFrequencyStatus } from './PostFrequencyStatus';


type SubredditRowProps = {
  subreddit: Subreddit;
  onEdit: () => void;
  onDelete: () => void;
  lastPostDate?: string | null;
};

export const SubredditRow = ({
  subreddit,
  onEdit,
  onDelete,
  lastPostDate,
}: SubredditRowProps) => {
  const { canPost } = usePostFrequencyStatus(lastPostDate, subreddit.maxPostFrequencyHours ?? undefined);

  const textClasses = canPost ? 'text-base-content' : 'text-base-content/30';

  return (
    <div className="contents group/row">

      {/* Name */}
      <div className="p-2 pl-4 min-h-12 flex items-center">
        <a
          href={`https://reddit.com/r/${subreddit.name}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 group hover:underline"
        >
          <span className={textClasses}>
            r/<strong>{subreddit.name}</strong>
          </span>
          <ExternalLink className="h-4 w-4 text-base-content/60 opacity-50 group-hover:opacity-100" />
        </a>
      </div>

      {/* Members */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <span className={textClasses}>
          {subreddit.memberCount ? formatViewCount(subreddit.memberCount) : '-'}
        </span>
      </div>

      {/* Post Frequency */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <span className={textClasses}>{subreddit.maxPostFrequencyHours ?? '-'}</span>
      </div>

      {/* Post Status */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <PostFrequencyStatus
          lastPostDate={lastPostDate}
          maxPostFrequencyHours={subreddit.maxPostFrequencyHours}
        />
      </div>

      {/* Verification */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <VerificationStatus
          status={subreddit.verificationStatus}
          className={canPost ? '' : 'opacity-50'}
        />
      </div>

      {/* Default Flair */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <span className={textClasses}>{subreddit.defaultFlair ?? '-'}</span>
      </div>

      {/* Caption Prefix */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <span className={textClasses}>{subreddit.captionPrefix ?? '-'}</span>
      </div>

      {/* Notes */}
      <div className="p-2 min-h-12 flex items-center justify-center">
        <div className="flex items-center gap-2 w-full justify-center">
          <span className={textClasses}>{subreddit.notes ?? '-'}</span>
          {subreddit.postingTimesData && subreddit.postingTimesData.length > 0 && (
            <div
              className="inline-flex"
              title={`Posting times analyzed (${subreddit.postingTimesLastFetched ? new Date(subreddit.postingTimesLastFetched).toLocaleDateString() : 'Unknown'})`}
            >
              <BarChart3 className="h-3 w-3 text-blue-500 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 pr-4 min-h-12 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={onDelete}
        >
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
      </div>
    </div>
  );
};
