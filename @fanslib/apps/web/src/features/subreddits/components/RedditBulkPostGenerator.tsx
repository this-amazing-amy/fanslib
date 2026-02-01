import type { Subreddit } from '@fanslib/server/schemas';
import { ChevronRight, Clock, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { AuthenticationStatus } from "~/features/settings/components/reddit/AuthenticationStatus";
import { useRedditLoginStatusQuery, useRedditSessionStatusQuery } from "~/lib/queries/reddit";
import { useGeneratePosts, useRegenerateMedia, useSchedulePosts, useScheduledPosts } from "~/lib/queries/reddit-poster";
import { getAuthenticationStatus, isStatusStale, loadCachedStatus } from "~/lib/reddit/auth-status-utils";
import { PostGenerationGrid } from "./PostGenerationGrid";
import { ScheduledPostsList } from "./ScheduledPostsList";


type GeneratedPost = {
  id: string;
  subreddit: {
    id: string;
    name: string;
  };
  media: {
    id: string;
    thumbnailUrl?: string;
    fileUrl?: string;
    [key: string]: unknown;
  };
  caption: string;
  date: Date;
};

type RedditBulkPostGeneratorProps = {
  subreddits: Subreddit[];
};

export const RedditBulkPostGenerator = ({ subreddits }: RedditBulkPostGeneratorProps) => {
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);

  // Auth status
  const [lastChecked, setLastChecked] = useState<string | null>(() => {
    const cached = loadCachedStatus();
    return cached?.lastChecked ?? null;
  });
  const loginStatusQuery = useRedditLoginStatusQuery();
  const sessionStatusQuery = useRedditSessionStatusQuery();
  const sessionStatus = sessionStatusQuery.data ?? null;
  const loginStatus = loginStatusQuery.data ?? null;
  const isLoadingAuth = sessionStatusQuery.isLoading || sessionStatusQuery.isFetching;
  const isCheckingLogin = loginStatusQuery.isLoading || loginStatusQuery.isFetching;
  const isStale = lastChecked ? isStatusStale(lastChecked) : true;
  const authStatus = getAuthenticationStatus(sessionStatus, loginStatus, isLoadingAuth, isStale);

  // Mutations
  const generatePostsMutation = useGeneratePosts();
  const schedulePostsMutation = useSchedulePosts();
  const regenerateMediaMutation = useRegenerateMedia();
  const { data: scheduledPosts } = useScheduledPosts();

  const handleRefreshAuth = async () => {
    await Promise.all([loginStatusQuery.refetch(), sessionStatusQuery.refetch()]);
    setLastChecked(new Date().toISOString());
  };

  const generatePosts = async () => {
    try {
      const posts = await generatePostsMutation.mutateAsync({
        count: 5,
        subreddits,
        channelId: "reddit", // TODO: Get from context or settings
      });
      setGeneratedPosts(posts as GeneratedPost[]);
    } catch (error) {
      console.error("Failed to generate posts:", error);
    }
  };

  const updatePost = (index: number, updates: Partial<GeneratedPost>) => {
    setGeneratedPosts((prev) =>
      prev.map((post, i) => (i === index ? { ...post, ...updates } : post))
    );
  };

  const regenerateMedia = async (index: number) => {
    const post = generatedPosts[index];
    if (!post) return;

    try {
      const regeneratedData = await regenerateMediaMutation.mutateAsync({
        subredditId: post.subreddit.id,
        channelId: "reddit",
      });

      updatePost(index, {
        media: regeneratedData.media,
        caption: regeneratedData.caption,
      });
    } catch (error) {
      console.error("Failed to regenerate media:", error);
    }
  };

  const scheduleIndividualPost = async (postId: string) => {
    const post = generatedPosts.find((p) => p.id === postId);
    if (!post) return;

    setSchedulingPostId(postId);
    try {
      await schedulePostsMutation.mutateAsync([post]);
      setGeneratedPosts((prev) => prev.filter((p) => p.id !== postId));
      console.log("Post scheduled successfully");
    } catch (error) {
      console.error("Failed to schedule post:", error);
    } finally {
      setSchedulingPostId(null);
    }
  };

  const discardPost = (postId: string) => {
    setGeneratedPosts((prev) => prev.filter((p) => p.id !== postId));
    console.log("Post discarded");
  };

  const scheduleAllPosts = async () => {
    if (generatedPosts.length === 0) return;

    try {
      await schedulePostsMutation.mutateAsync(generatedPosts);
      const count = generatedPosts.length;
      setGeneratedPosts([]);
      console.log(`Successfully scheduled ${count} posts`);
    } catch (error) {
      console.error("Failed to schedule posts:", error);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="px-6 pt-4 pb-2">
        <AuthenticationStatus
          authStatus={authStatus}
          lastChecked={lastChecked}
          isLoading={isLoadingAuth}
          isCheckingLogin={isCheckingLogin}
          onRefresh={handleRefreshAuth}
          variant="compact"
        />
      </div>

      <div className="flex flex-1 gap-6 p-6 overflow-hidden max-h-[80vh]">
        <div className="flex-[2] flex flex-col overflow-hidden">
          {generatedPosts.length > 0 ? (
            <PostGenerationGrid
              posts={generatedPosts}
              onUpdatePost={updatePost}
              onRegenerateMedia={regenerateMedia}
              onScheduleIndividualPost={scheduleIndividualPost}
              onDiscardPost={discardPost}
              isSchedulingPost={schedulingPostId}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-base-300 rounded-lg min-h-[60vh]">
              <div className="text-center py-12">
                <Button
                  onPress={generatePosts}
                  isDisabled={generatePostsMutation.isPending || subreddits.length === 0}
                  size="lg"
                  className="w-20 h-20"
                >
                  {generatePostsMutation.isPending ? (
                    <Loader2 className="w-12 h-12 animate-spin" />
                  ) : (
                    <Sparkles className="w-12 h-12" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center">
          <Button
            onPress={scheduleAllPosts}
            isDisabled={schedulePostsMutation.isPending || generatedPosts.length === 0}
            size="lg"
            className="w-20 h-20"
          >
            <div className="flex items-center justify-center pl-2">
              {schedulePostsMutation.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Clock className="w-8 h-8 -mr-2" />
                  <ChevronRight className="w-8 h-8" />
                </>
              )}
            </div>
          </Button>

          <div className="mt-2 text-center">
            {schedulePostsMutation.isPending ? (
              <p className="text-xs text-primary animate-pulse">Scheduling...</p>
            ) : generatedPosts.length > 0 ? (
              <p className="text-xs text-base-content/60">
                Schedule to Queue
                <br />
                <span className="font-medium">{generatedPosts.length} posts</span>
              </p>
            ) : (
              <p className="text-xs text-base-content/40">
                Generate posts first
                <br />
                to schedule
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-base-100 rounded-lg overflow-hidden border border-base-300">
          <div className="flex-1 overflow-y-auto">
            <ScheduledPostsList posts={scheduledPosts ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
};
