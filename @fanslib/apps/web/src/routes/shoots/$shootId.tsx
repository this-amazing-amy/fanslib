import type { Media, ShootSummary } from '@fanslib/server/schemas';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { LibraryPreferencesProvider } from "~/contexts/LibraryPreferencesContext";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { CombinedMediaSelection } from "~/features/library/components/CombinedMediaSelection";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { ShootDetailDateInput } from "~/features/shoots/components/shoot-detail/ShootDetailDateInput";
import { ShootDetailDotsMenu } from "~/features/shoots/components/shoot-detail/ShootDetailDotsMenu";
import { ShootDetailMediaGrid } from "~/features/shoots/components/shoot-detail/ShootDetailMediaGrid";
import { ShootDetailTitleInput } from "~/features/shoots/components/shoot-detail/ShootDetailTitleInput";
import { ShootPosts } from "~/features/shoots/components/shoot-detail/ShootPosts";
import { useShootQuery, useUpdateShootMutation } from "~/lib/queries/shoots";


const ShootDetailRoute = () => {
  const { shootId } = Route.useParams();
  const navigate = useNavigate();
  const { data: shoot, isLoading, error } = useShootQuery({ id: shootId });
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const updateShootMutation = useUpdateShootMutation();

  const goBack = useCallback(() => {
    if (typeof window === "undefined") {
      navigate({ to: "/shoots" });
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate({ to: "/shoots" });
  }, [navigate]);

  const handleMediaSelect = useCallback((media: Media) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id);
      return isSelected ? prev.filter((m) => m.id !== media.id) : [...prev, media];
    });
  }, []);

  const handleAddMedia = useCallback(async () => {
    if (selectedMedia.length === 0 || !shoot) return;
    
    const existingMediaIds = shoot.media?.map((m) => m.id) ?? [];
    await updateShootMutation.mutateAsync({
      id: shoot.id,
      updates: {
        mediaIds: [...existingMediaIds, ...selectedMedia.map((m) => m.id)],
      },
    });
    setSelectedMedia([]);
    setIsAddMediaOpen(false);
  }, [selectedMedia, shoot, updateShootMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !shoot) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-semibold">Shoot not found</h1>
        <Button variant="ghost" onClick={goBack}>Back</Button>
      </div>
    );
  }

  const normalizedShoot: ShootSummary = shoot as ShootSummary;

  return (
    <MediaDragProvider>
      <PostDragProvider>
        <PostPreferencesProvider>
          <MediaSelectionProvider media={normalizedShoot.media ?? []}>
            <div>
              <div className="max-w-[1280px] px-8 mx-auto pt-8 pb-12">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex-1" />
              <ShootDetailDotsMenu
                onCreatePost={() => setIsCreatePostDialogOpen(true)}
                mediaCount={normalizedShoot.media?.length ?? 0}
              />
            </div>

            <ShootDetailTitleInput shoot={normalizedShoot} />

            <div className="py-6">
              <ShootDetailDateInput shoot={normalizedShoot} />
            </div>

            <div className="@container flex flex-col gap-4">
              <LibraryPreferencesProvider>
                <ShootDetailMediaGrid
                  medias={normalizedShoot.media ?? []}
                  onAddMedia={() => setIsAddMediaOpen(true)}
                />
              </LibraryPreferencesProvider>
            </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Posts</h2>
                  <ShootPosts shootId={normalizedShoot.id} />
                </div>
              </div>
            </div>

            <MediaSelectionProvider media={selectedMedia}>
              <DialogTrigger isOpen={isAddMediaOpen} onOpenChange={setIsAddMediaOpen}>
                <DialogModal>
                  <Dialog maxWidth="3xl" className="max-h-[80vh] flex flex-col">
                    {({ close }) => (
                      <>
                        <DialogHeader>
                          <DialogTitle>Add Media to Shoot</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <CombinedMediaSelection
                            selectedMedia={selectedMedia}
                            onMediaSelect={handleMediaSelect}
                            excludeMediaIds={normalizedShoot.media?.map((m) => m.id) ?? []}
                            initialFilters={[
                              {
                                include: false,
                                items: [{ type: "shoot", id: "" }],
                              },
                            ]}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onPress={close}>
                            Cancel
                          </Button>
                          <Button
                            onPress={handleAddMedia}
                            isDisabled={selectedMedia.length === 0 || updateShootMutation.isPending}
                          >
                            {updateShootMutation.isPending
                              ? "Adding..."
                              : `Add ${selectedMedia.length} media`}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </Dialog>
                </DialogModal>
              </DialogTrigger>
            </MediaSelectionProvider>

            <CreatePostDialog
              open={isCreatePostDialogOpen}
              onOpenChange={setIsCreatePostDialogOpen}
              media={normalizedShoot.media ?? []}
            />
          </MediaSelectionProvider>
        </PostPreferencesProvider>
      </PostDragProvider>
    </MediaDragProvider>
  );
};

export const Route = createFileRoute("/shoots/$shootId")({
  component: ShootDetailRoute,
});

