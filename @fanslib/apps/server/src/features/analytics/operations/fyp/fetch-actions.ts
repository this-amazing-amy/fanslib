import type { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel } from "../../../channels/entity";
import { Post } from "../../../posts/entity";
import { calculateUserPerformanceThreshold } from "../../fyp-performance";
import type { FypActionsQuerySchema } from "../../schemas/fyp-actions";

type FypPost = {
  postId: string;
  postDate: string;
  mediaId: string;
  totalViews: number;
  avgEngagementSeconds: number;
  percentVsAverage: number;
  plateauDaysSincePosted: number | null;
  daysSincePosted: number;
};

const FYP_WINDOW_DAYS = 90;

const calculatePlateauDaysSincePosted = (
  postDate: Date,
  plateauDetectedAt?: Date | null,
): number | null => {
  if (!plateauDetectedAt) {
    return null;
  }

  const daysSincePosted = Math.floor(
    (plateauDetectedAt.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  return Math.max(0, daysSincePosted);
};

export const fetchFypActionItems = async (query: z.infer<typeof FypActionsQuerySchema>) => {
  const now = new Date();
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);
  const channelRepository = dataSource.getRepository(Channel);

  const fanslyChannel = await channelRepository.findOne({
    where: { typeId: "fansly" },
  });

  if (!fanslyChannel) {
    return {
      userAverageViews: 0,
      userAverageEngagementSeconds: 0,
      activeOnFypCount: 0,
      considerRemoving: [],
      readyToRepost: [],
    };
  }

  const channelId = fanslyChannel.id;

  const userAverages = await calculateUserPerformanceThreshold(channelId);

  const posts = await postRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.postMedia", "pm")
    .leftJoinAndSelect("pm.media", "media")
    .leftJoinAndSelect("pm.fanslyAnalyticsAggregate", "agg")
    .leftJoin("post.channel", "channel")
    .where("channel.typeId = :typeId", { typeId: "fansly" })
    .andWhere("pm.fanslyStatisticsId IS NOT NULL")
    .getMany();

  const considerRemoving: FypPost[] = [];
  const readyToRepost: FypPost[] = [];
  // eslint-disable-next-line functional/no-let
  let activeOnFyp = 0;

  const thresholdType = query.thresholdType ?? "views";
  const defaultThreshold =
    thresholdType === "views"
      ? userAverages.averageViews * 0.5
      : userAverages.averageEngagementSeconds * 0.5;
  const thresholdValue = query.thresholdValue ?? defaultThreshold;

  posts.forEach((post) => {
    const postDate = new Date(post.date);
    const daysSincePosted = Math.floor(
      (now.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    const isWithinFypWindow = daysSincePosted <= FYP_WINDOW_DAYS;
    const wasManuallyRemoved = post.fypManuallyRemoved === true;

    const pm = post.postMedia[0];
    const agg = pm?.fanslyAnalyticsAggregate;

    const plateauDaysSincePosted = calculatePlateauDaysSincePosted(
      postDate,
      agg?.plateauDetectedAt,
    );
    const hasPlateaued = plateauDaysSincePosted !== null;

    const actualValue =
      thresholdType === "views" ? (agg?.totalViews ?? 0) : (agg?.averageEngagementSeconds ?? 0);

    const averageValue =
      thresholdType === "views" ? userAverages.averageViews : userAverages.averageEngagementSeconds;

    const percentVsAverage =
      averageValue > 0 ? ((actualValue - averageValue) / averageValue) * 100 : -100;

    const belowThreshold = actualValue < thresholdValue;

    if (isWithinFypWindow && !wasManuallyRemoved) {
      activeOnFyp++;

      if (hasPlateaued && belowThreshold) {
        considerRemoving.push({
          postId: post.id,
          postDate: post.date.toISOString(),
          mediaId: pm?.media?.id ?? "",
          totalViews: agg?.totalViews ?? 0,
          avgEngagementSeconds: agg?.averageEngagementSeconds ?? 0,
          percentVsAverage,
          plateauDaysSincePosted,
          daysSincePosted,
        });
      }
    }

    if (daysSincePosted > FYP_WINDOW_DAYS && !wasManuallyRemoved) {
      const performedWell = percentVsAverage > 0;
      if (performedWell) {
        readyToRepost.push({
          postId: post.id,
          postDate: post.date.toISOString(),
          mediaId: pm?.media?.id ?? "",
          totalViews: agg?.totalViews ?? 0,
          avgEngagementSeconds: agg?.averageEngagementSeconds ?? 0,
          percentVsAverage,
          plateauDaysSincePosted,
          daysSincePosted,
        });
      }
    }
  });

  considerRemoving.sort((a, b) => a.percentVsAverage - b.percentVsAverage);
  readyToRepost.sort((a, b) => b.percentVsAverage - a.percentVsAverage);

  return {
    userAverageViews: userAverages.averageViews,
    userAverageEngagementSeconds: userAverages.averageEngagementSeconds,
    activeOnFypCount: activeOnFyp,
    considerRemoving,
    readyToRepost,
  };
};
