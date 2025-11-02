import { db } from "../../lib/db";
import type { FanslyAnalyticsResponse } from "../../lib/fansly-analytics/fansly-analytics-response";
import { Post } from "../posts/entity";
import { loadFanslyCredentials } from "../settings/operations/credentials/load";
import { addDatapointsToPost } from "./operations/post-analytics/add-datapoints";

const FANSLY_API_URL = "https://apiv3.fansly.com/api/v1/it/moie/statsnew";

export const fetchFanslyAnalyticsData = async (
  postId: string,
  analyticsStartDate?: Date,
  analyticsEndDate?: Date
): Promise<FanslyAnalyticsResponse> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);
  const post = await postRepository.findOneOrFail({
    where: { id: postId },
  });

  if (!post.fanslyStatisticsId) {
    throw new Error("Post does not have a valid Fansly statistics ID");
  }

  const credentials = await loadFanslyCredentials();

  if (!credentials.fanslyAuth || !credentials.fanslySessionId) {
    throw new Error(
      "Fansly credentials not configured. Please set up your Fansly authentication in settings."
    );
  }

  const endDate = analyticsEndDate ?? new Date();
  const startDate =
    analyticsStartDate ??
    (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();

  const beforeDate = endDate.getTime();
  const afterDate = startDate.getTime();
  const period = 86400000;

  const url = new URL(FANSLY_API_URL);
  url.searchParams.append("mediaOfferId", post.fanslyStatisticsId);
  url.searchParams.append("beforeDate", beforeDate.toString());
  url.searchParams.append("afterDate", afterDate.toString());
  url.searchParams.append("period", period.toString());
  url.searchParams.append("ngsw-bypass", "true");

  const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    authorization: credentials.fanslyAuth,
    "fansly-client-check": credentials.fanslyClientCheck ?? "159208de0e5574",
    "fansly-client-id": credentials.fanslyClientId ?? "715651835356000256",
    "fansly-session-id": credentials.fanslySessionId,
    "fansly-client-ts": Date.now().toString(),
    priority: "u=1, i",
    "sec-ch-ua": '"Chromium";v="135", "Not-A.Brand";v="8"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
  };

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Fansly authentication failed. Please update your credentials in settings."
        );
      }
      throw new Error(`Fansly API returned ${response.status}: ${response.statusText}`);
    }

    const data: FanslyAnalyticsResponse = await response.json();

    await addDatapointsToPost(postId, data);

    return data;
  } catch (error) {
    console.error("Error fetching Fansly analytics:", error);
    throw error;
  }
};



