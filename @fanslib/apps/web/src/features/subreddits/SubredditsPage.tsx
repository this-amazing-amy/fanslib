import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { TabItem, Tabs } from "~/components/ui/Tabs";
import { useSubredditsQuery } from "~/lib/queries/subreddits";
import { CreateSubredditDialog } from "./components/CreateSubredditDialog";
import { RedditBulkPostGenerator } from "./components/RedditBulkPostGenerator";
import { SubredditTable } from "./components/SubredditTable";

export const SubredditsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: subreddits = [], refetch } = useSubredditsQuery();

  const handleSubredditUpdated = () => {
    refetch();
  };

  const handleSubredditCreated = () => {
    refetch();
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subreddits</h1>
        <p className="text-base-content/60">
          Manage your Reddit communities and content distribution
        </p>
      </div>

      <Tabs>
        <TabItem key="bulk-posting" title="Post to Reddit">
          <RedditBulkPostGenerator subreddits={subreddits ?? []} />
        </TabItem>
        
        <TabItem key="subreddits" title="Manage Subreddits">
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button onPress={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Subreddit
              </Button>
            </div>

            <SubredditTable
              subreddits={subreddits ?? []}
              onSubredditUpdated={handleSubredditUpdated}
            />
          </div>
        </TabItem>
      </Tabs>

      <CreateSubredditDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubredditCreated={handleSubredditCreated}
      />
    </div>
  );
};
