import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { eden } from "~/lib/api/eden";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input/Input";

type Candidate = {
  id: string;
  filename: string;
  caption: string | null;
};

type AnalyticsMatchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onConfirm: (postMediaId: string) => void;
};

export const AnalyticsMatchDialog = ({
  isOpen,
  onClose,
  candidate,
  onConfirm,
}: AnalyticsMatchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostMediaId, setSelectedPostMediaId] = useState<string | null>(null);

  const { data: postsData } = useQuery({
    queryKey: ["posts-search", searchQuery],
    queryFn: async () => {
      const response = await eden.api.posts.all.get({
        query: {
          filters: JSON.stringify({
            search: searchQuery || undefined,
          }),
        },
      });
      if (response.error) throw new Error("Failed to search posts");
      return response.data;
    },
    enabled: isOpen,
  });

  const handleConfirm = () => {
    if (selectedPostMediaId) {
      onConfirm(selectedPostMediaId);
    }
  };

  const posts = postsData ?? [];

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <span />
      <DialogModal>
        <Dialog maxWidth="2xl">
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Match Candidate: {candidate.filename}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div>
                  <Input
                    placeholder="Search posts by caption or date..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {posts.length === 0 ? (
                    <div className="text-center py-8 text-base-content/70">
                      {searchQuery ? "No posts found" : "Start typing to search posts"}
                    </div>
                  ) : (
                    posts.map((post) =>
                      post.postMedia.map((postMedia) => (
                        <div
                          key={postMedia.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPostMediaId === postMedia.id
                              ? "border-primary bg-primary/10"
                              : "border-base-300 hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedPostMediaId(postMedia.id)}
                        >
                          <div className="font-semibold text-sm">{postMedia.media.name}</div>
                          {post.caption && (
                            <div className="text-xs text-base-content/70 mt-1 line-clamp-2">
                              {post.caption}
                            </div>
                          )}
                          <div className="text-xs text-base-content/60 mt-1">
                            {new Date(post.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onPress={close}>
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    handleConfirm();
                    close();
                  }}
                  isDisabled={!selectedPostMediaId}
                >
                  Confirm Match
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

