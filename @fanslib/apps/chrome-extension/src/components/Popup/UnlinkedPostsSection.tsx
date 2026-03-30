import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, Image, Video } from "lucide-react";
import { getSettings } from "../../lib/storage";
import { getMediaThumbnailUrl } from "../../lib/utils";

type UnlinkedPost = {
  postId: string;
  caption: string | null;
  postedDate: string;
  previewThumbnailUrl: string | null;
  previewDuration: number | null;
  previewMediaId: string | null;
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const UnlinkedPostsSection = () => {
  const [posts, setPosts] = useState<UnlinkedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      setApiUrl(settings.apiUrl);
      const response = await fetch(`${settings.apiUrl}/api/analytics/unlinked-posts`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setPosts(data.posts);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load unlinked posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (loading) {
    return (
      <div className="text-sm text-base-content/70 flex items-center gap-2 py-4 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-sm text-base-content/50 text-center py-4">
        All posts are linked
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      <div className="text-[10px] text-base-content/40 mb-1">{total} unlinked post{total !== 1 ? "s" : ""}</div>
      {posts.map((post) => {
        const captionPreview = post.caption
          ? post.caption.slice(0, 60) + (post.caption.length > 60 ? "..." : "")
          : null;
        const date = new Date(post.postedDate);

        return (
          <div key={post.postId} className="card card-compact bg-base-200 p-2">
            <div className="flex items-center gap-2">
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded overflow-hidden bg-base-300 shrink-0">
                {post.previewMediaId ? (
                  <img
                    src={getMediaThumbnailUrl(apiUrl, post.previewMediaId)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-4 h-4 text-base-content/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {captionPreview && (
                  <div className="text-xs truncate">{captionPreview}</div>
                )}
                <div className="flex items-center gap-2 text-[10px] text-base-content/40">
                  <Clock className="w-3 h-3" />
                  {date.toLocaleDateString()}
                  {post.previewDuration !== null && (
                    <span className="flex items-center gap-0.5">
                      <Video className="w-3 h-3" />
                      {formatDuration(post.previewDuration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
