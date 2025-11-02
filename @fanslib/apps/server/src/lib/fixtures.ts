import { seedChannelFixtures } from "../features/channels/fixtures";
import { seedContentScheduleFixtures } from "../features/content-schedules/fixtures";
import { seedFilterPresetFixtures } from "../features/filter-presets/fixtures";
import { seedHashtagFixtures } from "../features/hashtags/fixtures";
import { seedMediaFixtures } from "../features/library/fixtures";
import { seedPostFixtures } from "../features/posts/fixtures";
import { seedShootFixtures } from "../features/shoots/fixtures";
import { seedSnippetFixtures } from "../features/snippets/fixtures";
import { seedSubredditFixtures } from "../features/subreddits/fixtures";
import { seedTagFixtures } from "../features/tags/fixtures";

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

export const seedAllFixtures = async (): Promise<FixtureData> => {
  const channels = await seedChannelFixtures();
  const media = await seedMediaFixtures();
  const subreddits = await seedSubredditFixtures();
  const hashtags = await seedHashtagFixtures(channels.channels);
  const tags = await seedTagFixtures(media);
  const posts = await seedPostFixtures(channels.channels, media, subreddits);
  const shoots = await seedShootFixtures(media);
  const contentSchedules = await seedContentScheduleFixtures(channels.channels);
  const snippets = await seedSnippetFixtures(channels.channels);
  const filterPresets = await seedFilterPresetFixtures();

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
