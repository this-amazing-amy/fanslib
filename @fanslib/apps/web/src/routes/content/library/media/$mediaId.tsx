import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaView } from "~/components/MediaView";
import { RevealInFinderButton } from "~/components/RevealInFinderButton";
import { MediaDetailDotsMenu } from "~/components/media-detail/MediaDetailDotsMenu";
import { MediaDetailMetadata } from "~/components/media-detail/MediaDetailMetadata";
import { MediaDetailNavigation } from "~/components/media-detail/MediaDetailNavigation";
import { MediaPosts } from "~/components/media-detail/MediaPosts";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { Button } from "~/components/ui/Button";
import { Textarea } from "~/components/ui/Textarea";
import { Switch } from "~/components/ui/Switch";

import { MediaEditsSection } from "~/features/editor/components/MediaEditsSection";
import { MediaTagEditor } from "~/features/library/components/MediaTagEditor";
import { useDebounce } from "~/hooks/useDebounce";
import { SiblingStrip } from "~/features/library/components/SiblingStrip/SiblingStrip";
import { useMediaQuery, useSiblingsQuery, useUpdateMediaMutation } from "~/lib/queries/library";

const MediaRouteInner = ({ mediaId }: { mediaId: string }) => {
  const router = useRouter();
  const { data: media, isLoading, error } = useMediaQuery({ id: mediaId });
  const { data: siblings = [] } = useSiblingsQuery(mediaId);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [localDescription, setLocalDescription] = useState("");
  const [isDescriptionSaving, setIsDescriptionSaving] = useState(false);
  const updateMediaMutation = useUpdateMediaMutation();

  const mediaId_resolved = media && !("error" in media) ? media.id : undefined;
  const mediaDescription = media && !("error" in media) ? media.description : undefined;

  useEffect(() => {
    if (mediaId_resolved) {
      setLocalDescription(mediaDescription ?? "");
    }
  }, [mediaId_resolved, mediaDescription]);

  const saveDescription = async (description: string) => {
    if (!media || "error" in media) return;
    setIsDescriptionSaving(true);
    try {
      await updateMediaMutation.mutateAsync({
        id: media.id,
        updates: { description: description.trim() || null },
      });
    } catch (error) {
      console.error("Failed to update description:", error);
    } finally {
      setIsDescriptionSaving(false);
    }
  };

  const toggleExcluded = async (excluded: boolean) => {
    if (!media || "error" in media) return;
    await updateMediaMutation.mutateAsync({
      id: media.id,
      updates: { excluded },
    });
  };

  const debouncedSaveDescription = useDebounce(saveDescription, 1000);

  const updateDescription = (newDescription: string) => {
    setLocalDescription(newDescription);
    debouncedSaveDescription(newDescription);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !media || "error" in media) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold mb-4">Media not found</h1>
        <Button variant="ghost" onClick={() => router.history.back()}>
          Back to Library
        </Button>
      </div>
    );
  }

  const mediaWithDates = media as unknown as typeof media & {
    createdAt: Date;
    updatedAt: Date;
    fileCreationDate: Date;
    fileModificationDate: Date;
  };

  return (
    <div className="overflow-y-auto">
      <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex-1" />
          <MediaDetailNavigation mediaId={mediaId} navigateTo="/content/library/media/$mediaId" />
        </div>
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">{media.name}</h1>
          <div className="flex gap-2">
            <RevealInFinderButton relativePath={media.relativePath} />
            <MediaDetailDotsMenu
              id={media.id}
              mediaType={media.type}
              onCreatePost={() => setCreatePostDialogOpen(true)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6">
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl bg-base-300 aspect-square overflow-hidden"
              style={{ viewTransitionName: `media-${media.id}` }}
            >
              <MediaView media={mediaWithDates} controls />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="media-description" className="text-sm font-medium">
                  Description
                </label>
              </div>
              <div className="relative">
                <Textarea
                  id="media-description"
                  placeholder="Add a description..."
                  value={localDescription}
                  onChange={updateDescription}
                  rows={4}
                />
                {isDescriptionSaving && (
                  <div className="absolute right-2 bottom-2 bg-base-100 p-1 rounded text-xs">
                    Saving...
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="media-excluded" className="text-sm font-medium">
                Exclude from posting
              </label>
              <Switch
                id="media-excluded"
                isSelected={media.excluded ?? false}
                onChange={toggleExcluded}
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <MediaTagEditor media={[mediaWithDates]} />
          </div>
        </div>

        {Array.isArray(siblings) && <SiblingStrip siblings={siblings} />}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Posts</h3>
          <Button variant="primary" size="icon" onPress={() => setCreatePostDialogOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <MediaPosts mediaId={media.id} />
        </div>

        <div className="mt-4">
          <MediaEditsSection mediaId={media.id} />
        </div>

        <div className="mt-8">
          <MediaDetailMetadata media={mediaWithDates} />
        </div>
        <CreatePostDialog
          open={createPostDialogOpen}
          onOpenChange={setCreatePostDialogOpen}
          media={[mediaWithDates]}
        />
      </div>
    </div>
  );
};

const MediaRoute = () => {
  const { mediaId } = useParams({ from: "/content/library/media/$mediaId" });
  return <MediaRouteInner key={mediaId} mediaId={mediaId} />;
};

export const Route = createFileRoute("/content/library/media/$mediaId")({
  component: MediaRoute,
});
