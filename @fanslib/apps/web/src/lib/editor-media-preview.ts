/**
 * Picks video vs image preview for the editor. `media.type` can be wrong for
 * demo/legacy rows; file extension is the reliable signal for what the browser can render.
 */
export const shouldUseVideoElementForPreview = (media: {
  type: "image" | "video";
  relativePath: string;
}): boolean => {
  const path = media.relativePath.toLowerCase();
  const looksLikeRasterImage = /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(path);
  if (looksLikeRasterImage) return false;
  const looksLikeVideo = /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(path);
  if (looksLikeVideo) return true;
  return media.type === "video";
};
