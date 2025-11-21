import type { SubredditSchema } from "@fanslib/server/schemas";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useDeleteSubredditMutation } from "~/lib/queries/subreddits";

type Subreddit = typeof SubredditSchema.static;

type SubredditTableProps = {
  subreddits: Subreddit[];
  onSubredditUpdated: () => void;
};

export const SubredditTable = ({ subreddits, onSubredditUpdated }: SubredditTableProps) => {
  const deleteSubredditMutation = useDeleteSubredditMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subreddit?")) return;

    try {
      await deleteSubredditMutation.mutateAsync({ id });
      onSubredditUpdated();
      console.log("Subreddit deleted successfully");
    } catch (error) {
      console.error("Failed to delete subreddit:", error);
    }
  };

  if (subreddits.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
        <p className="text-base-content/60">No subreddits yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subreddits.map((subreddit) => (
            <tr key={subreddit.id}>
              <td className="font-medium">r/{subreddit.name}</td>
              <td className="text-base-content/60">{subreddit.notes || "—"}</td>
              <td>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDelete(subreddit.id)}
                  isDisabled={deleteSubredditMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
