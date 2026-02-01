import type { Media, Subreddit } from '@fanslib/server/schemas';
import { createContext, useContext, useState, type ReactNode } from "react";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useCreatePostMutation, useUpdatePostMutation } from "~/lib/queries/posts";



export type SubredditPostDraft = {
  subreddit: Subreddit;
  media?: Media | null;
  url?: string;
  caption?: string;
  postId?: string;
};

type RedditPostContextType = {
  drafts: SubredditPostDraft[];
  addDraft: (draft: SubredditPostDraft) => void;
  updateDraft: (subredditId: string, updates: Partial<SubredditPostDraft>) => void;
  removeDraft: (subredditId: string) => void;
  clearDrafts: () => void;
  submitDrafts: () => Promise<void>;
  isSubmitting: boolean;
};

const RedditPostContext = createContext<RedditPostContextType | null>(null);

export const RedditPostProvider = ({ children }: { children: ReactNode }) => {
  const [drafts, setDrafts] = useState<SubredditPostDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: channels = [] } = useChannelsQuery();
  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();

  const addDraft = (draft: SubredditPostDraft) => {
    setDrafts((prev) => {
      const existing = prev.find((d) => d.subreddit.id === draft.subreddit.id);
      if (existing) {
        return prev.map((d) => (d.subreddit.id === draft.subreddit.id ? { ...d, ...draft } : d));
      }
      return [...prev, draft];
    });
  };

  const updateDraft = (subredditId: string, updates: Partial<SubredditPostDraft>) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.subreddit.id === subredditId ? { ...draft, ...updates } : draft))
    );
  };

  const removeDraft = (subredditId: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.subreddit.id !== subredditId));
  };

  const clearDrafts = () => {
    setDrafts([]);
  };

  const submitDrafts = async () => {
    setIsSubmitting(true);
    try {
      const redditChannel = (channels ?? []).find((c) => c.typeId === "reddit");
      if (!redditChannel) {
        throw new Error("Reddit channel not found");
      }

      const promises = drafts.map(async (draft) => {
        const postData = {
          date: new Date(),
          channelId: redditChannel.id,
          status: "posted" as const,
          caption: draft.caption ?? "",
          subredditId: draft.subreddit.id,
          url: draft.url,
          mediaIds: draft.media ? [draft.media.id] : [],
        };

        if (draft.postId) {
          return updatePostMutation.mutateAsync({
            id: draft.postId,
            updates: postData,
          });
        } else {
          return createPostMutation.mutateAsync({
            ...postData,
            mediaIds: postData.mediaIds,
          });
        }
      });

      await Promise.all(promises);
      clearDrafts();
    } catch (error) {
      console.error("Failed to submit posts:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: RedditPostContextType = {
    drafts,
    addDraft,
    updateDraft,
    removeDraft,
    clearDrafts,
    submitDrafts,
    isSubmitting,
  };

  return <RedditPostContext.Provider value={value}>{children}</RedditPostContext.Provider>;
};

export const useRedditPosts = () => {
  const context = useContext(RedditPostContext);
  if (!context) {
    throw new Error("useRedditPosts must be used within a RedditPostProvider");
  }
  return context;
};
