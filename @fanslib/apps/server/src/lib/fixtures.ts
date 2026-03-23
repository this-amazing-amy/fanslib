import type { DataSource } from "typeorm";
import { seedFanslyAnalyticsFixtures } from "../features/analytics/fixtures";
import { seedChannelFixtures } from "../features/channels/fixtures";
import { seedContentScheduleFixtures } from "../features/content-schedules/fixtures";
import { seedFilterPresetFixtures } from "../features/filter-presets/fixtures";
import { seedHashtagFixtures } from "../features/hashtags/fixtures";
import { seedFixtureThumbnails, seedMediaFixtures } from "../features/library/fixtures";
import { seedPostFixtures } from "../features/posts/fixtures";
import { seedShootFixtures } from "../features/shoots/fixtures";
import { seedSnippetFixtures } from "../features/snippets/fixtures";
import { seedSubredditFixtures } from "../features/subreddits/fixtures";
import { seedTagFixtures } from "../features/tags/fixtures";
import { getTestDataSource } from "./test-db";

export type FixtureData = {
  channels: Awaited<ReturnType<typeof seedChannelFixtures>>;
  hashtags: Awaited<ReturnType<typeof seedHashtagFixtures>>;
  media: Awaited<ReturnType<typeof seedMediaFixtures>>;
  subreddits: Awaited<ReturnType<typeof seedSubredditFixtures>>;
  tags: Awaited<ReturnType<typeof seedTagFixtures>>;
  posts: Awaited<ReturnType<typeof seedPostFixtures>>;
  shoots: Awaited<ReturnType<typeof seedShootFixtures>>;
  contentSchedules: Awaited<ReturnType<typeof seedContentScheduleFixtures>>;
  snippets: Awaited<ReturnType<typeof seedSnippetFixtures>>;
  filterPresets: Awaited<ReturnType<typeof seedFilterPresetFixtures>>;
};

export const seedAllFixtures = async (dataSource?: DataSource): Promise<FixtureData> => {
  const ds = dataSource ?? getTestDataSource();
  const channels = await seedChannelFixtures(ds);
  const media = await seedMediaFixtures(ds);
  const subreddits = await seedSubredditFixtures(ds);
  const hashtags = await seedHashtagFixtures(ds, channels.channels);
  const tags = await seedTagFixtures(ds, media);
  const posts = await seedPostFixtures(ds, channels.channels, media, subreddits);
  const shoots = await seedShootFixtures(ds, media);
  const contentSchedules = await seedContentScheduleFixtures(ds, channels.channels);
  const snippets = await seedSnippetFixtures(ds, channels.channels);
  const filterPresets = await seedFilterPresetFixtures(ds);

  if (process.env.FANSLIB_SEED_DEMO_DATA === "1") {
    await seedFanslyAnalyticsFixtures(ds);
    await seedFixtureThumbnails();
  }

  return {
    channels,
    hashtags,
    media,
    subreddits,
    tags,
    posts,
    shoots,
    contentSchedules,
    snippets,
    filterPresets,
  };
};
