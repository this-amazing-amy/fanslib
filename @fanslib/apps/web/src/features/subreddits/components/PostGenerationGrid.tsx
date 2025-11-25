import { Clock, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

type Post = {
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

type PostGenerationGridProps = {
  posts: Post[];
  onUpdatePost: (index: number, updates: Partial<Post>) => void;
  onRegenerateMedia: (index: number) => void;
  onScheduleIndividualPost: (postId: string) => void;
  onDiscardPost: (postId: string) => void;
  isSchedulingPost: string | null;
};

export const PostGenerationGrid = ({
  posts,
  onUpdatePost,
  onRegenerateMedia,
  onScheduleIndividualPost,
  onDiscardPost,
  isSchedulingPost,
}: PostGenerationGridProps) => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
      {posts.map((post, index) => (
        <Card key={post.id} className="p-4 space-y-3">
          <div className="aspect-square bg-base-200 rounded-lg overflow-hidden">
            {post.media.thumbnailUrl ?? post.media.fileUrl ? (
              <img
                src={post.media.thumbnailUrl ?? post.media.fileUrl}
                alt="Post media"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base-content/40">
                No media
              </div>
            )}
          </div>

          <div>
            <div className="font-medium text-sm">r/{post.subreddit.name}</div>
            <textarea
              value={post.caption}
              onChange={(e) => onUpdatePost(index, { caption: e.target.value })}
              className="w-full mt-2 p-2 text-sm border border-base-300 rounded-md bg-base-100 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => onRegenerateMedia(index)}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => onScheduleIndividualPost(post.id)}
              isDisabled={isSchedulingPost === post.id}
              className="flex-1"
            >
              {isSchedulingPost === post.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-1" />
                  Schedule
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onDiscardPost(post.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>;
