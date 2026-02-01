import type { Subreddit, SubredditSchema } from '@fanslib/server/schemas';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { cn } from '~/lib/cn';
import {
  useDeleteSubredditMutation,
  useLastPostDatesQuery,
} from '~/lib/queries/subreddits';
import { EditingSubredditRow } from './EditingSubredditRow';
import { SubredditRow } from './SubredditRow';


type SubredditTableProps = {
  subreddits: Subreddit[];
  onSubredditUpdated: () => void;
};

type SortConfig = {
  key: keyof Subreddit | null;
  direction: 'asc' | 'desc';
};

export const SubredditTable = ({
  subreddits,
  onSubredditUpdated,
}: SubredditTableProps) => {
  const deleteSubredditMutation = useDeleteSubredditMutation();
  const [editingSubredditId, setEditingSubredditId] = useState<string | null>(null);

  const { value: sortConfig, setValue: setSortConfig } = useLocalStorage<SortConfig>(
    'subreddit-table-sort',
    { key: 'name', direction: 'asc' }
  );

  // Fetch last post dates for all subreddits
  const { data: lastPostDates = {} } = useLastPostDatesQuery({
    subredditIds: subreddits.map((s) => s.id),
  });

  // Sorting logic
  const sortedSubreddits = useMemo(() => {
    if (!sortConfig.key) return subreddits;

    return [...subreddits].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const aValue = a[sortConfig.key!];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const bValue = b[sortConfig.key!];


      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [subreddits, sortConfig]);

  const handleSort = (key: keyof Subreddit) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subreddit?')) return;

    try {
      await deleteSubredditMutation.mutateAsync({ id });
      onSubredditUpdated();
    } catch (error) {
      console.error('Failed to delete subreddit:', error);
    }
  };

  const SortIcon = ({ column }: { column: keyof Subreddit }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  if (subreddits.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
        <p className="text-base-content/60">No subreddits yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table with CSS Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1300px]">
          {/* Grid container */}
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                '[name] 200px [members] 100px [frequency] 120px [status] 140px [verification] 140px [flair] 150px [prefix] 150px [notes] 1fr [actions] 120px',
            }}
          >
            {/* Header Row */}
            <div className="contents font-medium border-b border-base-300">
              <button
                onClick={() => handleSort('name')}
                className="p-2 pl-4 min-h-10 flex items-center gap-1 hover:bg-base-200 transition-colors"
              >
                Name <SortIcon column="name" />
              </button>
              <button
                onClick={() => handleSort('memberCount')}
                className="p-2 min-h-10 flex items-center justify-center gap-1 hover:bg-base-200 transition-colors"
              >
                Members <SortIcon column="memberCount" />
              </button>
              <button
                onClick={() => handleSort('maxPostFrequencyHours')}
                className="p-2 min-h-10 flex items-center justify-center gap-1 hover:bg-base-200 transition-colors"
              >
                Frequency <SortIcon column="maxPostFrequencyHours" />
              </button>
              <div className="p-2 min-h-10 flex items-center justify-center">Post Status</div>
              <button
                onClick={() => handleSort('verificationStatus')}
                className="p-2 min-h-10 flex items-center justify-center gap-1 hover:bg-base-200 transition-colors"
              >
                Verification <SortIcon column="verificationStatus" />
              </button>
              <div className="p-2 min-h-10 flex items-center justify-center">Default Flair</div>
              <div className="p-2 min-h-10 flex items-center justify-center">Caption Prefix</div>
              <div className="p-2 min-h-10 flex items-center justify-center">Notes</div>
              <div className="p-2 pr-4 min-h-10 flex items-center justify-end">Actions</div>
            </div>

            {/* Data Rows */}
            {sortedSubreddits.map((subreddit) => (
              <div
                key={subreddit.id}
                className={cn(
                  'contents',
                  editingSubredditId === subreddit.id && 'bg-base-200/50'
                )}
              >
                {editingSubredditId === subreddit.id ? (
                  <EditingSubredditRow
                    subreddit={subreddit}
                    onUpdate={() => {
                      setEditingSubredditId(null);
                      onSubredditUpdated();
                    }}
                  />
                ) : (
                  <SubredditRow
                    subreddit={subreddit}
                    onEdit={() => setEditingSubredditId(subreddit.id)}
                    onDelete={() => handleDelete(subreddit.id)}
                    lastPostDate={
                      lastPostDates?.[subreddit.id]
                        ? new Date(lastPostDates[subreddit.id]).toISOString()
                        : null
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
