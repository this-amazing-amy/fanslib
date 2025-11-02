import { incrementHashtagViews } from "./increment-views";

export const updateHashtagStats = async (
  hashtagId: number,
  channelId: string,
  views: number
): Promise<Awaited<ReturnType<typeof incrementHashtagViews>>> =>
  incrementHashtagViews(hashtagId, channelId, views);

