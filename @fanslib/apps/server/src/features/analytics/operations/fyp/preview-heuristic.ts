import type { MediaType } from "../../../library/entity";

type PostMediaForHeuristic = {
  id: string;
  order: number;
  mediaType: MediaType | null;
  duration: number | null;
};

export const identifyFypTrackableId = (postMediaList: PostMediaForHeuristic[]): string | null => {
  const videos = postMediaList.filter((pm) => pm.mediaType === "video");

  if (videos.length === 0) {
    const byOrder = [...postMediaList].sort((a, b) => a.order - b.order);
    return byOrder[0]?.id ?? null;
  }

  if (videos.length === 1) return videos[0]?.id ?? null;

  const sorted = [...videos].sort((a, b) => {
    const durationDiff = (a.duration ?? Infinity) - (b.duration ?? Infinity);
    return durationDiff !== 0 ? durationDiff : a.order - b.order;
  });

  return sorted[0]?.id ?? null;
};

export const isFypTrackable = (
  postMediaId: string,
  postMediaList: PostMediaForHeuristic[],
): boolean => identifyFypTrackableId(postMediaList) === postMediaId;
