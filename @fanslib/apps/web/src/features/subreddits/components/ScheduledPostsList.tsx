import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { formatDate } from "~/lib/reddit/date-formatting";

type ScheduledPost = {
  id: string;
  subreddit: {
    id: string;
    name?: string;
    channel?: {
      name: string;
    };
  };
  media: {
    id: string;
    thumbnailUrl?: string;
  };
  caption: string;
  scheduledDate: string;
  status?: "queued" | "processing" | "posted" | "failed";
  errorMessage?: string;
  postUrl?: string;
};

type ScheduledPostsListProps = {
  posts: ScheduledPost[];
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case "posted":
      return <CheckCircle className="w-4 h-4 text-success" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-error" />;
    case "processing":
      return <Loader2 className="w-4 h-4 text-info animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-warning" />;
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case "posted":
      return "Posted";
    case "failed":
      return "Failed";
    case "processing":
      return "Processing";
    default:
      return "Queued";
  }
};

export const ScheduledPostsList = ({ posts }: ScheduledPostsListProps) => {
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="text-base-content/40">
          <Clock className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No scheduled posts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-base-300">
      {posts.map((post) => (
        <div key={post.id} className="p-4 hover:bg-base-200/50 transition-colors">
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-base-200 rounded-md overflow-hidden flex-shrink-0">
              {post.media.thumbnailUrl ? (
                <img
                  src={post.media.thumbnailUrl}
                  alt="Post thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base-content/40 text-xs">
                  No image
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(post.status)}
                <span className="text-xs font-medium">
                  {getStatusText(post.status)}
                </span>
              </div>

              <div className="font-medium text-sm truncate">
                r/{post.subreddit.channel?.name ?? post.subreddit.name ?? 'Unknown'}
              </div>

              <div className="text-xs text-base-content/60 line-clamp-2 mt-1">
                {post.caption}
              </div>

              <div className="text-xs text-base-content/40 mt-1">
                {formatDate(post.scheduledDate)}
              </div>

              {post.status === "failed" && post.errorMessage && (
                <div className="text-xs text-error mt-1">
                  Error: {post.errorMessage}
                </div>
              )}

              {post.status === "posted" && post.postUrl && (
                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View post →
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
